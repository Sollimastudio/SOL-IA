import Foundation
import Speech
import AVFAudio
#if canImport(FoundationModels)
import FoundationModels
#endif

struct JarvisDiagnosticItem: Identifiable {
    let id: String
    let label: String
    let ok: Bool
    let detail: String
}

@MainActor
final class JarvisNativeDiagnostics: ObservableObject {
    @Published var running = false
    @Published var items: [JarvisDiagnosticItem] = []

    private let auth = JarvisNativeAuth()
    private let context = JarvisNativeContextClient()

    func run() async {
        guard !running else { return }
        running = true
        defer { running = false }

        var result: [JarvisDiagnosticItem] = []

        let micPermission = AVAudioApplication.shared.recordPermission
        result.append(.init(
            id: "microphone",
            label: "Microfone",
            ok: micPermission == .granted,
            detail: micPermission == .granted ? "Autorizado" : micPermission == .denied ? "Negado nos Ajustes" : "Ainda não autorizado"
        ))

        do {
            let healthURL = URL(string: "/api/jarvis-runtime-health", relativeTo: JarvisNativeConfig.webAppURL)!
            let (data, response) = try await URLSession.shared.data(from: healthURL)
            let http = response as? HTTPURLResponse
            let payload = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let live = payload?["live"] as? [String: Any]
            let providers = live?["providers"] as? [String: Any]
            let gemini = providers?["gemini"] as? [String: Any]
            let keyPresent = gemini?["apiKeyPresent"] as? Bool == true
            result.append(.init(
                id: "gemini-live",
                label: "Gemini Live",
                ok: http?.statusCode == 200 && keyPresent,
                detail: keyPresent ? "Servidor pronto para token efêmero; modelo gemini-3.8-live" : "Credencial Gemini não confirmada no servidor"
            ))
        } catch {
            result.append(.init(id: "gemini-live", label: "Gemini Live", ok: false, detail: "Health do servidor indisponível"))
        }

        result.append(.init(
            id: "speaker-id",
            label: "Reconhecimento da voz da Sol",
            ok: false,
            detail: "Pendente: transcrição não equivale a speaker verification/voiceprint"
        ))

        let speech = SFSpeechRecognizer.authorizationStatus()
        result.append(.init(
            id: "speech",
            label: "Reconhecimento pt-BR",
            ok: speech == .authorized,
            detail: speech == .authorized ? "Autorizado" : speech == .denied || speech == .restricted ? "Sem permissão" : "Ainda não autorizado"
        ))

        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            let model = SystemLanguageModel.default
            result.append(.init(
                id: "local-brain",
                label: "Cérebro local Apple",
                ok: model.isAvailable && model.supportsLocale(Locale(identifier: "pt-BR")),
                detail: !model.isAvailable ? "Apple Intelligence/modelo ainda não está pronto" : model.supportsLocale(Locale(identifier: "pt-BR")) ? "Disponível em português" : "Português não confirmado neste aparelho"
            ))
        } else {
            result.append(.init(id: "local-brain", label: "Cérebro local Apple", ok: false, detail: "Requer iOS 26 ou superior"))
        }
        #else
        result.append(.init(id: "local-brain", label: "Cérebro local Apple", ok: false, detail: "SDK sem Foundation Models"))
        #endif

        do {
            if let session = try await auth.currentSession() {
                result.append(.init(id: "auth", label: "Sessão privada", ok: true, detail: "Sessão protegida no Keychain"))
                let privateContext = await context.fetch(query: "diagnóstico de continuidade Jarvis", auth: session)
                let count = privateContext.continuity.count + privateContext.profile.count + privateContext.assistantHistory.count + privateContext.knowledge.count
                result.append(.init(
                    id: "context",
                    label: "Memória privada",
                    ok: count > 0 && privateContext.warnings.count < 4,
                    detail: "\(count) item(ns) recuperado(s); \(privateContext.warnings.count) fonte(s) indisponível(is)"
                ))
            } else {
                result.append(.init(id: "auth", label: "Sessão privada", ok: false, detail: "Faça o acesso por código uma vez"))
                result.append(.init(id: "context", label: "Memória privada", ok: false, detail: "Aguardando sessão"))
            }
        } catch {
            result.append(.init(id: "auth", label: "Sessão privada", ok: false, detail: error.localizedDescription))
            result.append(.init(id: "context", label: "Memória privada", ok: false, detail: "Não consultada"))
        }

        items = result
    }
}
