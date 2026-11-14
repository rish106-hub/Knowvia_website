import { chunksToWav } from "./wav";

export type Recording = { stop: () => Blob };

const WORKLET = `class P extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice());return true}}registerProcessor("kv-pcm",P)`;

/** Captures mic PCM via an AudioWorklet (ScriptProcessor fallback). stop() returns a 16 kHz mono 16-bit WAV. */
export async function startRecording(stream: MediaStream): Promise<Recording> {
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const chunks: Float32Array[] = [];
  let cleanup: () => void;
  try {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    const node = new AudioWorkletNode(ctx, "kv-pcm");
    node.port.onmessage = e => chunks.push(e.data as Float32Array);
    src.connect(node);
    cleanup = () => { node.port.onmessage = null; node.disconnect(); };
  } catch {
    const node = ctx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = e => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    src.connect(node); node.connect(ctx.destination);
    cleanup = () => { node.onaudioprocess = null; node.disconnect(); };
  }
  return {
    stop: () => {
      cleanup(); src.disconnect(); stream.getTracks().forEach(t => t.stop());
      const rate = ctx.sampleRate;
      void ctx.close();
      return chunksToWav(chunks, rate);
    },
  };
}
