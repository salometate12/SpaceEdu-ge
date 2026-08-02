import { redirect } from "next/navigation";
import { DASHBOARD_ABIT_HREF } from "@/lib/dashboard-routes";

export default function LegacyDashboardPage() {
  redirect(DASHBOARD_ABIT_HREF);
}
