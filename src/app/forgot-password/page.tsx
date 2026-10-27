import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton, AuthShell } from "@/components/registration/AuthCard";
import { ForgotPasswordForm } from "@/components/registration/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "პაროლის აღდგენა",
  robots: { index: false },
};

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthCardSkeleton />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
