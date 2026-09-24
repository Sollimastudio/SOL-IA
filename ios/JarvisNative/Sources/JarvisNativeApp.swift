import SwiftUI
import UIKit
import AppIntents
import AVFAudio
import Combine

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
            phrases: [
                "Iniciar conversa com \(.applicationName)",
                "Falar com \(.applicationName)",
                "Chamar \(.applicationName)",
                "\(.applicationName), tá aí"
            ],
            shortTitle: "Iniciar Jarvis",
            systemImageName: "waveform"
        )
    }
}

@MainActor
final class JarvisVoiceSession: ObservableObject {
    static let geminiVoices = [
        "Kore", "Puck", "Zephyr", "Charon", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe",
        "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome",
        "Algenib", "Rasalgethi", "Laomedeia", "Achernar", "Alnilam", "Schedar", "Gacrux",
        "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat"
    ]

    @Published var status = "Em espera"
    @Published var transcript = ""
    @Published var lastAnswer = ""
    @Published var active = false
    @Published var listening = false
    @Published var authenticated = false
    @Published var authMessage = "Entre uma vez para ligar sua memória privada ao Jarvis."
    @Published var speakerStatus = "Voiceprint da Sol ainda não cadastrado."
    @Published var speakerBadge = "VOICEPRINT NÃO CADASTRADO"
    @Published var speakerEnrolled = false
    @Published var speakerEnrolling = false
    @Published var speechStyleTurns = 0
    @Published var selectedVoice: String

    private let auth = JarvisNativeAuth()
    private let live = JarvisNativeGeminiLive()
    private let speakerIdentity = JarvisSpeakerIdentity()
    private let speechStyle = JarvisSpeechStyleProfile()
    private var cancellables = Set<AnyCancellable>()

    init() {
        let storedVoice = UserDefaults.standard.string(forKey: "jarvis.gemini.voice") ?? "Kore"
        selectedVoice = Self.geminiVoices.contains(storedVoice) ? storedVoice : "Kore"
        speechStyleTurns = speechStyle.snapshot.verifiedTurns

        live.onStatus = { [weak self] value in
            Task { @MainActor in
                guard let self else { return }
                self.status = value
                self.listening = value.localizedCaseInsensitiveContains("ouvindo")
                if value.localizedCaseInsensitiveContains("encerrada") ||
                    value.localizedCaseInsensitiveContains("interrompida") {
                    self.active = false
                    self.listening = false
                }
            }
        }
        live.onUserTranscript = { [weak self] text in
            Task { @MainActor in
                guard let self else { return }
                self.transcript = text
                if self.speakerIdentity.lastResult == .sol {
                    self.speechStyle.observeVerifiedSolTranscript(text)
                    self.speechStyleTurns = self.speechStyle.snapshot.verifiedTurns
                }
            }
        }
        live.onAssistantTranscript = { [weak self] text in
            Task { @MainActor in self?.lastAnswer = text }
        }
        live.onSpeakerWindow = { [weak self] samples, rate in
            Task { @MainActor in
                guard let self else { return }
                let result = await self.speakerIdentity.verify(samples: samples, sourceSampleRate: rate)
                self.applySpeakerIdentity(result)
                self.live.updateSpeakerIdentity(result)
            }
        }

        speakerIdentity.$status
            .receive(on: DispatchQueue.main)
            .sink { [weak self] value in self?.speakerStatus = value }
            .store(in: &cancellables)

        speakerIdentity.$enrolled
            .receive(on: DispatchQueue.main)
            .sink { [weak self] value in
                self?.speakerEnrolled = value
                if !value { self?.speakerBadge = "VOICEPRINT NÃO CADASTRADO" }
            }
            .store(in: &cancellables)

        speakerIdentity.$enrolling
            .receive(on: DispatchQueue.main)
            .sink { [weak self] value in self?.speakerEnrolling = value }
            .store(in: &cancellables)
    }

    private func applySpeakerIdentity(_ result: JarvisSpeakerIdentityResult) {
        switch result {
        case .sol:
            speakerBadge = "SOL · VOZ VERIFICADA"
        case .guest:
            speakerBadge = "OUTRO LOCUTOR · MEMÓRIA BLOQUEADA"
        case .unknown:
            speakerBadge = "LOCUTOR NÃO VERIFICADO"
        case .notEnrolled:
            speakerBadge = "VOICEPRINT NÃO CADASTRADO"
        case .preparing:
            speakerBadge = "VERIFICANDO LOCUTOR"
        }
    }

    func prepareSpeakerIdentity() async {
        await speakerIdentity.prepare()
        speakerEnrolled = speakerIdentity.enrolled
        speakerEnrolling = speakerIdentity.enrolling
        speakerStatus = speakerIdentity.status
    }

    func startSpeakerEnrollment() async {
        guard !active else {
            speakerStatus = "Encerre a conversa antes de refazer o cadastro da voz."
            return
        }
        await speakerIdentity.startEnrollment()
        speakerEnrolled = speakerIdentity.enrolled
        speakerEnrolling = speakerIdentity.enrolling
        speakerStatus = speakerIdentity.status
    }

