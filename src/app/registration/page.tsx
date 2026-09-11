/**
 * Dev preview (NODE_ENV=development only):
 * /registration?role=student
 * /registration?role=student&dev_target=georgian-space
 * /registration?role=abiturient
 */
import { Suspense } from "react";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

function RegistrationFallback() {
  return (
    <div className="w-full max-w-md animate-pulse rounded-2xl border border-slate-200 bg-white/70 p-8 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#121214]/40">
      <div className="mx-auto h-11 w-11 rounded-xl bg-slate-200/70 dark:bg-white/[0.06]" />
      <div className="mx-auto mt-4 h-6 w-48 rounded-lg bg-slate-200/70 dark:bg-white/[0.06]" />
      <div className="mx-auto mt-2 h-4 w-64 rounded-lg bg-slate-200/50 dark:bg-white/[0.04]" />
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <main className="auth-ground flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense fallback={<RegistrationFallback />}>
        <RegistrationForm />
      </Suspense>
    </main>
  );
}
