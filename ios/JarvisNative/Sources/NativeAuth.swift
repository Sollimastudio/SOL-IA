import Foundation
import Security

struct JarvisAuthSession: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let userID: String
    let email: String
}

enum JarvisNativeConfig {
    static let supabaseURL = URL(string: "https://rkkpbmzrucaghrojujvb.supabase.co")!
    static let publishableKey = "sb_publishable_XhsUjBPVRtC-0DBfMNDQTA_FaK8XFj8"
}

enum JarvisAuthError: LocalizedError {
    case invalidEmail
    case invalidCode
    case unavailable(String)
    case noSession

    var errorDescription: String? {
        switch self {
        case .invalidEmail: return "Digite um e-mail válido."
        case .invalidCode: return "Digite o código numérico completo recebido no e-mail."
        case .unavailable(let message): return message
        case .noSession: return "Sua sessão precisa ser confirmada novamente."
        }
    }
}

private struct AuthTokenResponse: Decodable {
    struct User: Decodable { let id: String; let email: String? }
    let accessToken: String
    let refreshToken: String
    let expiresIn: Double
    let user: User?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }
}

private struct AuthErrorResponse: Decodable {
    let msg: String?
    let message: String?
    let errorDescription: String?
    enum CodingKeys: String, CodingKey {
        case msg, message
        case errorDescription = "error_description"
    }
}

final class JarvisNativeAuth {
    private let session: URLSession
    private let keychainService = "com.sollimastudio.jarvis.auth"
    private let keychainAccount = "private-session"

    init(session: URLSession = .shared) { self.session = session }

    func requestCode(email: String) async throws {
        let clean = try normalizedEmail(email)
        let body: [String: Any] = ["email": clean, "create_user": false]
        _ = try await authRequest(path: "/auth/v1/otp", body: body, decodeToken: false)
    }

    func verifyCode(email: String, code: String) async throws -> JarvisAuthSession {
        let cleanEmail = try normalizedEmail(email)
        let cleanCode = code.filter(\.isNumber)
        guard (6...10).contains(cleanCode.count) else { throw JarvisAuthError.invalidCode }
        let body: [String: Any] = ["email": cleanEmail, "token": cleanCode, "type": "email"]
        let token = try await authRequest(path: "/auth/v1/verify", body: body, decodeToken: true)
        guard let token else { throw JarvisAuthError.noSession }
        let result = JarvisAuthSession(
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            expiresAt: Date().addingTimeInterval(max(60, token.expiresIn - 30)),
            userID: token.user?.id ?? "",
            email: token.user?.email ?? cleanEmail
        )
        try save(result)
        return result
    }

    func currentSession() async throws -> JarvisAuthSession? {
        guard let stored = load() else { return nil }
        if stored.expiresAt > Date().addingTimeInterval(60) { return stored }
        return try await refresh(stored)
    }

    func signOutLocal() {
        SecItemDelete([kSecClass: kSecClassGenericPassword,
                       kSecAttrService: keychainService,
                       kSecAttrAccount: keychainAccount] as CFDictionary)
    }

    private func refresh(_ stored: JarvisAuthSession) async throws -> JarvisAuthSession {
        let body: [String: Any] = ["refresh_token": stored.refreshToken]
        let token = try await authRequest(path: "/auth/v1/token?grant_type=refresh_token", body: body, decodeToken: true)
        guard let token else { throw JarvisAuthError.noSession }
        let result = JarvisAuthSession(
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            expiresAt: Date().addingTimeInterval(max(60, token.expiresIn - 30)),
            userID: token.user?.id ?? stored.userID,
            email: token.user?.email ?? stored.email
        )
        try save(result)
        return result
    }

    private func authRequest(path: String, body: [String: Any], decodeToken: Bool) async throws -> AuthTokenResponse? {
        guard let url = URL(string: path, relativeTo: JarvisNativeConfig.supabaseURL) else {
            throw JarvisAuthError.unavailable("Configuração de autenticação inválida.")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue(JarvisNativeConfig.publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw JarvisAuthError.unavailable("Sem resposta do serviço de acesso.") }
        guard (200..<300).contains(http.statusCode) else {
            let payload = try? JSONDecoder().decode(AuthErrorResponse.self, from: data)
            if http.statusCode == 429 { throw JarvisAuthError.unavailable("Aguarde antes de pedir ou confirmar outro código.") }
            if http.statusCode >= 500 { throw JarvisAuthError.unavailable("O acesso está temporariamente indisponível; seu código não foi declarado inválido.") }
            throw JarvisAuthError.unavailable(payload?.msg ?? payload?.message ?? payload?.errorDescription ?? "Código inválido ou expirado.")
        }
        if !decodeToken { return nil }
        return try JSONDecoder().decode(AuthTokenResponse.self, from: data)
    }

    private func normalizedEmail(_ email: String) throws -> String {
        let clean = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard clean.contains("@"), clean.contains("."), !clean.contains(" ") else { throw JarvisAuthError.invalidEmail }
        return clean
    }

    private func save(_ auth: JarvisAuthSession) throws {
        let data = try JSONEncoder().encode(auth)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount
        ]
        SecItemDelete(query as CFDictionary)
        var item = query
        item[kSecValueData] = data
        item[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(item as CFDictionary, nil)
        guard status == errSecSuccess else { throw JarvisAuthError.unavailable("Não consegui proteger a sessão no Keychain.") }
    }

    private func load() -> JarvisAuthSession? {
        var query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        query.removeAll()
        return try? JSONDecoder().decode(JarvisAuthSession.self, from: data)
    }
}
