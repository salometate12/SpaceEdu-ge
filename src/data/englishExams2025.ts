/**
 * English — 2025 real national exam (ერთიანი ეროვნული გამოცდები, ინგლისური ენა,
 * ივლისი 2025). Transcribed verbatim from the NAEC booklets and answer key in
 * `docs/exam-sources/english/`. See `englishExamsData.ts` for the content/rights
 * note and the shape of every field.
 *
 * Variant I is complete. Variants II–IV are added the same way.
 */

import type {
  EnglishExamVariant,
  EnglishExamYear,
  EnglishItem,
  EnglishOption,
  EnglishTask,
} from "./englishExamsData";

/* ------------------------------- helpers --------------------------------- */

const LETTERS = "ABCDEFGHIJKLMN".split("");

/** A standalone item (Task 1/3/5): its own A–D (or A–B…) options. */
function standaloneItem(
  taskId: string,
  number: number,
  prompt: string,
  optionTexts: string[],
  correctLabel: string,
  explanation: string,
): EnglishItem {
  return {
    id: `${taskId}-q${number}`,
    number,
    prompt,
    options: optionTexts.map((text, i) => ({ label: LETTERS[i], text })),
    correctLabel,
    explanation,
  };
}

/** A matching item (Task 2/4/6): shares the task's bank of options. */
function matchingItem(
  taskId: string,
  number: number,
  prompt: string,
  bank: EnglishOption[],
  correctLabel: string,
  explanation: string,
): EnglishItem {
  return { id: `${taskId}-q${number}`, number, prompt, options: bank, correctLabel, explanation };
}

/* ============================== VARIANT I =============================== */

const V1_TASK1: EnglishTask = {
  id: "eng-2025-v1-t1",
  number: 1,
  kind: "listening",
  title: "Listening",
  instruction:
    "Listen to the text and for each question mark the correct answer A, B, C or D. You now have 40 seconds to look through the task. You will then hear the recording twice. (8 points)",
  points: 8,
  audioSrc: "/exam-audio/english/variant-1-2025.mp3",
  playsAllowed: 2,
  items: [
    standaloneItem("eng-2025-v1-t1", 1, "What is the lecture about?", [
      "The city of Oxford.",
      "One of the universities.",
      "British education system.",
      "Examination system in Oxford.",
    ], "B", "ლექცია ეთმობა ერთ კონკრეტულ უნივერსიტეტს — ოქსფორდის უნივერსიტეტს, არა ქალაქს ან მთლიან სისტემას."),
    standaloneItem("eng-2025-v1-t1", 2, "Which is the oldest university in the world?", [
      "The University of Cambridge.",
      "The University of Oxford.",
      "The University of St Andrews.",
      "The University of Bologna.",
    ], "D", "მსოფლიოში უძველესი უნივერსიტეტი ბოლონიის უნივერსიტეტია (დაარსდა 1088 წელს)."),
    standaloneItem("eng-2025-v1-t1", 3, "Oxford University grew rapidly in the 12th century because", [
      "it was popular among British people.",
      "it consisted of independent colleges.",
      "the king made a specific decision.",
      "students liked studying there.",
    ], "C", "ჩანაწერის მიხედვით, ოქსფორდის სწრაფი ზრდა მეფის კონკრეტულმა გადაწყვეტილებამ განაპირობა."),
    standaloneItem("eng-2025-v1-t1", 4, "What does the speaker say about the Department of Biology?", [
      "It is the newest.",
      "It is the oldest.",
      "It is the largest.",
      "It is the best.",
    ], "A", "მომხსენებლის თქმით, ბიოლოგიის დეპარტამენტი ყველაზე ახალია."),
    standaloneItem("eng-2025-v1-t1", 5, "Why do students meet with their tutor at Oxford University?", [
      "To learn more about university life.",
      "To get advice on their subject.",
      "To discuss personal matters.",
      "To meet other students.",
    ], "B", "ტუტორთან შეხვედრის მიზანი საგანთან დაკავშირებული რჩევის მიღებაა."),
    standaloneItem("eng-2025-v1-t1", 6, "The number 3,300 is mentioned in relation to", [
      "the students studying at Oxford.",
      "the population of the city of Oxford.",
      "the places for undergraduate students.",
      "the students graduating from Oxford each year.",
    ], "C", "რიცხვი 3,300 ბაკალავრიატის სტუდენტთა ადგილების რაოდენობას უკავშირდება."),
    standaloneItem("eng-2025-v1-t1", 7, "What do we learn about the Bodleian Library?", [
      "It has fewer printed items than the British Library.",
      "It has rare documents only from Britain.",
      "Its foundation year is not known.",
      "It is the largest library in Britain.",
    ], "A", "ბოდლის ბიბლიოთეკას ბრიტანეთის ბიბლიოთეკაზე ნაკლები ბეჭდური ერთეული აქვს."),
    standaloneItem("eng-2025-v1-t1", 8, "From the recording we learn that Marjory Wardrop", [
      "was a British diplomat.",
      "collected 1,454 items for the library.",
      "translated a Georgian poem into English.",
      "published a Georgian poem.",
    ], "C", "მარჯორი უორდროპმა ქართული პოემა (რუსთაველის „ვეფხისტყაოსანი“) ინგლისურად თარგმნა."),
  ],
};

