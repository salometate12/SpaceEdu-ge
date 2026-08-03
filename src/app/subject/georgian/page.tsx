import { AbiturientSubjectHub } from "@/components/abiturient/AbiturientSubjectHub";
import { GeorgianSubjectPageModules } from "@/components/abiturient/GeorgianSubjectPageModules";

export default function GeorgianSubjectPage() {
  return (
    <>
      <AbiturientSubjectHub subjectId="georgian" />
      <GeorgianSubjectPageModules />
    </>
  );
}
