// AudioWorklet processor for real-time audio encoding
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 4096; // Match the chunk size we're sending
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const channelData = input[0]; // Mono audio

      // Convert Float32Array to PCM16
      const pcm16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        // Convert from float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }

      // Convert to base64 and send to main thread
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
      this.port.postMessage({ audio: base64Audio });
    }

    return true; // Keep the processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
