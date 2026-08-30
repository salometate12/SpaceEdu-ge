import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthCompleteView } from "@/components/registration/AuthCompleteView";

function AuthCompleteFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <Loader2 className="h-6 w-6 animate-spin stroke-[1.5] text-purple-400" aria-hidden />
    </main>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<AuthCompleteFallback />}>
      <AuthCompleteView />
    </Suspense>
  );
}
