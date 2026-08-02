"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  getSpaceBackTarget,
  readSpaceeduSpace,
  type SpaceeduSpace,
} from "@/lib/space-back-navigation";

interface SpaceBackLinkProps {
  className?: string;
}

export function SpaceBackLink({
  className = "mb-3 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white",
}: SpaceBackLinkProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [space, setSpace] = useState<SpaceeduSpace | null>(null);

  useEffect(() => {
    setSpace(readSpaceeduSpace());
  }, []);

  const { href, label } = useMemo(
    () => getSpaceBackTarget({ from, space }),
    [from, space],
  );

  return (
    <Link href={href} className={className}>
      <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
      {label}
    </Link>
  );
}