    func cancelSpeakerEnrollment() {
        speakerIdentity.cancelEnrollment()
        speakerEnrolled = speakerIdentity.enrolled
        speakerEnrolling = speakerIdentity.enrolling
        speakerStatus = speakerIdentity.status
    }

    func resetSpeechStyleLearning() {
        guard !active else { return }
        speechStyle.reset()
        speechStyleTurns = 0
    }

    func eraseSpeakerEnrollment() {
        guard !active else { return }
        speakerIdentity.eraseEnrollment()
        speakerEnrolled = false
        speakerEnrolling = false
        applySpeakerIdentity(.notEnrolled)
        live.updateSpeakerIdentity(.notEnrolled)
    }

    func restoreAuth() async {
        do {
            authenticated = try await auth.currentSession() != nil
            authMessage = authenticated
                ? "Acesso privado confirmado neste iPhone."
                : "Entre uma vez para ligar sua memória privada ao Jarvis."
        } catch {
            authenticated = false
            authMessage = error.localizedDescription
        }
    }

    func requestLoginCode(email: String) async {
        do {
            try await auth.requestCode(email: email)
            authMessage = "Código enviado. Digite o número recebido no e-mail."
        } catch {
            authMessage = error.localizedDescription
        }
    }

    func verifyLogin(email: String, code: String) async {
        do {
            _ = try await auth.verifyCode(email: email, code: code)
            authenticated = true
            authMessage = "Acesso privado confirmado neste iPhone. Nas próximas ativações, o Keychain reaproveita sua sessão enquanto ela continuar válida."
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

    func chooseVoice(_ voice: String) {
        guard Self.geminiVoices.contains(voice), !active else { return }
        selectedVoice = voice
        UserDefaults.standard.set(voice, forKey: "jarvis.gemini.voice")
    }

    func start() async {
        guard !active else { return }

        guard await AVAudioApplication.requestRecordPermission() else {
            status = "Autorize Microfone nos Ajustes do iPhone. Essa autorização é lembrada pelo sistema depois da primeira vez."
            return
        }

        let session: JarvisAuthSession
        do {
            guard let current = try await auth.currentSession() else {
                authenticated = false
                authMessage = "Faça o acesso por código uma vez neste iPhone antes de usar a ativação à distância."
                status = "Aguardando o acesso privado inicial."
                return
            }
            session = current
            authenticated = true
        } catch {
            authenticated = false
            authMessage = error.localizedDescription
            status = "Não consegui recuperar a sessão privada."
            return
        }

        do {
            let audio = AVAudioSession.sharedInstance()
            try audio.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetoothHFP])
            try audio.setActive(true)
        } catch {
            status = "Não consegui ativar o áudio do iPhone."
            return
        }

        await speakerIdentity.prepare()
        let initialIdentity: JarvisSpeakerIdentityResult = speakerIdentity.enrolled ? .unknown : .notEnrolled
        applySpeakerIdentity(initialIdentity)
        live.updateSpeakerIdentity(initialIdentity)

        active = true
        listening = false
        transcript = ""
        lastAnswer = ""
        status = speakerIdentity.enrolled
            ? "Conectando ao Gemini 3.8 Live e preparando verificação de locutor…"
            : "Conectando ao Gemini 3.8 Live sem voiceprint; memória privada ficará bloqueada."

        let instructions = """
        Você é Jarvis, assessor pessoal da Sol em conversa de voz natural e contínua.
        Fale em português do Brasil, com voz humana, cadência natural, objetividade, inteligência e humor rápido quando couber.
        Aceite interrupções e mudanças de assunto sem exigir que a usuária repita seu nome em cada turno.
        Quando precisar de memória, projetos, decisões anteriores ou conhecimento privado, use consult_jarvis e trabalhe somente com o contexto retornado.
        O iPhone possui um verificador local de locutor. Somente quando o aplicativo confirmar "Sol" a ferramenta consult_jarvis poderá devolver contexto privado.
        Se o aplicativo sinalizar outro locutor, não revele o Cofre; peça autorização explícita da Sol para uma conversa de convidado.
        Autorização de convidado nunca libera memória privada para a voz do convidado.
        Fala de terceiro não vira memória atribuída à Sol.
        Não afirme que publicou, enviou, comprou, agendou ou alterou algo sem confirmação do aplicativo.
        Ao ser ativado, responda naturalmente e permaneça ouvindo até a Sol dizer “encerrar”.

        \(speechStyle.promptSummary())
        """

        do {
            try await live.connect(.init(auth: session, voice: selectedVoice, instructions: instructions))
        } catch {
            active = false
            listening = false
            status = error.localizedDescription
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }

    func stop() {
        live.disconnect()
        active = false
        listening = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        status = "Sessão encerrada."
    }
}

@main
struct JarvisNativeApp: App {
    @StateObject private var voice = JarvisVoiceSession()
    @StateObject private var diagnostics = JarvisNativeDiagnostics()
    @State private var email = ""
    @State private var code = ""

