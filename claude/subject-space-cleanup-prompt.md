# პრომპტი: Space-გვერდების გამარტივება — მხოლოდ არქივი ყველგან, გარდა ქართულისა

⚠️ სუპერსედს (replaces) წინა დავალებას `claude/math-history-space-page-prompt.md`-ში: იქ მათემატიკასა და ისტორიას საკუთარი პრაქტიკის ბარათები დაემატა (`MathSubjectHub`, `HistorySubjectHub`, `mcq-practice`, `open-practice`, `reading-comprehension`, `history/essay-practice`). ეს დავალება აუქმებს იმ გადაწყვეტილებას და მოითხოვს ამ ბარათების მოშორებას — მომხმარებელმა გადაწყვიტა, რომ ამგვარი დამოუკიდებელი (დროის ლიმიტის გარეშე) სავარჯიშო და თავისუფალი ესეს შემფასებელი მხოლოდ ქართულს უნდა ჰქონდეს.

დაწერილია კოდბაზის ამჟამინდელი მდგომარეობის შესწავლის შემდეგ (`SubjectSpacePage.tsx`, `GeorgianSubjectHub.tsx`, `MathSubjectHub.tsx`, `HistorySubjectHub.tsx`, `EnglishSubjectHub.tsx`, `src/app/subject/[id]/essay-grader/page.tsx`, `src/app/subject/[id]/space/page.tsx`, `PastExamsArchive.tsx`).

## 0. მომხმარებლის მოთხოვნა (ზუსტად)
„დამიწერე პრომპტი რომ მოაშოროს ყველა საგნიდან კითხვების პანელი და flashcards ბარათები და მხოლოდ დატოვოს არქივი სფეისი ესეს შემფასებელი მხოლოდ ქართულს უნდა ჰქონდეს და სავარჯიშო.“

ანუ:

1. ყველა საგნის Space-გვერდიდან (`/subject/<id>/space`) მოშორდეს „ტესტების ბანკი“ (quiz bank, `/quiz`-ზე მიმავალი ბარათი) და „ფლეშ ბარათები“ (flashcards, `/deck/...`-ზე მიმავალი ბარათი).
2. Space-გვერდზე დარჩეს მხოლოდ არქივის (იმიტირებული გამოცდის, `past-exams`) შესვლის წერტილი.
3. „სავარჯიშო“ (დროის ლიმიტის გარეშე, ცალკეული კითხვა/დავალება, დაუყოვნებელი პასუხის გამოვლენით — ის, რაც `TextEditingExercise`/`ReadingComprehensionExercise`/`EssayTopicPractice`/`MathMcqPractice`/`MathOpenPractice`/`HistoryReadingPractice`/`HistoryWritingPractice` ტიპის კომპონენტებია) დარჩეს მხოლოდ ქართულს.
4. „ესეს შემფასებელი“ (თავისუფალი, ტესტისგან დამოუკიდებელი ესეს/თემის AI-შეფასების ხელსაწყო, `EssayGrader.tsx`) დარჩეს მხოლოდ ქართულს.

⚠️ რაც არ იცვლება — ეს კრიტიკულია, ნუ წაშლით შეცდომით: სრული იმიტირებული გამოცდის (`past-exams` არქივის) შიგნით არსებული AI-შეფასების ლოგიკა — ანუ `MathExamSimulation`/`HistoryExamSimulation`/`EnglishExamSimulation`/`ExamSimulation`-ის შიგნით მოთავსებული ღია ამოცანების/დავალებების/ესეს შეფასება გამოცდის დასრულებისას — რჩება ხელუხლებელი ყველა საგანზე (მათ შორის მათემატიკა, ისტორია, ინგლისური, და ახლადგეგმილი გეოგრაფია/სამოქალაქო/ქიმია). ეს დავალება მხოლოდ დამოუკიდებელ, გამოცდისგან გარეთ არსებულ სავარჯიშო/შემფასებელ ხელსაწყოებზეა — არა არქივის შიდა შეფასების მექანიზმზე.

## 1. კოდის ამჟამინდელი მდგომარეობა (დადასტურებული)

* `src/app/subject/[id]/space/page.tsx`-ის `BESPOKE_SPACE_HUBS = new Set(["georgian", "math", "history"])` — ანუ math და history ამჟამად საკუთარ სტატიკურ route-ს იყენებენ (`src/app/subject/math/space/page.tsx` → `MathSubjectHub`, `src/app/subject/history/space/page.tsx` → `HistorySubjectHub`), დანარჩენი 4 საგანი (`english`, `geography`, `civics`, `chemistry`) კი ზოგად `SubjectSpacePage`-ს ავლენს — სადაც ამჟამად სწორედ „ტესტების ბანკი“ + „ფლეშ ბარათები“ + „მალე დაემატება“ ბლოკია.
* `EnglishSubjectHub.tsx` არსებობს კოდში, მაგრამ არცერთ route-ს არ არის მიბმული (არ არის `BESPOKE_SPACE_HUBS`-ში და არ არსებობს `src/app/subject/english/space/page.tsx`) — ანუ უკვე „მკვდარი“ კომპონენტია, უბრალოდ წასაშლელია.
* `src/app/subject/[id]/essay-grader/page.tsx`-ის `generateStaticParams` აბრუნებს `SUBJECT_HUB_IDS.filter((id) => id !== "georgian")` — ანუ ამჟამად ყველა საგანს გარდა ქართულისა აქვს დამოუკიდებელი, თავისუფალი-თემის ესეს შემფასებელი (`EssayGrader.tsx`) — ეს ზუსტად საწინააღმდეგოა იმისა, რაც მომხმარებელს სურს. ქართულს ცალკე, სტატიკური route აქვს (`src/app/subject/georgian/essay-grader/page.tsx` → `<EssayGrader subjectId="georgian" />`) — ეს უცვლელად რჩება.

