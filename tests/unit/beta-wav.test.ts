import { describe, expect, it } from "vitest";
import { MAX_WAV_BYTES, WAV_RATE, chunksToWav, downsample, encodeWav, floatTo16 } from "@/lib/beta/wav";

const ascii = (v: DataView, o: number, n: number) => String.fromCharCode(...Array.from({ length: n }, (_, i) => v.getUint8(o + i)));

describe("WAV encoder", () => {
  it("writes a 16 kHz mono 16-bit PCM header whose data length matches the samples", () => {
    const samples = Int16Array.from([0, 1000, -1000, 32767, -32768]);
    const v = new DataView(encodeWav(samples));
    expect(ascii(v, 0, 4)).toBe("RIFF");
    expect(ascii(v, 8, 4)).toBe("WAVE");
    expect(ascii(v, 12, 4)).toBe("fmt ");
    expect(v.getUint16(20, true)).toBe(1);
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(WAV_RATE);
    expect(v.getUint32(28, true)).toBe(WAV_RATE * 2);
    expect(v.getUint16(34, true)).toBe(16);
    expect(ascii(v, 36, 4)).toBe("data");
    expect(v.getUint32(40, true)).toBe(samples.length * 2);
    expect(v.getUint32(4, true)).toBe(36 + samples.length * 2);
    expect(v.byteLength).toBe(44 + samples.length * 2);
    expect(v.getInt16(46, true)).toBe(1000);
  });
  it("downsamples 48 kHz to 16 kHz and clamps floats", () => {
    expect(downsample(new Float32Array(4800), 48000).length).toBe(1600);
    expect(Array.from(floatTo16(Float32Array.from([2, -2, 0])))).toEqual([32767, -32768, 0]);
  });
  it("caps a long recording at 15 s (about 480 KB, under 512 KB) as audio/wav", async () => {
    const blob = chunksToWav([new Float32Array(48000 * 40)], 48000);
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(MAX_WAV_BYTES);
    expect(blob.size).toBeLessThan(512 * 1024);
  });
});
