import type { UploadedPhoto } from "@/lib/presentation-photos";
import type { GeneratedSlide, PresentationTemplate } from "@/lib/presentation-types";
import { SlideCard } from "./SlideCard";

const NO_PHOTOS = new Map<string, UploadedPhoto>();

/** A sample slide, so the preview shows the template's real decoration, fonts and markers. */
const SAMPLE: GeneratedSlide = {
  id: 0,
  type: "content",
  slideType: "",
  title: "სლაიდის სათაური",
  layout: "bullets",
  points: ["პირველი მთავარი აზრი", "მეორე, მოკლე არგუმენტი", "მაგალითი ან დასკვნა"],
  images: [],
};

export function TemplatePreview({ template }: { template: PresentationTemplate }) {
  return (
    <div className="pointer-events-none">
      <SlideCard slide={SAMPLE} index={1} template={template} photos={NO_PHOTOS} />
    </div>
  );
}

export function NewBadge() {
  return (
    <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-700 dark:bg-pink-500/15 dark:text-pink-300">
      ახალი
    </span>
  );
}
