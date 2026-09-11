import { Suspense } from "react";
import { LoginForm } from "@/components/registration/LoginForm";

function LoginFallback() {
  return (
    <div className="h-64 w-full max-w-md animate-pulse rounded-2xl border border-slate-200 bg-white/70 dark:border-white/[0.08] dark:bg-[#121214]/40" />
  );
}

export default function LoginPage() {
  return (
    <main className="auth-ground flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
