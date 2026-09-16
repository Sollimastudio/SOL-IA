class JarvisLiveCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.pending = [];
    this.targetRate = 24000;
    this.chunkSamples = 480;
  }

  toInt16(sample) {
    const value = Math.max(-1, Math.min(1, sample));
    return value < 0 ? Math.round(value * 0x8000) : Math.round(value * 0x7fff);
  }

  flushChunks() {
    while (this.pending.length >= this.chunkSamples) {
      const chunk = new Int16Array(this.chunkSamples);
      for (let index = 0; index < this.chunkSamples; index += 1) chunk[index] = this.pending[index];
      this.pending.splice(0, this.chunkSamples);
      this.port.postMessage(chunk.buffer, [chunk.buffer]);
    }
  }

  process(inputs) {
    const channel = inputs?.[0]?.[0];
    if (!channel?.length) return true;

    const ratio = sampleRate / this.targetRate;
    while (this.phase < channel.length) {
      const lower = Math.floor(this.phase);
      const upper = Math.min(channel.length - 1, lower + 1);
      const fraction = this.phase - lower;
      const sample = channel[lower] + (channel[upper] - channel[lower]) * fraction;
      this.pending.push(this.toInt16(sample));
      this.phase += ratio;
    }
    this.phase -= channel.length;
    this.flushChunks();
    return true;
  }
}

registerProcessor('jarvis-gpt-live-capture', JarvisLiveCaptureProcessor);
