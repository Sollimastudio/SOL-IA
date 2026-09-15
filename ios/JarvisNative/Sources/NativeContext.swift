import Foundation

struct JarvisNativeContext {
    var continuity: [ContinuityRow] = []
    var profile: [ProfileRow] = []
    var assistantHistory: [AssistantRow] = []
    var knowledge: [KnowledgeRow] = []
    var warnings: [String] = []

    struct ContinuityRow: Decodable {
        let relation: String
        let scope: String
        let topic_hint: String
        let delta_hint: String
        let content: String
        let match_kind: String
    }

    struct ProfileRow: Decodable {
        let kind: String
        let topic_hint: String
        let content: String
        let match_kind: String
    }

    struct AssistantRow: Decodable {
        let answer: String
        let specialist: String
        let model: String
        let match_kind: String
    }

    struct KnowledgeRow: Decodable {
        let project_key: String
        let title: String
        let version: Int
        let content: String
    }

    func promptContext(maxCharacters: Int = 9000) -> String {
        var blocks: [String] = []
        if !profile.isEmpty {
            blocks.append("PERFIL ATIVO:\n" + profile.prefix(6).map { "- [\($0.kind)] \($0.topic_hint): \($0.content)" }.joined(separator: "\n"))
        }
        if !continuity.isEmpty {
            blocks.append("CONTINUIDADE:\n" + continuity.prefix(8).map { "- [\($0.relation)/\($0.scope)] \($0.topic_hint) — \($0.delta_hint) — \($0.content)" }.joined(separator: "\n"))
        }
        if !assistantHistory.isEmpty {
            blocks.append("RESPOSTAS ANTERIORES RELEVANTES:\n" + assistantHistory.prefix(4).map { "- \($0.answer)" }.joined(separator: "\n"))
        }
        if !knowledge.isEmpty {
            blocks.append("FONTES PRIVADAS IMPORTADAS (não tratar automaticamente como fatos pessoais):\n" + knowledge.prefix(4).map { "- [\($0.project_key) / v\($0.version)] \($0.title): \($0.content)" }.joined(separator: "\n"))
        }
        if blocks.isEmpty { blocks.append("Nenhum contexto privado relevante foi recuperado para esta pergunta.") }
        let joined = blocks.joined(separator: "\n\n")
        return String(joined.prefix(maxCharacters))
    }
}

final class JarvisNativeContextClient {
    private let session: URLSession
    init(session: URLSession = .shared) { self.session = session }

    func fetch(query: String, auth: JarvisAuthSession) async -> JarvisNativeContext {
        var context = JarvisNativeContext()
        do { context.continuity = try await rpc("search_solia_continuity", body: ["p_query": query, "p_limit": 10], token: auth.accessToken) }
        catch { context.warnings.append("continuidade_indisponivel") }
        do { context.profile = try await rpc("search_solia_profile_claims", body: ["p_query": query, "p_limit": 8], token: auth.accessToken) }
        catch { context.warnings.append("perfil_indisponivel") }
        do { context.assistantHistory = try await rpc("search_solia_assistant_history", body: ["p_query": query, "p_limit": 6], token: auth.accessToken) }
        catch { context.warnings.append("historico_indisponivel") }
        do { context.knowledge = try await rpc("search_solia_knowledge", body: ["p_query": query], token: auth.accessToken) }
        catch { context.warnings.append("conhecimento_indisponivel") }
        return context
    }

    private func rpc<T: Decodable>(_ name: String, body: [String: Any], token: String) async throws -> [T] {
        guard let url = URL(string: "/rest/v1/rpc/\(name)", relativeTo: JarvisNativeConfig.supabaseURL) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue(JarvisNativeConfig.publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw URLError(.userAuthenticationRequired) }
        return try JSONDecoder().decode([T].self, from: data)
    }
}
