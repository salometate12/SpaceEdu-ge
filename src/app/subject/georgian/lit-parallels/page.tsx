import { Suspense } from "react";
import { LiteraryParallelsTablePage } from "@/components/abiturient/georgian/LiteraryParallelsTablePage";

function TableFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-sm text-gray-500">
      იტვირთება...
    </div>
  );
}

export default function GeorgianLitParallelsPage() {
  return (
    <Suspense fallback={<TableFallback />}>
      <LiteraryParallelsTablePage />
    </Suspense>
  );
}
