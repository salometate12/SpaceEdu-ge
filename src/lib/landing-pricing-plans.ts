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
      "სრული წვდომა ეროვნული გამოცდების სივრცეზე",
      "3 საცდელი AI ტესტი",
      "ძირითადი კონსპექტების გენერატორი",
    ],
    cta: "დაიწყე უფასოდ",
  },
  {
    id: "abit-pro",
    name: "ყოველთვიური პრო",
    price: "19₾",
    period: "თვეში",
    popular: true,
    features: [
      "ულიმიტო AI ასისტენტი",
      "NAEC პროგრამაზე მორგებული AI ტუტორები",
      "ისტორიის, ქართულისა და ინგლისურის სპეციალური მოდულები",
    ],
    cta: "გახდი პრო",
  },
  {
    id: "abit-season",
    name: "საგამოცდო სეზონი",
    price: "49₾",
    period: "3 თვე",
    features: [
      "ყველაფერი რაც პრო პაკეტშია",
      "სრული Mock გამოცდების სიმულატორი დროის კონტროლით",
      "დეტალური შეცდომების ანალიზი",
    ],
    cta: "შეიძინე სრული პაკეტი",
  },
] as const;

export const STUDENT_PRICING_TIERS: readonly PricingTier[] = [
  {
    id: "student-trial",
    name: "საცდელი პერიოდი",
    price: "0₾",
    period: "1 კვირა უფასოდ",
    features: [
      "წვდომა საუნივერსიტეტო კურსების ასისტენტზე",
      "2 PDF დოკუმენტის ანალიზი",
      "ლექციების კალენდარი",
    ],
    cta: "დაიწყე საცდელი",
  },
  {
    id: "student-pro",
    name: "სტუდენტური პრო",
    price: "9₾",
    period: "თვეში",
    popular: true,
    features: [
      "ულიმიტო PDF დოკუმენტების ანალიზი და დამუშავება",
      "ჭკვიანი კონსპექტების გენერატორი",
      "სილაბუსების ოპტიმიზატორი",
      "24/7 AI მხარდაჭერა კვლევებისთვის",
    ],
    cta: "აქტივაცია",
  },
  {
    id: "student-semester",
    name: "სემესტრული პასი",
    price: "35₾",
    period: "სემესტრი (5 თვე)",
    features: [
      "ყველაფერი რაც სტუდენტურ პრო პაკეტშია",
      "პრეზენტაციების რეპეტიტორი",
      "ულიმიტო სამეცნიერო ბაზების საძიებო დამხმარე",
    ],
    cta: "შეიძინე სემესტრულად",
  },
] as const;

export function pricingTiersForRole(role: PricingRole): readonly PricingTier[] {
  return role === "abiturient" ? ABITURIENT_PRICING_TIERS : STUDENT_PRICING_TIERS;
}
