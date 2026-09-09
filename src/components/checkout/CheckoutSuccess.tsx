"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Sparkle } from "@/components/landing/notebook/Doodles";
import {
  ACCENT_CARD,
  ACCENT_SOLID,
  ACCENT_TEXT,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";
import {
  findPricingTier,
  roleForTier,
  type PricingRole,
  type PricingTier,
} from "@/lib/landing-pricing-plans";
import { dashboardHrefForSpace } from "@/lib/dashboard-routes";

const ROLE_ACCENT: Record<PricingRole, NotebookAccent> = {
  abiturient: "violet",
  student: "blue",
};

const ROLE_LABEL: Record<PricingRole, string> = {
  abiturient: "აბიტურიენტი",
  student: "სტუდენტი",
};

const DATE_FORMAT = new Intl.DateTimeFormat("ka-GE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** The paper's torn bottom edge: a row of small triangles cut out of it. */
const TORN_EDGE =
  "polygon(0% 0%, 100% 0%, 100% calc(100% - 12px), 96% 100%, 92% calc(100% - 12px), 88% 100%, 84% calc(100% - 12px), 80% 100%, 76% calc(100% - 12px), 72% 100%, 68% calc(100% - 12px), 64% 100%, 60% calc(100% - 12px), 56% 100%, 52% calc(100% - 12px), 48% 100%, 44% calc(100% - 12px), 40% 100%, 36% calc(100% - 12px), 32% 100%, 28% calc(100% - 12px), 24% 100%, 20% calc(100% - 12px), 16% 100%, 12% calc(100% - 12px), 8% 100%, 4% calc(100% - 12px), 0% 100%)";

function Slip({ tier, role }: { tier: PricingTier; role: PricingRole }) {
  const accent = ROLE_ACCENT[role];

  return (
    <motion.div
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="notebook-paper relative w-full max-w-sm border-x-2 border-t-2 border-slate-300/80 px-7 pb-12 pt-9 text-center shadow-[0_24px_50px_-28px_rgba(0,0,0,0.55)] dark:border-white/[0.12]"
      style={{ clipPath: TORN_EDGE }}
    >
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 ${ACCENT_SOLID[accent]}`}
      >
        <Check className="h-7 w-7 stroke-[3]" aria-hidden />
      </span>

      <h1 className="headline mt-5 text-xl font-extrabold text-slate-900 dark:text-slate-50">
        გადახდა წარმატებულია
      </h1>

      <dl className="mt-6 space-y-2 text-left text-sm">
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-slate-300/70 pb-2 dark:border-white/[0.12]">
          <dt className="text-slate-600 dark:text-slate-400">პაკეტი</dt>
          <dd className="font-bold text-slate-900 dark:text-slate-50">{tier.name}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-slate-300/70 pb-2 dark:border-white/[0.12]">
          <dt className="text-slate-600 dark:text-slate-400">სივრცე</dt>
          <dd className="font-bold text-slate-900 dark:text-slate-50">{ROLE_LABEL[role]}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-slate-300/70 pb-2 dark:border-white/[0.12]">
          <dt className="text-slate-600 dark:text-slate-400">პერიოდი</dt>
          <dd className="font-bold text-slate-900 dark:text-slate-50">{tier.period}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-1">
          <dt className="text-slate-600 dark:text-slate-400">თანხა</dt>
          <dd className={`text-lg font-extrabold ${ACCENT_TEXT[accent]}`}>{tier.price}</dd>
        </div>
      </dl>

      <p className="mono mt-5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {DATE_FORMAT.format(new Date())}
      </p>
      <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
        მადლობა — წარმატებები სწავლაში.
      </p>
    </motion.div>
  );
}

export function CheckoutSuccess() {
  const params = useSearchParams();
  const tierId = params.get("tier");
  const tier = tierId ? findPricingTier(tierId) : null;
  const role = tier ? roleForTier(tier.id) : null;
  const [confirmed, setConfirmed] = useState(false);

  // Records the entitlement on the account, which is what lifts the trial
  // deadline in the middleware. Once a bank callback exists this moves
  // server-side and this call goes away.
  useEffect(() => {
    if (!tier || confirmed) return;
    let active = true;
    void fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: tier.id }),
    })
      .catch(() => undefined)
      .finally(() => {
        if (active) setConfirmed(true);
      });
    return () => {
      active = false;
    };
  }, [tier, confirmed]);

  if (!tier || !role) {
    return (
      <main className="notebook-paper flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
        <p className="text-base font-bold text-slate-900 dark:text-slate-50">
          გადახდა ვერ მოიძებნა
        </p>
        <Link
          href="/#pricing"
          className={`paper-sticker inline-flex items-center rounded-full border-2 px-6 py-3 text-sm font-bold ${ACCENT_SOLID.violet}`}
        >
          პაკეტების ნახვა
        </Link>
      </main>
    );
  }

  const accent = ROLE_ACCENT[role];
  const space = role === "abiturient" ? "abiturient" : "student";

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12">
      <Sparkle className="pointer-events-none absolute left-10 top-16 hidden h-5 w-5 -rotate-12 text-amber-400 sm:block" />
      <Sparkle className="pointer-events-none absolute right-12 top-28 hidden h-4 w-4 rotate-12 text-sky-400 sm:block" />

      {/* The printer: the slip slides out of this slot. */}
      <div className="w-full max-w-sm">
        <div
          className={`h-3 w-full rounded-t-2xl border-2 border-b-0 ${ACCENT_CARD[accent]}`}
          aria-hidden
        />
        <div className="overflow-hidden">
          <Slip tier={tier} role={role} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.0 }}
        className="mt-10"
      >
        <Link
          href={dashboardHrefForSpace(space)}
          className={`paper-sticker inline-flex items-center rounded-full border-2 px-7 py-3.5 text-base font-bold ${ACCENT_SOLID[accent]}`}
        >
          დეშბორდზე გადასვლა
        </Link>
      </motion.div>
    </main>
  );
}
