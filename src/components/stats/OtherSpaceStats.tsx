import Link from "next/link";
import { STATS_HREF } from "@/lib/access-control";
import type { StatsSpace } from "@/lib/activity-log";
import { psButton } from "@/components/profile/settings-ui";
import { SpaceChip } from "./stats-ui";

/** Opened the other space's stats page: say whose it is and send them to their own, without showing any numbers. */
export function OtherSpaceStats({ page, working }: { page: StatsSpace; working: StatsSpace | null }) {
  return (
    <section className="ps-card flex flex-col items-start gap-4 p-6 sm:p-8">
      <SpaceChip space={page} />
      <h1 className="text-[22px] font-bold leading-tight text-[var(--ps-title)]">
        ეს {page === "student" ? "სტუდენტის" : "აბიტურიენტის"} სივრცის სტატისტიკაა
      </h1>
      <p className="max-w-[520px] text-[14.5px] text-[var(--ps-text)]">
        {working
          ? `შენ ახლა ${working === "student" ? "სტუდენტის" : "აბიტურიენტის"} სივრცეში ხარ. სტატისტიკა სივრცეებს შორის არ ერევა.`
          : "სტატისტიკის სანახავად ჯერ სივრცე აირჩიე."}
      </p>
      <Link href={working ? STATS_HREF : "/select-space"} className={psButton("primary")}>
        {working ? "გადადი შენს სტატისტიკაზე" : "სივრცის არჩევა"}
      </Link>
    </section>
  );
}
