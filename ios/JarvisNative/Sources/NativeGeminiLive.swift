import Foundation
import AVFAudio

final class JarvisNativeGeminiLive: @unchecked Sendable {
    struct Configuration: Sendable {
        let auth: JarvisAuthSession
        let voice: String
        let instructions: String
    }

    var onStatus: (@Sendable (String) -> Void)?
    var onUserTranscript: (@Sendable (String) -> Void)?
    var onAssistantTranscript: (@Sendable (String) -> Void)?
    var onSpeakerWindow: (@Sendable ([Float], Double) -> Void)?

    private let urlSession: URLSession
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var socket: URLSessionWebSocketTask?
    private var receiveTask: Task<Void, Never>?
    private var started = false
    private var closing = false
    private var tapInstalled = false
    private var inputRate: Double = 48_000
    private var phase: Double = 0
    private var pending: [Int16] = []
    private var identityPending: [Float] = []
    private var speakerIdentity: JarvisSpeakerIdentityResult = .notEnrolled
    private var guestAwaitingAuthorization = false
    private var guestAuthorized = false
    private let targetRate: Double = 24_000
    private let chunkSamples = 960
    private let identityWindowSamples = 72_000

    init(urlSession: URLSession = .shared) {
        self.urlSession = urlSession
    }

    func connect(_ configuration: Configuration) async throws {
        guard socket == nil, !closing else { return }
        status("Conectando ao Gemini Live…")
        let token = try await ephemeralToken(accessToken: configuration.auth.accessToken)
        guard let url = URL(string: "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=\(token.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? token)") else {
            throw URLError(.badURL)
        }

        let task = urlSession.webSocketTask(with: url)
        socket = task
        task.resume()
        receiveTask = Task { [weak self] in await self?.receiveLoop(configuration) }

        try await send([
            "setup": [
                "model": "models/gemini-3.8-live",
                "generationConfig": [
                    "responseModalities": ["AUDIO"],
                    "speechConfig": [
                        "voiceConfig": [
                            "prebuiltVoiceConfig": ["voiceName": configuration.voice]
                        ]
                    ]
                ],
                "systemInstruction": [
                    "parts": [["text": configuration.instructions]]
                ],
                "inputAudioTranscription": [:],
                "outputAudioTranscription": [:],
                "tools": [[
                    "functionDeclarations": [[
                        "name": "consult_jarvis",
                        "description": "Consulta contexto privado autorizado do Jarvis quando a resposta depende de memória ou projetos anteriores.",
                        "parameters": [
                            "type": "OBJECT",
                            "properties": [
                                "request": [
                                    "type": "STRING",
                                    "description": "Pergunta objetiva para recuperar contexto privado relevante."
                                ]
                            ],
                            "required": ["request"]
                        ]
                    ]]
                ]]
            ]
        ])
    }

    func disconnect() {
        guard !closing else { return }
        closing = true
        started = false
        receiveTask?.cancel()
        receiveTask = nil
        stopAudio()
        socket?.cancel(with: .normalClosure, reason: nil)
        socket = nil
        status("Sessão Gemini encerrada.")
    }

    func setMuted(_ muted: Bool) {
        engine.inputNode.inputFormat(forBus: 0)
        engine.inputNode.volume = muted ? 0 : 1
    }

    func updateSpeakerIdentity(_ result: JarvisSpeakerIdentityResult) {
        guard result != speakerIdentity else { return }
        speakerIdentity = result

        switch result {
        case .sol:
            Task { [weak self] in
                try? await self?.sendSystemInstruction(
                    "SISTEMA LOCAL: o voiceprint do iPhone confirmou a Sol. Contexto privado pode ser consultado para a fala dela."
                )
            }
        case .guest:
            guestAwaitingAuthorization = true
            guestAuthorized = false
            Task { [weak self] in
                try? await self?.sendSystemInstruction(
                    "SISTEMA LOCAL: outra voz foi detectada. Não revele memória privada. Diga exatamente: Sol, detectei outra voz. Você autoriza que eu converse como convidado?"
                )
            }
        case .unknown, .preparing:
            Task { [weak self] in
                try? await self?.sendSystemInstruction(
                    "SISTEMA LOCAL: o locutor não pôde ser confirmado com segurança. Não consulte nem revele memória privada."
                )
            }
        case .notEnrolled:
            Task { [weak self] in
                try? await self?.sendSystemInstruction(
                    "SISTEMA LOCAL: não existe voiceprint cadastrado neste iPhone. Trate o locutor como não verificado e não revele memória privada."
                )
            }
        }
    }

