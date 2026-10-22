import type { ResearchSectionKey } from "@/lib/ai/research-platform-schema";

/** What each section is called and says; its colour is `--rp-<key>` (research-theme.css). */
export const RESEARCH_SECTIONS: Record<ResearchSectionKey, { label: string; short: string; description: string }> = {
  theses: { label: "ძირითადი თეზისები", short: "თეზისები", description: "ტექსტის მთავარი აზრები, გამოკვეთილად" },
  methodology: { label: "მეთოდოლოგია", short: "მეთოდოლოგია", description: "როგორ არის აგებული კვლევა ან მსჯელობა" },
  literature: { label: "ლიტერატურის მიმოხილვა", short: "ლიტერატურა", description: "წყაროებთან და კონტექსტთან კავშირი" },
  criticalAnalysis: { label: "კრიტიკული ანალიზი", short: "კრიტიკა", description: "ძლიერი და სუსტი მხარეები" },
  conclusions: { label: "დასკვნები და რჩევები", short: "დასკვნები", description: "პრაქტიკული დასკვნა და შემდეგი ნაბიჯები" },
};
