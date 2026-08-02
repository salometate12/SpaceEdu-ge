import { Suspense } from "react";
import { LoginForm } from "@/components/registration/LoginForm";

function LoginFallback() {
  return (
    <div className="h-64 w-full max-w-md animate-pulse rounded-2xl border border-white/[0.08] bg-[#121214]/40" />
  );
}

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-12"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }}
    >
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
