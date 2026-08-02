import { AbiturientSubjectHub } from "@/components/abiturient/AbiturientSubjectHub";
import { GeorgianSpacePremiumCard } from "@/components/abiturient/GeorgianSpacePremiumCard";
import { GeorgianSubjectPageModules } from "@/components/abiturient/GeorgianSubjectPageModules";

export default function GeorgianSubjectPage() {
  return (
    <>
      <AbiturientSubjectHub
        subjectId="georgian"
        premiumSlot={<GeorgianSpacePremiumCard />}
      />
      <GeorgianSubjectPageModules />
    </>
  );
}
