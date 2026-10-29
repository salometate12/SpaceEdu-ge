import { describe, expect, it } from "vitest";
import { encodeWav, MAX_RECORDING_SECONDS, SPEECH_SAMPLE_RATE } from "./wav";

describe("encodeWav", () => {
  it("writes a RIFF header and 16-bit samples", () => {
    const wav = new DataView(encodeWav(new Float32Array([0, 1, -1]), 16000));
    const text = (at: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => wav.getUint8(at + i)));
    expect(text(0)).toBe("RIFF");
    expect(text(8)).toBe("WAVE");
    expect(wav.getUint32(24, true)).toBe(16000);
    expect(wav.byteLength).toBe(44 + 6);
    expect([wav.getInt16(44, true), wav.getInt16(46, true), wav.getInt16(48, true)]).toEqual([0, 32767, -32768]);
  });
  it("keeps the longest recording under 20 MB", () => {
    expect(44 + MAX_RECORDING_SECONDS * SPEECH_SAMPLE_RATE * 2).toBeLessThan(20 * 1024 * 1024);
  });
});