const V1_T2_PARAGRAPHS = [
  { label: "A", text: "One of the most interesting authors of the 20th century, J.R.R. Tolkien became famous through his very creative fantasy novel The Lord of the Rings, which is still read and enjoyed worldwide. Tolkien was born in Bloemfontein, an Afrikaans-speaking area of South Africa, in 1892. After the death of his father, four-year-old Tolkien, with his mother and younger brother, moved to England and settled near Birmingham. Tolkien later attended Oxford University. After serving in World War I, he became a professor of Anglo-Saxon and English Language and Literature at Oxford University." },
  { label: "B", text: "The three books of The Lord of the Rings were written between 1936 and 1949. It took Tolkien so many years to complete the novel due to his duties as a professor and the problems caused by World War II. The novel is about a battle between good and evil trying to get a magical ring that has the power to rule the world. The books were published in 1965 and they soon became very popular, especially among young people. By the late 1960s, about twenty years after this unusual novel was written, young people had become interested in the mythology and legends Tolkien had created and started to study them." },
  { label: "C", text: "The Lord of the Rings is set in a world called Middle Earth, populated by good and evil creatures - dwarves, elves, monsters, wizards and some humans. The author created a large number of characters, each with a distinct and unique personality. He based these characters on mythological tales from Greece and Northern Europe, creating a fantasy world with its own unique and magic history, geography, culture and language. The novel is so rich in characters and so full of unusual facts that it can be hard to understand without careful attention from readers." },
  { label: "D", text: "People often ask whether Ethiopia, a country in Africa, had influenced Tolkien's creation of Middle Earth. That's what some writers and Lord of the Rings bloggers think. Their theory is based on the fact that so many of the place names in this classic fantasy are surprisingly similar to the names of Ethiopian places, like Gondor in the novel and Gondar in Ethiopia. Despite the fact that Tolkien never visited this country, his African birthplace inspired parts of the novel, even though he lived in England while writing it." },
  { label: "E", text: "Many readers and scholars have analysed J.R.R. Tolkien's works, particularly The Lord of the Rings, and have tried to connect them with his real-life experiences from both World War I and World War II. However, the author never agreed with this opinion. He stated that during his university years his main goal was to create myths and legends about elves and their languages. The novel mentions several invented languages, but only two of them are well-described by the author. They are Quenya and Sindarin - both used by the elves. Tolkien was very careful with inventing a new language and paid a lot of attention to its every detail." },
  { label: "F", text: "The production of The Lord of the Rings film series, directed by Peter Jackson, was both a big challenge and a huge success. All three films were shot at the same time in Peter Jackson's native New Zealand and were shown in the movie theatres between 2001 and 2003. The series won numerous prestigious awards and is considered one of the most influential film series ever made. Disney Studios refused to produce an animated version of the novel, noting that it would be very expensive to make. In fact, the real reason was the fact that Tolkien found Walt Disney's movies 'terrible' and didn't want to 'let Disney touch The Lord of the Rings'. This shows how much Tolkien wanted to protect his story." },
];

const V1_T2_BANK: EnglishOption[] = V1_T2_PARAGRAPHS.map((p) => ({
  label: p.label,
  text: `Paragraph ${p.label}`,
}));

