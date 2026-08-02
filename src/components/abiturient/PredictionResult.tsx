"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  GripVertical,
  Share2,
  X,
} from "lucide-react";

const PRIORITY_ITEMS = [
  { code: "0010116", title: "ბიზნესის ადმინისტრირება", institution: "თსუ" },
  { code: "0010101", title: "კომპიუტერული მეცნიერება", institution: "ილიაუნი" },
  { code: "0010150", title: "საერთაშორისო ბიზნესი", institution: "სეუ" },
];

export function PredictionResult() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0B0F19] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-white">შენი პროგნოზი</h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            მაღალი თავსებადობა
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#161B26] px-3 py-2 text-xs text-zinc-300"
        >
          შეცვალე არჩევანი
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <article className="rounded-xl border border-white/[0.08] bg-[#111622] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-md border border-white/[0.1] bg-[#182033] px-2 py-0.5 font-mono text-xs text-zinc-300">
                0010116
              </span>
              <h4 className="text-lg font-semibold text-white">ბიზნესის ადმინისტრირება</h4>
            </div>
            <p className="text-sm text-zinc-400">თბილისის სახელმწიფო უნივერსიტეტი</p>
          </div>
          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
            მინიმალური შანსი
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-[#111622] p-4 sm:grid-cols-3 sm:gap-4">
          <Metric label="შენი ქულა" value="1,619" />
          <Metric label="გასული წლის ზღვარი" value="2,097" />
          <Metric label="არჩევითი საგანი" value="მათემატიკა" />
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            მიმდინარე პროგნოზი აჩვენებს, რომ პროგრამის ზღვარი შენს მოსალოდნელ ქულაზე
            მაღალია. რეკომენდებულია პრიორიტეტების გადანაწილება.
          </p>
        </div>
      </article>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0E1320] p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-white">პრიორიტეტების დალაგება</h4>
                <p className="text-sm text-zinc-400">
                  შეცვალე სიის თანმიმდევრობა მაუსის გადათრევით
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/[0.08] bg-[#161B26] p-2 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {PRIORITY_ITEMS.map((item, idx) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#141a2a] px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-zinc-500" />
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-xs text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm text-white">{item.title}</p>
                      <p className="text-xs text-zinc-400">
                        {item.code} • {item.institution}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                    პრიორიტეტული
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
              >
                <Share2 className="h-4 w-4" />
                სიის გაზიარება
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/[0.08] bg-[#161B26] px-4 py-2.5 text-sm text-zinc-300"
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0f1420] px-3 py-2">
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
