"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { encodeWav, MAX_RECORDING_SECONDS, SPEECH_SAMPLE_RATE } from "@/lib/audio/wav";
import { formatClock } from "@/lib/generation-options";

const BARS = 44;

type RecorderState = "idle" | "recording" | "saving";

/** Down to 16 kHz mono with the browser's own resampler, then WAV. */
async function toWavFile(blob: Blob): Promise<File> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const length = Math.ceil(decoded.duration * SPEECH_SAMPLE_RATE);
    const offline = new OfflineAudioContext(1, length, SPEECH_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const wav = encodeWav(rendered.getChannelData(0), SPEECH_SAMPLE_RATE);
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ").replace(":", "-");
    return new File([wav], `ჩანაწერი ${stamp}.wav`, { type: "audio/wav" });
  } finally {
    void context.close();
  }
}

/**
 * Records a lecture from the microphone with a live wave, for up to ten
 * minutes (what fits in one upload), and hands back a WAV file.
 */
export function AudioRecorder({ onRecorded, onError }: { onRecorded: (file: File) => void; onError: (message: string) => void }) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array(BARS).fill(0.06));
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const cleanup = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    frameRef.current = null;
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    cleanup();
  }, []);

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError("ამ ბრაუზერში ჩაწერა არ მუშაობს. ატვირთე აუდიო ფაილი.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError("მიკროფონზე წვდომა არ არის. დაუშვი ბრაუზერის პარამეტრებში.");
      return;
    }
    streamRef.current = stream;

    // The live wave: one bar per frequency band, newest volume per frame.
    const context = new AudioContext();
    contextRef.current = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    context.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(data);
      setLevels(Array.from({ length: BARS }, (_, i) => Math.max(0.06, data[Math.floor((i / BARS) * data.length)] / 255)));
      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      cleanup();
      setLevels(new Array(BARS).fill(0.06));
      setState("saving");
      try {
        onRecorded(await toWavFile(new Blob(chunks, { type: recorder.mimeType })));
      } catch {
        onError("ჩანაწერი ვერ შევინახე. სცადე თავიდან ან ატვირთე ფაილი.");
      } finally {
        setState("idle");
        setSeconds(0);
      }
    };
    recorder.start(1000);
    setSeconds(0);
    setState("recording");
    const startedAt = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) stop();
    }, 250);
  };

  const recording = state === "recording";

  return (
    <div className="flex items-center gap-4 rounded-[18px] bg-[#f0fdf4] p-4 dark:bg-[rgba(74,222,128,0.08)]">
      <button
        type="button"
        onClick={() => (recording ? stop() : void start())}
        disabled={state === "saving"}
        aria-label={recording ? "ჩაწერის შეწყვეტა" : "ჩაწერის დაწყება"}
        className={`gen-focus flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-60 ${
          recording ? "bg-[#dc2626] hover:bg-[#b91c1c]" : "bg-[#e11d74] hover:bg-[#cf1769]"
        }`}
      >
        {recording ? <Square className="h-5 w-5 fill-current" aria-hidden /> : <Mic className="h-6 w-6" strokeWidth={2} aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[15px] font-semibold text-[#14532d] dark:text-[#bbf7d0]">
            {recording ? "ვიწერთ ლექციას" : state === "saving" ? "ვინახავთ ჩანაწერს…" : "ჩაწერე ლექცია"}
          </p>
          <span className="shrink-0 text-[14px] font-semibold tabular-nums text-[#15803d] dark:text-[#86efac]" aria-live="off">
            {recording ? `${formatClock(seconds)} / ${formatClock(MAX_RECORDING_SECONDS)}` : `მაქს. ${MAX_RECORDING_SECONDS / 60} წუთი`}
          </span>
        </div>
        <div className="gen-wave mt-2 flex h-8 items-center gap-[3px]" aria-hidden>
          {levels.map((level, index) => (
            <span key={index} style={{ height: `${Math.round(level * 100)}%`, opacity: recording ? 1 : 0.35 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
