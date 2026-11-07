"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* The Web Speech API's recognizer: not in TypeScript's DOM types yet. */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionConstructor = new () => Recognition;

function recognizer(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const host = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

/**
 * Dictation in Georgian (`ka-GE`) for a lecture: each finished phrase goes
 * to `onText`. It keeps listening through pauses (the browser stops after a
 * silence; it's started again) until stopped. `supported` is false where
 * the browser has no speech recognition: the button isn't shown there.
 */
export function useSpeechDictation(onText: (text: string) => void) {
  const supported = useSyncExternalStore(noop, () => recognizer() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  const stop = useCallback(() => {
    wanted.current = false;
    active.current?.stop();
    active.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Constructor = recognizer();
    if (!Constructor) return;
    setError(null);
    wanted.current = true;
    const run = () => {
      const recognition = new Constructor();
      recognition.lang = "ka-GE";
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const text = result.isFinal ? result[0].transcript.trim() : "";
          if (text) onTextRef.current(text);
        }
      };
      recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        wanted.current = false;
        setError(event.error === "not-allowed" || event.error === "service-not-allowed" ? "მიკროფონზე წვდომა არ არის. ნება დართე ბრაუზერის პარამეტრებში." : "ხმით ჩაწერა შეწყდა. სცადე თავიდან.");
      };
      recognition.onend = () => {
        if (wanted.current) {
          run();
          return;
        }
        active.current = null;
        setListening(false);
      };
      active.current = recognition;
      try {
        recognition.start();
        setListening(true);
      } catch {
        wanted.current = false;
        setListening(false);
      }
    };
    run();
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, listening, error, start, stop, clearError: () => setError(null) };
}
