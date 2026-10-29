import { Suspense } from "react";
import { CardGenerator } from "@/components/CardGenerator";

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <CardGenerator />
    </Suspense>
  );
}
