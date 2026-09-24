import Foundation
import AVFAudio
import Security
import FluidAudio

enum JarvisSpeakerIdentityResult: String, Sendable {
    case sol
    case guest
    case unknown
    case notEnrolled = "not_enrolled"
    case preparing
}

private final class SpeakerSampleBuffer: @unchecked Sendable {
    private let lock = NSLock()
    private var samples: [Float] = []
    private var sampleRate: Double = 48_000

    func reset(sampleRate: Double) {
        lock.lock()
        samples.removeAll(keepingCapacity: true)
        self.sampleRate = sampleRate
        lock.unlock()
    }

    func append(_ pointer: UnsafePointer<Float>, count: Int) {
        guard count > 0 else { return }
        lock.lock()
        samples.append(contentsOf: UnsafeBufferPointer(start: pointer, count: count))
        lock.unlock()
    }

    func snapshot() -> (samples: [Float], sampleRate: Double) {
        lock.lock()
        defer { lock.unlock() }
        return (samples, sampleRate)
    }
}

@MainActor
final class JarvisSpeakerIdentity: ObservableObject {
    @Published private(set) var enrolled = false
    @Published private(set) var preparing = false
    @Published private(set) var enrolling = false
    @Published private(set) var lastResult: JarvisSpeakerIdentityResult = .notEnrolled
    @Published private(set) var lastDistance: Float?
    @Published private(set) var status = "Voiceprint da Sol ainda não cadastrado."

    private let keychainService = "com.sollimastudio.jarvis.speaker-id"
    private let keychainAccount = "sol-embedding-v1"
    private let enrollmentEngine = AVAudioEngine()
    private let enrollmentBuffer = SpeakerSampleBuffer()
    private var enrollmentTask: Task<Void, Never>?
    private var tapInstalled = false
    private var diarizer: DiarizerManager?
    private var ownerEmbedding: [Float]?
    private var verificationInFlight = false
    private var lastVerificationAt = Date.distantPast

    // Fail-closed defaults. Tune only after physical samples from Sol are measured.
    private let verifiedSolMaxDistance: Float = 0.35
    private let definiteGuestMinDistance: Float = 0.55

    init() {
        ownerEmbedding = loadEmbedding()
        enrolled = ownerEmbedding?.count == SpeakerManager.embeddingSize
        lastResult = enrolled ? .unknown : .notEnrolled
        status = enrolled
            ? "Voiceprint local cadastrado. Aguardando fala para verificar o locutor."
            : "Voiceprint da Sol ainda não cadastrado."
    }

    func prepare() async {
        guard diarizer == nil, !preparing else { return }
        preparing = true
        lastResult = .preparing
        status = "Preparando reconhecimento de locutor no próprio iPhone…"
        defer { preparing = false }

        do {
            let models = try await DiarizerModels.downloadIfNeeded()
            let manager = DiarizerManager()
            manager.initialize(models: models)
            diarizer = manager
            lastResult = enrolled ? .unknown : .notEnrolled
            status = enrolled
                ? "Reconhecimento local pronto."
                : "Reconhecimento local pronto. Cadastre a voz da Sol uma vez."
        } catch {
            diarizer = nil
            lastResult = enrolled ? .unknown : .notEnrolled
            status = "Não consegui preparar o modelo local de reconhecimento de voz."
        }
    }

    func startEnrollment() async {
        guard !enrolling else { return }
        guard await AVAudioApplication.requestRecordPermission() else {
            status = "Autorize o Microfone para cadastrar a voz."
            return
        }
        await prepare()
        guard diarizer != nil else { return }

        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: [])
            try audioSession.setActive(true)

            let input = enrollmentEngine.inputNode
            let format = input.outputFormat(forBus: 0)
            enrollmentBuffer.reset(sampleRate: format.sampleRate)
            input.installTap(onBus: 0, bufferSize: 2048, format: format) { [buffer = enrollmentBuffer] audio, _ in
                guard let channel = audio.floatChannelData?[0] else { return }
                buffer.append(channel, count: Int(audio.frameLength))
            }
            tapInstalled = true
            enrollmentEngine.prepare()
            try enrollmentEngine.start()
            enrolling = true
            status = "Cadastro de voz: fale naturalmente por 8 segundos. Só a Sol deve falar agora."