const V1_TASK2: EnglishTask = {
  id: "eng-2025-v1-t2",
  number: 2,
  kind: "matching",
  title: "Reading — matching",
  instruction:
    "Read the questions (1-8) and find the answers to them in the paragraphs (A-F) of the text. Some paragraphs correspond to more than one question. (8 points)",
  points: 8,
  paragraphs: V1_T2_PARAGRAPHS,
  bank: V1_T2_BANK,
  items: [
    matchingItem("eng-2025-v1-t2", 1, "Which paragraph specifies why it took the author so long to write The Lord of the Rings?", V1_T2_BANK, "B", "აბზაცი B ხსნის, რომ რომანის დასრულებას წლები დასჭირდა პროფესორის მოვალეობებისა და მეორე მსოფლიო ომის გამო."),
    matchingItem("eng-2025-v1-t2", 2, "Which paragraph lists the creatures who live in Middle Earth?", V1_T2_BANK, "C", "აბზაცი C ჩამოთვლის შუახმელეთის არსებებს — ჯუჯებს, ელფებს, ურჩხულებს, ჯადოქრებს და ადამიანებს."),
    matchingItem("eng-2025-v1-t2", 3, "Which paragraph says that the names of some places in the novel are related to real locations?", V1_T2_BANK, "D", "აბზაცი D აღნიშნავს, რომ რომანის ზოგი ადგილის სახელი ეთიოპიის რეალურ ადგილებს ჰგავს (Gondor / Gondar)."),
    matchingItem("eng-2025-v1-t2", 4, "Which paragraph mentions Tolkien's educational background?", V1_T2_BANK, "A", "აბზაცი A ახსენებს, რომ ტოლკინი ოქსფორდის უნივერსიტეტში სწავლობდა."),
    matchingItem("eng-2025-v1-t2", 5, "Which paragraph states the reason why an animated version of Tolkien's novel was not made?", V1_T2_BANK, "F", "აბზაცი F ხსნის, რომ ანიმაცია არ შეიქმნა, რადგან ტოლკინს დისნეის ფილმები არ მოსწონდა."),
    matchingItem("eng-2025-v1-t2", 6, "Which paragraph names the countries' mythology which helped Tolkien to create his characters?", V1_T2_BANK, "C", "აბზაცი C ასახელებს საბერძნეთისა და ჩრდილოეთ ევროპის მითოლოგიას, რომელზეც პერსონაჟები დაფუძნდა."),
    matchingItem("eng-2025-v1-t2", 7, "Which paragraph could have the title 'The languages spoken by elves'?", V1_T2_BANK, "E", "აბზაცი E ეხება ელფების ენებს — Quenya-სა და Sindarin-ს."),
    matchingItem("eng-2025-v1-t2", 8, "Which paragraph could have the title: 'Africa - a big inspiration'?", V1_T2_BANK, "D", "აბზაცი D აღნიშნავს, რომ ტოლკინის აფრიკულმა დაბადების ადგილმა შთააგონა რომანის ნაწილები."),
  ],
};

