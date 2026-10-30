"use client";

import { HelpCircle } from "lucide-react";
import { StepSection, TONES } from "@/components/ui/wizard/StepSection";
import { ChoiceChips, Field } from "@/components/ui/wizard/fields";

interface QA {
  goal: string;
  audience: string;
  tone: string;
  mainPoint: string;
}

interface Step3PhotosQAProps {
  qa: QA;
  onQaChange: (qa: Partial<QA>) => void;
}

export const QA_OPTIONS = {
  goal: ["ცნების განმარტება", "არგუმენტის დამტკიცება", "ისტორიის მიმოხილვა", "კვლევის წარდგენა"],
  // Students present to their groupmates, not classmates.
  audience: ["ჯგუფელები", "პროფესორი", "კომისია", "შერეული"],
  tone: ["აკადემიური", "მეგობრული", "ფორმალური", "კრეატიული"],
};

/** Saved presentations from before may still say „კლასელები“. */
export function normalizeAudience(value: string): string {
  return value === "კლასელები" ? "ჯგუფელები" : value;
}

const chips = (values: string[]) => values.map((value) => ({ value, label: value }));

export function Step3PhotosQA({ qa, onQaChange }: Step3PhotosQAProps) {
  return (
    <StepSection icon={HelpCircle} tone={TONES.blue} title="დეტალები" subtitle="რამდენიმე კითხვა, რომ ტექსტი შენს მიზანს მოერგოს">
      <div className="flex flex-col gap-[22px]">
        <Field label="რა არის მთავარი მიზანი?">
          <ChoiceChips label="რა არის მთავარი მიზანი?" options={chips(QA_OPTIONS.goal)} value={qa.goal} onChange={(goal) => onQaChange({ goal })} />
        </Field>
        <Field label="ვინ არის აუდიტორია?">
          <ChoiceChips label="ვინ არის აუდიტორია?" options={chips(QA_OPTIONS.audience)} value={normalizeAudience(qa.audience)} onChange={(audience) => onQaChange({ audience })} />
        </Field>
        <Field label="რა ტონი გინდა?">
          <ChoiceChips label="რა ტონი გინდა?" options={chips(QA_OPTIONS.tone)} value={qa.tone} onChange={(tone) => onQaChange({ tone })} />
        </Field>
        <Field label="რა არის ყველაზე მნიშვნელოვანი?" optional htmlFor="pr-main">
          <input
            id="pr-main"
            value={qa.mainPoint}
            onChange={(e) => onQaChange({ mainPoint: e.target.value })}
            placeholder="მაგ. სინათლის და ბნელი ფაზების განსხვავება"
            className="wz-input"
          />
        </Field>
      </div>
    </StepSection>
  );
}
