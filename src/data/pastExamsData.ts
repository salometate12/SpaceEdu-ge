/**
 * National Exams Interactive Archive — structured question bank.
 *
 * The archive is deliberately data-only so new years can be added by
 * dropping another `ExamYear` into `PAST_EXAMS`; no component changes are
 * needed. Nothing here renders an external PDF — every variant is played
 * inside SpaceEdu's native split-screen quiz interface.
 *
 * Content note: all passages are ORIGINAL practice texts written in the
 * style of the national exams (the same convention used by
 * `readingComprehensionData.ts`). They are not transcriptions of official
 * exam papers. Attributed excerpts are public-domain authors, shortened.
 *
 * Typography: Georgian inline quotes use the typographic pair „…“.
 */

import type { ExamCategory } from "@/lib/exam-categories";
import { GEORGIAN_2025 } from "./pastExams2025";

export interface ExamQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  /** Shown in the feedback card after "პასუხის შემოწმება". */
  explanation: string;
  category: ExamCategory;
  /**
   * Exact phrase from `ExamPassage.textExcerpt`. When this question is
   * active — or hovered in the question rail — the trope highlighter
   * illuminates the span in the left reading panel.
   */
  highlightPhrase?: string;
}

/** Part II's writing task — the essay prompt attached to a passage. */
export interface ExamEssayTask {
  id: string;
  points: number;
  prompt: string;
}

/** Part I — "ტექსტის რედაქტირება". A free-writing exercise, not an MCQ. */
export interface ExamEditingTask {
  id: string;
  points: number;
  /** The flawed text the student has to rewrite correctly. */
  text: string;
  /** What the marker is looking for, shown after the student submits. */
  focusPoints: string[];
}

export interface ExamPassage {
  id: string;
  title: string;
  authorOrSource: string;
  textExcerpt: string;
  /** Poems keep their line breaks in the reading panel. */
  kind?: "poem" | "prose";
  questions: ExamQuestion[];
  /** Part II's writing task for this text. */
  essay?: ExamEssayTask;
  /** Shown on the text-choice screen ("ტექსტი I" / "ტექსტი II"). */
  choiceLabel?: string;
}

export interface ExamVariant {
  id: string;
  /** "I ვარიანტი" / "II ვარიანტი" */
  label: string;
  /** Short descriptor shown under the badge. */
  blurb: string;
  /** Part I of the paper, when the variant has one. */
  editingTask?: ExamEditingTask;
  /**
   * True for real national-exam papers, where Part II offers two texts and
   * the student answers on ONE of them. When false/absent the passages run
   * back to back as a single question set.
   */
  choosePassage?: boolean;
  passages: ExamPassage[];
}

export interface ExamYear {
  year: number;
  variants: ExamVariant[];
}

/* -------------------------------------------------------------------------- */
/*                              GEORGIAN ARCHIVE                              */
/* -------------------------------------------------------------------------- */