const V1_TASK3: EnglishTask = {
  id: "eng-2025-v1-t3",
  number: 3,
  kind: "reading",
  title: "Reading",
  instruction:
    "Read the text and the questions which follow. For each question mark the correct answer (A, B, C or D). (8 points)",
  points: 8,
  passageText: `This is a personal story told by Daniel Smithson, an American student.

When I graduated from high school in a small town in Texas, USA, it felt like the end of an era. I had spent the last four years of high school studying doing sports and hanging out with friends. But now, all of that was behind me. As I stood on stage in my cap and gown, shaking hands with the school principal and receiving my diploma, I couldn't help but feel excited and nervous about what was coming next – university. I had always dreamed of going to university, and after months of sending applications and waiting, I finally received an acceptance letter from the Massachusetts Institute of Technology, or MIT, one of the top universities in the country. It was a real surprise for me. I knew that getting into MIT would be incredibly hard as a lot of young people try to get accepted there. I could hardly believe it! What fascinated me was the fact that MIT, like no other university, encourages students to conduct research or participate in it. I really liked this idea! I also discovered through their website that MIT is known for its strong programmes in political science and urban studies – two areas I could choose as electives.

As summer passed and the start of the academic year approached, I began to feel anxious. I was excited about the opportunities ahead, but the idea of moving hundreds of miles away to a city where I knew no one stressed me out. I'd lived in the same small town my entire life, surrounded by familiar faces and places. My parents were incredibly supportive, reminding me that feeling nervous before such a big change is normal. My mom, in particular, seemed to understand exactly how I felt. 'It's okay to be scared,' she told me one evening as I was packing my suitcase. 'But this is your chance to explore new things, meet new people and grow into the person you're meant to be.' To calm my nerves, I spent time researching my future university. I knew well it was very prestigious, but I took a risk of applying there because of its reputation for engineering - the exact field I wanted to follow. On their website I looked up clubs and nearby hangout places. I even reached out to a few fellow students who would be living in the same dorm. Slowly, my excitement began to overshadow my fear.

The day I left for university was emotional. I hugged my parents tightly before loading my bags into the car. When I arrived, I saw that the campus was even more beautiful than I had imagined - wide green lawns, tall red brick buildings and students bustling everywhere. During orientation week I met other first-year students who were just as nervous as I was. We talked about our majors, where we were from and what we hoped to achieve. As we laughed and shared our stories, I began to feel more at ease. What helped me relax was realising that I wasn't alone - everyone was going through the same emotions. By the end of the first week, I realised that while it was hard to leave home, it was also exciting to begin this new chapter of life. I still missed my family, but I knew this was where I needed to be. University was going to be an adventure and for the first time in weeks, I felt ready for it.`,
  items: [
    standaloneItem("eng-2025-v1-t3", 1, "Why was Daniel surprised when he received the acceptance letter from MIT?", [
      "He knew many other people were applying.",
      "He was sure he wouldn't be accepted.",
      "He had never dreamt of going there.",
      "He had never heard of MIT.",
    ], "A", "დანიელი გაოცდა, რადგან იცოდა, რომ MIT-ში მოხვედრა ძალიან რთულია — ბევრი ახალგაზრდა ცდილობს იქ ჩაბარებას."),
    standaloneItem("eng-2025-v1-t3", 2, "What do we learn about the political science and urban studies programmes?", [
      "Daniel wants to do research in them.",
      "Daniel has no interest in studying them.",
      "Daniel could take them as electives at MIT.",
      "They are Daniel's main areas of interest.",
    ], "C", "ტექსტში ნათქვამია, რომ MIT-ში ეს პროგრამები დანიელს არჩევით საგნებად შეეძლო აეღო."),
    standaloneItem("eng-2025-v1-t3", 3, "Why did Daniel feel nervous about moving to another city?", [
      "He doubted his academic abilities.",
      "He didn't want to leave his parents.",
      "He worried about making new friends.",
      "He was moving to a completely new place.",
    ], "D", "დანიელი ნერვიულობდა, რადგან მთელი ცხოვრება ერთ პატარა ქალაქში ცხოვრობდა და სრულიად ახალ ადგილას გადადიოდა."),
    standaloneItem("eng-2025-v1-t3", 4, "When Daniel's mother spoke to him, she sounded", [
      "indifferent.",
      "confused.",
      "supportive.",
      "emotional.",
    ], "C", "დედის სიტყვები („ეს შენი შანსია...“) მხარდამჭერი ტონისაა."),
    standaloneItem("eng-2025-v1-t3", 5, "What was the main reason Daniel applied to MIT?", [
      "Its location in a large city.",
      "Its reputation in a specific field.",
      "Its students' social life.",
      "His interest in university life.",
    ], "B", "დანიელმა MIT-ს მიმართა მისი კონკრეტულ სფეროში (ინჟინერიაში) რეპუტაციის გამო."),
    standaloneItem("eng-2025-v1-t3", 6, "How did Daniel overcome his nervousness during the orientation week?", [
      "He spent more time on social media.",
      "He shared his personal story with his family.",
      "He took long walks around the University campus.",
      "He realised that other students felt the same way.",
    ], "D", "დანიელი დამშვიდდა, როცა მიხვდა, რომ სხვა სტუდენტებიც იმავეს განიცდიდნენ."),
    standaloneItem("eng-2025-v1-t3", 7, "By the end of the first week at university, Daniel felt", [
      "ready for the new adventure.",
      "uncertain about his decision.",
      "eager to go back home.",
      "overtired by the workload.",
    ], "A", "პირველი კვირის ბოლოს დანიელი მზად იყო ახალი თავგადასავლისთვის."),
    standaloneItem("eng-2025-v1-t3", 8, "Which of the following would be the best title for the text?", [
      "Family first",
      "A step into a grown-up life",
      "How to overcome laziness",
      "How to make friends",
    ], "B", "ტექსტი ზრდასრულ ცხოვრებაში გადადგმულ ნაბიჯზეა — უნივერსიტეტში წასვლა და დამოუკიდებლობა."),
  ],
};

