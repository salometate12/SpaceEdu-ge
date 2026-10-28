import { redirect } from "next/navigation";
import { statsPageForSpace } from "@/lib/access-control";

// The stats pages moved under /profile/stats; old links land on the abiturient one.
export default function AbiturientStatsRedirect() {
  redirect(statsPageForSpace("abiturient"));
}
