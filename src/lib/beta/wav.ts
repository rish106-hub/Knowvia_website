// Pure helpers: PCM capture to 16 kHz mono 16-bit WAV. No dependencies.
export const WAV_RATE = 16000;
export const MAX_RECORD_SECONDS = 15;
export const MAX_WAV_BYTES = 44 + MAX_RECORD_SECONDS * WAV_RATE * 2; // 480,044 (inside the 512 KB BFF body cap)

/** Averaging downsampler from inRate to 16 kHz. */
export function downsample(input: Float32Array, inRate: number, outRate = WAV_RATE): Float32Array {
  if (inRate === outRate) return input;
  const ratio = inRate / outRate;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = end > start ? sum / (end - start) : 0;
  }
  return out;
}

export function floatTo16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

/** RIFF/WAVE, PCM, mono, 16-bit little endian. */
export function encodeWav(samples: Int16Array, sampleRate = WAV_RATE): ArrayBuffer {
  const dataBytes = samples.length * 2;
  const buf = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(buf);
  const tag = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  tag(0, "RIFF"); v.setUint32(4, 36 + dataBytes, true); tag(8, "WAVE");
  tag(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  tag(36, "data"); v.setUint32(40, dataBytes, true);
  samples.forEach((s, i) => v.setInt16(44 + i * 2, s, true));
  return buf;
}

/** Joins captured float chunks, downsamples, caps at 15 s and encodes. */
export function chunksToWav(chunks: Float32Array[], inRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const all = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  const pcm = floatTo16(downsample(all, inRate)).subarray(0, MAX_RECORD_SECONDS * WAV_RATE);
  return new Blob([encodeWav(pcm)], { type: "audio/wav" });
}
