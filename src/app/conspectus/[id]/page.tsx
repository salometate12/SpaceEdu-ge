import { Navbar } from "@/components/Navbar";
import { ConspectusPageClient } from "@/components/ConspectusPageClient";

export default function ConspectusPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Navbar />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <ConspectusPageClient />
      </div>
    </div>
  );
}
