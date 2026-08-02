export interface TextEditingAttempt {
  id: string;
  dateLabel: string;
  preview: string;
  score: number;
  maxScore: number;
}

export interface TextEditingEvaluation {
  score: number;
  maxScore: number;
  points: string[];
}

export const TEXT_EDITING_MAX_SCORE = 16;

export const INITIAL_ATTEMPTS: TextEditingAttempt[] = [
  {
    id: "att-1",
    dateLabel: "2 ივნისი, 2026 • 14:32",
    preview:
      "მაგიდის ჩოგბურთი ერთ-ერთი ყველაზე სწრაფი სპორტის სახეობაა, რომელიც...",
    score: 11,
    maxScore: TEXT_EDITING_MAX_SCORE,
  },
  {
    id: "att-2",
    dateLabel: "28 მაისი, 2026 • 09:15",
    preview:
      "პინგ-პონგი ჩინეთში დაიბადა და მალე გავრცელდა მთელ მსოფლიოში...",
    score: 16,
    maxScore: TEXT_EDITING_MAX_SCORE,
  },
];

export const SOURCE_TEXTS_WITH_ERRORS: string[] = [
  `მაგიდის ჩოგბურთი, ანუ პინგ-პონგი ერთ-ერთი ყველაზე სწრაფი და დინამიური სპორტის სახეობაა. თამაში დაიბადა ბრიტანეთში XIX საუკუნის ბოლოს, თუმცა ზოგიერთი მკვლეველი0 მის ფესვებს ძველ ჩინეთში ეძებს.

პირველი ოფიციალური ჩემპიონატი 1926 წელს ჩაირთო. 1988 წლიდან ეს სახეობა ოლიმპიურ პროგრამაში შევიდა, რამაც მისი პოპულარობა მნიშვნელოვნად გაზარდა. დღეს ჩოგბურთი თამაშობენ როგორც ახალგაზრდები, ასევე პროფესიონალ სპორტსმენებიც.

თამაშის წესები მარტივია, მაგრამ მაღალი დონის ფლანგისთვის საჭიროა სიჩქარე, რეაქცია და ტაქტიკური აზროვნება. სწორი ტექნიკა და ყოველდღიური პრაქტიკა გადამწყვეტ როლს თამაშობს წარმატებაში.`,

  `ქართული ენის ნორმები მოითხოვს ზუსტ პუნქტუაციას, ლოგიკურ აბზაცებს და ერთგვაროვან სიტყვათა თანმიმდევრობას. გამოცდაზე მოსწავლე უნდა შეძლოს ტექსტის გამოსწორება ისე, რომ შეცდომა არ გამოიწვიოს აზრის დაკარგვას.

ხშირი შეცდომებია: ზმნისა და ზმნილების შეუსაბამო თანხმობა, ზედმეტი მეონრე, არასწორი მიმოხვედრები და გაურკვეველი ფრაზები. სწორი რედაქტირება ნიშნავს არა მხოლოდ მექანიკურ გასწორებას, არამედ სტილის გაუმჯობესებასაც.`,
];

export function pickRandomSourceText(): string {
  const index = Math.floor(Math.random() * SOURCE_TEXTS_WITH_ERRORS.length);
  return SOURCE_TEXTS_WITH_ERRORS[index] ?? SOURCE_TEXTS_WITH_ERRORS[0];
}

export function buildAttemptPreview(text: string, maxLen = 72): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}...`;
}

export function evaluateTextEditing(
  source: string,
  corrected: string,
): TextEditingEvaluation {
  const sourceLen = source.replace(/\s/g, "").length;
  const correctedLen = corrected.replace(/\s/g, "").length;
  const lengthRatio =
    sourceLen > 0 ? Math.min(1, correctedLen / sourceLen) : 0;

  let score = 8;
  if (lengthRatio > 0.85) score += 4;
  else if (lengthRatio > 0.6) score += 2;
  if (corrected.includes("0") && !source.includes("0")) score -= 1;
  if (corrected.length > source.length * 0.5) score += 2;
  score = Math.min(TEXT_EDITING_MAX_SCORE, Math.max(6, score));

  const points: string[] = [];

  if (!corrected.trim()) {
    return {
      score: 0,
      maxScore: TEXT_EDITING_MAX_SCORE,
      points: [
        "ტექსტი ცარიელია — გამოსწორებული ვერსია აუცილებელია შეფასებისთვის.",
        "გამოიყენე „რედაქტორში გადმოყვანა“ საწყისი ტექსტის სწრაფად ჩასაწერად.",
      ],
    };
  }

  if (source.includes("0") && corrected.includes("0")) {
    points.push(
      "ციფრი „0“ ზმნის ფორმასთან არ უნდა ერიოებოდეს — შეამოწმე ზმნის ზმნილებითი ფორმა.",
    );
  } else {
    points.push("ორთოგრაფიული ხარვეზები საერთო ჯამში კარგად არის გამოსწორებული.");
  }

  if (lengthRatio < 0.7) {
    points.push(
      "ტექსტი მოკლეა სავარაუდო სრულ ვერსიასთან შედარებით — დარწმუნდი, რომ ყველა აბზაცი გადმოიტანე.",
    );
  } else {
    points.push("ტექსტის მოცულობა შეესაბება სავარაუდო სრულ რედაქტირებას.");
  }

  points.push(
    "პუნქტუაცია: შეამოწმე მძიმეები აბზაცებს შორის და ზმნის ბოლოს.",
  );
  points.push(
    "სინტაქსი: თავიდან აიცილე გაურკვეველი ფრაზები და ზედმეტი მეონრეები.",
  );

  return { score, maxScore: TEXT_EDITING_MAX_SCORE, points };
}

export function scoreBadgeClass(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio >= 0.94) return "text-emerald-400";
  if (ratio >= 0.75) return "text-purple-400";
  return "text-amber-400";
}