> ⚠️ განახლება (ამ პრომპტის შენახვის მომენტისთვის): მას შემდეგ, რაც ეს პრომპტი დაიწერა, `EnglishSubjectHub` **უკვე დაკავშირდა** ცოცხალ route-თან (`src/app/subject/english/space/page.tsx` შეიქმნა, `english` დაემატა `BESPOKE_SPACE_HUBS`-ს) და დაემატა English-ის სავარჯიშო გვერდები (`/subject/english/task-practice`, `/subject/english/writing-practice`) + `EnglishTaskPractice`/`EnglishWritingPractice` + `src/lib/english-past-paper-practice.ts`. ამ cleanup-ის შესრულებისას ეს ფაილებიც უნდა წაიშალოს (ან English დაბრუნდეს ზოგად `SubjectSpacePage`-ზე).

## 2. საჭირო ცვლილებები

### 2.1. `SubjectSpacePage.tsx` — გამარტივება ერთადერთ „არქივის“ ბარათამდე
`src/components/abiturient/SubjectSpacePage.tsx`-ში:

* ამოშალეთ ორივე `ModuleCard` — „ტესტების ბანკი“ (`/quiz`) და „ფლეშ ბარათები“ (`flashcardHref`).
* ამოშალეთ „მალე დაემატება“ ტიზერ-სექცია მთლიანად (`Sparkles`-იანი ბლოკი).
* მის ნაცვლად დაამატეთ ერთი, ვიზუალურად თანასწორი ბარათი/CTA, რომელიც პირდაპირ მიდის `/subject/${subjectId}/past-exams`-ზე. სათაური „წინა წლების საარქივო ტესტები“ ან მსგავსი, აღწერა „გაიარე რეალური, წინა წლების საგამოცდო ვარიანტები დროზე გათვლილი იმიტირებული გამოცდის რეჟიმში.“, ღილაკი „არქივის გახსნა“.
* `flashcardHref` ჰელპერი და `cardsHref`/`deckId`-ზე დამოკიდებულება ამოღებულ იქნას, თუ აღარსად აღარ გამოიყენება (გადაამოწმეთ `grep`-ით).
* ჰედერი და გვერდის ჩარჩო უცვლელად რჩება.

### 2.2. Math და History — მოშორება საკუთარი „სავარჯიშო“ ჰაბებისა

* წაშალეთ `src/app/subject/math/space/page.tsx` და `src/app/subject/history/space/page.tsx`.
* განაახლეთ `BESPOKE_SPACE_HUBS`, დარჩეს მხოლოდ `new Set(["georgian"])`.
* `grep -r "MathSubjectHub\|HistorySubjectHub\|EnglishSubjectHub"` — თუ აღარსად არ არის იმპორტირებული, წაშალეთ ფაილებიც.
* წაშალეთ ახლა-მიუწვდომელი „სავარჯიშო“ route-ები და კომპონენტები (grep-ით გადამოწმებით):
   * `src/app/subject/math/mcq-practice/`, `src/app/subject/math/open-practice/` + `MathMcqPractice`/`MathOpenPractice` (+ Loader-ები).
   * `src/app/subject/history/reading-comprehension/`, `src/app/subject/history/essay-practice/` + `HistoryReadingPractice`/`HistoryWritingPractice` (+ Loader-ები).
   * `src/app/subject/english/task-practice/`, `src/app/subject/english/writing-practice/` + `EnglishTaskPractice`/`EnglishWritingPractice` (+ Loader-ები) + `src/lib/english-past-paper-practice.ts`.
   * `src/lib/math-past-paper-practice.ts`, `src/lib/history-past-paper-practice.ts` — მხოლოდ თუ არსად სხვაგან არ გამოიყენება. თუ გაურკვეველია — დატოვეთ.

### 2.3. თავისუფალი ესეს შემფასებლის შეზღუდვა მხოლოდ ქართულზე

* წაშალეთ მთლიანად `src/app/subject/[id]/essay-grader/` დინამიური route. ქართულის საკუთარი სტატიკური route უცვლელად რჩება.
* `EssayGrader.tsx` არ წაიშალოს.
* `grep -r "/essay-grader"` — non-georgian ბმულები ამოშალეთ ან დამალეთ (`if (subjectId === "georgian") ...`).

## 3. რა რჩება უცვლელი

* `GeorgianSubjectHub.tsx` და `/subject/georgian/space` — 3 ბარათი + ესეს შემფასებელი — სრულად უცვლელი.
* `PastExamsArchive.tsx` და ყველა შვილობილი არქივი — სრულად უცვლელი, შიდა AI-შეფასების ლოგიკის ჩათვლით.
* `/quiz` და `/deck/...` გვერდები — მხოლოდ Space-იდან ბმულები შორდება.

## 4. საბოლოო შემოწმების სია

* [ ] ყველა non-georgian Space-გვერდი აჩვენებს გამარტივებულ „მხოლოდ არქივი“ გვერდს.
* [ ] `/subject/georgian/space` სრულად უცვლელი.
* [ ] non-georgian `/essay-grader` 404-დება; `/subject/georgian/essay-grader` მუშაობს.
* [ ] წაშლილი practice route-ები აღარ არსებობს.
* [ ] `npm run build` გადის — არსად dangling `<Link>` (`grep -r "essay-grader\|mcq-practice\|open-practice\|reading-comprehension\|essay-practice\|task-practice\|writing-practice" src/`).
* [ ] ყველა საგნის არქივის შიდა (`past-exams`) AI-შეფასება უცვლელად მუშაობს.
