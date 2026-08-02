import { redirect } from "next/navigation";
import { DASHBOARD_STUDENT_HREF } from "@/lib/dashboard-routes";

export default function LegacyUniversityPage() {
  redirect(DASHBOARD_STUDENT_HREF);
}
