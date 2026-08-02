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
    <div className="w-full max-w-md animate-pulse rounded-2xl border border-white/[0.08] bg-[#121214]/40 p-8 backdrop-blur-xl">
      <div className="mx-auto h-11 w-11 rounded-xl bg-white/[0.06]" />
      <div className="mx-auto mt-4 h-6 w-48 rounded-lg bg-white/[0.06]" />
      <div className="mx-auto mt-2 h-4 w-64 rounded-lg bg-white/[0.04]" />
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-12"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }}
    >
      <Suspense fallback={<RegistrationFallback />}>
        <RegistrationForm />
      </Suspense>
    </main>
  );
}
