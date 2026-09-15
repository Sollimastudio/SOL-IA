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
    @Published var active = false
    @Published var listening = false

    private let engine = AVAudioEngine()
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "pt-BR"))
    private let speaker = AVSpeechSynthesizer()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var quietTask: Task<Void, Never>?
    private var lastText = ""
    private var afterSpeech: (() -> Void)?
    private var tapInstalled = false

    override init() {
        super.init()
        speaker.delegate = self
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
        guard active else { return }
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
            status = "Ouvindo. Diga “encerrar” para parar."
        } catch {
            stopRecognition()
            status = "Falha ao iniciar o microfone."
        }
    }

    private func receive(_ value: String, final: Bool) {
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
                guard let self, self.lastText == text else { return }
                self.commit(text)
            }
        }
    }

    private func commit(_ text: String) {
        let normalized = text.folding(options: .diacriticInsensitive, locale: .current).lowercased()
        if ["encerrar", "jarvis encerrar", "silencio", "parar de ouvir"].contains(normalized) {
            stop()
            return
        }
        stopRecognition()
        status = "Fala capturada. O próximo passo conecta esta frase ao Jarvis Core."
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
        stopRecognition()
        if speaker.isSpeaking { speaker.stopSpeaking(at: .immediate) }
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        status = "Sessão encerrada."
    }
}

@main
struct JarvisNativeApp: App {
    @StateObject private var voice = JarvisVoiceSession()

    var body: some Scene {
        WindowGroup {
            VStack(spacing: 18) {
                Text("JARVIS").font(.largeTitle.bold())
                Text(voice.status).multilineTextAlignment(.center)
                if !voice.transcript.isEmpty {
                    Text(voice.transcript).padding().background(.thinMaterial).clipShape(RoundedRectangle(cornerRadius: 14))
                }
                Button(voice.active ? "Encerrar" : "Iniciar manualmente") {
                    Task {
                        if voice.active { voice.stop() }
                        else { await voice.start() }
                    }
                }
            }
            .padding()
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                if JarvisWakeState.consume() { Task { await voice.start() } }
            }
        }
    }
}
