"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ka } from "@/lib/i18n";
import { getConspectusById, type Conspectus } from "@/lib/conspectus-storage";
import { ConspectusReader } from "./ConspectusReader";

export function ConspectusPageClient() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [conspectus, setConspectus] = useState<Conspectus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) {
      setReady(true);
      return;
    }
    setConspectus(getConspectusById(id) ?? null);
    setReady(true);
  }, [id]);

  if (!ready) {
    return (
      <p className="text-center text-zinc-500">{ka.conspectus.loading}</p>
    );
  }

  if (!conspectus) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {ka.conspectus.notFound}
        </h1>
        <Link
          href="/generate"
          className="mt-4 inline-block text-violet-600 hover:underline"
        >
          {ka.conspectus.back}
        </Link>
      </div>
    );
  }

  return <ConspectusReader conspectus={conspectus} />;
}
