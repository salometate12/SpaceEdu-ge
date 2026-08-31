import { ToolPageHeader } from "@/components/layout/ToolPageHeader";
import { PresentationWizard } from "@/components/presentation/PresentationWizard";

export default function PresentationPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <ToolPageHeader
        title="პრეზენტაციების გენერატორი"
        subtitle="მიუთითე თემა და AI წამებში მოგიმზადებს სრულყოფილ სლაიდების სტრუქტურასა და ტექსტებს"
      />
      <PresentationWizard />
    </main>
  );
}
