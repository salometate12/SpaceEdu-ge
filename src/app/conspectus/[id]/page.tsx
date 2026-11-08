import { ConspectusPageClient } from "@/components/ConspectusPageClient";

/** A saved conspectus, under the site's own header (the layout's). */
export default function ConspectusPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden print:overflow-visible">
      <ConspectusPageClient />
    </div>
  );
}
