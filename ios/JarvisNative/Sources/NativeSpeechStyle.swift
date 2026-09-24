import Foundation

struct JarvisSpeechStyleSnapshot: Codable, Sendable {
    var version: Int = 1
    var verifiedTurns: Int = 0
    var totalWords: Int = 0
    var markerCounts: [String: Int] = [:]
    var correctionTurns: Int = 0
    var directRequestTurns: Int = 0
}

@MainActor
final class JarvisSpeechStyleProfile: ObservableObject {
    @Published private(set) var snapshot: JarvisSpeechStyleSnapshot

    private let storageKey = "jarvis.sol.speech-style-v1"
    private let markers = [
        "entendeu", "olha", "assim", "então", "por exemplo", "sabe",
        "tipo", "né", "tá", "eu acho", "quero", "preciso", "me diga",
        "não, não", "deixa eu", "pera", "quer dizer"
    ]

    init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let saved = try? JSONDecoder().decode(JarvisSpeechStyleSnapshot.self, from: data) {
            snapshot = saved
        } else {
            snapshot = JarvisSpeechStyleSnapshot()
        }
    }

    func observeVerifiedSolTranscript(_ text: String) {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard clean.count >= 3 else { return }

        let folded = clean.folding(options: .diacriticInsensitive, locale: .current).lowercased()
        let words = folded.split { !$0.isLetter && !$0.isNumber }.count
        guard words > 0 else { return }

        snapshot.verifiedTurns += 1
        snapshot.totalWords += words

        for marker in markers {
            let normalized = marker.folding(options: .diacriticInsensitive, locale: .current).lowercased()
            if folded.contains(normalized) {
                snapshot.markerCounts[marker, default: 0] += 1
            }
        }

        if folded.contains("nao, nao") || folded.contains("quer dizer") ||
            folded.contains("deixa eu") || folded.contains("pera") {
            snapshot.correctionTurns += 1
        }

        if folded.contains("quero") || folded.contains("preciso") ||
            folded.contains("me diga") || folded.contains("faz") {
            snapshot.directRequestTurns += 1
        }

        if let data = try? JSONEncoder().encode(snapshot) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    func promptSummary() -> String {
        guard snapshot.verifiedTurns >= 3 else {
            return "PERFIL_DE_FALA_LOCAL: poucas amostras verificadas; não invente nem imite padrões."
        }

        let average = Double(snapshot.totalWords) / Double(max(1, snapshot.verifiedTurns))
        let topMarkers = snapshot.markerCounts
            .sorted { $0.value == $1.value ? $0.key < $1.key : $0.value > $1.value }
            .prefix(6)
            .map { "\($0.key)=\($0.value)" }
            .joined(separator: ", ")

        let correctionRatio = Double(snapshot.correctionTurns) / Double(snapshot.verifiedTurns)
        let requestRatio = Double(snapshot.directRequestTurns) / Double(snapshot.verifiedTurns)

        return """
        PERFIL_DE_FALA_LOCAL_DA_SOL:
        - turnos verificados: \(snapshot.verifiedTurns)
        - tamanho médio aproximado: \(String(format: "%.1f", average)) palavras
        - marcadores recorrentes: \(topMarkers.isEmpty ? "ainda não definidos" : topMarkers)
        - retomada/autocorreção: \(correctionRatio >= 0.20 ? "frequente" : "ocasional")
        - pedidos diretos: \(requestRatio >= 0.35 ? "frequentes" : "moderados")
        Use apenas para acompanhar melhor a cadência da Sol. Não caricature e não transforme estilo em fato pessoal.
        """
    }

    func reset() {
        snapshot = JarvisSpeechStyleSnapshot()
        UserDefaults.standard.removeObject(forKey: storageKey)
    }
}
