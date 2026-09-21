# პრომპტი: ქიმიის 2025 წლის საარქივო იმიტირებული გამოცდა

დაწერილია იმავე არქიტექტურის მიხედვით, რაც აშენდა მათემატიკისთვის (`mathExamsData.ts`, `MathExamSimulation.tsx`, `math-open-problem-grader-schema.ts`, `scoreFromSteps()`) და ისტორიისთვის (`historyExamsData.ts`, `history-open-answer-grader-schema.ts`). ქიმია **ორივეს ჰიბრიდია** — იხილეთ §4-ში არქიტექტურული განმარტება, სანამ დაიწყებთ.

## 0. წყარო მასალები

`docs/exam-sources/chemistry/` (რეპოში უკვე გადატანილია):

| ფაილი | შემცველობა |
|---|---|
| `paper-variant-1-2025.pdf` | გამოცდის ტესტი, 43 გვერდი, „ტესტი ქიმიაში“, ივლისი 2025 |
| `scoring-variant-1-2025.pdf` | ოფიციალური შეფასების სქემა |

⚠️ მხოლოდ 1 ვარიანტია მოწოდებული — მონაცემთა მოდელი გაფართოებადი (მასივი ვარიანტებზე), ამჟამად ივსება მხოლოდ `variant: 1`.

## 1. დადასტურებული გამოცდის სტრუქტურა

- **მაქსიმალური ქულა:** 63. **ხანგრძლივობა:** 3 საათი (10800 წმ).
- **ნაწილი 1 — ტესტური კითხვები (1–30, თითო 1 ქ. = 30 ქ.).** X-ნიშნით მონიშვნის იგივე კონვენცია, რაც ისტორია/მათემატიკა/სამოქალაქო. **ნაწილობრივ ვიზუალურად დამოკიდებული** — შერეული ტიპი: სუფთა ტექსტური კითხვები (იონები, იზოტოპები, pH გამოთვლა) **და** ვიზუალზე დამოკიდებული (ელექტრონული გარსების ფრჩხილოვანი დიაგრამა კითხვა 3-ში, წყალბადბმულოვანი დიმერის მოლეკულური აღნაგობა კითხვა 5-ში, პერიოდული ცხრილის ფრაგმენტი კითხვა 6-ში, რეაქციის სიჩქარის გრაფიკი კითხვა 9-ში, ინდიკატორის ფერის ცვლილების ფოტო კითხვა 15-ში). ყველა ასეთი ვიზუალი ამოღებული (`public/exam-figures/chemistry/variant-1-2025/qN.png`), `MathMcqQuestion.figure`-ის ან გეოგრაფიის `figures`-ის იდენტური ველით.
- **ნაწილი 2 — ღია დავალებები (31–40, ჯამში 33 ქ.):**
  - **31** (3 ქ., 31.1–31.3) — მოლეკულური ფორმულა / IUPAC დასახელება / სტრუქტურული ფორმულა, თითო 1 ქ., **ბინარული**.
  - **32** (5 ქ., 32.1–32.5) — დასახელებიდან ფორმულის ჩაწერა, თითო 1 ქ., ბინარული.
  - **33** (3 ქ., 33.1–33.3) — ცხრილის მონაცემებზე მოკლე გამოთვლა/დასკვნა, თითო 1 ქ., ბინარული.
  - **34** (2 ქ.: 34.1 ელექტრონული ბალანსის სქემა — 1 ქ.; 34.2 რეაქცია გათანაბრებულია — 1 ქ.).
  - **35** (2 ქ.) — ორი მისაღები ფორმა (მოლეკულური/იონური განტოლება), **პირობითი წესებით**: ორივე სწორი+გათანაბრებული = 2; ორივე ფორმულურად სწორი, ერთი გაუთანაბრებელი = 1; მხოლოდ ერთი სწორი და გაუთანაბრებელი = 0; შეუძლებელი/არასწორი იონურის შემთხვევაში მაქს. 1 ქ.
  - **36** (4 ქ., 36.1–36.4) — ოთხი დამოუკიდებელი განტოლების სწორად/გათანაბრებულად ჩაწერა, თითო 1 ქ. (35-ის ანალოგიური გაუთანაბრებელი-ნიუანსი — სქემიდან გადამოწმებით).
  - **37** (3 ქ., 37.1–37.3) — რეაქციის პროდუქტის/მექანიზმის ფორმულა, თითო 1 ქ., ბინარული.
  - **38** (3 ქ., 38.1–38.3) — უცნობი ნივთიერებების (X/Y/Z) სტრუქტურული ფორმულები, თითო 1 ქ., ბინარული.
  - **39** (4 ქ.) — მრავალსაფეხურიანი გამოთვლა (ხსნარის კონცენტრაცია + მასური წილი, შემდეგ განეიტრალების მასა), **ეტაპობრივი ნაწილობრივი შეფასებით** (2 ქ. სუბამოცანაზე, 2/1/0 კონკრეტული ლოგიკური პირობებით — ზუსტი ფორმულირება სქემიდან).
  - **40** (4 ქ.) — მეორე გამოთვლა (ორგანული ნაერთის სტრუქტურა წვისა და ბრომირების მონაცემებით), ანალოგიური ეტაპობრივი 4/3/2/1/0 პარციალური შეფასებით.
  - **ჯამი:** 30+3+5+3+2+2+4+3+3+4+4 = **63** ✓