    private func ephemeralToken(accessToken: String) async throws -> String {
        guard let url = URL(string: "/api/jarvis-gemini-live-token", relativeTo: JarvisNativeConfig.webAppURL) else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data("{}".utf8)
        let (data, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        guard (200..<300).contains(http.statusCode) else {
            let payload = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            let message = payload?["error"] as? String ?? "Não consegui autorizar o Gemini Live."
            throw NSError(domain: "JarvisGeminiLive", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: message])
        }
        let payload = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let token = payload?["token"] as? String, !token.isEmpty else {
            throw NSError(domain: "JarvisGeminiLive", code: 1, userInfo: [NSLocalizedDescriptionKey: "O servidor não devolveu um token Gemini válido."])
        }
        return token
    }

    private func receiveLoop(_ configuration: Configuration) async {
        while !Task.isCancelled, let socket, !closing {
            do {
                let message = try await socket.receive()
                let data: Data
                switch message {
                case .string(let text): data = Data(text.utf8)
                case .data(let value): data = value
                @unknown default: continue
                }
                guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { continue }
                await handle(object, configuration: configuration)
            } catch {
                if !closing {
                    status("A conexão Gemini Live foi interrompida.")
                }
                disconnect()
                return
            }
        }
    }

    private func handle(_ object: [String: Any], configuration: Configuration) async {
        if object["setupComplete"] != nil, !started {
            do {
                try startAudio()
                started = true
                status("Ouvindo. Verificando o locutor localmente; diga “encerrar” para terminar.")
                try await sendSystemInstruction(
                    "SISTEMA LOCAL: o Jarvis foi ativado no dispositivo da Sol, mas o locutor ainda precisa ser verificado. Diga: Tô aqui. Vou confirmar quem está falando."
                )
            } catch {
                status("Não consegui iniciar o áudio do Gemini Live.")
            }
        }

        if let content = object["serverContent"] as? [String: Any] {
            if let transcript = (content["inputTranscription"] as? [String: Any])?["text"] as? String, !transcript.isEmpty {
                onUserTranscript?(transcript)
                let normalized = normalize(transcript)
                if normalized == "encerrar" || normalized == "jarvis encerrar" {
                    disconnect()
                    return
                }

                if speakerIdentity == .sol && guestAwaitingAuthorization {
                    if normalized.contains("autorizo") || normalized.contains("pode conversar") || normalized.contains("pode falar") {
                        guestAwaitingAuthorization = false
                        guestAuthorized = true
                        try? await sendSystemInstruction(
                            "SISTEMA LOCAL: a voz verificada da Sol autorizou conversa de convidado. Converse genericamente com o convidado, mas continue bloqueando memória privada quando o locutor não for Sol."
                        )
                    } else if normalized.contains("nao autorizo") || normalized.contains("não autorizo") || normalized.contains("nao pode") || normalized.contains("não pode") {
                        guestAwaitingAuthorization = false
                        guestAuthorized = false
                        try? await sendSystemInstruction(
                            "SISTEMA LOCAL: a voz verificada da Sol negou autorização ao convidado. Não continue a conversa com o outro locutor."
                        )
                    }
                }
            }
            if let transcript = (content["outputTranscription"] as? [String: Any])?["text"] as? String, !transcript.isEmpty {
                onAssistantTranscript?(transcript)
            }
            if let turn = content["modelTurn"] as? [String: Any],
               let parts = turn["parts"] as? [[String: Any]] {
                for part in parts {
                    guard let inline = part["inlineData"] as? [String: Any],
                          let encoded = inline["data"] as? String,
                          let data = Data(base64Encoded: encoded) else { continue }
                    play(data)
                }
            }
        }

        if let toolCall = object["toolCall"] as? [String: Any],
           let calls = toolCall["functionCalls"] as? [[String: Any]] {
            await handleToolCalls(calls, configuration: configuration)
        }

        if let error = object["error"] as? [String: Any] {
            let message = error["message"] as? String ?? "O Gemini Live informou um erro."
            status(message)
        }
    }

    private func handleToolCalls(_ calls: [[String: Any]], configuration: Configuration) async {
        var responses: [[String: Any]] = []
        for call in calls {
            let name = call["name"] as? String ?? "unknown"
            let id = call["id"] as? String ?? UUID().uuidString
            guard name == "consult_jarvis" else {
                responses.append(["name": name, "id": id, "response": ["error": "Ferramenta não autorizada."]])
                continue
            }
            let args = call["args"] as? [String: Any]
            let request = args?["request"] as? String ?? ""
            guard speakerIdentity == .sol else {
                responses.append([
                    "name": name,
                    "id": id,
                    "response": ["error": "Contexto privado bloqueado: locutor não verificado como Sol."]
                ])
                continue
            }
            let context = await privateContext(query: request, accessToken: configuration.auth.accessToken)
            responses.append([
                "name": name,
                "id": id,
                "response": ["result": String(context.prefix(9000))]
            ])
        }
        if !responses.isEmpty {
            try? await send(["toolResponse": ["functionResponses": responses]])
        }
    }

