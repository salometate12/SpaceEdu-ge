/**
 * Georgian National Exam — Mathematics past papers (2025, variants I & II).
 *
 * Transcribed from docs/exam-sources/math/paper-variant-*.pdf and the matching
 * scoring schemes. Unlike the literature papers, a maths paper is a set of
 * independent questions — 37 single-answer MCQs (1 point each) and 4 open
 * problems (38–41, 3–4 points) whose solutions are graded step by step. Some
 * questions carry a formula (stored as KaTeX) or a figure cropped from the PDF.
 *
 * NOTE: Both variants are fully transcribed (37 MCQs + 4 open problems each),
 * with every answer key and open-problem scoring scheme verified against the
 * official scoring documents.
 */

export type MathOptionLabel = "ა" | "ბ" | "გ" | "დ";

export interface MathFigure {
  src: string;
  alt: string;
}

export interface MathOption {
  label: MathOptionLabel;
  /** Plain text, when the option is words/a number. */
  text?: string;
  /** KaTeX, when the option is a formula. */
  latex?: string;
}

export interface MathMcqQuestion {
  id: string;
  number: number; // 1–37
  prompt: string; // question text (Georgian)
  latex?: string; // formula shown with the prompt, if any
  figure?: MathFigure;
  options: MathOption[];
  correctLabel: MathOptionLabel;
  points: 1;
}

export interface MathOpenStep {
  /** Step label as in the scheme's "ამოხსნის ეტაპები" (ა, ბ, გ, ...). */
  id: string;
  description: string;
}

export interface MathScoringRow {
  score: number;
  /** Which step ids must be completed to earn this score. */
  requiresSteps: string[];
}

export interface MathOpenProblem {
  id: string;
  number: number; // 38–41
  prompt: string;
  latex?: string;
  figure?: MathFigure;
  points: number; // 3 or 4
  modelSolution: string; // "ამოხსნა" — the full worked answer
  answer?: string; // "პასუხი"
  steps: MathOpenStep[]; // "ამოხსნის ეტაპები"
  scoringTable: MathScoringRow[]; // "შეფასების სქემა"
  partialCreditNote?: string; // the scheme's "შენიშვნა"
}

export interface MathExamVariant {
  id: string;
  label: string; // "I ვარიანტი" / "II ვარიანტი"
  year: number;
  mcq: MathMcqQuestion[];
  open: MathOpenProblem[];
  totalPoints: number; // 51
  durationMinutes: number; // 180
}

/** The official MCQ answer keys (1–37), verified from the scoring schemes. */
export const MATH_MCQ_ANSWER_KEYS: Record<string, MathOptionLabel[]> = {
  "variant-1-2025": [
    "დ", "ბ", "ბ", "დ", "დ", "დ", "ა", "ბ", "დ", "ბ", "ა", "ბ", "გ", "გ", "გ",
    "გ", "გ", "დ", "ა", "დ", "გ", "გ", "ბ", "ბ", "ბ", "დ", "დ", "ა", "ბ", "ა",
    "გ", "ა", "ბ", "ა", "ა", "ა", "გ",
  ],
  "variant-2-2025": [
    "გ", "გ", "ბ", "გ", "დ", "გ", "ა", "ა", "დ", "ა", "ა", "ა", "ბ", "ა", "გ",
    "დ", "ა", "გ", "ა", "ბ", "დ", "დ", "ა", "გ", "ბ", "დ", "დ", "ბ", "გ", "ბ",
    "ბ", "გ", "გ", "ბ", "დ", "ბ", "დ",
  ],
};

const FIG = "/exam-figures/math/variant-1-2025";
const FIG2 = "/exam-figures/math/variant-2-2025";

