import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton, AuthShell } from "@/components/registration/AuthCard";
import { ResetPasswordForm } from "@/components/registration/ResetPasswordForm";

export const metadata: Metadata = {
  title: "ახალი პაროლი",
  robots: { index: false },
};

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthCardSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