const V1_T4_BANK: EnglishOption[] = [
  { label: "A", text: "anything" },
  { label: "B", text: "boat" },
  { label: "C", text: "depth" },
  { label: "D", text: "drowns" },
  { label: "E", text: "gave" },
  { label: "F", text: "grab" },
  { label: "G", text: "gratitude" },
  { label: "H", text: "hit" },
  { label: "I", text: "net" },
  { label: "J", text: "realised" },
  { label: "K", text: "role" },
  { label: "L", text: "something" },
  { label: "M", text: "surface" },
  { label: "N", text: "surprise" },
];

const V1_TASK4: EnglishTask = {
  id: "eng-2025-v1-t4",
  number: 4,
  kind: "vocabulary",
  title: "Vocabulary",
  instruction:
    "Read the text and fill the gaps with the words given (A-N). Use each word only once. Two words are extra. (12 points)",
  points: 12,
  bank: V1_T4_BANK,
  sharedText: `An Italian diver rescued a dolphin

Once the famous Italian freediver Enzo Mallorca jumped from a boat into the sea of Syracuse, a historic city in Italy. Meanwhile, his daughter Rossana stayed on the __(1)__. Ready to go deep into the water, Enzo felt that something slightly __(2)__ his back. He turned and saw a dolphin. Then he __(3)__ that the dolphin did not want to play but tried to communicate __(4)__. The animal dove into the sea and Enzo followed it. At a __(5)__ of about 12 meters, trapped in an abandoned net, there was another dolphin. Enzo quickly asked his daughter to __(6)__ the diving knives. Soon, the two of them managed to free the dolphin. While they were helping it to swim up, the other dolphin suddenly leaped out of the water and __(7)__ an 'almost human cry'. A dolphin can stay underwater for up to 10 minutes, otherwise it __(8)__. Enzo, Rossana and the second dolphin helped the rescued one reach the __(9)__ to take a breath. That's when the __(10)__ came. They noticed that the freed dolphin was expecting a baby! The male dolphin circled them and then stopped in front of Enzo, touched his cheek, like a kiss, in a gesture of __(11)__ and then they both swam off. After this incident Enzo Mallorca said: 'Until man learns to respect and speak to the animal world, he can never know his true __(12)__ on Earth.'`,
  items: [
    matchingItem("eng-2025-v1-t4", 1, "", V1_T4_BANK, "B", "„stayed on the boat“ — ქალიშვილი ნავზე დარჩა."),
    matchingItem("eng-2025-v1-t4", 2, "", V1_T4_BANK, "H", "„something slightly hit his back“ — რაღაცამ ოდნავ ხელი ჰკრა ზურგზე."),
    matchingItem("eng-2025-v1-t4", 3, "", V1_T4_BANK, "J", "„he realised“ — მიხვდა."),
    matchingItem("eng-2025-v1-t4", 4, "", V1_T4_BANK, "L", "„communicate something“ — რაღაცის გადმოცემას ცდილობდა."),
    matchingItem("eng-2025-v1-t4", 5, "", V1_T4_BANK, "C", "„at a depth of about 12 meters“ — დაახლ. 12 მეტრ სიღრმეზე."),
    matchingItem("eng-2025-v1-t4", 6, "", V1_T4_BANK, "F", "„grab the diving knives“ — დანების აღება/ჩავლება."),
    matchingItem("eng-2025-v1-t4", 7, "", V1_T4_BANK, "E", "„gave an 'almost human cry'“ — თითქმის ადამიანური ხმა გამოსცა."),
    matchingItem("eng-2025-v1-t4", 8, "", V1_T4_BANK, "D", "„otherwise it drowns“ — თორემ იხრჩობა."),
    matchingItem("eng-2025-v1-t4", 9, "", V1_T4_BANK, "M", "„reach the surface“ — ზედაპირამდე მიაღწიოს ჰაერის ჩასასუნთქად."),
    matchingItem("eng-2025-v1-t4", 10, "", V1_T4_BANK, "N", "„the surprise came“ — მოულოდნელობა/სიურპრიზი."),
    matchingItem("eng-2025-v1-t4", 11, "", V1_T4_BANK, "G", "„a gesture of gratitude“ — მადლიერების ჟესტი."),
    matchingItem("eng-2025-v1-t4", 12, "", V1_T4_BANK, "K", "„his true role on Earth“ — ჭეშმარიტი როლი დედამიწაზე."),
  ],
};

