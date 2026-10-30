import { notoSerifGeorgian } from "@/fonts/serif";
import { CvGenerator } from "@/components/cv/CvGenerator";
import { WizardPage } from "@/components/ui/wizard/WizardPage";

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
