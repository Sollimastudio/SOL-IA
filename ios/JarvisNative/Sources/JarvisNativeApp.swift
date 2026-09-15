import SwiftUI
import UIKit
import AppIntents
import Speech
import AVFAudio

private enum JarvisWakeState {
    static let key = "jarvis.pendingVoiceStart"
    static func mark() { UserDefaults.standard.set(true, forKey: key) }
    static func consume() -> Bool {
        let value = UserDefaults.standard.bool(forKey: key)
        if value { UserDefaults.standard.set(false, forKey: key) }
        return value
    }
}

struct StartJarvisConversationIntent: AppIntent {
    static var title: LocalizedStringResource = "Iniciar conversa Jarvis"
    static var openAppWhenRun = true
    func perform() async throws -> some IntentResult {
        JarvisWakeState.mark()
        return .result()
    }
}

struct JarvisAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartJarvisConversationIntent(),
            phrases: ["Iniciar conversa com \(.applicationName)"],
            shortTitle: "Iniciar Jarvis",
            systemImageName: "waveform"
        )
    }
}

@MainActor
final class JarvisVoiceSession: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published var status = "Em espera"
    @Published var transcript = ""
    @Published var lastAnswer = ""
    @Published var active = false
    @Published var listening = false
    @Published var authenticated = false
    @Published var authMessage = "Entre uma vez para ligar sua memória privada ao Jarvis."

    private let engine = AVAudioEngine()
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "pt-BR"))
    private let speaker = AVSpeechSynthesizer()
    private let auth = JarvisNativeAuth()
    private let core = JarvisNativeContextClient()
    private let brain = JarvisNativeBrain()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var quietTask: Task<Void, Never>?
    private var lastText = ""
    private var afterSpeech: (() -> Void)?
    private var tapInstalled = false
    private var processing = false

    override init() {
        super.init()
        speaker.delegate = self
    }

    func restoreAuth() async {
        do {
            authenticated = try await auth.currentSession() != nil
            authMessage = authenticated ? "Acesso privado confirmado neste iPhone." : "Entre uma vez para ligar sua memória privada ao Jarvis."
        } catch {
            authenticated = false
            authMessage = error.localizedDescription
        }
    }

    func requestLoginCode(email: String) async {
        do {
            try await auth.requestCode(email: email)
            authMessage = "Código enviado. Digite o número recebido no e-mail."
        } catch { authMessage = error.localizedDescription }
    }

    func verifyLogin(email: String, code: String) async {
        do {
            _ = try await auth.verifyCode(email: email, code: code)
            authenticated = true
            authMessage = "Acesso privado confirmado neste iPhone."
        } catch {
            authenticated = false
            authMessage = error.localizedDescription
        }
    }

    func signOut() {
        stop()
        auth.signOutLocal()
        authenticated = false
        authMessage = "Sessão privada removida deste iPhone."
    }

    func start() async {
        guard !active else { return }
        guard await permissions() else {
            status = "Autorize Microfone e Reconhecimento de Fala nos Ajustes."
            return
        }
        do {
            let audio = AVAudioSession.sharedInstance()
            try audio.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetoothHFP])
            try audio.setActive(true)
            active = true
            processing = false
            say("Tô aqui. Pode falar.") { [weak self] in self?.listen() }
        } catch {
            status = "Não consegui iniciar o áudio."
        }
    }

    private func permissions() async -> Bool {
        let mic = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { continuation.resume(returning: $0) }
        }
        guard mic else { return false }
        return await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0 == .authorized) }
        }
    }

    private func listen() {
        guard active, !processing else { return }
        stopRecognition()
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        self.request = request

        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in request.append(buffer) }
        tapInstalled = true
        task = recognizer?.recognitionTask(with: request) { [weak self] result, _ in
            Task { @MainActor in
                guard let self, let result else { return }
                self.receive(result.bestTranscription.formattedString, final: result.isFinal)
            }
        }
        do {
            engine.prepare()
            try engine.start()
            listening = true
            status = "Ouvindo. Continue falando normalmente; diga “encerrar” para parar."
        } catch {
            stopRecognition()
            status = "Falha ao iniciar o microfone."
        }
    }

    private func receive(_ value: String, final: Bool) {
        guard !processing else { return }
        let text = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        transcript = text
        lastText = text
        quietTask?.cancel()
        if final { commit(text); return }
        quietTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(1100))
            guard !Task.isCancelled else { return }
            await MainActor.run {
                guard let self, self.lastText == text, !self.processing else { return }
                self.commit(text)
            }
        }
    }

    private func commit(_ text: String) {
        guard !processing else { return }
        let normalized = text.folding(options: .diacriticInsensitive, locale: .current).lowercased()
        if ["encerrar", "jarvis encerrar", "silencio", "parar de ouvir"].contains(normalized) {
            stop()
            return
        }
        processing = true
        stopRecognition()
        status = "Consultando sua memória privada…"
        Task { [weak self] in await self?.answer(text) }
    }

    private func answer(_ text: String) async {
        do {
            guard let session = try await auth.currentSession() else {
                authenticated = false
                authMessage = "Entre uma vez para o Jarvis usar sua memória privada."
                say("Eu te ouvi, mas preciso que você entre uma vez neste iPhone antes de usar sua memória privada.") { [weak self] in
                    self?.processing = false
                    self?.stop()
                }
                return
            }
            authenticated = true
            let context = await core.fetch(query: text, auth: session)
            status = context.warnings.isEmpty ? "Pensando no próprio iPhone…" : "Pensando com contexto parcial…"
            let response = try await brain.answer(message: text, context: context)
            lastAnswer = response
            say(response) { [weak self] in
                guard let self else { return }
                self.processing = false
                self.listen()
            }
        } catch {
            let message = error.localizedDescription
            status = message
            say("Eu entendi sua fala, mas meu cérebro local não conseguiu responder agora. Não vou inventar uma resposta.") { [weak self] in
                guard let self else { return }
                self.processing = false
                self.listen()
            }
        }
    }

    private func say(_ text: String, then: @escaping () -> Void) {
        stopRecognition()
        afterSpeech = then
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "pt-BR")
        utterance.rate = 0.47
        utterance.pitchMultiplier = 0.86
        speaker.speak(utterance)
        status = "Jarvis falando…"
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        let next = afterSpeech
        afterSpeech = nil
        next?()
    }

    private func stopRecognition() {
        quietTask?.cancel()
        quietTask = nil
        task?.cancel()
        task = nil
        request?.endAudio()
        request = nil
        if engine.isRunning { engine.stop() }
        if tapInstalled {
            engine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        listening = false
    }

    func stop() {
        active = false
        processing = false
        stopRecognition()
        if speaker.isSpeaking { speaker.stopSpeaking(at: .immediate) }
        afterSpeech = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        status = "Sessão encerrada."
    }
}

