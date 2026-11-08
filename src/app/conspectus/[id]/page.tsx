import { ConspectusPageClient } from "@/components/ConspectusPageClient";

/** A saved conspectus, under the site's own header (the layout's). The page scrolls as a whole, so the side column can stick. */
export default function ConspectusPage() {
  return (
    <div className="flex flex-1 flex-col">
      <ConspectusPageClient />
    </div>
  );
}