## 2. მონაცემთა მოდელი — `src/data/chemistryExamsData.ts`

```ts
export type ChemistryOptionLabel = "ა" | "ბ" | "გ" | "დ";
export interface ChemistryFigure { src: string; alt: string }
export interface ChemistryMcqQuestion {
  id: string; number: number; prompt: string; // ფორმულები LaTeX-ის მსგავსად (MathText)
  figure?: ChemistryFigure;
  options: { label: ChemistryOptionLabel; text: string }[];
  correctLabel: ChemistryOptionLabel; points: 1;
}
// 31-38: checklist-სტილის დეტერმინისტული კრიტერიუმები
export interface ChemistryFormulaSubItem {
  id: string; prompt?: string; maxPoints: number;
  criteria: { id: string; description: string; points: number; conditionalNote?: string }[];
  acceptedAnswer: string;
}
export interface ChemistryFormulaTask { id: string; number: number; maxPoints: number; subItems: ChemistryFormulaSubItem[] }
// 39-40: სრული გამოთვლა — Math-ის MathOpenProblem-ის იდენტური ფორმა
export interface ChemistryCalculationStep { id: string; description: string; points: number }
export interface ChemistryCalculationProblem {
  id: string; number: number; prompt: string; maxPoints: number; // 4
  steps: ChemistryCalculationStep[];
  scoringTable: { completedSteps: number; awardedPoints: number }[];
  partialCreditNote?: string; modelSolution: string;
}
export interface ChemistryExamVariant {
  variant: number; mcq: ChemistryMcqQuestion[]; formulaTasks: ChemistryFormulaTask[];
  calculationProblems: ChemistryCalculationProblem[]; maxPoints: 63; durationSeconds: 10800;
}
export interface ChemistryExamYear { year: number; variants: ChemistryExamVariant[] }
export function getChemistryExamYears(): ChemistryExamYear[];
export function getChemistryVariant(year: number, variant: number): ChemistryExamVariant | undefined;
```

მონაცემები: `src/data/chemistryExams2025.ts`, ზუსტი ტრანსკრიფციით (ინდექსები/ხარისხები `MathText`/LaTeX სინტაქსით, `mathExamsData.ts`-ის კონვენციით).

## 3. ფიგურების ამოღება

ამოიღეთ ყველა ელექტრონული გარსის დიაგრამა, მოლეკულური სტრუქტურა, პერიოდული ცხრილის ფრაგმენტი, გრაფიკი და ინდიკატორის ფოტო MCQ-დან (1-30) → `public/exam-figures/chemistry/variant-1-2025/qN.png`. ღია ნაწილში (31-40) ვიზუალი ნაკლებია, მაგრამ გადაამოწმეთ — თუ რომელიმე რეაქციის სქემა/მოლეკულა მხოლოდ სურათადაა, ისიც ამოვიღოთ.

