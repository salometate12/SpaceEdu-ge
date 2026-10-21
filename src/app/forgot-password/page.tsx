import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/registration/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "პაროლის აღდგენა",
  robots: { index: false },
};

function Fallback() {
  return (
    <div className="h-64 w-full max-w-md animate-pulse rounded-2xl border border-slate-200 bg-white/70 dark:border-white/[0.08] dark:bg-[#121214]/40" />
  );
}

export default function Page() {
  return (
    <main className="auth-ground flex min-h-dvh items-center justify-center px-4 py-12">
      <Suspense fallback={<Fallback />}>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
