export type PricingRole = "abiturient" | "student";

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export const ABITURIENT_PRICING_TIERS: readonly PricingTier[] = [
  {
    id: "abit-trial",
    name: "საცდელი პერიოდი",
    price: "0₾",
    period: "3 დღე უფასოდ",
    features: [
      "სრული წვდომა აბიტურიენტის სივრცეზე",
      "AI მასწავლებელი და ქვიზები",
      "წინა წლების ტესტები",
    ],
    cta: "დაიწყე უფასოდ",
  },
  {
    id: "abit-pro",
    name: "პრო",
    price: "19₾",
    period: "თვეში",
    popular: true,
    features: [
      "გაზრდილი დღიური AI ლიმიტი",
      "AI მასწავლებელი ეროვნული გამოცდების პროგრამით",
      "თემისა და ღია დავალებების AI შეფასება",
      "სასწავლო გეგმა გამოცდის თარიღამდე",
    ],
    cta: "გახდი პრო",
  },
  {
    id: "abit-season",
    name: "საგამოცდო სეზონი",
    price: "49₾",
    period: "3 თვე",
    features: [
      "ყველაფერი, რაც პრო პაკეტშია",
      "გამოცდის სიმულაცია დროის კონტროლით",
      "შეცდომების დეტალური ანალიზი",
      "თვეში დაახლოებით 16₾",
    ],
    cta: "შეიძინე სეზონი",
  },
] as const;

export const STUDENT_PRICING_TIERS: readonly PricingTier[] = [
  {
    id: "student-trial",
    name: "საცდელი პერიოდი",
    price: "0₾",
    period: "3 დღე უფასოდ",
    features: [
      "სრული წვდომა სტუდენტის სივრცეზე",
      "2 PDF ფაილის ანალიზი",
      "სასწავლო გეგმა და ჟურნალი",
    ],
    cta: "დაიწყე უფასოდ",
  },
  {
    id: "student-pro",
    name: "სტუდენტური პრო",
    price: "9₾",
    period: "თვეში",
    popular: true,
    features: [
      "გაზრდილი დღიური AI ლიმიტი",
      "ქვიზები და კონსპექტები PDF ფაილებიდან",
      "სილაბუსის ანალიზატორი და ვადების კალენდარი",
      "AI მასწავლებელი შენი საგნებით",
    ],
    cta: "გახდი პრო",
  },
  {
    id: "student-semester",
    name: "სემესტრული პასი",
    price: "35₾",
    period: "5 თვე, ერთი სემესტრი",
    features: [
      "ყველაფერი, რაც პრო პაკეტშია",
      "AI პრეზენტაციები და CV გენერატორი",
      "მასალის ანალიზი",
      "თვეში 7₾",
    ],
    cta: "შეიძინე სემესტრი",
  },
] as const;

export function pricingTiersForRole(role: PricingRole): readonly PricingTier[] {
  return role === "abiturient" ? ABITURIENT_PRICING_TIERS : STUDENT_PRICING_TIERS;
}

/** The one free tier per role — its button still leads to registration. */
export function isTrialTier(tierId: string): boolean {
  return tierId.endsWith("-trial");
}

export function findPricingTier(tierId: string): PricingTier | null {
  return (
    [...ABITURIENT_PRICING_TIERS, ...STUDENT_PRICING_TIERS].find(
      (tier) => tier.id === tierId,
    ) ?? null
  );
}

export function roleForTier(tierId: string): PricingRole | null {
  if (ABITURIENT_PRICING_TIERS.some((tier) => tier.id === tierId)) return "abiturient";
  if (STUDENT_PRICING_TIERS.some((tier) => tier.id === tierId)) return "student";
  return null;
}
