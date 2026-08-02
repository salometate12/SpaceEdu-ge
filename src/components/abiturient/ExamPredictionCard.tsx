"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  PREDICTION_STATUS_STYLES,
  type PredictionStatus,
} from "@/lib/exam-calculator/prediction-status";
import type { CalculatorPrediction } from "@/lib/exam-calculator/types";

function formatScore(value: number): string {
  return value.toLocaleString("ka-GE");
}

interface ExamPredictionCardProps {
  prediction: CalculatorPrediction;
}

export function ExamPredictionCard({ prediction }: ExamPredictionCardProps) {
  const styles = PREDICTION_STATUS_STYLES[prediction.status];

  return (
    <section className="rounded-2xl border border-cyan-300/50 bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/30 p-5 shadow-lg shadow-cyan-100/30 backdrop-blur-md dark:border-cyan-500/20 dark:bg-[#0B0F19]/90 dark:shadow-[0_0_32px_rgba(34,211,238,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            შენი პროგნოზი
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${styles.header}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {prediction.compatibilityLabel}
          </span>
        </div>
      </div>

      <article className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-inner dark:border-white/[0.08] dark:bg-[#111622]/95">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600 dark:border-white/[0.1] dark:bg-[#182033] dark:text-zinc-300">
                {prediction.code}
              </span>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                {prediction.faculty}
              </h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              {prediction.university}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${styles.badge}`}
          >
            {prediction.statusLabel}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-gradient-to-r from-slate-50 via-cyan-50/50 to-violet-50/40 p-4 sm:grid-cols-3 sm:gap-4 dark:bg-[#0f1420]">
          <Metric label="შენი ქულა" value={formatScore(prediction.userScore)} />
          <Metric
            label="გასული წლის ზღვარი"
            value={formatScore(prediction.threshold)}
          />
          <Metric label="არჩევითი საგანი" value={prediction.electiveSubject} />
        </div>

        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${styles.alert}`}
        >
          <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${styles.alertIcon}`} />
          <p>{prediction.advisoryMessage}</p>
        </div>
      </article>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-[#111622]">
      <p className="text-[11px] text-slate-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export function resultStatusBadgeClass(status: PredictionStatus): string {
  return PREDICTION_STATUS_STYLES[status].badge;
}
