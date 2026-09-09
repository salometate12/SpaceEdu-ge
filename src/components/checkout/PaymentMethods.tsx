import {
  Building2,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NotebookAccent } from "@/components/landing/notebook/accents";

export interface PaymentMethod {
  id: string;
  name: string;
  note: string;
  icon: LucideIcon | "mastercard";
}

/**
 * What the shopper can pay with. Every one of these ends at the bank's own
 * hosted page — the list picks which one, it never collects anything.
 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "visa", name: "Visa", note: "ნებისმიერი ბანკის ბარათი", icon: CreditCard },
  { id: "mastercard", name: "Mastercard", note: "ნებისმიერი ბანკის ბარათი", icon: "mastercard" },
  { id: "tbc", name: "TBC ბარათი", note: "თიბისი ბანკის გადახდის გვერდი", icon: Landmark },
  { id: "bog", name: "საქართველოს ბანკი", note: "BOG-ის გადახდის გვერდი", icon: Building2 },
  { id: "apple-pay", name: "Apple Pay", note: "iPhone-ით ან Mac-ით", icon: Smartphone },
  { id: "google-pay", name: "Google Pay", note: "Android-ით ან ბრაუზერით", icon: Wallet },
];

/** Mastercard's two rings, drawn rather than imported as a logo file. */
function MastercardMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="10" r="7.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PaymentMethodMark({
  icon,
  className = "",
}: {
  icon: PaymentMethod["icon"];
  className?: string;
}) {
  if (icon === "mastercard") return <MastercardMark className={`h-5 w-8 ${className}`} />;
  const Icon = icon;
  return <Icon className={`h-[18px] w-[18px] stroke-[2] ${className}`} aria-hidden />;
}

export type { NotebookAccent };
