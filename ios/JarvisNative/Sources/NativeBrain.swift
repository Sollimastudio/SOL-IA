import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

enum JarvisNativeBrainError: LocalizedError {
    case unavailable
    case unsupportedLanguage
    case emptyAnswer

    var errorDescription: String? {
        switch self {
        case .unavailable: return "O cérebro local da Apple ainda não está disponível neste aparelho."
        case .unsupportedLanguage: return "O modelo local não confirmou suporte ao português neste aparelho."
        case .emptyAnswer: return "O modelo local não produziu uma resposta utilizável."
        }
    }
}

@MainActor
final class JarvisNativeBrain {
    func answer(message: String, context: JarvisNativeContext) async throws -> String {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            let model = SystemLanguageModel.default
            guard model.isAvailable else { throw JarvisNativeBrainError.unavailable }
            guard model.supportsLocale(Locale(identifier: "pt-BR")) else { throw JarvisNativeBrainError.unsupportedLanguage }

            let session = LanguageModelSession(instructions: """
            Você é Jarvis, assistente pessoal da Sol. Responda em português do Brasil, de forma natural, direta e útil. Preserve continuidade: responda ao que mudou ou foi perguntado agora, sem recomeçar explicações já conhecidas. Não transforme estado temporário, hipótese, documento importado ou resposta anterior em fato pessoal. Quando o contexto estiver incompleto, diga isso. Não afirme que executou ações externas. Seja conciso para conversa por voz.
            """)

            let prompt = """
            CONTEXTO PRIVADO RECUPERADO:
            \(context.promptContext())

            PEDIDO ATUAL DA SOL:
            \(message)

            Responda ao pedido atual usando o contexto somente quando for realmente relevante.
            """
            let response = try await session.respond(to: prompt)
            let text = response.content.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else { throw JarvisNativeBrainError.emptyAnswer }
            return text
        }
        #endif
        throw JarvisNativeBrainError.unavailable
    }
}