const V1_TASK5: EnglishTask = {
  id: "eng-2025-v1-t5",
  number: 5,
  kind: "grammar",
  title: "Use of English",
  instruction: "Read the text and mark the correct choice A, B, C or D. (12 points)",
  points: 12,
  sharedText: `The youngest football player

Lamine Yamal is a rising football star from Spain. He was born on July 13th, 2007. Yamal joined Barcelona's famous youth academy, La Masia, in 2014. He mostly plays as a right winger and is known __(1)__ his strong left foot. Yamal's ability to cut inside from the right makes him particularly effective __(2)__ attacking situations. In his youth career, he has also played on the left wing __(3)__ a center-forward. His decision-making skill on the field is considered exceptionally well-developed __(4)__ his age. Yamal made history by debuting for Barcelona's first team __(5)__ just 15 years, 9 months and 16 days old, __(6)__ makes him the youngest player ever to do so. On the international stage, Yamal has represented Spain for various youth levels. In September 2023, __(7)__ the age of 16, Yamal made his main debut for Spain, becoming the youngest player __(8)__ goal scorer in the national team's history. He scored his first goal __(9)__ the 8th of September in 2023, during a match against Georgia and set more records as __(10)__ youngest scorer in both La Liga and European Championship history. Lamine Yamal is widely known as one of the brightest young talents __(11)__ football today. With his exceptional skills and early achievements, he is expected to have a promising future __(12)__ both the club and international levels.`,
  items: [
    standaloneItem("eng-2025-v1-t5", 1, "Gap (1)", ["by", "with", "for", "according to"], "C", "„known for something“ — მყარი გამოთქმა."),
    standaloneItem("eng-2025-v1-t5", 2, "Gap (2)", ["in", "at", "outside", "inside"], "A", "„effective in attacking situations“."),
    standaloneItem("eng-2025-v1-t5", 3, "Gap (3)", ["like", "as", "besides", "with"], "B", "„played as a center-forward“ — როლის აღსანიშნავად as."),
    standaloneItem("eng-2025-v1-t5", 4, "Gap (4)", ["in", "of", "from", "for"], "D", "„well-developed for his age“ — ასაკის გათვალისწინებით."),
    standaloneItem("eng-2025-v1-t5", 5, "Gap (5)", ["under", "at", "from", "about"], "B", "„at … years old“ — ასაკის აღსანიშნავად at."),
    standaloneItem("eng-2025-v1-t5", 6, "Gap (6)", ["what", "this", "who", "which"], "D", "which — არაშემზღუდავი დამოკიდებული წინადადება ფაქტზე."),
    standaloneItem("eng-2025-v1-t5", 7, "Gap (7)", ["at", "in", "for", "during"], "A", "„at the age of 16“."),
    standaloneItem("eng-2025-v1-t5", 8, "Gap (8)", ["or", "but", "and", "still"], "C", "„youngest player and goal scorer“ — ორი როლის დაკავშირება and-ით."),
    standaloneItem("eng-2025-v1-t5", 9, "Gap (9)", ["from", "at", "on", "in"], "C", "„on the 8th of September“ — კონკრეტულ თარიღზე on."),
    standaloneItem("eng-2025-v1-t5", 10, "Gap (10)", ["this", "the", "that", "a"], "B", "„the youngest scorer“ — superlative-თან the."),
    standaloneItem("eng-2025-v1-t5", 11, "Gap (11)", ["in", "about", "around", "among"], "A", "„talents in football“."),
    standaloneItem("eng-2025-v1-t5", 12, "Gap (12)", ["on", "in", "for", "at"], "D", "„at both the club and international levels“ — at … level."),
  ],
};

