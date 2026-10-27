/**
 * Dev preview (NODE_ENV=development only):
 * /registration?role=student
 * /registration?role=student&dev_target=georgian-space
 * /registration?role=abiturient
 */
import { Suspense } from "react";
import { AuthCardSkeleton, AuthShell } from "@/components/registration/AuthCard";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export default function RegistrationPage() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthCardSkeleton />}>
        <RegistrationForm />
      </Suspense>
    </AuthShell>
  );
}