@main
struct JarvisNativeApp: App {
    @StateObject private var voice = JarvisVoiceSession()
    @State private var email = ""
    @State private var code = ""

    var body: some Scene {
        WindowGroup {
            ScrollView {
                VStack(spacing: 18) {
                    Text("JARVIS").font(.largeTitle.bold())
                    Text(voice.status).multilineTextAlignment(.center)

                    if !voice.authenticated {
                        GroupBox("Acesso privado — uma vez neste aparelho") {
                            VStack(spacing: 10) {
                                TextField("Seu e-mail", text: $email)
                                    .textInputAutocapitalization(.never)
                                    .keyboardType(.emailAddress)
                                    .textContentType(.emailAddress)
                                Button("Enviar código") { Task { await voice.requestLoginCode(email: email) } }
                                TextField("Código recebido", text: $code)
                                    .keyboardType(.numberPad)
                                Button("Confirmar acesso") { Task { await voice.verifyLogin(email: email, code: code) } }
                                Text(voice.authMessage).font(.footnote)
                            }
                        }
                    } else {
                        HStack {
                            Label("Memória privada conectada", systemImage: "lock.fill")
                            Spacer()
                            Button("Sair") { voice.signOut() }
                        }
                        .font(.footnote)
                    }

                    if !voice.transcript.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("VOCÊ").font(.caption.bold())
                            Text(voice.transcript)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding().background(.thinMaterial).clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    if !voice.lastAnswer.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("JARVIS").font(.caption.bold())
                            Text(voice.lastAnswer)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding().background(.thinMaterial).clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    Button(voice.active ? "Encerrar" : "Iniciar manualmente") {
                        Task {
                            if voice.active { voice.stop() }
                            else { await voice.start() }
                        }
                    }
                    .buttonStyle(.borderedProminent)

                    Text("Depois da configuração única do Atalho Vocal, “Jarvis, tá aí?” inicia esta sessão sem você tocar na tela. Durante a sessão, continue falando normalmente até dizer “encerrar”.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding()
            }
            .task {
                await voice.restoreAuth()
                if JarvisWakeState.consume() { await voice.start() }
            }
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                if JarvisWakeState.consume() { Task { await voice.start() } }
            }
        }
    }
}
