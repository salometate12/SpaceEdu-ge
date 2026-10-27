import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/registration/AuthCard";
import { AuthCompleteView } from "@/components/registration/AuthCompleteView";

function AuthCompleteFallback() {
  return (
    <AuthShell>
      <div className="flex flex-1 items-start justify-center pt-16">
        <Loader2 className="h-6 w-6 animate-spin stroke-[1.5] text-[var(--au-primary)]" aria-hidden />
      </div>
    </AuthShell>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<AuthCompleteFallback />}>
      <AuthCompleteView />
    </Suspense>
  );
}