const V1_T6_BANK: EnglishOption[] = [
  { label: "A", text: "I wish I could play the guitar. I prefer to just scroll through my phone if I take a break." },
  { label: "B", text: "Thanks for offering me your help. I'll let you know if I have some problem." },
  { label: "C", text: "Everybody's brain needs that, actually. You're right, Daniel. Psychologists give the same advice." },
  { label: "D", text: "I haven't really thought of having a short rest while studying. I just don't want to fall behind." },
  { label: "E", text: "Thanks a lot, Daniel. I'm really worried about my economics exam. I feel like I don't understand some topics fully." },
  { label: "F", text: "I hope I will. Thank you for encouraging me." },
  { label: "G", text: "This is actually a nice way to relax and restart yourself." },
  { label: "H", text: "Yes, I've been doing that. I make flashcards for the key questions and try to connect them, but then I get lost in all the details. It's frustrating." },
];

const V1_TASK6: EnglishTask = {
  id: "eng-2025-v1-t6",
  number: 6,
  kind: "dialogue",
  title: "Dialogue",
  instruction:
    "Complete the conversation. For questions 1-6 mark the correct letter A-H. Two sentences are extra. (6 points)",
  points: 6,
  bank: V1_T6_BANK,
  sharedText: `Students talking about the exams

Daniel: Hi Lucy. How are things with your exams? Is there anything in particular I can help you with?
Lucy: __(1)__
Daniel: Have you tried breaking each topic down into smaller sections and concentrating on major things only?
Lucy: __(2)__
Daniel: What about having a short rest? Like, step away for a while, clear your head, then come back.
Lucy: __(3)__
Daniel: An hour's rest won't make you fall behind. Sometimes when I feel overtired, I go play the guitar and when I come back, the problem doesn't seem as bad.
Lucy: __(4)__
Daniel: Even that might help. The point is to reset. Your brain needs some rest, too.
Lucy: __(5)__
Daniel: You're one of the smartest people I know. Just don't overwork yourself. You'll pass that exam, no doubt.
Lucy: __(6)__
Daniel: Thank YOU for taking my advice. It helps to be encouraged, believe me.`,
  items: [
    matchingItem("eng-2025-v1-t6", 1, "", V1_T6_BANK, "E", "ლუსი პასუხობს, რომ ეკონომიკის გამოცდაზე ღელავს — საუბრის დასაწყისი."),
    matchingItem("eng-2025-v1-t6", 2, "", V1_T6_BANK, "H", "პასუხობს, რომ ფლეშბარათებს აკეთებს, მაგრამ დეტალებში იკარგება — დანიელის რჩევის შემდეგ."),
    matchingItem("eng-2025-v1-t6", 3, "", V1_T6_BANK, "D", "ამბობს, რომ დასვენებაზე არ უფიქრია, არ უნდა ჩამორჩენა."),
    matchingItem("eng-2025-v1-t6", 4, "", V1_T6_BANK, "A", "პასუხობს, რომ გიტარას ვერ უკრავს და ტელეფონს ურჩევნია — დანიელის გიტარის ხსენების შემდეგ."),
    matchingItem("eng-2025-v1-t6", 5, "", V1_T6_BANK, "C", "ეთანხმება, რომ ტვინს დასვენება სჭირდება — ფსიქოლოგებიც ამას ურჩევენ."),
    matchingItem("eng-2025-v1-t6", 6, "", V1_T6_BANK, "F", "ბოლოს მადლობას უხდის გამხნევებისთვის."),
  ],
};

const VARIANT_1: EnglishExamVariant = {
  id: "english-2025-v1",
  label: "I ვარიანტი",
  year: 2025,
  durationSeconds: 2 * 3600 + 30 * 60,
  totalPoints: 70,
  tasks: [V1_TASK1, V1_TASK2, V1_TASK3, V1_TASK4, V1_TASK5, V1_TASK6],
  essay: {
    id: "eng-2025-v1-t7",
    number: 7,
    prompt:
      "Many people, including young ones, want to go abroad to find a job and have a good income. What do YOU think about this? Give your own opinion and support it with arguments.",
    minWords: 120,
    maxWords: 170,
    points: 16,
  },
};

/* ============================ REGISTRY ================================== */

export const ENGLISH_2025: EnglishExamYear = {
  year: 2025,
  variants: [VARIANT_1],
};
