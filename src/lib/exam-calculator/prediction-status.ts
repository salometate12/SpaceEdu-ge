export type PredictionStatus = "high" | "medium" | "minimal";

export const PREDICTION_MARGIN_HIGH = 50;

export function getPredictionStatus(
  userScore: number,
  threshold: number,
): PredictionStatus {
  if (userScore < threshold) return "minimal";
  if (userScore >= threshold + PREDICTION_MARGIN_HIGH) return "high";
  return "medium";
}

export const PREDICTION_STATUS_LABEL: Record<PredictionStatus, string> = {
  high: "მაღალი შანსი",
  medium: "საშუალო შანსი",
  minimal: "მინიმალური შანსი",
};

export const PREDICTION_ADVISORY: Record<PredictionStatus, string> = {
  minimal:
    "მიმდინარე პროგნოზი აჩვენებს, რომ პროგრამის ზღვარი შენს მოსალოდნელ ქულაზე მაღალია. რეკომენდებულია პრიორიტეტების გადანაწილება.",
  medium:
    "ამ პროგრამაზე მოხვედრის შანსი საშუალოა. გირჩევ, პრიორიტეტულ სიაში წინასწარ გადაამოწმო უსაფრთხოების ზღვრები.",
  high: "გილოცავ! შენი ქულა საკმარისია ამ პროგრამისთვის. შეგიძლია დარწმუნებით მიუთითო პირველ პრიორიტეტად.",
};

export function compatibilityLabel(status: PredictionStatus): string {
  if (status === "high") return "მაღალი თავსებადობა";
  if (status === "medium") return "საშუალო თავსებადობა";
  return "დაბალი თავსებადობა";
}

export const PREDICTION_STATUS_STYLES: Record<
  PredictionStatus,
  { badge: string; header: string; alert: string; alertIcon: string }
> = {
  high: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    header: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    alert: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    alertIcon: "text-emerald-400",
  },
  medium: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    header: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    alert: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    alertIcon: "text-amber-400",
  },
  minimal: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
    header: "border-red-500/20 bg-red-500/10 text-red-400",
    alert: "border-red-500/20 bg-red-500/5 text-red-400",
    alertIcon: "text-red-400",
  },
};