    private func privateContext(query: String, accessToken: String) async -> String {
        let clean = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty,
              let url = URL(string: "/api/jarvis-core", relativeTo: JarvisNativeConfig.webAppURL) else {
            return "Nenhum contexto adicional confirmado."
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["query": String(clean.prefix(1000))])
        do {
            let (data, response) = try await urlSession.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode),
                  let payload = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  payload["ok"] as? Bool == true,
                  let context = payload["context"] else {
                return "O contexto privado não pôde ser recuperado nesta consulta."
            }
            let encoded = try JSONSerialization.data(withJSONObject: context)
            return String(data: encoded, encoding: .utf8) ?? "Contexto privado recuperado sem representação textual."
        } catch {
            return "O contexto privado não pôde ser recuperado nesta consulta."
        }
    }

    private func startAudio() throws {
        guard !engine.isRunning else { return }
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetoothHFP])
        try session.setActive(true)

        if !engine.attachedNodes.contains(player) {
            engine.attach(player)
        }
        let playbackFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: targetRate, channels: 1, interleaved: false)!
        engine.connect(player, to: engine.mainMixerNode, format: playbackFormat)

        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        inputRate = format.sampleRate
        phase = 0
        pending.removeAll(keepingCapacity: true)
        identityPending.removeAll(keepingCapacity: true)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.capture(buffer)
        }
        tapInstalled = true
        engine.prepare()
        try engine.start()
        player.play()
    }

    private func capture(_ buffer: AVAudioPCMBuffer) {
        guard started, !closing, let channel = buffer.floatChannelData?[0] else { return }
        let count = Int(buffer.frameLength)
        guard count > 0 else { return }
        let ratio = inputRate / targetRate

        while phase < Double(count) {
            let lower = Int(phase)
            let upper = min(count - 1, lower + 1)
            let fraction = Float(phase - Double(lower))
            let sample = channel[lower] + (channel[upper] - channel[lower]) * fraction
            let clipped = max(-1, min(1, sample))
            let pcm = clipped < 0 ? Int16(clipped * 32768) : Int16(clipped * 32767)
            pending.append(pcm)
            identityPending.append(clipped)
            phase += ratio
        }
        phase -= Double(count)

        while pending.count >= chunkSamples {
            let chunk = Array(pending.prefix(chunkSamples))
            pending.removeFirst(chunkSamples)
            let data = chunk.withUnsafeBytes { Data($0) }
            let payload: [String: Any] = [
                "realtimeInput": [
                    "audio": [
                        "data": data.base64EncodedString(),
                        "mimeType": "audio/pcm;rate=24000"
                    ]
                ]
            ]
            Task { [weak self] in try? await self?.send(payload) }
        }

        if identityPending.count >= identityWindowSamples {
            let window = Array(identityPending.prefix(identityWindowSamples))
            identityPending.removeFirst(identityWindowSamples)
            onSpeakerWindow?(window, targetRate)
        }
    }

    private func play(_ data: Data) {
        guard !closing else { return }
        let frames = data.count / MemoryLayout<Int16>.size
        guard frames > 0 else { return }
        let format = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: targetRate, channels: 1, interleaved: false)!
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frames)) else { return }
        buffer.frameLength = AVAudioFrameCount(frames)
        data.withUnsafeBytes { raw in
            guard let source = raw.bindMemory(to: Int16.self).baseAddress,
                  let target = buffer.int16ChannelData?[0] else { return }
            target.update(from: source, count: frames)
        }
        player.scheduleBuffer(buffer)
    }

    private func stopAudio() {
        if tapInstalled {
            engine.inputNode.removeTap(onBus: 0)
            tapInstalled = false
        }
        if player.isPlaying { player.stop() }
        if engine.isRunning { engine.stop() }
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        pending.removeAll()
        identityPending.removeAll()
        phase = 0
    }

    private func sendSystemInstruction(_ text: String) async throws {
        try await send([
            "clientContent": [
                "turns": [[
                    "role": "user",
                    "parts": [["text": text]]
                ]],
                "turnComplete": true
            ]
        ])
    }

    private func send(_ object: [String: Any]) async throws {
        guard let socket, !closing else { return }
        let data = try JSONSerialization.data(withJSONObject: object)
        guard let text = String(data: data, encoding: .utf8) else { return }
        try await socket.send(.string(text))
    }

    private func status(_ value: String) {
        onStatus?(value)
    }

    private func normalize(_ value: String) -> String {
        value.folding(options: .diacriticInsensitive, locale: .current)
            .lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines.union(.punctuationCharacters))
    }
}