const VARIANT_1_MCQ: MathMcqQuestion[] = [
  {
    id: "m1-q1",
    number: 1,
    prompt: "გამოთვალეთ:",
    latex: "\\left(1\\tfrac{3}{5} - 2{,}2\\right)\\cdot 3\\tfrac{1}{3}",
    options: [
      { label: "ა", latex: "2" },
      { label: "ბ", latex: "\\tfrac{7}{3}" },
      { label: "გ", latex: "-\\tfrac{4}{15}" },
      { label: "დ", latex: "-2" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q2",
    number: 2,
    prompt:
      "იპოვეთ უმცირესი სამნიშნა რიცხვი, რომელიც როგორც 4-ზე, ასევე 7-ზე გაყოფისას იძლევა 3-ის ტოლ ნაშთს.",
    options: [
      { label: "ა", text: "143" },
      { label: "ბ", text: "115" },
      { label: "გ", text: "107" },
      { label: "დ", text: "103" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q3",
    number: 3,
    prompt:
      "საათის ფასი ჯერ გაიზარდა 20%-ით, ხოლო შემდეგ შემცირდა 20%-ით და გახდა 96 ლარი. იპოვეთ საათის თავდაპირველი ფასი.",
    options: [
      { label: "ა", text: "96 ₾" },
      { label: "ბ", text: "100 ₾" },
      { label: "გ", text: "105 ₾" },
      { label: "დ", text: "110 ₾" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q4",
    number: 4,
    prompt:
      "სამკუთხედის კუთხეები ისე შეეფარდება ერთმანეთს, როგორც $1:3:5$. იპოვეთ სამკუთხედის უმცირესი კუთხის სიდიდე.",
    options: [
      { label: "ა", text: "40°" },
      { label: "ბ", text: "30°" },
      { label: "გ", text: "10°" },
      { label: "დ", text: "20°" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q5",
    number: 5,
    prompt:
      "0,5 მეტრი რადიუსის მქონე წრის ფორმის გასაშლელი მაგიდის გაშლის დროს ნახევარწრის ფორმის ნაჭრებს შორის დგამენ მართკუთხედის ფორმის ნაჭერს, რომლის დიაგონალის სიგრძე $\\sqrt{5}$ მეტრია. იპოვეთ გაშლილი მაგიდის ფართობი (იხ. სურათი).",
    figure: { src: `${FIG}/q5.png`, alt: "გასაშლელი მაგიდის სქემა" },
    options: [
      { label: "ა", latex: "\\left(4+\\tfrac{\\pi}{4}\\right)\\,\\text{მ}^2" },
      { label: "ბ", latex: "\\left(5+\\tfrac{\\pi}{4}\\right)\\,\\text{მ}^2" },
      { label: "გ", latex: "\\left(2+\\tfrac{\\pi}{2}\\right)\\,\\text{მ}^2" },
      { label: "დ", latex: "\\left(2+\\tfrac{\\pi}{4}\\right)\\,\\text{მ}^2" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q6",
    number: 6,
    prompt:
      "იპოვეთ $a$, თუ $2^{a}=\\left(\\sqrt[3]{2\\sqrt[3]{2}}\\right)^{\\frac{3}{2}}$.",
    options: [
      { label: "ა", latex: "\\tfrac{2}{9}" },
      { label: "ბ", latex: "\\tfrac{4}{9}" },
      { label: "გ", latex: "\\tfrac{5}{6}" },
      { label: "დ", latex: "\\tfrac{2}{3}" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q7",
    number: 7,
    prompt:
      "იპოვეთ $\\sqrt[4]{b}-\\sqrt[4]{a}$ გამოსახულების მნიშვნელობა, თუ $a$ და $b$ რიცხვები აკმაყოფილებს ტოლობებს: $\\sqrt[4]{a}+\\sqrt[4]{b}=3$ და $\\sqrt{a}-\\sqrt{b}=2$.",
    options: [
      { label: "ა", latex: "-\\tfrac{2}{3}" },
      { label: "ბ", latex: "\\tfrac{2}{3}" },
      { label: "გ", latex: "\\tfrac{3}{2}" },
      { label: "დ", latex: "\\tfrac{2}{\\sqrt{3}}" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q8",
    number: 8,
    prompt:
      "იპოვეთ $y=kx+b$ წრფის $k$ კოეფიციენტი, თუ ცნობილია, რომ როდესაც წრფეზე მდგარი წერტილის აბსცისა გაიზრდება 2 ერთეულით, მაშინ მისი ორდინატა შემცირდება 3 ერთეულით.",
    options: [
      { label: "ა", latex: "\\tfrac{3}{2}" },
      { label: "ბ", latex: "-\\tfrac{3}{2}" },
      { label: "გ", latex: "-\\tfrac{2}{3}" },
      { label: "დ", latex: "-6" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q9",
    number: 9,
    prompt:
      "$y=kx+\\frac{1}{k}$ ფუნქციის გრაფიკი $Oxy$ მართკუთხა საკოორდინატო სისტემის აბსცისათა და ორდინატთა ღერძებს კვეთს შესაბამისად $A$ და $B$ წერტილებში (იხ. სურათი). იპოვეთ $A$ წერტილის კოორდინატები, თუ ცნობილია, რომ $\\angle BAO=30^{\\circ}$.",
    figure: { src: `${FIG}/q9.png`, alt: "წრფის გრაფიკი საკოორდინატო სისტემაში" },
    options: [
      { label: "ა", text: "(0; 1)" },
      { label: "ბ", text: "(−1; 0)" },
      { label: "გ", text: "(−4; 0)" },
      { label: "დ", text: "(−3; 0)" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q10",
    number: 10,
    prompt: "იპოვეთ $|x-2|=2-x$ განტოლების ამონახსნთა სიმრავლე.",
    options: [
      { label: "ა", latex: "(-\\infty;\\,2)" },
      { label: "ბ", latex: "(-\\infty;\\,2]" },
      { label: "გ", latex: "[2;\\,+\\infty)" },
      { label: "დ", latex: "\\{2\\}" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q11",
    number: 11,
    prompt:
      "იპოვეთ წესიერი ათკუთხედის პერიმეტრი, თუ მასში ჩახაზული წრეწირის რადიუსი 3 სმ-ის ტოლია.",
    options: [
      { label: "ა", latex: "60\\,\\operatorname{tg}\\!\\left(\\tfrac{\\pi}{10}\\right)\\,\\text{სმ}" },
      { label: "ბ", latex: "30\\,\\operatorname{tg}\\!\\left(\\tfrac{\\pi}{10}\\right)\\,\\text{სმ}" },
      { label: "გ", latex: "60\\,\\operatorname{tg}\\!\\left(\\tfrac{\\pi}{5}\\right)\\,\\text{სმ}" },
      { label: "დ", latex: "60\\sin\\!\\left(\\tfrac{\\pi}{10}\\right)\\,\\text{სმ}" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q12",
    number: 12,
    prompt:
      "7,2 კგ მასის შენადნობი მიღებულია სამი ლითონის ერთმანეთთან შედნობის შედეგად. ლითონების მასების განაწილების წრიულ დიაგრამაზე მეორე ლითონის შესაბამისი სექტორის ცენტრალური კუთხის სიდიდე 5°-ით აღემატება პირველი ლითონის შესაბამისი ცენტრალური კუთხის სიდიდეს და 35°-ით ნაკლებია მესამე ლითონის შესაბამისი ცენტრალური კუთხის სიდიდეზე. იპოვეთ ამ შენადნობში მეორე ლითონის მასა.",
    options: [
      { label: "ა", text: "2,1 კგ" },
      { label: "ბ", text: "2,2 კგ" },
      { label: "გ", text: "2,3 კგ" },
      { label: "დ", text: "2,4 კგ" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q13",
    number: 13,
    prompt:
      "პირამიდას და პრიზმას ტოლი რაოდენობის წვეროები აქვს. რამდენი წიბო აქვს ამ პირამიდას, თუ მას 5-ით მეტი წახნაგი აქვს, ვიდრე აღნიშნულ პრიზმას.",
    options: [
      { label: "ა", text: "18" },
      { label: "ბ", text: "22" },
      { label: "გ", text: "26" },
      { label: "დ", text: "28" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q14",
    number: 14,
    prompt:
      "$Oxy$ საკოორდინატო სიბრტყეზე მოცემულია $OABC$ პარალელოგრამი, რომლის $AOC$ კუთხის სიდიდე 60°-ია, ხოლო $B$ წერტილის კოორდინატებია $(4;\\,2)$. იპოვეთ $C$ წერტილის აბსცისა, თუ ცნობილია, რომ $C$ წერტილის ორდინატა ნულის ტოლია.",
    options: [
      { label: "ა", latex: "4-2\\sqrt{3}" },
      { label: "ბ", latex: "2" },
      { label: "გ", latex: "4-\\tfrac{2\\sqrt{3}}{3}" },
      { label: "დ", latex: "4-2\\sqrt{2}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q15",
    number: 15,
    prompt:
      "რამდენი ისეთი ხუთნიშნა ნატურალური რიცხვი არსებობს, რომელიც მარცხნიდან და მარჯვნიდან ერთნაირად იკითხება (ასეთი რიცხვია, მაგალითად, 12321)?",
    options: [
      { label: "ა", text: "810" },
      { label: "ბ", text: "890" },
      { label: "გ", text: "900" },
      { label: "დ", text: "990" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q16",
    number: 16,
    prompt:
      "რამდენ ელემენტს შეიცავს $(A\\cup B)\\setminus(A\\cap B)$ სიმრავლე, თუ ცნობილია, რომ $A$ და $B$ სიმრავლეები შეიცავს ხუთ-ხუთ ელემენტს, რომელთაგან 2 ელემენტი საერთო აქვთ.",
    options: [
      { label: "ა", text: "3" },
      { label: "ბ", text: "5" },
      { label: "გ", text: "6" },
      { label: "დ", text: "8" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q17",
    number: 17,
    prompt:
      "არგუმენტის რომელი მნიშვნელობისთვის იღებს $\\left[-\\frac{2\\pi}{3};\\,-\\frac{\\pi}{6}\\right]$ შუალედზე განსაზღვრული $f(x)=\\cos(3x)$ ფუნქცია უმცირეს მნიშვნელობას?",
    options: [
      { label: "ა", latex: "-\\tfrac{\\pi}{2}" },
      { label: "ბ", latex: "-\\tfrac{2\\pi}{3}" },
      { label: "გ", latex: "-\\tfrac{\\pi}{3}" },
      { label: "დ", latex: "-\\tfrac{\\pi}{6}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q18",
    number: 18,
    prompt:
      "წინასწარ განსაზღვრული 20 თემიდან გამოცდაზე აძლევენ შემთხვევით შერჩეულ 3 თემას, საიდანაც მოსწავლე სურვილის მიხედვით დასაწერად ირჩევს ერთს. მოსწავლეს საგამოცდოდ განსაზღვრული 20 თემიდან მომზადებული აქვს მხოლოდ 12 თემა. რას უდრის იმის ალბათობა, რომ მან შეძლოს მომზადებული თემის არჩევა?",
    options: [
      { label: "ა", latex: "\\tfrac{3}{5}" },
      { label: "ბ", latex: "\\dfrac{C_{8}^{3}}{C_{20}^{3}}" },
      { label: "გ", latex: "\\dfrac{C_{5}^{3}}{C_{20}^{3}}" },
      { label: "დ", latex: "1-\\dfrac{C_{8}^{3}}{C_{20}^{3}}" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q19",
    number: 19,
    prompt:
      "იპოვეთ $m$-ის ყველა იმ მნიშვნელობათა სიმრავლე, რომელთაგან თითოეულისთვის $x^{2}-4x+3-m=0$ კვადრატულ განტოლებას აქვს ერთი და იმავე ნიშნის ორი განსხვავებული ფესვი.",
    options: [
      { label: "ა", latex: "(-1;\\,3)" },
      { label: "ბ", latex: "(-1;\\,+\\infty)" },
      { label: "გ", latex: "(-\\infty;\\,3)" },
      { label: "დ", latex: "[-1;\\,3)" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q20",
    number: 20,
    prompt:
      "$ABC$ მართკუთხა სამკუთხედის $C$ მართი კუთხის წვეროდან $AB$ ჰიპოტენუზისადმი გავლებულია $CD$ სიმაღლე. იპოვეთ $ACD$ კუთხის სინუსი, თუ $\\frac{DB}{CB}=\\frac{3}{4}$.",
    figure: { src: `${FIG}/q20.png`, alt: "მართკუთხა სამკუთხედი სიმაღლით" },
    options: [
      { label: "ა", latex: "\\tfrac{1}{4}" },
      { label: "ბ", latex: "\\tfrac{3}{4}" },
      { label: "გ", latex: "\\tfrac{\\sqrt{3}}{4}" },
      { label: "დ", latex: "\\tfrac{\\sqrt{7}}{4}" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q21",
    number: 21,
    prompt:
      "იპოვეთ $\\vec{a}=(1;\\,-1)$ და $\\vec{b}=(2;\\,1)$ ვექტორებს შორის კუთხის სიდიდე.",
    options: [
      { label: "ა", latex: "\\arccos\\!\\left(\\tfrac{1}{\\sqrt{5}}\\right)" },
      { label: "ბ", latex: "\\tfrac{\\pi}{3}" },
      { label: "გ", latex: "\\arccos\\!\\left(\\tfrac{\\sqrt{10}}{10}\\right)" },
      { label: "დ", latex: "\\tfrac{\\pi}{4}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q22",
    number: 22,
    prompt:
      "რის ტოლია იმის ალბათობა, რომ მონეტის 10-ჯერ აგდებისას ზუსტად 8-ჯერ მოვა საფასური?",
    options: [
      { label: "ა", latex: "\\tfrac{4}{5}" },
      { label: "ბ", latex: "\\tfrac{1}{5}" },
      { label: "გ", latex: "\\tfrac{45}{1024}" },
      { label: "დ", latex: "\\tfrac{1}{1024}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q23",
    number: 23,
    prompt:
      "იპოვეთ $f(x)=3+2\\cos(x-1)$ ფუნქციის მნიშვნელობათა სიმრავლე.",
    options: [
      { label: "ა", latex: "(-\\infty;\\,+\\infty)" },
      { label: "ბ", latex: "[1;\\,5]" },
      { label: "გ", latex: "[-2;\\,2]" },
      { label: "დ", latex: "(1;\\,5)" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q24",
    number: 24,
    prompt:
      "$Oxy$ საკოორდინატო სიბრტყეზე მოცემულია სამკუთხედი, რომლის წვეროები $y=x^{2}-7x+12$ ფუნქციის გრაფიკის საკოორდინატო ღერძებთან გადაკვეთის წერტილებია. იპოვეთ ამ სამკუთხედის უდიდესი გვერდის სიგრძე.",
    options: [
      { label: "ა", latex: "\\sqrt{153}" },
      { label: "ბ", latex: "4\\sqrt{10}" },
      { label: "გ", latex: "13" },
      { label: "დ", latex: "16" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q25",
    number: 25,
    prompt:
      "იპოვეთ $a$ პარამეტრის ყველა იმ მნიშვნელობების სიმრავლე, რომელთაგან თითოეულისათვის $\\cos x=3-2a$ განტოლებას აქვს ამონახსნი, რომელიც მოთავსებულია $\\left(\\frac{\\pi}{2};\\,\\frac{3\\pi}{2}\\right)$ ინტერვალში.",
    options: [
      { label: "ა", latex: "\\left[\\tfrac{3}{2};\\,+\\infty\\right)" },
      { label: "ბ", latex: "\\left(\\tfrac{3}{2};\\,2\\right]" },
      { label: "გ", latex: "\\left(\\tfrac{3}{2};\\,2\\right)" },
      { label: "დ", latex: "\\left[\\tfrac{3}{2};\\,2\\right]" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q26",
    number: 26,
    prompt: "ქვემოთ ჩამოთვლილი გამონათქვამებიდან რომელია ყოველთვის ჭეშმარიტი?",
    options: [
      {
        label: "ა",
        text:
          "თუ ორი განსხვავებული a და b წრფე M სიბრტყის პარალელურია, მაშინ ისინი ურთიერთპარალელურია.",
      },
      {
        label: "ბ",
        text:
          "თუ ორი განსხვავებული M და N სიბრტყე a წრფის პარალელურია, მაშინ ისინი ურთიერთპარალელურია.",
      },
      {
        label: "გ",
        text:
          "თუ M სიბრტყე N სიბრტყეზე მდებარე ორი განსხვავებული წრფის პარალელურია, მაშინ M სიბრტყე N სიბრტყის პარალელურია.",
      },
      {
        label: "დ",
        text:
          "თუ ერთმანეთისაგან განსხვავებული და ურთიერთგადამკვეთი a და b წრფეები M სიბრტყის პარალელურია, მაშინ ამ წრფეების შემცველი N სიბრტყეც M სიბრტყის პარალელურია.",
      },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q27",
    number: 27,
    prompt:
      "$Oxy$ საკოორდინატო სიბრტყეზე მოცემულია სიბრტყის ორი გარდაქმნა: $R_{O}^{90^{\\circ}}$ და $H_{O}^{2}$, სადაც $R_{O}^{90^{\\circ}}$ არის მობრუნება კოორდინატთა სათავის გარშემო 90°-ით საათის ისრის მოძრაობის საწინააღმდეგო მიმართულებით, ხოლო $H_{O}^{2}$ არის ჰომოთეტია ცენტრით კოორდინატთა სათავეში და კოეფიციენტით 2. იპოვეთ $H_{O}^{2}\\!\\left(R_{O}^{90^{\\circ}}(A)\\right)$ წერტილის კოორდინატები, თუ $A$ წერტილის კოორდინატებია $(3;\\,-2)$.",
    options: [
      { label: "ა", text: "(−3; 4)" },
      { label: "ბ", text: "(6; 4)" },
      { label: "გ", text: "(−4; −6)" },
      { label: "დ", text: "(4; 6)" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m1-q28",
    number: 28,
    prompt:
      "რიცხვითი მიმდევრობის ზოგადი წევრი მოცემულია ფორმულით $a_{n}=n^{2}-3n+1$, სადაც $n$ ნატურალური რიცხვია. იპოვეთ $a_{n}+a_{n+1}$.",
    options: [
      { label: "ა", latex: "2n^{2}-4n" },
      { label: "ბ", latex: "n^{2}-4n-1" },
      { label: "გ", latex: "2n^{2}-n+1" },
      { label: "დ", latex: "n^{2}-n-1" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q29",
    number: 29,
    prompt:
      "იპოვეთ უდიდესი მთელი რიცხვი, რომელიც ნაკლებია $\\log_{2}3-\\log_{4}81$ გამოსახულების მნიშვნელობაზე.",
    options: [
      { label: "ა", text: "−3" },
      { label: "ბ", text: "−2" },
      { label: "გ", text: "−1" },
      { label: "დ", text: "0" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q30",
    number: 30,
    prompt:
      "$O$ ცენტრის მქონე წრეწირის $A$ წერტილზე გავლებულია $AB$ მხები. $OB$ მონაკვეთი წრეწირს კვეთს $C$ წერტილში ისე, რომ $OC:CB=2:1$. იპოვეთ წრეწირის რადიუსი, თუ $AB=2$.",
    figure: { src: `${FIG}/q30.png`, alt: "წრეწირი მხებით" },
    options: [
      { label: "ა", latex: "\\tfrac{4}{\\sqrt{5}}" },
      { label: "ბ", latex: "\\tfrac{2}{\\sqrt{3}}" },
      { label: "გ", latex: "\\tfrac{4}{\\sqrt{3}}" },
      { label: "დ", latex: "\\sqrt{5}" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q31",
    number: 31,
    prompt: "იპოვეთ $4^{x}+4^{x+1}+4^{x+2}=2^{x}+2^{x+1}+2^{x+2}$ განტოლების ამონახსნი.",
    options: [
      { label: "ა", latex: "\\log_{2}7" },
      { label: "ბ", latex: "\\log_{2}3" },
      { label: "გ", latex: "-\\log_{2}3" },
      { label: "დ", latex: "\\log_{2}\\!\\left(\\tfrac{5}{21}\\right)" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m1-q32",
    number: 32,
    prompt:
      "გეომეტრიული პროგრესიის მეორე და მეხუთე წევრი შესაბამისად 12-ის და 96-ის ტოლია. იპოვეთ ამ პროგრესიის პირველი წევრი.",
    options: [
      { label: "ა", text: "6" },
      { label: "ბ", text: "4" },
      { label: "გ", text: "3" },
      { label: "დ", text: "2" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q33",
    number: 33,
    prompt: "იპოვეთ $f(x)=|\\sin x|$ ფუნქციის უმცირესი დადებითი პერიოდი.",
    options: [
      { label: "ა", latex: "2\\pi" },
      { label: "ბ", latex: "\\pi" },
      { label: "გ", latex: "\\tfrac{\\pi}{2}" },
      { label: "დ", text: "არ აქვს" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m1-q34",
    number: 34,
    prompt:
      "წესიერი ექვსკუთხა პირამიდის ფუძის გვერდის სიგრძეა $2\\sqrt{3}$ სმ, ხოლო პირამიდის სიმაღლე არის 6 სმ. იპოვეთ პირამიდის ფუძით და გვერდითი წახნაგით შედგენილი ორწახნაგა კუთხის სიდიდე.",
    options: [
      { label: "ა", latex: "\\operatorname{arctg}2" },
      { label: "ბ", latex: "\\arcsin\\!\\left(\\tfrac{\\sqrt{3}}{6}\\right)" },
      { label: "გ", text: "60°" },
      { label: "დ", text: "45°" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q35",
    number: 35,
    prompt:
      "$x=-5$ წრფე წარმოადგენს $f(x)=|x+a|+3$ ფუნქციის გრაფიკის სიმეტრიის ღერძს. იპოვეთ $f(6)$.",
    options: [
      { label: "ა", text: "14" },
      { label: "ბ", text: "4" },
      { label: "გ", text: "3" },
      { label: "დ", text: "9" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q36",
    number: 36,
    prompt:
      "$ABCD$ პარალელოგრამის $BC$ გვერდზე მონიშნულია $P$ წერტილი ისე, რომ $BP=3PC$. ამასთან $AP$ და $CD$ წრფეები იკვეთება $K$ წერტილში. რას უდრის $ABCD$ პარალელოგრამისა და $AKD$ სამკუთხედის ფართობების შეფარდება?",
    figure: { src: `${FIG}/q36.png`, alt: "პარალელოგრამი ABCD და წერტილი K" },
    options: [
      { label: "ა", latex: "\\tfrac{3}{2}" },
      { label: "ბ", latex: "\\tfrac{4}{3}" },
      { label: "გ", latex: "\\tfrac{5}{4}" },
      { label: "დ", latex: "\\tfrac{4}{5}" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m1-q37",
    number: 37,
    prompt:
      "ცილინდრის გვერდითი ზედაპირის ფართობი სრული ზედაპირის ფართობის ნახევრის ტოლია. იპოვეთ ცილინდრის ფუძის რადიუსის შეფარდება ცილინდრის სიმაღლესთან.",
    options: [
      { label: "ა", latex: "\\tfrac{1}{\\pi}" },
      { label: "ბ", latex: "\\tfrac{1}{2}" },
      { label: "გ", latex: "1" },
      { label: "დ", latex: "\\pi" },
    ],
    correctLabel: "გ",
    points: 1,
  },
];

const VARIANT_1_OPEN: MathOpenProblem[] = [
  {
    id: "m1-q38",
    number: 38,
    prompt:
      "$Oxy$ საკოორდინატო სისტემაში $y=\\log_9 x$ და $y=kx+b$ ფუნქციების გრაფიკები იკვეთება ორ წერტილში, რომელთა ორდინატებია $\\frac{1}{2}$ და $\\frac{3}{2}$. რას უდრის $k+b$?",
    points: 3,
    modelSolution:
      "ვთქვათ, გრაფიკები იკვეთება (x₁; 1/2) და (x₂; 3/2) წერტილებში. მაშინ 1/2 = log₉x₁ და 3/2 = log₉x₂, საიდანაც x₁ = 9^(1/2) = 3 და x₂ = 9^(3/2) = 27. რადგან ორივე წერტილი მდებარეობს y = kx+b-ის გრაფიკზე, მივიღებთ სისტემას: 3k+b = 1/2 და 27k+b = 3/2. ამ სისტემიდან 24k = 1, ე.ი. k = 1/24 და b = 3/8. მაშასადამე k+b = 5/12.",
    answer: "k + b = 5/12",
    steps: [
      { id: "ა", description: "გამოთვალა x₁ = 3 ან x₂ = 27." },
      {
        id: "ბ",
        description:
          "შეადგინა სისტემა 3k+b = 1/2, 27k+b = 3/2, ან იპოვა k პარამეტრი.",
      },
      { id: "გ", description: "მიიღო სწორი პასუხი." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 2, requiresSteps: ["ბ"] },
      { score: 3, requiresSteps: ["ბ", "გ"] },
    ],
    partialCreditNote:
      "თუ გადაკვეთის წერტილების ორდინატები აბსცისებად ჩათვალა და ამ პირობით სრულად ამოხსნა, ნაშრომი ფასდება 1 ქულით.",
  },
  {
    id: "m1-q39",
    number: 39,
    prompt:
      "$O_1$ და $O_2$ ცენტრების მქონე ორი წრეწირი გარედან ეხება ერთმანეთს. ამ წრეწირების საერთო გარე მხები $O_1$ ცენტრის მქონე მცირე წრეწირს ეხება $A$ წერტილში, ხოლო $O_2$ ცენტრის მქონე დიდ წრეწირს — $B$ წერტილში. იპოვეთ $O_1ABO_2$ ოთხკუთხედის ფართობი, თუ მცირე წრეწირის რადიუსი 2 სმ-ის ტოლია, ხოლო დიდი წრეწირის რადიუსი ტოლია 5 სმ-ის.",
    points: 3,
    modelSolution:
      "O₁ABO₂ ოთხკუთხედში O₁A ⊥ AB და O₂B ⊥ AB, ამიტომ O₁A ∥ O₂B, ე.ი. O₁ABO₂ არის მართკუთხა ტრაპეცია. O₁ წერტილიდან O₂B რადიუსზე დავუშვათ O₁C სიმაღლე. მივიღებთ O₁CO₂ მართკუთხა სამკუთხედს, სადაც O₁O₂ = 2+5 = 7 სმ და O₂C = 5−2 = 3 სმ. პითაგორას თეორემით O₁C = √(O₁O₂² − O₂C²) = √(49−9) = 2√10 სმ. მაშინ ტრაპეციის ფართობია S = (O₁A + O₂B)/2 · O₁C = (2+5)/2 · 2√10 = 7√10 სმ².",
    answer: "7√10 სმ²",
    steps: [
      {
        id: "ა",
        description:
          "იპოვა O₂C ან O₁O₂ მონაკვეთის სიგრძე; ან დაადგინა, რომ O₁ABO₂ მართკუთხა ტრაპეციაა.",
      },
      { id: "ბ", description: "იპოვა O₁ABO₂ ტრაპეციის სიმაღლე (O₁C = 2√10 სმ)." },
      { id: "გ", description: "მიიღო სწორი პასუხი." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 2, requiresSteps: ["ბ"] },
      { score: 3, requiresSteps: ["ბ", "გ"] },
    ],
  },
  {
    id: "m1-q40",
    number: 40,
    prompt:
      "კურსზე ბიჭებისა და გოგონების რაოდენობების გამომსახველ წრიულ დიაგრამაზე გოგონების შესაბამისი სექტორის ცენტრალური კუთხის სიდიდე 30°-ით აღემატება ბიჭების შესაბამისი სექტორის ცენტრალური კუთხის სიდიდეს. სულ რამდენი გოგონა და რამდენი ბიჭი სწავლობს ამ კურსზე, თუ მათი ჯამური რაოდენობა 75-ზე მეტი ორნიშნა რიცხვით გამოისახება?",
    points: 4,
    modelSolution:
      "ვთქვათ, კურსზე x გოგონა და y ბიჭია, მაშინ ამოცანის პირობის თანახმად 75 < x+y < 100. x−y რიცხვს წრიულ დიაგრამაზე შეესაბამება 30°-ის ტოლი კუთხე, ხოლო x+y რიცხვს — 360°-ის ტოლი კუთხე. ამიტომ ვწერთ განტოლებას (x−y)/(x+y) = 30/360 = 1/12. ეს განტოლება ტოლფასია 11x = 13y ტოლობის, ანუ x = (13/11)y. რადგან x და y მთელი რიცხვებია, ამიტომ y არის 11-ის ჯერადი რიცხვი. 75 < x+y < 100 პირობას აკმაყოფილებს რიცხვების მხოლოდ ერთი წყვილი: y = 44, x = 52.",
    answer: "52 გოგონა, 44 ბიჭი.",
    steps: [
      { id: "ა", description: "შემოიტანა საჭირო უცნობები და დაწერა უტოლობა 75 < x+y < 100." },
      {
        id: "ბ",
        description:
          "დაწერა, რამდენ გრადუსიანი სექტორი შეესაბამება ერთ მოსწავლეს ან მთლიანად გოგონებს ან მთლიანად ბიჭებს (მაგ. 360/(x+y), 360x/(x+y), 360y/(x+y)).",
      },
      { id: "გ", description: "დაწერა ტოლობა (x−y)/(x+y) = 1/12 (ან მისი ტოლფასი ტოლობა)." },
      { id: "დ", description: "გამოსახა ერთი ცვლადი მეორეს საშუალებით, მაგ. x = (13/11)y." },
      { id: "ე", description: "მიიღო სწორი პასუხი." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 1, requiresSteps: ["ბ"] },
      { score: 2, requiresSteps: ["გ"] },
      { score: 3, requiresSteps: ["ა", "დ"] },
      { score: 4, requiresSteps: ["ა", "დ", "ე"] },
    ],
    partialCreditNote:
      "იმ შემთხვევაში, თუ აბიტურიენტმა გამოიცნო პასუხი და შეამოწმა, რომ ის აკმაყოფილებს ამოცანის პირობებს, იწერება 2 ქულა.",
  },
  {
    id: "m1-q41",
    number: 41,
    prompt:
      "იპოვეთ მთელ რიცხვთა ყველა შესაძლო $(x;\\,y)$ წყვილი, რომელთათვისაც სრულდება ტოლობა:",
    latex: "\\log_{7}(x^{2}-y^{2}+4)=1-\\log_{7}(x+3y)",
    points: 4,
    modelSolution:
      "რადგან x და y მთელი რიცხვებია, ამიტომ x²−y²+4 და x+3y დადებითი მთელი რიცხვებია. საწყისი ტოლობა გადავწეროთ log₇[(x²−y²+4)(x+3y)] = 1 სახით. ლოგარითმის განმარტების თანახმად, ვწერთ (x²−y²+4)(x+3y) = 7. რადგან 7 მარტივი რიცხვია, ამიტომ გვაქვს განტოლებათა ორი შესაძლო სისტემა: {x+3y = 1; x²−y²+4 = 7} ან {x+3y = 7; x²−y²+4 = 1}. პირველი სისტემიდან x = 1−3y; მეორე განტოლებაში ჩასმით მივიღებთ 4y²−3y−1 = 0, რომლის ამონახსნებია y₁ = 1 და y₂ = −1/4. y₂ არ არის მთელი, ამიტომ პირველი სისტემა იძლევა ერთ ამონახსნს (−2; 1). მეორე სისტემიდან x = 7−3y; ჩასმით მივიღებთ 4y²−21y+26 = 0, რომლის ამონახსნებია y₁ = 2 და y₂ = 13/4. y₂ არ არის მთელი, ამიტომ მეორე სისტემა იძლევა ერთ ამონახსნს (1; 2).",
    answer: "(−2; 1); (1; 2)",
    steps: [
      { id: "ა", description: "მიიღო განტოლება (x²−y²+4)(x+3y) = 7 (ან მისი ტოლფასი განტოლება)." },
      {
        id: "ბ",
        description:
          "დაწერა სისტემა {x+3y = 1; x²−y²+4 = 7} ან სისტემა {x+3y = 7; x²−y²+4 = 1}.",
      },
      { id: "გ", description: "სწორად ამოხსნა ბ) პუნქტის ერთ-ერთი სისტემა." },
      {
        id: "დ",
        description:
          "სწორად ამოხსნა ბ) პუნქტის ორივე სისტემა და დააფიქსირა საწყისი განტოლების სწორი პასუხები.",
      },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 2, requiresSteps: ["ა", "ბ"] },
      { score: 3, requiresSteps: ["ა", "ბ", "გ"] },
      { score: 4, requiresSteps: ["ა", "ბ", "დ"] },
    ],
    partialCreditNote:
      "თუ გამოიცნო საწყისი განტოლების ერთი ამონახსნი მაინც და შეამოწმა, რომ ის აკმაყოფილებს ამოცანის პირობაში მოცემულ განტოლებას, იწერება 1 ქულა.",
  },
];

const VARIANT_2_MCQ: MathMcqQuestion[] = [
  {
    id: "m2-q1",
    number: 1,
    prompt: "გამოთვალეთ:",
    latex: "3\\tfrac{1}{3}\\cdot\\left(2\\tfrac{3}{4}-1{,}25\\right)",
    options: [
      { label: "ა", latex: "\\tfrac{7}{12}" },
      { label: "ბ", latex: "\\tfrac{21}{4}" },
      { label: "გ", latex: "5" },
      { label: "დ", latex: "-5" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q2",
    number: 2,
    prompt: "იპოვეთ 2025-ის ყველა განსხვავებული მარტივი გამყოფის ჯამი.",
    options: [
      { label: "ა", text: "5" },
      { label: "ბ", text: "7" },
      { label: "გ", text: "8" },
      { label: "დ", text: "9" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q3",
    number: 3,
    prompt:
      "ტელევიზორის ფასი ჯერ 20%-ით შემცირდა, ხოლო შემდეგ კიდევ 10%-ით შემცირდა. სულ რამდენი პროცენტით შემცირდა ტელევიზორის ფასი?",
    options: [
      { label: "ა", text: "27%" },
      { label: "ბ", text: "28%" },
      { label: "გ", text: "29%" },
      { label: "დ", text: "30%" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q4",
    number: 4,
    prompt:
      "ამოზნექილი ოთხკუთხედის კუთხეები ისე შეეფარდება ერთმანეთს, როგორც $1:2:4:5$. იპოვეთ ოთხკუთხედის უდიდესი კუთხის სიდიდე.",
    options: [
      { label: "ა", text: "130°" },
      { label: "ბ", text: "135°" },
      { label: "გ", text: "150°" },
      { label: "დ", text: "160°" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q5",
    number: 5,
    prompt:
      "წრის ფორმის გასაშლელი მაგიდის გარშემოწერილობის სიგრძე (წრეწირის სიგრძე) $2\\pi$ მეტრის ტოლია. გაშლის დროს ნახევარწრის ფორმის ნაჭრებს შორის დგამენ მართკუთხედის ფორმის ნაჭერს, რომლის დიაგონალის სიგრძე $\\sqrt{13}$ მეტრია (იხ. სურათი). მაგიდის გაშლის შედეგად რამდენჯერ იზრდება მისი ფართობი?",
    figure: { src: `${FIG2}/q5.png`, alt: "გასაშლელი მაგიდის სქემა" },
    options: [
      { label: "ა", latex: "(6+\\pi)\\text{-ჯერ}" },
      { label: "ბ", latex: "\\left(1+\\tfrac{3}{\\pi}\\right)\\text{-ჯერ}" },
      { label: "გ", latex: "2\\text{-ჯერ}" },
      { label: "დ", latex: "\\left(1+\\tfrac{6}{\\pi}\\right)\\text{-ჯერ}" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q6",
    number: 6,
    prompt: "გამოთვალეთ:",
    latex: "\\sqrt{2}\\cdot\\left(2^{\\sqrt{0{,}5}-1}\\right)^{\\sqrt{0{,}5}+1}",
    options: [
      { label: "ა", latex: "2\\sqrt{2}" },
      { label: "ბ", latex: "2" },
      { label: "გ", latex: "1" },
      { label: "დ", latex: "\\tfrac{1}{2}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q7",
    number: 7,
    prompt: "იპოვეთ $f(2)$, თუ $f(x)=\\dfrac{9-4x}{2\\sqrt{x}+3}$.",
    options: [
      { label: "ა", latex: "3-2\\sqrt{2}" },
      { label: "ბ", latex: "\\tfrac{1}{6}" },
      { label: "გ", latex: "\\sqrt{2}-3" },
      { label: "დ", latex: "2\\sqrt{2}-3" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q8",
    number: 8,
    prompt:
      "$Oxy$ სიბრტყის $(1;4)$ წერტილი მდებარეობს $y=-3x+b$ წრფეზე. იპოვეთ ამ წრფეზე მდებარე იმ წერტილის ორდინატა, რომლის აბსცისაა 5.",
    options: [
      { label: "ა", text: "−8" },
      { label: "ბ", text: "−7" },
      { label: "გ", latex: "\\tfrac{3}{4}" },
      { label: "დ", text: "7" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q9",
    number: 9,
    prompt:
      "სურათზე მოცემულია $f(x)=\\frac{a}{x+b}$ ფუნქციის გრაფიკი, რომლის განსაზღვრის არეა $(-\\infty;-4)\\cup(-4;+\\infty)$ სიმრავლე. იპოვეთ $a+b$, თუ გრაფიკი $Oy$ ღერძს კვეთს $\\left(0;\\frac{1}{2}\\right)$ წერტილში.",
    figure: { src: `${FIG2}/q9.png`, alt: "ჰიპერბოლის გრაფიკი" },
    options: [
      { label: "ა", text: "−6" },
      { label: "ბ", text: "−2" },
      { label: "გ", text: "4,5" },
      { label: "დ", text: "6" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q10",
    number: 10,
    prompt:
      "$Oxy$ საკოორდინატო სიბრტყეზე $y=2x^{2}-ax+5$ ფუნქციის გრაფიკის სიმეტრიის ღერძია $x=-3$ წრფე. იპოვეთ $a$-ს მნიშვნელობა.",
    options: [
      { label: "ა", text: "−12" },
      { label: "ბ", text: "−6" },
      { label: "გ", text: "10" },
      { label: "დ", text: "12" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q11",
    number: 11,
    prompt:
      "წესიერი ოცკუთხედის პერიმეტრი 40 სმ-ის ტოლია. იპოვეთ მასზე შემოხაზული წრეწირის რადიუსი.",
    options: [
      { label: "ა", latex: "\\dfrac{1}{\\sin\\left(\\frac{\\pi}{20}\\right)}\\,\\text{სმ}" },
      { label: "ბ", latex: "\\dfrac{1}{\\cos\\left(\\frac{\\pi}{20}\\right)}\\,\\text{სმ}" },
      { label: "გ", latex: "\\dfrac{1}{2\\sin\\left(\\frac{\\pi}{10}\\right)}\\,\\text{სმ}" },
      { label: "დ", latex: "2\\sin\\left(\\tfrac{\\pi}{20}\\right)\\,\\text{სმ}" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q12",
    number: 12,
    prompt:
      "სამი ფირმა ასრულებს 60 მილიონი ლარის ღირებულების ერთობლივ პროექტს. ამ ფირმების პროექტში ჩადებული თანხების განაწილების წრიულ დიაგრამაზე მესამე ფირმას შეესაბამება 90° კუთხის სექტორი. მოგვიანებით თითოეულმა ფირმამ პროექტში დამატებით 5 მილიონი ლარი ჩადო, რის შემდეგაც კვლავ შეადგინეს შესაბამისი წრიული დიაგრამა. რამდენი გრადუსით შეიცვალა ახალ წრიულ დიაგრამაზე მესამე ფირმის შესაბამისი სექტორის კუთხე?",
    options: [
      { label: "ა", text: "გაიზარდა 6°-ით" },
      { label: "ბ", text: "შემცირდა 5°-ით" },
      { label: "გ", text: "გაიზარდა 8°-ით" },
      { label: "დ", text: "გაიზარდა 9°-ით" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q13",
    number: 13,
    prompt:
      "პირამიდას და პრიზმას ტოლი რაოდენობის წახნაგები აქვს. რამდენი წვერო აქვს ამ პრიზმას, თუ მას 7-ით მეტი წიბო აქვს, ვიდრე აღნიშნულ პირამიდას?",
    options: [
      { label: "ა", text: "16" },
      { label: "ბ", text: "18" },
      { label: "გ", text: "22" },
      { label: "დ", text: "28" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q14",
    number: 14,
    prompt:
      "$Oxy$ საკოორდინატო სიბრტყეზე მოცემულია $OABC$ რომბი, რომლის გვერდის სიგრძე 2-ის ტოლია, ხოლო $AOC$ კუთხის სიდიდე $45°$-ია. იპოვეთ $B$ წერტილის აბსცისა, თუ ცნობილია, რომ $C$ წერტილი მდებარეობს აბსცისათა დადებით ნახევარღერძზე.",
    options: [
      { label: "ა", latex: "2+\\sqrt{2}" },
      { label: "ბ", latex: "2+\\tfrac{\\sqrt{3}}{2}" },
      { label: "გ", latex: "2-\\sqrt{2}" },
      { label: "დ", latex: "4-2\\sqrt{2}" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q15",
    number: 15,
    prompt:
      "ელენემ 5 დღეში ამოხსნა სულ 75 სავარჯიშო ისე, რომ ყოველდღიურად უფრო მეტ სავარჯიშოს ხსნიდა, ვიდრე წინა დღეს. სავარჯიშოების რა უმცირესი რაოდენობა შეიძლება ამოეხსნა ელენეს მეხუთე დღეს?",
    options: [
      { label: "ა", text: "20" },
      { label: "ბ", text: "18" },
      { label: "გ", text: "17" },
      { label: "დ", text: "16" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q16",
    number: 16,
    prompt:
      "$A$ და $B$ არის 20 ელემენტიანი სიმრავლის ქვესიმრავლეები, ამასთან $A$ სიმრავლე შედგება 13 ელემენტისაგან, ხოლო $B$ შედგება 15 ელემენტისაგან. ქვემოთ ჩამოთვლილი რიცხვებიდან რომელი შეიძლება წარმოადგენდეს $A\\cap B$ სიმრავლის ყველა ელემენტის რაოდენობას?",
    options: [
      { label: "ა", text: "4" },
      { label: "ბ", text: "6" },
      { label: "გ", text: "7" },
      { label: "დ", text: "9" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q17",
    number: 17,
    prompt:
      "არგუმენტის რომელი მნიშვნელობისთვის იღებს $\\left[\\frac{2\\pi}{5};\\,\\frac{3\\pi}{5}\\right]$ შუალედზე განსაზღვრული $f(x)=\\sin(5x)$ ფუნქცია უდიდეს მნიშვნელობას?",
    options: [
      { label: "ა", latex: "\\tfrac{\\pi}{2}" },
      { label: "ბ", latex: "\\tfrac{2\\pi}{5}" },
      { label: "გ", latex: "\\tfrac{3\\pi}{5}" },
      { label: "დ", latex: "\\tfrac{5\\pi}{2}" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q18",
    number: 18,
    prompt:
      "კლასში სწავლობს ოცდაოთხი მოსწავლე. მათგან მაგიდის კომპიუტერი აქვს ათ მოსწავლეს, პლანშეტი აქვს შვიდ მოსწავლეს, ხოლო როგორც მაგიდის კომპიუტერი, ასევე პლანშეტი აქვს ხუთ მოსწავლეს. რა არის იმის ალბათობა, რომ ამ კლასის მოსწავლეებიდან შემთხვევით შერჩეულ მოსწავლეს არ აქვს არც მაგიდის კომპიუტერი და არც პლანშეტი?",
    options: [
      { label: "ა", latex: "\\tfrac{1}{11}" },
      { label: "ბ", latex: "\\tfrac{7}{24}" },
      { label: "გ", latex: "\\tfrac{1}{2}" },
      { label: "დ", latex: "\\tfrac{22}{29}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q19",
    number: 19,
    prompt:
      "იპოვეთ $m$-ის ყველა იმ მნიშვნელობათა სიმრავლე, რომელთაგან თითოეულისთვის $mx^{2}-6x+m-2=0$ კვადრატულ განტოლებას აქვს სხვადასხვა ნიშნის ორი განსხვავებული ფესვი.",
    options: [
      { label: "ა", latex: "(0;\\,2)" },
      { label: "ბ", latex: "(0;\\,+\\infty)" },
      { label: "გ", latex: "(-\\infty;\\,2)" },
      { label: "დ", latex: "(-\\infty;\\,0)\\cup(2;\\,+\\infty)" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q20",
    number: 20,
    prompt:
      "$ABC$ მართკუთხა სამკუთხედის $C$ მართი კუთხის წვეროდან $AB$ ჰიპოტენუზისადმი გავლებულია $CD$ სიმაღლე. იპოვეთ $ABC$ კუთხის ტანგენსი, თუ $\\frac{AD}{DB}=\\frac{2}{7}$.",
    figure: { src: `${FIG2}/q20.png`, alt: "მართკუთხა სამკუთხედი სიმაღლით" },
    options: [
      { label: "ა", latex: "\\tfrac{2}{5}" },
      { label: "ბ", latex: "\\tfrac{\\sqrt{14}}{7}" },
      { label: "გ", latex: "\\sqrt{\\tfrac{7}{2}}" },
      { label: "დ", latex: "\\tfrac{\\sqrt{7}}{2}" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q21",
    number: 21,
    prompt:
      "$ABC$ ტოლგვერდა სამკუთხედის გვერდის სიგრძე 6-ის ტოლია. იპოვეთ $\\vec{AB}$ და $\\vec{BC}$ ვექტორების სკალარული ნამრავლი.",
    options: [
      { label: "ა", latex: "18\\sqrt{3}" },
      { label: "ბ", latex: "18" },
      { label: "გ", latex: "-18\\sqrt{3}" },
      { label: "დ", latex: "-18" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q22",
    number: 22,
    prompt:
      "ჭადრაკის ტურნირში მონაწილეობს 13 მოჭადრაკე, რომელთაგან ერთ-ერთი არის გია. თითოეული მოჭადრაკე ყველა დანარჩენთან თითო პარტიას თამაშობს. თითოეულ პარტიაში თეთრი ან შავი ფიგურებით თამაშის უფლება თამაშდება კენჭისყრით, რომელშიც თითოეული ფერის მოსვლის ალბათობა ერთმანეთის ტოლია. რა არის იმის ალბათობა, რომ ტურნირის მსვლელობაში გია თეთრი ფიგურებით ზუსტად ოთხჯერ ითამაშებს?",
    options: [
      { label: "ა", latex: "\\dfrac{C_{12}^{4}}{8!\\,4!}" },
      { label: "ბ", latex: "\\dfrac{2^{12}}{12!}" },
      { label: "გ", latex: "\\dfrac{C_{8}^{4}}{2^{12}}" },
      { label: "დ", latex: "\\dfrac{C_{12}^{4}}{2^{12}}" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q23",
    number: 23,
    prompt: "იპოვეთ $f(x)=3^{x+7}-5$ ფუნქციის მნიშვნელობათა სიმრავლე.",
    options: [
      { label: "ა", latex: "(-5;\\,+\\infty)" },
      { label: "ბ", latex: "(\\log_{3}5-7;\\,+\\infty)" },
      { label: "გ", latex: "[-7;\\,-5)" },
      { label: "დ", latex: "(0;\\,+\\infty)" },
    ],
    correctLabel: "ა",
    points: 1,
  },
  {
    id: "m2-q24",
    number: 24,
    prompt:
      "$Oxy$ საკოორდინატო სიბრტყეზე მოცემულია სამკუთხედი, რომლის წვეროები $y=x^{2}-8x+7$ ფუნქციის გრაფიკის საკოორდინატო ღერძებთან გადაკვეთის წერტილებია. იპოვეთ ამ სამკუთხედის უმცირესი გვერდის სიგრძე.",
    options: [
      { label: "ა", text: "8" },
      { label: "ბ", text: "7" },
      { label: "გ", text: "6" },
      { label: "დ", latex: "\\sqrt{50}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q25",
    number: 25,
    prompt:
      "იპოვეთ $a$ პარამეტრის ყველა იმ მნიშვნელობების სიმრავლე, რომელთაგან თითოეულისათვის $\\sin x=7-5a$ განტოლებას აქვს ამონახსნი, რომელიც მოთავსებულია $(\\pi;\\,2\\pi)$ ინტერვალში.",
    options: [
      { label: "ა", latex: "\\left(\\tfrac{7}{5};\\,\\tfrac{8}{5}\\right)" },
      { label: "ბ", latex: "\\left(\\tfrac{7}{5};\\,\\tfrac{8}{5}\\right]" },
      { label: "გ", latex: "\\left(\\tfrac{7}{5};\\,+\\infty\\right)" },
      { label: "დ", latex: "\\left(-\\infty;\\,\\tfrac{8}{5}\\right)" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q26",
    number: 26,
    prompt: "ქვემოთ ჩამოთვლილი გამონათქვამებიდან რომელია მცდარი?",
    options: [
      {
        label: "ა",
        text:
          "თუ ორი განსხვავებული a და b წრფე M სიბრტყის მართობულია, მაშინ ეს წრფეები ერთმანეთის პარალელურია.",
      },
      {
        label: "ბ",
        text:
          "თუ ორი განსხვავებული M და N სიბრტყე a წრფის მართობულია, მაშინ ეს სიბრტყეები ერთმანეთის პარალელურია.",
      },
      {
        label: "გ",
        text:
          "თუ a წრფე M სიბრტყის მართობულია, ხოლო a წრფის გადამკვეთი b წრფე M სიბრტყის პარალელურია, მაშინ a და b წრფეები ერთმანეთის მართობულია.",
      },
      {
        label: "დ",
        text:
          "ნებისმიერად შერჩეული M და N სიბრტყეებისათვის და a წრფისათვის, თუ M∥a და N∥a, მაშინ M∥N.",
      },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q27",
    number: 27,
    prompt:
      "$Oxy$ საკოორდინატო სიბრტყეზე მოცემულია სიბრტყის ორი გარდაქმნა: $R_{O}^{90^{\\circ}}$ და $S_{y}$, სადაც $R_{O}^{90^{\\circ}}$ არის მობრუნება კოორდინატთა სათავის გარშემო 90°-ით საათის ისრის მოძრაობის საწინააღმდეგო მიმართულებით, ხოლო $S_{y}$ არის სიმეტრია ორდინატთა ღერძის მიმართ. სიბრტყეზე მდებარე ნებისმიერი $A$ წერტილისათვის, სადაც $A\\neq O$, ავაგოთ $B=S_{y}\\!\\left(R_{O}^{90^{\\circ}}(A)\\right)$ წერტილი. ქვემოთ ჩამოთვლილი წინადადებებიდან რომელია ჭეშმარიტი?",
    options: [
      {
        label: "ა",
        text: "B წერტილი მიიღება A წერტილის მობრუნებით O წერტილის მიმართ 180°-ით.",
      },
      { label: "ბ", text: "B წერტილი A წერტილის სიმეტრიულია აბსცისათა ღერძის მიმართ." },
      { label: "გ", text: "B წერტილი A წერტილის სიმეტრიულია ორდინატთა ღერძის მიმართ." },
      { label: "დ", text: "B წერტილი A წერტილის სიმეტრიულია y=x წრფის მიმართ." },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q28",
    number: 28,
    prompt:
      "რიცხვითი მიმდევრობის ზოგადი წევრი მოცემულია ფორმულით $a_{n}=n^{2}-3n$, სადაც $n$ ნატურალური რიცხვია. გამოთვალეთ $a_{2n}-a_{n+1}$.",
    options: [
      { label: "ა", latex: "3n^{2}-n+4" },
      { label: "ბ", latex: "3n^{2}-5n+2" },
      { label: "გ", latex: "n^{2}-n-4" },
      { label: "დ", latex: "3n^{2}-n-4" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q29",
    number: 29,
    prompt:
      "იპოვეთ უმცირესი მთელი რიცხვი, რომელიც მეტია $\\log_{3}4-\\log_{9}121$ გამოსახულების მნიშვნელობაზე?",
    options: [
      { label: "ა", text: "−2" },
      { label: "ბ", text: "−1" },
      { label: "გ", text: "0" },
      { label: "დ", text: "1" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q30",
    number: 30,
    prompt:
      "$A$ წერტილიდან წრეწირისადმი გავლებულია მხები და წრეწირის ცენტრზე გამავალი მკვეთი. მხები წრეწირს ეხება $B$ წერტილში, ხოლო $C$ არის მკვეთის წრეწირთან გადაკვეთის წერტილი, რომელიც მდებარეობს $A$ წერტილსა და წრეწირის ცენტრს შორის (იხ. სურათი). იპოვეთ $AB$ მონაკვეთის სიგრძე, თუ წრეწირის რადიუსია 5 სმ და $AC=4$ სმ.",
    figure: { src: `${FIG2}/q30.png`, alt: "წრეწირი მხებითა და მკვეთით" },
    options: [
      { label: "ა", latex: "\\sqrt{14}\\,\\text{სმ}" },
      { label: "ბ", latex: "2\\sqrt{14}\\,\\text{სმ}" },
      { label: "გ", latex: "8\\,\\text{სმ}" },
      { label: "დ", latex: "8\\sqrt{2}\\,\\text{სმ}" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q31",
    number: 31,
    prompt: "ამოხსენით უტოლობა:",
    latex: "3^{-x}+3^{1-x}\\leq40",
    options: [
      { label: "ა", latex: "\\left[\\tfrac{1+\\log_{3}40}{2};\\,+\\infty\\right)" },
      { label: "ბ", latex: "[-\\log_{3}10;\\,+\\infty)" },
      { label: "გ", latex: "(0;\\,\\log_{3}10]" },
      { label: "დ", latex: "(-\\infty;\\,-\\log_{3}10]" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q32",
    number: 32,
    prompt:
      "გეომეტრიული პროგრესიის მნიშვნელი უდრის 4-ს, ხოლო პირველი და მეხუთე წევრების ნამრავლი ტოლია მესამე წევრის. რას უდრის ამ პროგრესიის მეხუთე წევრი?",
    options: [
      { label: "ა", text: "64" },
      { label: "ბ", text: "32" },
      { label: "გ", text: "16" },
      { label: "დ", text: "4" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q33",
    number: 33,
    prompt: "ქვემოთ ჩამოთვლილი მნიშვნელობებიდან რომელი შეიძლება მიიღოს $y=\\cos x$ ფუნქციამ?",
    options: [
      { label: "ა", latex: "\\pi" },
      { label: "ბ", latex: "\\tfrac{\\pi}{2}" },
      { label: "გ", latex: "-\\tfrac{\\pi}{4}" },
      { label: "დ", latex: "-\\tfrac{\\pi}{3}" },
    ],
    correctLabel: "გ",
    points: 1,
  },
  {
    id: "m2-q34",
    number: 34,
    prompt:
      "$ABCD$ კვადრატს და $ASD$ სამკუთხედს, რომლებიც სხვადასხვა სიბრტყეში მდებარეობს, აქვს $AD$ საერთო გვერდი (იხ. სურათი). $O$ წერტილი კვადრატის დიაგონალების გადაკვეთის წერტილია, $SO$ კვადრატის სიბრტყის მართობულია, $SO=6$ სმ და $AB=8$ სმ. იპოვეთ $ABCD$ კვადრატითა და $ASD$ სამკუთხედით შედგენილი ორწახნაგა კუთხე.",
    figure: { src: `${FIG2}/q34.png`, alt: "კვადრატი და სამკუთხედი სხვადასხვა სიბრტყეში" },
    options: [
      { label: "ა", latex: "\\arcsin\\!\\left(\\tfrac{3}{4}\\right)" },
      { label: "ბ", latex: "\\operatorname{arctg}\\!\\left(\\tfrac{3}{2}\\right)" },
      { label: "გ", latex: "\\operatorname{arctg}\\!\\left(\\tfrac{2}{3}\\right)" },
      { label: "დ", latex: "\\arccos\\!\\left(\\tfrac{3}{4}\\right)" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q35",
    number: 35,
    prompt:
      "იპოვეთ $a+b$, თუ $A(a;b)$ და $B(1;3)$ წერტილები სიმეტრიულია $y=2x^{2}-3x+c$ პარაბოლის სიმეტრიის ღერძის მიმართ.",
    options: [
      { label: "ა", text: "−1" },
      { label: "ბ", latex: "\\tfrac{1}{2}" },
      { label: "გ", latex: "\\tfrac{5}{2}" },
      { label: "დ", latex: "\\tfrac{7}{2}" },
    ],
    correctLabel: "დ",
    points: 1,
  },
  {
    id: "m2-q36",
    number: 36,
    prompt:
      "$ABCD$ მართკუთხედის $BC$ გვერდზე მონიშნულია $M$ და $N$ წერტილები ისე, რომ $BM=MN=NC$. ამასთან $AM$ და $DN$ წრფეები იკვეთება $K$ წერტილში. რას უდრის $ABCD$ მართკუთხედისა და $AKD$ სამკუთხედის ფართობების შეფარდება?",
    figure: { src: `${FIG2}/q36.png`, alt: "მართკუთხედი ABCD და წერტილი K" },
    options: [
      { label: "ა", latex: "\\tfrac{3}{2}" },
      { label: "ბ", latex: "\\tfrac{4}{3}" },
      { label: "გ", latex: "\\tfrac{5}{4}" },
      { label: "დ", latex: "\\tfrac{2}{3}" },
    ],
    correctLabel: "ბ",
    points: 1,
  },
  {
    id: "m2-q37",
    number: 37,
    prompt:
      "კონუსის გვერდითი ზედაპირის ფართობი ორჯერ მეტია ფუძის ფართობზე. იპოვეთ კონუსის სიმაღლის შეფარდება კონუსის ფუძის რადიუსთან.",
    options: [
      { label: "ა", latex: "2\\pi" },
      { label: "ბ", latex: "\\pi\\sqrt{3}" },
      { label: "გ", latex: "\\tfrac{\\sqrt{3}}{2}" },
      { label: "დ", latex: "\\sqrt{3}" },
    ],
    correctLabel: "დ",
    points: 1,
  },
];

const VARIANT_2_OPEN: MathOpenProblem[] = [
  {
    id: "m2-q38",
    number: 38,
    prompt:
      "$A(1;2)$ და $B(-1;8)$ წერტილები ეკუთვნის $f(x)=a^{x+b}$ მაჩვენებლიან ფუნქციის გრაფიკს. იპოვეთ $b$ პარამეტრის მნიშვნელობა.",
    points: 3,
    modelSolution:
      "რადგან A(1;2) და B(−1;8) წერტილები ეკუთვნის f(x)=a^(x+b) ფუნქციის გრაფიკს, ამიტომ მივიღებთ სისტემას: 2=a^(1+b) და 8=a^(−1+b). პირველი ტოლობა ავიყვანოთ კუბში: 2³=a^(3(1+b)), ე.ი. 8=a^(3(1+b)). მეორე ტოლობასთან შედარებით a^(3(1+b))=a^(−1+b), საიდანაც 3(b+1)=b−1, ე.ი. b=−2.",
    answer: "b = −2",
    steps: [
      { id: "ა", description: "a და b პარამეტრების მიმართ მიიღო განტოლებათა სისტემა." },
      {
        id: "ბ",
        description:
          "მიიღო ერთუცნობიანი განტოლება b პარამეტრის მიმართ (მაგ. (b−1)/(b+1)=3) ან იპოვა a პარამეტრის მნიშვნელობა.",
      },
      { id: "გ", description: "მიიღო სწორი პასუხი." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 2, requiresSteps: ["ა", "ბ"] },
      { score: 3, requiresSteps: ["ა", "ბ", "გ"] },
    ],
  },
  {
    id: "m2-q39",
    number: 39,
    prompt:
      "$ABCD$ კვადრატის გვერდის სიგრძეა $a$. იპოვეთ იმ წრეწირის რადიუსი, რომელიც გადის კვადრატის $A$ და $B$ წვეროებზე და ეხება $CD$ გვერდს (იხ. სურათი).",
    figure: { src: `${FIG2}/q39.png`, alt: "კვადრატი ჩახაზული წრეწირით" },
    points: 3,
    modelSolution:
      "ვთქვათ, წრეწირის რადიუსია r, ხოლო ცენტრი O წერტილში მდებარეობს; E წრეწირისა და CD გვერდის შეხების წერტილია. მაშინ AO=BO=EO=r. წრფე EO მართობულია AB გვერდის და მას F შუაწერტილში კვეთს, ამიტომ AOF მართკუთხა სამკუთხედში AF=a/2, FO=a−r, AO=r. პითაგორას თეორემით AO²=AF²+FO², საიდანაც ვღებულობთ განტოლებას r²=a²/4+(a−r)². აქედან 2ar=5a²/4, ე.ი. r=5a/8.",
    answer: "r = 5a/8",
    steps: [
      {
        id: "ა",
        description:
          "დაწერა ტოლობა AO=BO=EO=r (ან ეკვივალენტური კავშირი — მაგ. ქორდების/მხების მონაკვეთებს შორის, ან რომ BC-ს წრეწირთან გადაკვეთისა და A წერტილის შემაერთებელი მონაკვეთი დიამეტრია).",
      },
      { id: "ბ", description: "შეადგინა r²=a²/4+(a−r)² ან მისი ტოლფასი განტოლება." },
      { id: "გ", description: "მიიღო სწორი პასუხი: r=5a/8." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 2, requiresSteps: ["ა", "ბ"] },
      { score: 3, requiresSteps: ["ა", "ბ", "გ"] },
    ],
  },
  {
    id: "m2-q40",
    number: 40,
    prompt:
      "ორი ჭურჭლიდან თითოეულში ჩასხმულია 10 კგ მარილხსნარი. მეორე ჭურჭელში მარილის პროცენტული შემცველობა 4-ჯერ მეტია პირველ ჭურჭელში ჩასხმულ მარილხსნარში მარილის პროცენტულ შემცველობაზე. რამდენი კილოგრამი მარილხსნარი უნდა გადავასხათ პირველი ჭურჭლიდან მეორეში, რომ მეორე ჭურჭელში მარილხსნარში მარილის პროცენტული შემცველობა 3-ჯერ მეტი გახდეს პირველ ჭურჭელში მარილხსნარში მარილის პროცენტულ შემცველობაზე?",
    points: 4,
    modelSolution:
      "ვთქვათ, პირველ ჭურჭელში 10 კგ მარილხსნარი შეიცავდა a კგ მარილს. მაშინ მარილის პროცენტული შემცველობა იქნებოდა (a/10)·100%. პირობის თანახმად მეორე ჭურჭელში ჩასხმული მარილხსნარი შეიცავდა 4a კგ მარილს. თუ პირველი ჭურჭლიდან მეორეში გადავასხამთ x კგ მარილხსნარს, მაშინ მასში იქნებოდა (a/10)·x კგ მარილი. ცხადია, რომ ამის შემდეგ პირველ ჭურჭელში მარილის პროცენტული შემცველობა დარჩება იგივე (a/10)·100%, ხოლო მეორე ჭურჭელში გახდება (4a+(a/10)·x)/(10+x)·100%. პირობის თანახმად: (3a/10)·100=(4a+(a/10)·x)/(10+x)·100, საიდანაც 3(10+x)=10(4+x/10), ე.ი. x=5.",
    answer: "5 კგ",
    steps: [
      {
        id: "ა",
        description:
          "გამოსახა მარილის მასა პირველი ჭურჭლიდან მეორეში გადასახმულ მარილხსნარში (მაგ. (a/10)·x), ან აღნიშნა, რომ თავიდან მეორე ჭურჭელში იქნებოდა 4-ჯერ მეტი მასის მარილი.",
      },
      {
        id: "ბ",
        description:
          "გამოსახა მეორე ჭურჭელში მარილის წილი ან პროცენტული შემცველობა გადასახმის შემდეგ.",
      },
      {
        id: "გ",
        description:
          "შეადგინა (3a/10)·100=(4a+(a/10)·x)/(10+x)·100 ან მისი ტოლფასი განტოლება.",
      },
      { id: "დ", description: "მიიღო სწორი პასუხი." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 2, requiresSteps: ["ბ"] },
      { score: 3, requiresSteps: ["ბ", "გ"] },
      { score: 4, requiresSteps: ["ბ", "გ", "დ"] },
    ],
    partialCreditNote:
      "თუ a-ს კონკრეტული მნიშვნელობისთვის ამოხსნა ამოცანა, ან დაწერა პასუხი და შეამოწმა, რომ ის აკმაყოფილებს ამოცანის პირობებს ყოველი a-სთვის, ნაშრომი ფასდება 2 ქულით. თუ დაწერა პასუხი და შეამოწმა მხოლოდ a-ს კონკრეტული მნიშვნელობისთვის, ნაშრომი ფასდება 1 ქულით.",
  },
  {
    id: "m2-q41",
    number: 41,
    prompt: "იპოვეთ $m$, $n$ ნატურალურ რიცხვთა ყველა ისეთი $(m;\\,n)$ წყვილი, რომ:",
    latex: "\\frac{11m^{2}+5mn-6n^{2}}{\\sqrt{256-8m-7n}}=0",
    points: 4,
    modelSolution:
      "გადავწეროთ განტოლება სისტემის სახით: 11m²+5mn−6n²=0 და 8m+7n<256. სისტემის პირველი განტოლების ამოხსნა m-ის მიმართ გვაძლევს m₁=(6/11)n, m₂=−n. ამოცანის პირობებს (m და n ნატურალურია) აკმაყოფილებს მხოლოდ პირველი ფესვი: m=(6/11)n, საიდანაც 11m=6n. რადგან m და n ნატურალურია, ამიტომ m=6k, n=11k, სადაც k∈ℕ. ამ მნიშვნელობების ჩასმა უტოლობაში იძლევა 125k<256, ე.ი. k=1 ან k=2. თუ k=1, მაშინ m=6, n=11; თუ k=2, მაშინ m=12, n=22.",
    answer: "(m; n) = (6; 11) ან (12; 22)",
    steps: [
      { id: "ა", description: "დაწერა 11m²+5mn−6n²=0 და 8m+7n<256 პირობები." },
      {
        id: "ბ",
        description:
          "ამოხსნა 11m²+5mn−6n²=0 კვადრატული განტოლება ერთ-ერთი ცვლადის, ან ცვლადთა შეფარდების მიმართ.",
      },
      { id: "გ", description: "ამოხსნა და შეარჩია საჭირო ფესვი: m=(6/11)n." },
      {
        id: "დ",
        description:
          "დაწერა უტოლობა ერთი ცვლადის მიმართ (მაგ. 125k<256), ან შეარჩია ფესვების ერთი წყვილი.",
      },
      { id: "ე", description: "მიიღო სწორი პასუხი." },
    ],
    scoringTable: [
      { score: 1, requiresSteps: ["ა"] },
      { score: 1, requiresSteps: ["ბ"] },
      { score: 2, requiresSteps: ["ა", "ბ"] },
      { score: 2, requiresSteps: ["გ"] },
      { score: 3, requiresSteps: ["ა", "ბ", "დ"] },
      { score: 4, requiresSteps: ["ა", "ბ", "დ", "ე"] },
    ],
    partialCreditNote:
      "თუ გამოიცნო საწყისი განტოლების ერთი ამონახსნი მაინც და შეამოწმა, რომ ის აკმაყოფილებს ამოცანის პირობას, იწერება 1 ქულა.",
  },
];

export const MATH_EXAM_VARIANTS: MathExamVariant[] = [
  {
    id: "variant-1-2025",
    label: "I ვარიანტი",
    year: 2025,
    mcq: VARIANT_1_MCQ,
    open: VARIANT_1_OPEN,
    totalPoints: 51,
    durationMinutes: 180,
  },
  {
    id: "variant-2-2025",
    label: "II ვარიანტი",
    year: 2025,
    mcq: VARIANT_2_MCQ,
    open: VARIANT_2_OPEN,
    totalPoints: 51,
    durationMinutes: 180,
  },
];

export function getMathVariant(id: string): MathExamVariant | undefined {
  return MATH_EXAM_VARIANTS.find((v) => v.id === id);
}

export function getMathExamYears(): { year: number; variants: MathExamVariant[] }[] {
  const byYear = new Map<number, MathExamVariant[]>();
  for (const v of MATH_EXAM_VARIANTS) {
    const list = byYear.get(v.year) ?? [];
    list.push(v);
    byYear.set(v.year, list);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, variants]) => ({ year, variants }));
}
