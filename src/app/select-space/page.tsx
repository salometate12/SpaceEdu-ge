"use client";

import { useRouter } from "next/navigation";
import { SpaceSelectorModal } from "@/components/SpaceSelectorModal";
import { registrationHref } from "@/lib/registration-role";

export default function SelectSpacePage() {
  const router = useRouter();

  const handleSelect = (spaceId: "school" | "abiturient" | "student") => {
    if (spaceId === "abiturient" || spaceId === "student") {
      router.push(registrationHref(spaceId));
      return;
    }
  };

  return <SpaceSelectorModal onSelect={handleSelect} />;
}