const GEORGIAN_2024: ExamYear = {
  year: 2024,
  variants: [
    {
      id: "2024-v1",
      label: "I ვარიანტი",
      blurb: "მხატვრული ტექსტი — ტროპები და ქვეტექსტი",
      passages: [
        {
          id: "geo-2024-v1-p1",
          title: "ზამთრის მოლოდინი",
          authorOrSource: "სავარჯიშო ტექსტი (ვაჟა-ფშაველას სტილში)",
          textExcerpt: `მთა დადუმდა და თოვლის თეთრი მოსასხამი მოიგდო მხრებზე. ქარი ხეობაში დაეშვა და ძველი მუხის ტოტებს ჩურჩულით ესაუბრა — თითქოს ძველი მეგობრები დიდი ხნის უნახავები შეხვდნენო.

სოფელში ერთადერთი კვამლი ადიოდა, ის კი ცისკენ მიიწევდა, როგორც გაშვებული თოკი, რომელსაც ვერავინ ეწევა. მოხუცი გუთანთან იდგა და ისე დაღლილი იყო, მთელი მთა რომ დაედო ზურგზე.

„გაზაფხული მოვა“ — თქვა ჩუმად და ჯიუტი იმედი ჩაიდო გულში.`,
          questions: [
            {
              id: "geo-2024-v1-q1",
              category: "personification",
              questionText:
                "რომელი მხატვრული საშუალებაა გამოყენებული წინადადებაში „ქარი ხეობაში დაეშვა და ძველი მუხის ტოტებს ჩურჩულით ესაუბრა“?",
              options: ["შედარება", "გაპიროვნება", "ჰიპერბოლა", "ალეგორია"],
              correctIndex: 1,
              explanation:
                "ქარს — უსულო ბუნებრივ მოვლენას — მიენიჭა ადამიანური მოქმედება („ესაუბრა“, „ჩურჩულით“). ეს გაპიროვნებაა. შედარება ამ მონაკვეთში მოგვიანებით ჩნდება („როგორც გაშვებული თოკი“).",
              highlightPhrase: "ქარი ხეობაში დაეშვა და ძველი მუხის ტოტებს ჩურჩულით ესაუბრა",
            },
            {
              id: "geo-2024-v1-q2",
              category: "simile",
              questionText:
                "„ის კი ცისკენ მიიწევდა, როგორც გაშვებული თოკი“ — რომელ ტროპს ეკუთვნის ეს კონსტრუქცია?",
              options: ["მეტაფორა", "ეპითეტი", "შედარება", "გაპიროვნება"],
              correctIndex: 2,
              explanation:
                "მაკავშირებელი „როგორც“ პირდაპირ აპირისპირებს კვამლს და თოკს. როცა შეპირისპირება ღიად, მაკავშირებლით („როგორც“, „-ვით“, „მსგავსად“) ხდება, ეს შედარებაა და არა მეტაფორა.",
              highlightPhrase: "როგორც გაშვებული თოკი",
            },
            {
              id: "geo-2024-v1-q3",
              category: "hyperbole",
              questionText:
                "„ისე დაღლილი იყო, მთელი მთა რომ დაედო ზურგზე“ — რას აღწევს ავტორი ამ ხერხით?",
              options: [
                "ზუსტად აღწერს მოხუცის ფიზიკურ დატვირთვას.",
                "განზრახ ზვიადებს დაღლილობას მისი სიმძიმის საჩვენებლად.",
                "ადარებს მოხუცს მთის მცხოვრებლებს.",
                "ანიჭებს მთას ადამიანურ თვისებას.",
              ],
              correctIndex: 1,
              explanation:
                "მთის ზურგზე დადება ფიზიკურად შეუძლებელია — ეს განზრახ გაზვიადება, ანუ ჰიპერბოლაა. მისი ფუნქცია დაღლილობის მასშტაბის ემოციური გადმოცემაა.",
              highlightPhrase: "მთელი მთა რომ დაედო ზურგზე",
            },
            {
              id: "geo-2024-v1-q4",
              category: "main_idea",
              questionText: "რა არის ტექსტის მთავარი აზრი?",
              options: [
                "ზამთრის მოახლოებასთან ერთად ადამიანი იმედს არ კარგავს.",
                "სოფელში მოსახლეობა შემცირდა.",
                "მთაში ამინდი მოულოდნელად იცვლება.",
                "მოხუცი გუთნის შეკეთებას აპირებს.",
              ],
              correctIndex: 0,
              explanation:
                "ტექსტი ზამთრის სიმძიმეს („თოვლის მოსასხამი“, დაღლა, ერთადერთი კვამლი) უპირისპირებს ბოლო წინადადების „ჯიუტ იმედს“. სწორედ ეს კონტრასტი ქმნის მთავარ სათქმელს.",
              highlightPhrase: "ჯიუტი იმედი ჩაიდო გულში",
            },
          ],
        },
      ],
    },
    {
      id: "2024-v2",
      label: "II ვარიანტი",
      blurb: "საინფორმაციო ტექსტი — არგუმენტი და ალეგორია",
      passages: [
        {
          id: "geo-2024-v2-p1",
          title: "მდინარე და ქალაქი",
          authorOrSource: "სავარჯიშო ტექსტი (პუბლიცისტური სტილი)",
          textExcerpt: `ყოველი ქალაქი მდინარეს ჰგავს: სანამ დინება თავისუფალია, წყალი თავად იწმინდება; როგორც კი კალაპოტს შეუვიწროვებ, ის ჭაობდება.

ბოლო ათწლეულში ქალაქმა ბეტონის მაღალი კედლები აღმართა იქ, სადაც ადრე ბაღები იყო. ურბანისტები აფრთხილებდნენ: სივრცე, რომელიც სუნთქვას ვერ ახერხებს, ავადმყოფდება.

დღეს ეს გაფრთხილება უკვე რიცხვებშია ჩაწერილი — ჰაერის დაბინძურების მაჩვენებელი სამჯერ გაიზარდა. ეს მშრალი სტატისტიკა ყველაზე მჭევრმეტყველი მოწმეა.`,
          questions: [
            {
              id: "geo-2024-v2-q1",
              category: "allegory",
              questionText:
                "„ყოველი ქალაქი მდინარეს ჰგავს… როგორც კი კალაპოტს შეუვიწროვებ, ის ჭაობდება“ — რა ფუნქცია აქვს ამ ხატს?",
              options: [
                "აღწერს კონკრეტული მდინარის ჰიდროლოგიას.",
                "კონკრეტული ხატით გადმოსცემს აბსტრაქტულ აზრს ქალაქის განვითარებაზე.",
                "ადარებს ორ სხვადასხვა ქალაქს.",
                "ზვიადებს დაბინძურების მასშტაბს.",
              ],
              correctIndex: 1,
              explanation:
                "მდინარის ხატი მთელ ტექსტში გადაშლილი, თანმიმდევრული სახეა, რომელიც აბსტრაქტულ იდეას (თავისუფალი განვითარება vs. ხელოვნური შევიწროება) გამოხატავს — ეს ალეგორიაა. მარტივი შედარებისგან იმით განსხვავდება, რომ ხატი მთელი მსჯელობის საყრდენია.",
              highlightPhrase: "ყოველი ქალაქი მდინარეს ჰგავს",
            },
            {
              id: "geo-2024-v2-q2",
              category: "epithet",
              questionText:
                "„ეს მშრალი სტატისტიკა ყველაზე მჭევრმეტყველი მოწმეა“ — რომელი სიტყვაა ეპითეტი?",
              options: ["სტატისტიკა", "მშრალი", "მოწმე", "გაიზარდა"],
              correctIndex: 1,
              explanation:
                "„მშრალი“ მხატვრული განსაზღვრებაა — ის სტატისტიკას ემოციურ დატვირთვას სძენს და ამავე დროს კონტრასტს ქმნის „მჭევრმეტყველთან“. ეპითეტი სწორედ ასეთი შემფასებელი მსაზღვრელია.",
              highlightPhrase: "მშრალი სტატისტიკა",
            },
            {
              id: "geo-2024-v2-q3",
              category: "implied_meaning",
              questionText: "რა დამოკიდებულება აქვს ავტორს აღწერილი ცვლილებებისადმი?",
              options: [
                "ნეიტრალური — მხოლოდ ფაქტებს გადმოსცემს.",
                "კრიტიკული — ცვლილებებს ზიანის მომტანად მიიჩნევს.",
                "აღტაცებული — განვითარებას მიესალმება.",
                "გულგრილი — შედეგები არ აინტერესებს.",
              ],
              correctIndex: 1,
              explanation:
                "სიტყვები „ავადმყოფდება“, „გაფრთხილება“ და დამამთავრებელი რიცხვი კრიტიკულ შეფასებას ქმნის. ავტორი ფაქტს არგუმენტად იყენებს, არა ნეიტრალურ ინფორმაციად.",
              highlightPhrase: "სივრცე, რომელიც სუნთქვას ვერ ახერხებს, ავადმყოფდება",
            },
          ],
        },
      ],
    },
  ],
};

