import { Suspense } from "react";
import { AuthCardSkeleton, AuthShell } from "@/components/registration/AuthCard";
import { LoginForm } from "@/components/registration/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthCardSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
