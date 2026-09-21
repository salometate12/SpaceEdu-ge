"use client";

import { useRef, useState } from "react";
import { Headphones, Pause, Play } from "lucide-react";

function fmt(t: number): string {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * The listening (Task 1) audio player. `maxPlays` enforces the exam's own rule
 * ("You will then hear the recording twice") — the play button is disabled once
 * the recording has finished that many times. Omit it for free, unlimited
 * replay in the Space practice.
 */
export function EnglishAudioPlayer({
  src,
  maxPlays,
}: {
  src: string;
  maxPlays?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [playsDone, setPlaysDone] = useState(0);

  const limited = typeof maxPlays === "number";
  const exhausted = limited && playsDone >= maxPlays! && !playing;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      if (exhausted) return;
      void a.play();
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/25 dark:bg-amber-500/[0.06]">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
        <Headphones className="h-3 w-3 stroke-[2.5]" />
        Listening
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={exhausted}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={playing ? "pause" : "play"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-amber-500 transition-[width] duration-200"
              style={{ width: dur > 0 ? `${(cur / dur) * 100}%` : "0%" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold tabular-nums text-amber-800 dark:text-amber-200/80">
            <span>{fmt(cur)} / {fmt(dur)}</span>
            {limited && (
              <span>
                {exhausted
                  ? "მოსმენა ამოიწურა"
                  : `დარჩა ${Math.max(0, maxPlays! - playsDone)} მოსმენა`}
              </span>
            )}
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={() => {
          setPlaying(false);
          setCur(0);
          setPlaysDone((n) => n + 1);
        }}
      />
    </div>
  );
}