const GEORGIAN_2023: ExamYear = {
  year: 2023,
  variants: [
    {
      id: "2023-v1",
      label: "I ვარიანტი",
      blurb: "მეტაფორა და ავტორისეული პოზიცია",
      passages: [
        {
          id: "geo-2023-v1-p1",
          title: "მამის სახლი",
          authorOrSource: "სავარჯიშო ტექსტი (მემუარული პროზა)",
          textExcerpt: `მამის სახლი ჩემი მეხსიერების ღუზაა. სადაც არ უნდა წავიდე, თოკი იქითკენ მიწევს.

ბავშვობაში ეზოში ერთი ბებერი კაკალი იდგა; მისი ჩრდილი ზაფხულში მთელ ოჯახს იტევდა. ახლა იმ ადგილას მხოლოდ ქვის წრეა დარჩენილი — ხის ნაფეხურივით.

წლების შემდეგ მივხვდი: სახლი კედლები არაა. სახლი ის ხმებია, რომლებსაც დღემდე ვისმენ, როცა თვალს ვხუჭავ.`,
          questions: [
            {
              id: "geo-2023-v1-q1",
              category: "metaphor",
              questionText:
                "„მამის სახლი ჩემი მეხსიერების ღუზაა“ — რატომ არის ეს მეტაფორა და არა შედარება?",
              options: [
                "იმიტომ რომ იყენებს მაკავშირებელს „როგორც“.",
                "იმიტომ რომ სახლს პირდაპირ, მაკავშირებლის გარეშე უწოდებს ღუზას.",
                "იმიტომ რომ ზვიადებს სახლის მნიშვნელობას.",
                "იმიტომ რომ სახლს ადამიანურ თვისებას ანიჭებს.",
              ],
              correctIndex: 1,
              explanation:
                "მეტაფორაში გადატანა პირდაპირი გაიგივებით ხდება — „სახლი ღუზაა“. თუ ეწერებოდა „სახლი ღუზასავით მიმაგრებს“, ეს უკვე შედარება იქნებოდა.",
              highlightPhrase: "მამის სახლი ჩემი მეხსიერების ღუზაა",
            },
            {
              id: "geo-2023-v1-q2",
              category: "simile",
              questionText:
                "„მხოლოდ ქვის წრეა დარჩენილი — ხის ნაფეხურივით“ — რომელი საშუალებაა გამოყენებული?",
              options: ["გაპიროვნება", "შედარება", "ალეგორია", "ჰიპერბოლა"],
              correctIndex: 1,
              explanation:
                "სუფიქსი „-ვით“ მაკავშირებლის როლს ასრულებს და ქვის წრეს ნაფეხურს უპირისპირებს — კლასიკური შედარება.",
              highlightPhrase: "ხის ნაფეხურივით",
            },
            {
              id: "geo-2023-v1-q3",
              category: "main_idea",
              questionText: "რა დასკვნამდე მიდის მთხრობელი ტექსტის ბოლოს?",
              options: [
                "სახლის ღირებულებას ფიზიკური ნაგებობა კი არა, მეხსიერება და ხმები განსაზღვრავს.",
                "ძველი სახლი უნდა აღდგეს.",
                "კაკლის ხე უნდა დარგულიყო ხელახლა.",
                "ბავშვობა ყოველთვის უფრო ბედნიერია.",
              ],
              correctIndex: 0,
              explanation:
                "ბოლო აბზაცი პირდაპირ აყალიბებს დასკვნას: „სახლი კედლები არაა“. მთელი წინა აღწერა ამ აზრს ამზადებს.",
              highlightPhrase: "სახლი ის ხმებია, რომლებსაც დღემდე ვისმენ",
            },
          ],
        },
      ],
    },
    {
      id: "2023-v2",
      label: "II ვარიანტი",
      blurb: "ტექსტის რედაქტირება და გრამატიკული ნორმა",
      passages: [
        {
          id: "geo-2023-v2-p1",
          title: "წერილი რედაქციას",
          authorOrSource: "სავარჯიშო ტექსტი (ოფიციალური სტილი)",
          textExcerpt: `პატივცემულო რედაქტორო, გიგზავნით შენიშვნებს გასულ ნომერში გამოქვეყნებულ სტატიაზე.

ავტორი წერს, რომ პროექტი „წარმატებით დასრულდა“, თუმცა არცერთი კონკრეტული მაჩვენებელი არ მოჰყავს. ჩემი აზრით, დასკვნა უნდა ეყრდნობოდეს მონაცემებს და არა შთაბეჭდილებას.

გთხოვთ, გაითვალისწინოთ ეს შენიშვნა მომდევნო პუბლიკაციისას.`,
          questions: [
            {
              id: "geo-2023-v2-q1",
              category: "grammar",
              questionText:
                "რომელი ვარიანტია სწორი: „ჩემი აზრით, დასკვნა უნდა ეყრდნობოდეს მონაცემებს“ თუ „…უნდა ეყრდნობოდა მონაცემებს“?",
              options: [
                "„ეყრდნობოდა“ — რადგან წარსულ დროზეა საუბარი.",
                "„ეყრდნობოდეს“ — რადგან „უნდა“ კავშირებითს მოითხოვს.",
                "ორივე ერთნაირად სწორია.",
                "არცერთი — უნდა იყოს „ეყრდნობა“.",
              ],
              correctIndex: 1,
              explanation:
                "ნაწილაკი „უნდა“ ქართულში კავშირებით კილოს მოითხოვს: უნდა ეყრდნობოდეს. „ეყრდნობოდა“ თხრობითი წარსულია და აქ ნორმას არღვევს.",
              highlightPhrase: "დასკვნა უნდა ეყრდნობოდეს მონაცემებს",
            },
            {
              id: "geo-2023-v2-q2",
              category: "implied_meaning",
              questionText: "რას გულისხმობს ავტორი, როცა წერს „არცერთი კონკრეტული მაჩვენებელი არ მოჰყავს“?",
              options: [
                "სტატია ძალიან გრძელი იყო.",
                "სტატიის დასკვნა დაუსაბუთებელია.",
                "ავტორმა ციფრები შეცდომით დაწერა.",
                "პროექტი ჯერ არ დასრულებულა.",
              ],
              correctIndex: 1,
              explanation:
                "ქვეტექსტი ბრალდებაა დაუსაბუთებლობაში: შეფასება არსებობს, მტკიცებულება — არა. ამას ადასტურებს მომდევნო წინადადებაც.",
              highlightPhrase: "არცერთი კონკრეტული მაჩვენებელი არ მოჰყავს",
            },
          ],
        },
      ],
    },
  ],
};

