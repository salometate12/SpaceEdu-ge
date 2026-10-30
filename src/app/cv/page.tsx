import { Noto_Serif_Georgian } from "next/font/google";
import { CvGenerator } from "@/components/cv/CvGenerator";
import { WizardPage } from "@/components/ui/wizard/WizardPage";

/** The classic template's serif (the sans is the site's own). */
const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian", "latin"],
  weight: ["400", "600", "700"],
});

export default function CvPage() {
  return (
    <div className={notoSerifGeorgian.variable}>
      <WizardPage
        title="AI CV გენერატორი"
        subtitle="შეავსე მონაცემები და მიიღე მზა CV სტაჟირებისთვის ან ვაკანსიისთვის"
        backHref="/dashboard-student"
      >
        <CvGenerator />
      </WizardPage>
    </div>
  );
}