            enrollmentTask?.cancel()
            enrollmentTask = Task { [weak self] in
                try? await Task.sleep(for: .seconds(8))
                guard !Task.isCancelled else { return }
                await self?.finishEnrollment()
            }
        } catch {
            stopEnrollmentHardware()
            status = "Não consegui iniciar o cadastro de voz."
        }
    }

    func cancelEnrollment() {
        enrollmentTask?.cancel()
        enrollmentTask = nil
        stopEnrollmentHardware()
        enrolling = false
        status = enrolled ? "Cadastro anterior preservado." : "Cadastro de voz cancelado."
    }

    func finishEnrollment() async {
        guard enrolling else { return }
        enrollmentTask?.cancel()
        enrollmentTask = nil
        stopEnrollmentHardware()
        enrolling = false

        let captured = enrollmentBuffer.snapshot()
        guard captured.samples.count >= Int(captured.sampleRate * 4.0) else {
            status = "A amostra ficou curta. Fale por pelo menos 4 segundos no próximo cadastro."
            return
        }
        guard let diarizer else {
            status = "O modelo local de locutor não está pronto."
            return
        }

        do {
            let normalized = Self.resample(captured.samples, from: captured.sampleRate, to: 16_000)
            let embedding = try diarizer.extractSpeakerEmbedding(from: normalized)
            guard embedding.count == SpeakerManager.embeddingSize else {
                status = "O perfil de voz gerado ficou inválido."
                return
            }
            try saveEmbedding(embedding)
            ownerEmbedding = embedding
            enrolled = true
            lastResult = .unknown
            lastDistance = nil
            status = "Voiceprint local da Sol cadastrado neste iPhone."
        } catch {
            status = "Não consegui criar o voiceprint local desta amostra."
        }
    }

    func verify(samples: [Float], sourceSampleRate: Double) async -> JarvisSpeakerIdentityResult {
        guard enrolled, let ownerEmbedding else {
            lastResult = .notEnrolled
            return .notEnrolled
        }
        guard !verificationInFlight else { return lastResult }
        guard Date().timeIntervalSince(lastVerificationAt) >= 1.5 else { return lastResult }

        if diarizer == nil { await prepare() }
        guard let diarizer else {
            lastResult = .unknown
            return .unknown
        }

        let normalized = Self.resample(samples, from: sourceSampleRate, to: 16_000)
        guard normalized.count >= 24_000 else { return lastResult }

        verificationInFlight = true
        defer {
            verificationInFlight = false
            lastVerificationAt = Date()
        }

        do {
            let embedding = try diarizer.extractSpeakerEmbedding(from: normalized)
            let distance = SpeakerManager.cosineDistance(embedding, ownerEmbedding)
            lastDistance = distance

            let result: JarvisSpeakerIdentityResult
            if distance.isFinite && distance <= verifiedSolMaxDistance {
                result = .sol
                status = "Voz compatível com o voiceprint local da Sol."
            } else if distance.isFinite && distance >= definiteGuestMinDistance {
                result = .guest
                status = "Outra voz detectada. Memória privada deve permanecer bloqueada."
            } else {
                result = .unknown
                status = "Não consegui confirmar o locutor com segurança."
            }
            lastResult = result
            return result
        } catch {
            lastResult = .unknown
            status = "Falha ao verificar o locutor; trate a voz como desconhecida."
            return .unknown
        }
    }

    func eraseEnrollment() {
        stopEnrollmentHardware()
        enrollmentTask?.cancel()
        enrollmentTask = nil
        SecItemDelete([
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount
        ] as CFDictionary)
        ownerEmbedding = nil
        enrolled = false
        lastResult = .notEnrolled
        lastDistance = nil
        status = "Voiceprint local apagado deste iPhone."
    }

    private func saveEmbedding(_ embedding: [Float]) throws {
        let data = try JSONEncoder().encode(embedding)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount
        ]
        SecItemDelete(query as CFDictionary)

        var add = query
        add[kSecValueData] = data
        add[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(add as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }

    private func loadEmbedding() -> [Float]? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let embedding = try? JSONDecoder().decode([Float].self, from: data),
              embedding.count == SpeakerManager.embeddingSize else {
            return nil
        }
        return embedding
    }

    private func stopEnrollmentHardware() {
        if tapInstalled {
            enrollmentEngine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        if enrollmentEngine.isRunning { enrollmentEngine.stop() }
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    static func resample(_ input: [Float], from sourceRate: Double, to targetRate: Double) -> [Float] {
        guard !input.isEmpty, sourceRate > 0, targetRate > 0 else { return [] }
        if abs(sourceRate - targetRate) < 1 { return input }

        let ratio = sourceRate / targetRate
        let outputCount = max(1, Int(Double(input.count) / ratio))
        var output = [Float]()
        output.reserveCapacity(outputCount)

        for index in 0..<outputCount {
            let position = Double(index) * ratio
            let lower = min(input.count - 1, Int(position))
            let upper = min(input.count - 1, lower + 1)
            let fraction = Float(position - Double(lower))
            output.append(input[lower] + (input[upper] - input[lower]) * fraction)
        }
        return output
    }
}