const GEORGIAN_2022: ExamYear = {
  year: 2022,
  variants: [
    {
      id: "2022-v1",
      label: "I ვარიანტი",
      blurb: "პოეტური ტექსტი — ხატი და განწყობა",
      passages: [
        {
          id: "geo-2022-v1-p1",
          title: "შემოდგომის ბაღი",
          authorOrSource: "სავარჯიშო ტექსტი (ლირიკული პროზა)",
          textExcerpt: `ბაღმა ოქროს კაბა ჩაიცვა და დღეებს ითვლის.

ყოველი ფოთოლი პატარა წერილია, რომელსაც ხე მიწას უგზავნის. ქარი ფოსტალიონია — ჩქარობს, არ ელოდება პასუხს.

საღამოს სიჩუმე ისეთი მძიმეა, ხმას რომ ჩაყლაპავს.`,
          questions: [
            {
              id: "geo-2022-v1-q1",
              category: "metaphor",
              questionText: "„ყოველი ფოთოლი პატარა წერილია“ — რომელი ტროპია?",
              options: ["შედარება", "მეტაფორა", "ეპითეტი", "ჰიპერბოლა"],
              correctIndex: 1,
              explanation:
                "ფოთოლი პირდაპირ გაიგივებულია წერილთან, მაკავშირებლის გარეშე — ეს მეტაფორაა. იგივე ხატი ვითარდება მომდევნო წინადადებაში („ქარი ფოსტალიონია“).",
              highlightPhrase: "ყოველი ფოთოლი პატარა წერილია",
            },
            {
              id: "geo-2022-v1-q2",
              category: "personification",
              questionText: "„ბაღმა ოქროს კაბა ჩაიცვა და დღეებს ითვლის“ — რას ეფუძნება ეს ხატი?",
              options: [
                "ბაღისთვის ადამიანური მოქმედების მინიჭებას.",
                "ბაღის ზომის გაზვიადებას.",
                "ორი ბაღის შედარებას.",
                "ბაღის ზუსტ აღწერას.",
              ],
              correctIndex: 0,
              explanation:
                "„ჩაიცვა“ და „ითვლის“ ადამიანის მოქმედებებია, ბაღზე გადატანილი — გაპიროვნება. „ოქროს კაბა“ კი ამავე დროს ეპითეტურ-მეტაფორული სახეა.",
              highlightPhrase: "ბაღმა ოქროს კაბა ჩაიცვა და დღეებს ითვლის",
            },
            {
              id: "geo-2022-v1-q3",
              category: "hyperbole",
              questionText: "„სიჩუმე ისეთი მძიმეა, ხმას რომ ჩაყლაპავს“ — რა ხერხია გამოყენებული?",
              options: ["ალეგორია", "ეპითეტი", "ჰიპერბოლა", "შედარება"],
              correctIndex: 2,
              explanation:
                "სიჩუმეს ხმის „ჩაყლაპვა“ არ შეუძლია — განზრახ გაზვიადება განწყობის სიმძაფრეს ქმნის. ეს ჰიპერბოლაა.",
              highlightPhrase: "ხმას რომ ჩაყლაპავს",
            },
          ],
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                              HISTORY ARCHIVE                               */
/* -------------------------------------------------------------------------- */

const HISTORY_2024: ExamYear = {
  year: 2024,
  variants: [
    {
      id: "2024-v1",
      label: "I ვარიანტი",
      blurb: "წყაროს ანალიზი — შუა საუკუნეები",
      passages: [
        {
          id: "hist-2024-v1-p1",
          title: "ქრონიკის ფრაგმენტი",
          authorOrSource: "სავარჯიშო ტექსტი (ქრონიკის სტილიზაცია)",
          textExcerpt: `მეფემ ბრძანა, რომ ყოველ ხეობაში აეშენებინათ ციხე და გზები დაეკავშირებინათ ერთმანეთისთვის.

მემატიანე წერს: „ვაჭარმა უშიშრად გაიარა იქ, სადაც წინათ ღამით ვერავინ ბედავდა სიარულს“.

ამ დროიდან ხაზინის შემოსავალი გაიზარდა, ხოლო მონასტრებმა ახალი წიგნების გადაწერა დაიწყეს.`,
          questions: [
            {
              id: "hist-2024-v1-q1",
              category: "implied_meaning",
              questionText: "რაზე მიუთითებს ვაჭრის უსაფრთხო გადაადგილება წყაროში?",
              options: [
                "ვაჭრობის შემცირებაზე.",
                "ცენტრალური ხელისუფლების გაძლიერებასა და გზების უსაფრთხოებაზე.",
                "მონასტრების დაკეტვაზე.",
                "ხეობების დაცარიელებაზე.",
              ],
              correctIndex: 1,
              explanation:
                "მემატიანის დეტალი — ადრე სახიფათო გზაზე უშიშარი მოძრაობა — არის ირიბი მტკიცებულება ცენტრალიზაციისა და შიდა უსაფრთხოების გაუმჯობესების შესახებ.",
              highlightPhrase: "ვაჭარმა უშიშრად გაიარა იქ, სადაც წინათ ღამით ვერავინ ბედავდა სიარულს",
            },
            {
              id: "hist-2024-v1-q2",
              category: "main_idea",
              questionText: "რა კავშირს ავლენს ტექსტი ინფრასტრუქტურასა და კულტურას შორის?",
              options: [
                "კულტურული აღმავლობა ეკონომიკური სტაბილურობის შედეგია.",
                "ციხეების მშენებლობამ წიგნების გადაწერა შეაფერხა.",
                "მონასტრები ვაჭრობას ეწინააღმდეგებოდნენ.",
                "ხაზინის შემოსავალი კულტურაზე არ აისახა.",
              ],
              correctIndex: 0,
              explanation:
                "ტექსტი თანმიმდევრობას აჩვენებს: უსაფრთხოება → ვაჭრობა → შემოსავალი → წიგნების გადაწერა. ეს მიზეზ-შედეგობრივი ჯაჭვია.",
              highlightPhrase: "მონასტრებმა ახალი წიგნების გადაწერა დაიწყეს",
            },
          ],
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                                  REGISTRY                                  */
/* -------------------------------------------------------------------------- */

export const PAST_EXAMS: Record<string, ExamYear[]> = {
  georgian: [GEORGIAN_2025, GEORGIAN_2024, GEORGIAN_2023, GEORGIAN_2022],
  history: [HISTORY_2024],
};

export function getExamYears(subjectId: string): ExamYear[] {
  return PAST_EXAMS[subjectId] ?? [];
}

export function hasPastExams(subjectId: string): boolean {
  return getExamYears(subjectId).length > 0;
}

export function getExamVariant(
  subjectId: string,
  year: number,
  variantId: string,
): ExamVariant | null {
  const match = getExamYears(subjectId).find((entry) => entry.year === year);
  return match?.variants.find((variant) => variant.id === variantId) ?? null;
}

/** Flattens a variant into a single ordered question run, keeping the
 * owning passage alongside each question so the reading panel can follow. */
export interface ExamRunStep {
  passage: ExamPassage;
  question: ExamQuestion;
}

export function buildExamRun(variant: ExamVariant): ExamRunStep[] {
  return variant.passages.flatMap((passage) =>
    passage.questions.map((question) => ({ passage, question })),
  );
}

export function countVariantQuestions(variant: ExamVariant): number {
  return variant.passages.reduce((sum, passage) => sum + passage.questions.length, 0);
}