## 4. AI-შეფასების არქიტექტურა — ორი განსხვავებული რეჟიმი ერთ საგანში

⚠️ **ეს არის ამ დავალების ყველაზე მნიშვნელოვანი არქიტექტურული გადაწყვეტილება:**

**(ა) 31-38 → `src/lib/ai/chemistry-formula-grader-schema.ts`.** `history-open-answer-grader-schema.ts`/გეოგრაფიის ანალოგიური deterministic checklist-შეფასება — AI განსაზღვრავს, თითოეული `criteria` შესრულდა თუ არა (ქიმიური ფორმულის/დასახელების **ეკვივალენტობის** განსჯით), ქულა სერვერზე გამოითვლება კრიტერიუმების ჯამიდან. `conditionalNote` (35/36-ის „გაუთანაბრებელი“ წესი) პრომპტის ინსტრუქციაში ცალკე უნდა აისახოს.

**(ბ) 39-40 → `src/lib/ai/chemistry-calculation-grader-schema.ts`.** `math-open-problem-grader-schema.ts`-ის **პირდაპირი ანალოგი** — იგივე `scoreFromSteps()`, ეტაპობრივი ლოგიკა, `scoringTable`-ზე დაფუძნებული საბოლოო ქულა.

ორივესთვის: ბარე ფუნქცია + ჰუკი წყვილი (`gradeChemistryFormulaTask`/`useChemistryFormulaGrading`, `gradeChemistryCalculationProblem`/`useChemistryCalculationGrading`), `Promise.all`-თან თავსებადი. ცალკე `pageType` (`page-types.ts`/`page-prompts.ts`/`route.ts`) + ლოკალური fallback ორივესთვის.

## 5. გამოცდის სიმულაცია — `src/components/abiturient/exams/ChemistryExamSimulation.tsx`

`MathExamSimulation.tsx`-ის ანალოგი: `Stage = "mcq" | "open" | "done"`, `reveal={false}` MCQ-ზე, ღია ეტაპზე textarea-ების სია (31-40, თითო თავისი ველით; მარტივი ტექსტური input საკმარისია). `დასრულება`-ზე: MCQ კლიენტზე + `Promise.all`-ში ორივე ტიპის ღია დავალების (31-38 checklist + 39-40 calculation) პარალელური შეფასება. შედეგები: ჯამი/63, აკორდეონები სამ ნაწილზე (MCQ / 31-38 / 39-40), `AnimatePresence`-ით, არსებული `OpenResultRow`/`McqReview`-ის გამოყენებით.

## 6. არქივის რაუტინგი

`PastExamsArchive.tsx`-ში: `if (subjectId === "chemistry") return <ChemistryPastExamsArchive />;` (`MathPastExamsArchive.tsx`-ის ანალოგი, 2025/ვარიანტი 1). Space-ისთვის ცალკე არაფერი — იხ. `claude/subject-space-cleanup-prompt.md`.

## 7. საბოლოო შემოწმების სია

- [ ] ორივე PDF ტრანსკრიბირებული (`chemistryExams2025.ts`) — 30 MCQ + 31-40, სულ 63 ქულა.
- [ ] ყველა ვიზუალი ამოღებული/ჩასმული.
- [ ] 31-38 იყენებს checklist/deterministic გრეიდერს (არა scoreFromSteps-ს); 35/36-ის პირობითი წესი ზუსტად აღწერილი.
- [ ] 39-40 იყენებს Math-ის იდენტურ `scoreFromSteps`-ზე დაფუძნებულ გრეიდერს.
- [ ] გამოცდა გადავადებული შეფასების პატერნზეა.
- [ ] `PastExamsArchive.tsx`-ში `chemistry` ტოტი.