    var body: some Scene {
        WindowGroup {
            ScrollView {
                VStack(spacing: 18) {
                    Text("JARVIS").font(.largeTitle.bold())
                    Text(voice.status).multilineTextAlignment(.center)

                    HStack {
                        Label("Gemini 3.8 Live", systemImage: "waveform.circle.fill")
                        Spacer()
                        Text(voice.speakerBadge).foregroundStyle(.secondary)
                    }
                    .font(.footnote)

                    if !voice.authenticated {
                        GroupBox("Acesso privado — uma vez neste aparelho") {
                            VStack(spacing: 10) {
                                TextField("Seu e-mail", text: $email)
                                    .textInputAutocapitalization(.never)
                                    .keyboardType(.emailAddress)
                                    .textContentType(.emailAddress)
                                Button("Enviar código") {
                                    Task { await voice.requestLoginCode(email: email) }
                                }
                                TextField("Código recebido", text: $code)
                                    .keyboardType(.numberPad)
                                Button("Confirmar acesso") {
                                    Task { await voice.verifyLogin(email: email, code: code) }
                                }
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

                    GroupBox("Reconhecimento da Sol") {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(voice.speakerStatus)
                                .font(.footnote)
                                .foregroundStyle(.secondary)

                            if voice.speakerEnrolling {
                                ProgressView("Ouvindo a amostra local por 8 segundos…")
                                Button("Cancelar cadastro") { voice.cancelSpeakerEnrollment() }
                            } else if !voice.speakerEnrolled {
                                Button("Cadastrar minha voz neste iPhone") {
                                    Task { await voice.startSpeakerEnrollment() }
                                }
                            } else {
                                HStack {
                                    Label("Voiceprint local cadastrado", systemImage: "person.wave.2.fill")
                                    Spacer()
                                    Button("Refazer") {
                                        Task { await voice.startSpeakerEnrollment() }
                                    }
                                }
                                Button("Apagar voiceprint deste iPhone", role: .destructive) {
                                    voice.eraseSpeakerEnrollment()
                                }
                                .font(.footnote)
                            }

                            Text("O perfil biométrico fica somente neste iPhone/Keychain. A voz ajuda a identificar o locutor, mas não substitui login ou aprovação para ações sensíveis.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }

                    GroupBox("Aprendizado do meu jeito de falar") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("\(voice.speechStyleTurns) turno(s) confirmados pelo voiceprint contribuíram para o perfil linguístico local.")
                                .font(.footnote)
                            Text("Este módulo guarda somente estatísticas agregadas de estilo. Fala de convidados, voz incerta e transcrição não verificada são ignoradas.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            if voice.speechStyleTurns > 0 {
                                Button("Zerar aprendizado de fala", role: .destructive) {
                                    voice.resetSpeechStyleLearning()
                                }
                                .font(.footnote)
                            }
                        }
                    }

                    GroupBox("Voz do Jarvis") {
                        Picker("Voz Gemini", selection: Binding(
                            get: { voice.selectedVoice },
                            set: { voice.chooseVoice($0) }
                        )) {
                            ForEach(JarvisVoiceSession.geminiVoices, id: \.self) { item in
                                Text(item).tag(item)
                            }
                        }
                        .disabled(voice.active)
                        Text("Esta é a voz nativa do Gemini Live. O app não troca automaticamente para a síntese robótica do iPhone.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    if !voice.transcript.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(voice.speakerBadge).font(.caption.bold())
                            Text(voice.transcript)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(.thinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    if !voice.lastAnswer.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("JARVIS · GEMINI LIVE").font(.caption.bold())
                            Text(voice.lastAnswer)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(.thinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    Button(voice.active ? "Encerrar conversa" : "Iniciar conversa natural") {
                        Task {
                            if voice.active { voice.stop() }
                            else { await voice.start() }
                        }
                    }
                    .buttonStyle(.borderedProminent)

                    DisclosureGroup("Diagnóstico deste iPhone") {
                        VStack(alignment: .leading, spacing: 8) {
                            Button(diagnostics.running ? "Verificando…" : "Verificar agora") {
                                Task { await diagnostics.run() }
                            }
                            .disabled(diagnostics.running)
                            ForEach(diagnostics.items) { item in
                                HStack(alignment: .top) {
                                    Image(systemName: item.ok ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(item.label).font(.footnote.bold())
                                        Text(item.detail).font(.caption).foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                        .padding(.top, 8)
                    }

                    Text("Configuração hands-free: ensine uma única vez o Atalho Vocal “Jarvis, tá aí?” e associe-o à ação Iniciar Jarvis. O atalho abre o app; com sessão válida e Microfone já autorizado, o Gemini Live inicia sem escolher motor/voz novamente.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    Text("Enquanto a sessão de áudio estiver ativa, o projeto está configurado para background audio. O Speaker ID local bloqueia o Cofre até confirmar a Sol; se detectar outra voz, o Jarvis deve pedir autorização para conversa de convidado.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding()
            }
            .task {
                await voice.restoreAuth()
                await voice.prepareSpeakerIdentity()
                if JarvisWakeState.consume() { await voice.start() }
            }
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                if JarvisWakeState.consume() {
                    Task { await voice.start() }
                }
            }
        }
    }
}
