import { Suspense } from "react";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";

export default function Page() {
  return (
    <main>
      <Suspense fallback={null}>
        <NotificationsPage />
      </Suspense>
    </main>
  );
}
