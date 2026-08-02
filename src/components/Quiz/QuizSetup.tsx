"use client";

import { useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

interface QuizSetupProps {
  loading: boolean;
  onGenerate: (payload: { material: string; questionCount: number }) => Promise<void>;
}

type InputMode = "file" | "text";

export function QuizSetup({ loading, onGenerate }: QuizSetupProps) {
  const [material, setMaterial] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [mode, setMode] = useState<InputMode>("file");
  const [fileName, setFileName] = useState("");
  const [fileMaterial, setFileMaterial] = useState("");
  const [isDropActive, setIsDropActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const applyFile = async (file: File) => {
    setLocalError(null);
    setFileName(file.name);
    try {
      const raw = await file.text();
      const normalized = raw.replace(/\s+/g, " ").trim();
      if (normalized.length < 30) {
        setLocalError(
          "ფაილიდან ტექსტი ვერ ამოვიკითხე. სცადე სხვა ფაილი ან გამოიყენე ტექსტის ჩაწერის რეჟიმი.",
        );
        setFileMaterial("");
        return;
      }
      setFileMaterial(raw.slice(0, 40000));
    } catch {
      setLocalError("ფაილის დამუშავება ვერ მოხერხდა. სცადე სხვა ფაილი.");
      setFileMaterial("");
    }
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    await applyFile(nextFile);
  };

  const onDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDropActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) return;
    await applyFile(dropped);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const source = mode === "file" ? fileMaterial : material;
    const prepared = source.trim();
    if (prepared.length < 30) {
      setLocalError("გთხოვ, დაამატე მინიმუმ 30 სიმბოლოს მასალა.");
      return;
    }
    setLocalError(null);
    await onGenerate({ material: prepared, questionCount });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-3xl border border-white/[0.08] bg-[#0f1012]/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6"
    >
      <div className="inline-flex rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-1">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            mode === "file"
              ? "border border-purple-500/30 bg-purple-500/10 text-purple-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          📂 ფაილის ატვირთვა
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            mode === "text"
              ? "border border-purple-500/30 bg-purple-500/10 text-purple-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ✍️ ტექსტის ჩაწერა
        </button>
      </div>

      {mode === "file" ? (
        <label
          onDrop={onDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDropActive(true);
          }}
          onDragLeave={() => setIsDropActive(false)}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-[#121214]/40 p-10 text-center transition-all ${
            isDropActive
              ? "border-purple-500/40 bg-purple-500/10"
              : "border-white/[0.08] hover:border-purple-500/30"
          }`}
        >
          <input
            type="file"
            accept=".txt,.md,.pdf,.doc,.docx"
            className="hidden"
            onChange={onFileChange}
          />
          <span className="text-2xl">⭳</span>
          <p className="text-sm text-zinc-200">
            ჩააგდე PDF / Word ფაილი ან დააწკაპუნე ასარჩევად
          </p>
          <p className="text-xs text-zinc-500">TXT / MD მუშაობს ყველაზე სტაბილურად</p>
          {fileName && (
            <div className="rounded-lg border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
              არჩეული ფაილი: {fileName}
            </div>
          )}
        </label>
      ) : (
        <textarea
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="ჩასვი სასწავლო ტექსტი აქ..."
          className="h-48 w-full resize-none rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-4 text-white outline-none placeholder:text-gray-500 focus:border-purple-500/50"
        />
      )}

      <div className="rounded-2xl border border-white/[0.08] bg-[#121214]/45 px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
          <span>კითხვების რაოდენობა</span>
          <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400">
            {questionCount}
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={15}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="w-56 max-w-full accent-purple-500"
        />
      </div>

      {localError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          ⚠️ {localError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "AI ქმნის კითხვებს..." : "კითხვის გენერაცია"}
      </button>
    </form>
  );
}
