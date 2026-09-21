/**
 * English — 2025 real national exam (ერთიანი ეროვნული გამოცდები, ინგლისური ენა,
 * ივლისი 2025). Transcribed verbatim from the NAEC booklets and answer key in
 * `docs/exam-sources/english/`. See `englishExamsData.ts` for the content/rights
 * note and the shape of every field.
 *
 * Variant I is complete. Variants II–IV are added the same way.
 */

import type {
  EnglishEssayTask,
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

/* ============================== VARIANT II ============================== */

const V2_TASK1: EnglishTask = {
  id: "eng-2025-v2-t1",
  number: 1,
  kind: "listening",
  title: "Listening",
  instruction:
    "Listen to the text and for each question mark the correct answer A, B, C or D. You now have 40 seconds to look through the task. You will then hear the recording twice. (8 points)",
  points: 8,
  audioSrc: "/exam-audio/english/variant-2-2025.mp3",
  playsAllowed: 2,
  items: [
    standaloneItem("eng-2025-v2-t1", 1, "The Marshall exchange program is for students from", [
      "Denmark.",
      "The Netherlands.",
      "The USA.",
      "all over the world.",
    ], "D", "ჩანაწერის მიხედვით, Marshall-ის გაცვლითი პროგრამა მთელი მსოფლიოს სტუდენტებისთვისაა."),
    standaloneItem("eng-2025-v2-t1", 2, "What was the speaker's main goal in attending the University of California?", [
      "To take a business administration course.",
      "To study music industry administration.",
      "To spend time on the beach sunbathing.",
      "To discover what real college life was like.",
    ], "B", "მომხსენებლის მთავარი მიზანი მუსიკის ინდუსტრიის ადმინისტრირების შესწავლა იყო."),
    standaloneItem("eng-2025-v2-t1", 3, "How has growing up in different countries affected the speaker?", [
      "She avoids travelling abroad.",
      "She never misses home.",
      "She misses her family a lot.",
      "She values her hometown.",
    ], "B", "სხვადასხვა ქვეყანაში გაზრდის გამო მომხსენებელს სახლის მონატრება არასდროს აწუხებს."),
    standaloneItem("eng-2025-v2-t1", 4, "How did the speaker feel before travelling to the USA?", [
      "Worried.",
      "Relaxed.",
      "Happy.",
      "Sad.",
    ], "A", "აშშ-ში გამგზავრებამდე მომხსენებელი შეწუხებული იყო."),
    standaloneItem("eng-2025-v2-t1", 5, "What do we learn about the Trojan Family?", [
      "It is a network of the university staff.",
      "It assists only first-year students.",
      "It supports students even after they graduate.",
      "It ends assistance upon students' graduation.",
    ], "C", "Trojan Family სტუდენტებს კურსდამთავრების შემდეგაც ეხმარება."),
    standaloneItem("eng-2025-v2-t1", 6, "The speaker says that the campus of the University of California is", [
      "the same size as the campus back home.",
      "bigger than other campuses in America.",
      "smaller than the campus back home.",
      "smaller than most other American campuses.",
    ], "D", "მომხსენებლის თქმით, კამპუსი უმეტეს სხვა ამერიკულ კამპუსზე პატარაა."),
    standaloneItem("eng-2025-v2-t1", 7, "What was the speaker's most memorable experience?", [
      "Going to a beach.",
      "Going to student parties.",
      "Attending a baseball game.",
      "Dining at a Mexican restaurant.",
    ], "C", "ყველაზე დასამახსოვრებელი გამოცდილება ბეისბოლის თამაშზე დასწრება იყო."),
    standaloneItem("eng-2025-v2-t1", 8, "The speaker expects that the term spent at The University of California will be", [
      "exciting.",
      "exotic.",
      "tiring.",
      "experimental.",
    ], "A", "მომხსენებელს მიაჩნია, რომ კალიფორნიის უნივერსიტეტში გატარებული სემესტრი საინტერესო/ამაღელვებელი იქნება."),
  ],
};

const V2_T2_PARAGRAPHS = [
  { label: "A", text: `'Women must try to do things as men have tried. When they fail, their failure must be a challenge to others.' These words belong to Amelia Earhart, one of the most famous figures in early aviation. Amelia Earhart was born in 1897, in Kansas, USA. As a child she didn't behave in a 'feminine' way. She climbed trees and hunted rats with her rifle. She saw her first plane when she was ten and wasn't impressed with it at all. But she was very interested in newspaper reports about women who were successful in the professions men mostly had, such as engineering, law and management. Amelia cut the reports out and kept them.` },
  { label: "B", text: `During World War I Amelia worked as a nursing assistant in a military hospital and later started to study medicine at university. However, her life took a different direction in 1920 when she went to an aviation fair with her father and had a ten-minute flight. As soon as the plane left the ground, Amelia knew she wanted to fly. Amelia found a female flight instructor and started to learn how to fly. She took on all sorts of jobs to pay for her lessons, worked really hard for a certain period of life and eventually bought a second-hand plane - a bright yellow aircraft she named 'Canary'. Thus, whatever she dreamt about came true. In 1922 she flew Canary to a height of 4.27 kilometers, setting a women's altitude record.` },
  { label: "C", text: `In 1928, while working as a social worker in Boston, Amelia received an amazing phone call inviting her to join pilot Wilmer Stultz on a flight across the Atlantic. The man, who organised the flight, was the American publisher, George Putman. Amelia's official title was 'commander', but she herself said she was just a passenger. Amelia became the first woman to fly across the Atlantic. This flight brought her fame and she wrote a book about it titled 20 Hrs., 40 Min. Amelia toured the country giving lectures, with George Putnam acting as her manager. In 1931 they got married.` },
  { label: "D", text: `In 1932 Amelia made aviation history again by becoming the first woman to fly solo across the Atlantic, something that only one person, Charles Lindbergh, had ever done before. Due to bad weather, she had to make an emergency landing in the field in Ireland frightening the local cows. With this flight she set several records: the first woman to complete a solo transatlantic flight, the only person to make the crossing of the ocean twice, the longest non-stop distance flown by a woman and the shortest time for the journey. Amelia was awarded the Distinguished Flying Cross. She wrote another book and began designing a flying suit for women, later expanding her designs to include practical clothing for women with active lifestyles.` },
  { label: "E", text: `Amelia continued to set aviation records over the next few years. However, not everyone was comfortable with the idea of a woman living the kind of life that she led. One newspaper sarcastically ended an article about her with the question 'But can she bake a cake?' When she was nearly 40, Amelia decided that she was ready for a final challenge - to become the first woman to fly around the world. Her first attempt failed, but she didn't change her mind. In June 1937, she tried again, accompanied by navigator Fred Noonan. She had decided that this was going to be her last long-distance, record-breaking flight.` },
  { label: "F", text: `Everything went well and they landed in New Guinea in July. The next stage of their journey was from New Guinea to Howland Island, a tiny spot of land in the Pacific Ocean. However, in mid-flight, the plane disappeared in bad weather. A massive rescue search was started immediately but nothing was found. The USA government spent four million US dollars looking for Amelia and the navigator, which makes it the most expensive air and sea search in history. Although they were never found, Amelia Earhart remains a symbol of courage and bravery both for aviation and for women.` },
];

const V2_T2_BANK: EnglishOption[] = V2_T2_PARAGRAPHS.map((p) => ({
  label: p.label,
  text: `Paragraph ${p.label}`,
}));

const V2_TASK2: EnglishTask = {
  id: "eng-2025-v2-t2",
  number: 2,
  kind: "matching",
  title: "Reading — matching",
  instruction:
    "Read the questions (1-8) and find the answers to them in the paragraphs (A-F) of the text. Some paragraphs correspond to more than one question. (8 points)",
  points: 8,
  paragraphs: V2_T2_PARAGRAPHS,
  bank: V2_T2_BANK,
  items: [
    matchingItem("eng-2025-v2-t2", 1, "Which paragraph states that some people didn't approve of Amelia's lifestyle?", V2_T2_BANK, "E", "აბზაცი E: „not everyone was comfortable with the idea of a woman living the kind of life that she led“."),
    matchingItem("eng-2025-v2-t2", 2, "Which paragraph explains why once Amelia had to make an unexpected landing?", V2_T2_BANK, "D", "აბზაცი D: ცუდი ამინდის გამო იძულებული გახდა ირლანდიაში დაეშვა."),
    matchingItem("eng-2025-v2-t2", 3, "Which paragraph specifies the route Amelia and her companion took during their last flight?", V2_T2_BANK, "F", "აბზაცი F: ახალი გვინეიდან Howland Island-ისკენ."),
    matchingItem("eng-2025-v2-t2", 4, "Which paragraph mentions the specific event which inspired Amelia to write a book?", V2_T2_BANK, "C", "აბზაცი C: ატლანტიკის გადაფრენის შემდეგ დაწერა წიგნი 20 Hrs., 40 Min."),
    matchingItem("eng-2025-v2-t2", 5, "Which paragraph states Amelia's reaction when she first saw a plane?", V2_T2_BANK, "A", "აბზაცი A: პირველად თვითმფრინავი ათი წლისამ ნახა და საერთოდ არ მოეწონა."),
    matchingItem("eng-2025-v2-t2", 6, "Which paragraph names the things Amelia designed specifically for women?", V2_T2_BANK, "D", "აბზაცი D: შექმნა საფრენი კოსტიუმი და პრაქტიკული ტანსაცმელი ქალებისთვის."),
    matchingItem("eng-2025-v2-t2", 7, "Which paragraph could have the title 'Working hard to reach a dream'?", V2_T2_BANK, "B", "აბზაცი B: სხვადასხვა სამუშაოთი იხდიდა გაკვეთილების ფასს და ბოლოს იყიდა თვითმფრინავი."),
    matchingItem("eng-2025-v2-t2", 8, "Which paragraph could have the title: 'Amelia's first flight across the Atlantic'?", V2_T2_BANK, "C", "აბზაცი C: 1928 წელს გახდა ატლანტიკის გადამფრენი პირველი ქალი."),
  ],
};

const V2_TASK3: EnglishTask = {
  id: "eng-2025-v2-t3",
  number: 3,
  kind: "reading",
  title: "Reading",
  instruction:
    "Read the text and the questions which follow. For each question mark the correct answer (A, B, C or D). (8 points)",
  points: 8,
  passageText: `This is a story told by Thomas Wilson, the captain of a cruise ship called The Pacific Princess.

As the captain of the cruise ship The Pacific Princess, I've seen countless wonders at sea, but nothing prepared me for the extraordinary event of August 25, 2022 – the event which will stay in my memory forever! It was supposed to be another smooth evening aboard The Pacific Princess. With 670 guests on board, our cruise ship was nearing the end of an 8-day trip through the North Sea. The passengers gathered in the dining hall, enjoying their dinner and sharing the stories of their adventures from the trip. I stood on the top deck, watching the beautiful sunset paint the horizon in shades of orange and pink. The air was calm, and everything seemed peaceful – a perfect end to an exciting day. And that's when I saw it – a sudden burst of light in the distance. It was so bright and unexpected that I knew I had to act quickly. Trusting my instincts, I immediately ordered the ship to change course and directed my crew toward that strange light. As we got closer, I realised it wasn't an optical illusion; it was an emergency flare signaling for help! My intuition had been right; someone at sea was in serious trouble. Normally, the Coast Guard would handle a search mission like this, but we were the only ship nearby. I knew that if we didn't act fast, those in trouble would be lost at sea forever. Every second mattered, so I gathered my crew and prepared for a rescue operation.

Our ship moved forward at full speed. Looking through my binoculars, I spotted something far ahead in the ocean. Soon I realised what we were approaching – a lifeboat floating helplessly in the waves. My heart raced with a mix of fear and hope. Was it too late? But then I saw movement on the boat – there were three men on the boat and they were alive! All three of them waved desperately as they saw our ship approaching. I made an announcement to the passengers, asking them to remain calm as we were about to start a rescue operation. Suddenly, the ship fell silent. Everyone aboard seemed to hold their breath, anxiously waiting to see what would happen next. When we lowered a ladder over the side of the ship, the first man from the lifeboat reached up and grasped the ladder with shaky hands. He climbed steadily, step by step, as the passengers watched breathlessly from above. He safely climbed onto the deck of our ship, followed by the second man and then the third. But as the third man was about to board, he slipped. Time seemed to freeze for a moment as he dropped into the sea. But the crew didn't hesitate, they pulled him from the water within seconds and brought him safely aboard.

Everyone felt relieved and I could hear the applause and cheers from the passengers. But there was no time to celebrate. From the three survivors we learned that there had been five men on the fishing boat when it sank. So two fishermen were still missing. As night fell, we stayed in the area and carefully watched the waters while waiting for the Coast Guard to arrive. Soon helicopters and patrol boats joined the search. We still held onto the hope of finding the others. But at dawn, the Coast Guard found the bodies of the two missing fishermen. It was a tragic ending. We saved three lives, but we couldn't save them all. The weight of the loss was heavy, but I knew we had done everything to give those men a chance to live. I'll always remember that remarkable day and the deep sense of achievement it gave me.`,
  items: [
    standaloneItem("eng-2025-v2-t3", 1, "What was happening aboard the ship at the beginning of the story?", [
      "The passengers were in a panic.",
      "The captain was enjoying the view.",
      "The ship was caught in a violent storm.",
      "The crew was preparing for a rescue mission.",
    ], "B", "დასაწყისში კაპიტანი გემბანზე იდგა და მშვიდ მზის ჩასვლას უცქერდა."),
    standaloneItem("eng-2025-v2-t3", 2, "When the captain saw the unexpected burst of light, he", [
      "decided to take immediate action.",
      "knew it was an optical illusion.",
      "didn't know what to do.",
      "completely ignored it.",
    ], "A", "სინათლის დანახვისთანავე კაპიტანმა მყისიერად შეცვალა კურსი."),
    standaloneItem("eng-2025-v2-t3", 3, "The captain decided to start the rescue operation because", [
      "his ship was in a serious trouble.",
      "he knew there was no other ship nearby.",
      "he wanted to test his crew's rescue skills.",
      "he didn't trust the Coast Guard.",
    ], "B", "ტექსტში: „we were the only ship nearby“ — მხოლოდ მათი გემი იყო ახლოს."),
    standaloneItem("eng-2025-v2-t3", 4, "What did the captain see through his binoculars?", [
      "An empty boat.",
      "A storm approaching.",
      "A lifeboat with three men.",
      "A ship moving at full speed.",
    ], "C", "ბინოკლით კაპიტანმა სამი ადამიანით სავსე მაშველი ნავი დაინახა."),
    standaloneItem("eng-2025-v2-t3", 5, "How did the passengers feel when the rescue operation started?", [
      "Disappointed.",
      "Grateful.",
      "Worried.",
      "Relaxed.",
    ], "C", "მგზავრები შეშფოთებულები იყვნენ — სუნთქვაშეკრული ელოდნენ შედეგს."),
    standaloneItem("eng-2025-v2-t3", 6, "What happened as the third man was boarding the ship?", [
      "He shouted for help.",
      "He jumped into the sea.",
      "His hands started to shake.",
      "He fell into the sea.",
    ], "D", "მესამე კაცი ასვლისას დაუსხლტა და ზღვაში ჩავარდა."),
    standaloneItem("eng-2025-v2-t3", 7, "The cruise ship remained in the area overnight because its crew", [
      "continued searching for the missing men.",
      "wanted to celebrate the successful rescue.",
      "found the bodies of the missing fishermen.",
      "were too tired to continue their journey.",
    ], "A", "გემი ღამით დარჩა, რადგან ეკიპაჟი დაკარგულ ადამიანებს ეძებდა."),
    standaloneItem("eng-2025-v2-t3", 8, "Which of the following would be the best title for the text?", [
      "Captain rescues a sinking ship",
      "Five lives saved at sea",
      "Failed rescue operation",
      "Unforgettable memory",
    ], "D", "ტექსტი კაპიტანის დაუვიწყარ დღეზეა — „Unforgettable memory“."),
  ],
};

const V2_T4_BANK: EnglishOption[] = [
  { label: "A", text: "between" },
  { label: "B", text: "cloudy" },
  { label: "C", text: "exploration" },
  { label: "D", text: "helped" },
  { label: "E", text: "invented" },
  { label: "F", text: "period" },
  { label: "G", text: "possible" },
  { label: "H", text: "qualities" },
  { label: "I", text: "road" },
  { label: "J", text: "seemed" },
  { label: "K", text: "spread" },
  { label: "L", text: "understand" },
  { label: "M", text: "valuable" },
  { label: "N", text: "way" },
];

const V2_TASK4: EnglishTask = {
  id: "eng-2025-v2-t4",
  number: 4,
  kind: "vocabulary",
  title: "Vocabulary",
  instruction:
    "Read the text and fill the gaps with the words given (A-N). Use each word only once. Two words are extra. (12 points)",
  points: 12,
  bank: V2_T4_BANK,
  sharedText: `The importance of the compass

A long time ago before the invention of the compass, sailors used the stars to find their __(1)__. However, this method didn't work during the day or on __(2)__ nights, which made travelling far from land, dangerous. The first compass was __(3)__ in China during the Han dynasty, __(4)__ the 2nd century BC and the 1st century AD. It was made from lodestone, a type of rock that has special natural __(5)__. People had been studying this rock for a long time. However, the compass wasn't used for sailing until the Song dynasty, around the 11th and 12th centuries.

Soon after, compass technology __(6)__ to the West through the contacts with other sailors. The compass __(7)__ sailors travel safely far from land, making global trade and __(8)__ possible. The compass played a key role in making possible the Age of Discovery, which was the __(9)__ of worldwide exploration by Europeans between the 15th and 18th centuries. The invention of the compass made it __(10)__ to travel throughout the year, rather than only being able to travel for just a few months. Today, despite technological advancements, the compass is still a __(11)__ tool. It is still an important and widely used tool that has definitely changed the way we __(12)__ and explore the world.`,
  items: [
    matchingItem("eng-2025-v2-t4", 1, "", V2_T4_BANK, "N", "„find their way“ — გზის პოვნა."),
    matchingItem("eng-2025-v2-t4", 2, "", V2_T4_BANK, "B", "„cloudy nights“ — ღრუბლიან ღამეებში."),
    matchingItem("eng-2025-v2-t4", 3, "", V2_T4_BANK, "E", "„was invented in China“ — გამოიგონეს."),
    matchingItem("eng-2025-v2-t4", 4, "", V2_T4_BANK, "A", "„between the 2nd century BC and the 1st century AD“ — შორის."),
    matchingItem("eng-2025-v2-t4", 5, "", V2_T4_BANK, "H", "„special natural qualities“ — ბუნებრივი თვისებები."),
    matchingItem("eng-2025-v2-t4", 6, "", V2_T4_BANK, "K", "„technology spread to the West“ — გავრცელდა."),
    matchingItem("eng-2025-v2-t4", 7, "", V2_T4_BANK, "D", "„helped sailors travel“ — დაეხმარა."),
    matchingItem("eng-2025-v2-t4", 8, "", V2_T4_BANK, "C", "„global trade and exploration“ — გამოკვლევა/აღმოჩენა."),
    matchingItem("eng-2025-v2-t4", 9, "", V2_T4_BANK, "F", "„the period of worldwide exploration“ — პერიოდი."),
    matchingItem("eng-2025-v2-t4", 10, "", V2_T4_BANK, "G", "„made it possible to travel“ — შესაძლებელი."),
    matchingItem("eng-2025-v2-t4", 11, "", V2_T4_BANK, "M", "„a valuable tool“ — ღირებული."),
    matchingItem("eng-2025-v2-t4", 12, "", V2_T4_BANK, "L", "„the way we understand … the world“ — გავიგოთ."),
  ],
};

const V2_TASK5: EnglishTask = {
  id: "eng-2025-v2-t5",
  number: 5,
  kind: "grammar",
  title: "Use of English",
  instruction: "Read the text and mark the correct choice A, B, C or D. (12 points)",
  points: 12,
  sharedText: `The deepest cave

Caves, mysterious natural formations shaped by water, wind or volcanic activity, reveal secrets about the natural world. Caves have fascinated people __(1)__ centuries. These natural wonders are filled with secrets about Earth's history and are home to unique ecosystems __(2)__ scientists are still exploring. One __(3)__ the most incredible places to study is the Arabika mountain range in Abkhazeti, where some of the deepest caves in the world are found. Among these is __(4)__ deepest cave ever recorded, reaching an amazing depth of 2,212 meters. Exploring such caves is not an easy task. For instance, this deepest cave, which was discovered in 1968, required decades of dangerous expeditions to fully reveal __(5)__ depth. Explorers had to go down the cave thousands of metres, dealing __(6)__ freezing temperature and water-filled passages. Yet, the difficult conditions haven't stopped scientists __(7)__ continuing to explore. They hope to learn more __(8)__ the cave's history, collect rare fossils, and even discover new species of microorganisms that might help __(9)__ developing new medicines. Additionally, caves show some important facts __(10)__ climate change processes, helping researchers understand environmental history. Despite the challenges, the caves of the Arabika mountain range in Abkhazeti still continue to fascinate both explorers __(11)__ researchers. Their huge and unexplored passages suggest that there are still many things left __(12)__ future discoveries.`,
  items: [
    standaloneItem("eng-2025-v2-t5", 1, "Gap (1)", ["in", "about", "for", "from"], "C", "„fascinated people for centuries“ — for."),
    standaloneItem("eng-2025-v2-t5", 2, "Gap (2)", ["yet", "that", "but", "and"], "B", "„ecosystems that scientists are still exploring“ — that."),
    standaloneItem("eng-2025-v2-t5", 3, "Gap (3)", ["from", "off", "for", "of"], "D", "„One of the most incredible places“ — of."),
    standaloneItem("eng-2025-v2-t5", 4, "Gap (4)", ["the", "this", "a", "that"], "A", "„the deepest cave ever recorded“ — superlative-თან the."),
    standaloneItem("eng-2025-v2-t5", 5, "Gap (5)", ["theirs", "it", "its", "their"], "C", "„fully reveal its depth“ — its."),
    standaloneItem("eng-2025-v2-t5", 6, "Gap (6)", ["for", "on", "at", "with"], "D", "„dealing with freezing temperature“ — with."),
    standaloneItem("eng-2025-v2-t5", 7, "Gap (7)", ["from", "about", "in", "for"], "A", "„stopped scientists from continuing“ — from."),
    standaloneItem("eng-2025-v2-t5", 8, "Gap (8)", ["for", "about", "around", "inside"], "B", "„learn more about the cave's history“ — about."),
    standaloneItem("eng-2025-v2-t5", 9, "Gap (9)", ["from", "of", "in", "to"], "C", "„help in developing new medicines“ — in."),
    standaloneItem("eng-2025-v2-t5", 10, "Gap (10)", ["inside", "from", "off", "about"], "D", "„facts about climate change processes“ — about."),
    standaloneItem("eng-2025-v2-t5", 11, "Gap (11)", ["also", "and", "but", "or"], "B", "„both explorers and researchers“ — and."),
    standaloneItem("eng-2025-v2-t5", 12, "Gap (12)", ["for", "by", "from", "through"], "A", "„many things left for future discoveries“ — for."),
  ],
};

const V2_T6_BANK: EnglishOption[] = [
  { label: "A", text: "You borrowed them some time ago and left them at my friend's house." },
  { label: "B", text: "If you were a bit more organised, this wouldn't keep happening. Did you ask Mom? She might've moved them when she was cleaning." },
  { label: "C", text: "Hmm, I think I saw them on the kitchen table this morning. Did you check there?" },
  { label: "D", text: "Documentaries are my favourite, they show a real world around us. Comedies are just for entertainment." },
  { label: "E", text: "Sounds good! Let me know when you find them!" },
  { label: "F", text: "That sounds fun! What do you want to watch?" },
  { label: "G", text: "You always leave your things lying around and then you lose them easily. Maybe you left them in your room." },
  { label: "H", text: "Oh, I've heard about that one! Sure, let's watch it after dinner. We can make some popcorn, too." },
];

const V2_TASK6: EnglishTask = {
  id: "eng-2025-v2-t6",
  number: 6,
  kind: "dialogue",
  title: "Dialogue",
  instruction:
    "Complete the conversation. For questions 1-6 mark the correct letter A-H. Two sentences are extra. (6 points)",
  points: 6,
  bank: V2_T6_BANK,
  sharedText: `Brother and sister talking

Brother: Emily, have you seen my headphones? I can't find them. I've looked all over the place - under the couch, in my pockets, everywhere!
Sister: __(1)__
Brother: Yes, I already did. They're not there now.
Sister: __(2)__
Brother: I already checked my room. I'm sure I left them in the living room last night after watching that show. I was using them before I went to bed.
Sister: __(3)__
Brother: Good idea. I'll ask her. By the way, do you want to watch a movie tonight?
Sister: __(4)__
Brother: I was thinking about that new comedy everyone's talking about. What about watching it today?
Sister: __(5)__
Brother: Great! I'll ask Mom about my headphones now. Thanks, Emily!
Sister: __(6)__
Brother: All right!`,
  items: [
    matchingItem("eng-2025-v2-t6", 1, "", V2_T6_BANK, "C", "დას ჰგონია, რომ სამზარეულოს მაგიდაზე ნახა — ურჩევს იქ შეამოწმოს."),
    matchingItem("eng-2025-v2-t6", 2, "", V2_T6_BANK, "G", "„Maybe you left them in your room“ — ოთახში ეძებოს."),
    matchingItem("eng-2025-v2-t6", 3, "", V2_T6_BANK, "B", "ურჩევს დედას ჰკითხოს — დალაგებისას შეიძლება გადაინაცვლა."),
    matchingItem("eng-2025-v2-t6", 4, "", V2_T6_BANK, "F", "„That sounds fun! What do you want to watch?“ — ფილმის შეთავაზების პასუხი."),
    matchingItem("eng-2025-v2-t6", 5, "", V2_T6_BANK, "H", "ეთანხმება კომედიის ყურებას ვახშმის შემდეგ, პოპკორნით."),
    matchingItem("eng-2025-v2-t6", 6, "", V2_T6_BANK, "E", "„Let me know when you find them!“ — საუბრის დასასრული."),
  ],
};

const VARIANT_2: EnglishExamVariant = {
  id: "english-2025-v2",
  label: "II ვარიანტი",
  year: 2025,
  durationSeconds: 2 * 3600 + 30 * 60,
  totalPoints: 70,
  tasks: [V2_TASK1, V2_TASK2, V2_TASK3, V2_TASK4, V2_TASK5, V2_TASK6],
  essay: {
    id: "eng-2025-v2-t7",
    number: 7,
    prompt:
      "Money is the most important thing in life. What do YOU think about this? Give your own opinion and support it with arguments.",
    minWords: 120,
    maxWords: 170,
    points: 16,
  },
};

/* ============================== VARIANT III ============================= */

const V3_TASK1: EnglishTask = {
  id: "eng-2025-v3-t1",
  number: 1,
  kind: "listening",
  title: "Listening",
  instruction:
    "Listen to the text and for each question mark the correct answer A, B, C or D. You now have 40 seconds to look through the task. You will then hear the recording twice. (8 points)",
  points: 8,
  audioSrc: "/exam-audio/english/variant-3-2025.mp3",
  playsAllowed: 2,
  items: [
    standaloneItem("eng-2025-v3-t1", 1, "Tamara Tumanishvili was nicknamed the Black Pearl because of her", [
      "eyes.",
      "skin.",
      "roles.",
      "hair.",
    ], "D", "ტამარა თუმანიშვილს „შავი მარგალიტი“ თმის გამო შეარქვეს."),
    standaloneItem("eng-2025-v3-t1", 2, "We learn from the speaker that Evgenia Tumanishvili", [
      "was a military doctor.",
      "got married very young.",
      "spent all her life in Russia.",
      "left for China together with her husband.",
    ], "B", "ევგენია თუმანიშვილი ძალიან ახალგაზრდა გათხოვდა."),
    standaloneItem("eng-2025-v3-t1", 3, "Which important event happened on the train?", [
      "Tamara was born there.",
      "Tamara's father died there.",
      "Tamara met her father there.",
      "Tamara's mother got married there.",
    ], "A", "მატარებელში ტამარა დაიბადა."),
    standaloneItem("eng-2025-v3-t1", 4, "In which country did Tamara Tumanishvili start her ballet career?", [
      "China.",
      "Egypt.",
      "Russia.",
      "France.",
    ], "D", "ტამარამ საბალეტო კარიერა საფრანგეთში დაიწყო."),
    standaloneItem("eng-2025-v3-t1", 5, "Who dedicated the ballets to Tamara Tumanishvili?", [
      "George Balanchine.",
      "Olga Preobrazhenskaya.",
      "An Egyptian choreographer.",
      "An unknown Parisian dancer.",
    ], "A", "ბალეტები ტამარას ჯორჯ ბალანჩინმა მიუძღვნა."),
    standaloneItem("eng-2025-v3-t1", 6, "What was her stage name?", [
      "Tamara Casey.",
      "Tamara Pavlova.",
      "Tamara Toumanova.",
      "Tamara Tumanishvili.",
    ], "C", "მისი სასცენო სახელი იყო Tamara Toumanova."),
    standaloneItem("eng-2025-v3-t1", 7, "Why was Evgenia against Tamara marrying Balanchine?", [
      "Balanchine had a wife.",
      "Tamara was already married.",
      "The age difference was big.",
      "She wanted Tamara to focus on her career.",
    ], "C", "ევგენია წინააღმდეგი იყო დიდი ასაკობრივი სხვაობის გამო."),
    standaloneItem("eng-2025-v3-t1", 8, "What happened to Tamara Tumanishvili's property after her death?", [
      "It was sold.",
      "It was given to charity.",
      "She left it to her family.",
      "She left it to her friends.",
    ], "B", "მისი ქონება საქველმოქმედოდ გაიცა."),
  ],
};

const V3_T2_PARAGRAPHS = [
  { label: "A", text: `Wildlife films are powerful tools for spreading information about nature and animals. In wildlife filmmaking, filmmakers must fully dedicate their lives to their profession. These professionals help us learn more about animals and understand how easily our planet's ecosystems can be damaged. This job has a reputation of a 'dream job' because it involves travelling to exotic places, seeing amazing wildlife and having great adventures. If you don't mind long hours, hard work and getting sick in tropical places, then that's what it is. It's no surprise that many people want to become a wildlife filmmaker; however, not everyone is fit for this demanding profession.` },
  { label: "B", text: `Richard and Sonia Muller began making wildlife films because they both loved nature and wanted to protect it. They shared a deep passion for filming and storytelling, which made it easy for them to work together, as a team. The documentaries, which they make together, are mostly about dangerous animals, like the big cats that live in Africa. They make movies to show people around the world how important it is to care about animals and protect them. In their film Staying Alive, which they made after becoming well-known, the Mullers studied how lions in one region of Africa interact with each other.` },
  { label: "C", text: `With a camera in hand, Richard and Sonia started capturing amazing moments of wildlife in their natural environment. One thing that made their method exceptional was that they didn't just document animal behaviour but also tried to tell an interesting story about the animals' lives and struggles. The focus of their work was the beauty of nature. Each of their films was a work of art, a visual journey through the heart of the wilderness. Their earliest film, Wild Symphony, made during their student years, was a poetic masterpiece. It demonstrated the diversity of animals found around the planet, ranging from the polar bears of the Arctic to the stunning hummingbirds of the Amazon jungle.` },
  { label: "D", text: `Sonia and Richard both say that finishing the project is the hardest experience for them. Sonia adds that working long hours is sometimes hard and things like the heat, dust and insects make their job very tiring. Nevertheless, what makes her job most attractive is the fact that she never knows what will happen next. And she finds this feeling of unexpectedness fascinating. She might even find something new for science. On the other hand, Richard takes more interest in spending time with individual animals, getting to know their character.` },
  { label: "E", text: `A major part of the Mullers' work involves helping students appreciate the importance of understanding different environments, including climate, wildlife and local cultures. While visiting schools around the world, the couple made an unexpected discovery: students with a lot of access to the internet often had a weaker understanding of geography, whereas those with limited internet access had a better understanding of geography. 'Students with very little internet connection actually look at paper maps; they want to find out where they are and often end up with a better idea of place,' Richard explains.` },
  { label: "F", text: `If you'd like to become a wildlife filmmaker, Richard suggests studying various different areas of biology, rather than learning about the latest filmmaking technology. This is because understanding the natural world will always be useful. The couple also gives general advice to those who want to help protect the environment. Sonia explains that it's important to allow yourself to concentrate. 'Turning off personal electronic items gets you closer to the natural world,' she says. Most importantly, they agree that if urgent action isn't taken, more animals might be lost forever. However, the fact that more teenagers are getting involved in this activity offers some hope for the future.` },
];

const V3_T2_BANK: EnglishOption[] = V3_T2_PARAGRAPHS.map((p) => ({
  label: p.label,
  text: `Paragraph ${p.label}`,
}));

const V3_TASK2: EnglishTask = {
  id: "eng-2025-v3-t2",
  number: 2,
  kind: "matching",
  title: "Reading — matching",
  instruction:
    "Read the questions (1-8) and find the answers to them in the paragraphs (A-F) of the text. Some paragraphs correspond to more than one question. (8 points)",
  points: 8,
  paragraphs: V3_T2_PARAGRAPHS,
  bank: V3_T2_BANK,
  items: [
    matchingItem("eng-2025-v3-t2", 1, "Which paragraph states the things the Mullers had in common?", V3_T2_BANK, "B", "აბზაცი B: ორივეს უყვარდა ბუნება და საერთო ჰქონდათ გადაღება-თხრობის ვნება."),
    matchingItem("eng-2025-v3-t2", 2, "Which paragraph says what Sonia finds most interesting about her profession?", V3_T2_BANK, "D", "აბზაცი D: სონიას ყველაზე მეტად მოულოდნელობის განცდა იზიდავს."),
    matchingItem("eng-2025-v3-t2", 3, "Which paragraph has information about the Mullers' unique method?", V3_T2_BANK, "C", "აბზაცი C: მათი მეთოდი გამორჩეული იყო — ისტორიას ჰყვებოდნენ, არა მხოლოდ ქცევას აღწერდნენ."),
    matchingItem("eng-2025-v3-t2", 4, "Which paragraph offers recommendations to those interested in wildlife filmmaking?", V3_T2_BANK, "F", "აბზაცი F: რიჩარდი ურჩევს ბიოლოგიის შესწავლას."),
    matchingItem("eng-2025-v3-t2", 5, "Which paragraph gives the reason why the Mullers make their documentaries?", V3_T2_BANK, "B", "აბზაცი B: ფილმებს იღებენ, რომ ხალხს ცხოველების დაცვის მნიშვნელობა აჩვენონ."),
    matchingItem("eng-2025-v3-t2", 6, "Which paragraph mentions the title of the Mullers' first film?", V3_T2_BANK, "C", "აბზაცი C: მათი პირველი ფილმი — Wild Symphony."),
    matchingItem("eng-2025-v3-t2", 7, "Which paragraph can have the title: 'A dream job for adventurous people'?", V3_T2_BANK, "A", "აბზაცი A: „dream job“ — თავგადასავალი, ეგზოტიკური ადგილები."),
    matchingItem("eng-2025-v3-t2", 8, "Which paragraph can have the title: 'An unexpected finding'?", V3_T2_BANK, "E", "აბზაცი E: წყვილმა მოულოდნელი აღმოჩენა გააკეთა ინტერნეტსა და გეოგრაფიის ცოდნაზე."),
  ],
};

const V3_TASK3: EnglishTask = {
  id: "eng-2025-v3-t3",
  number: 3,
  kind: "reading",
  title: "Reading",
  instruction:
    "Read the text and the questions which follow. For each question mark the correct answer (A, B, C or D). (8 points)",
  points: 8,
  passageText: `This is a personal story told by Jason Arday, a famous sociologist of education.

Hello, everybody! My name is Jason Arday and I was diagnosed with autism as a child. My parents come from Ghana, Africa, but I grew up in Clapham, south London. We lived in a council estate, which is a group of houses constructed and rented by the local government. I am the second youngest of four brothers. At the age of three, I was diagnosed with global developmental delay and autism spectrum disorder. I couldn't speak until I was 11 and was unable to read or write until I was 18. Less than eight years ago, my family was informed that I'd probably need care for the rest of my life, but I surprised everyone. Despite these challenges, I got two master's degrees and even completed a PhD at Liverpool University in the UK. I received a lot of encouragement to become a professor from Sandro Sandi, my mentor, who offered advice and support. After publishing my first paper in 2018 and getting positions at two English universities, I became one of the youngest professors in the UK.

From a young age, I've been fascinated by the mysteries of the universe. The depths of the ocean and the sparkling stars in the sky held countless secrets awaiting discovery. My journey into the unknown began in my childhood. As a child growing up in a small town surrounded by hills, I was charmed by the endless space of the universe. My parents, both passionate star-watchers, stimulated my interest and made me quite curious from an early age. They would often take me out to our backyard, where we would lie on blankets under the night sky full of stars. We would look at the stars and share stories about ancient civilisations.

My interest grew when I discovered an old book in the attic of my grandfather's house. Though worn, it was packed with stories about brave travellers and scientists who went into the unknown in search of knowledge and understanding. From that moment, I knew I wanted to follow in their footsteps. As I grew older, I eagerly learned everything I could about the world. But just reading about these wonders and admiring the pictures of the starry sky wasn't enough for me; I was eager to see them myself.

After graduating from university with a degree in astrophysics, I went on my own journey to study the stars from telescopes high in the mountains. In faraway parts of the world, I dived into the ocean to find its hidden secrets. The excitement of each new adventure was unlike anything I had ever experienced. For years scientists had suggested that there might be a ninth planet somewhere near Neptune and I was determined to be the one to find it. My own passion combined with the latest technology gave me the strength to start the trip of a lifetime. It was a long and hard search full of problems and failures. We had to deal with terrible weather and broken technology. But I refused to give up. Later, on a significant night, I saw the new planet through my telescope: a little dot of light in the sky. Everyone called me a hero, but what really made me happy wasn't the praise or recognition; it was knowing that I did my best and eventually reached my goal. As long as there are mysteries to uncover, I will always be ready to answer the call of the cosmos.`,
  items: [
    standaloneItem("eng-2025-v3-t3", 1, "What do we learn about Jason from the start?", [
      "He had problems in development.",
      "He could read and write at three.",
      "He grew up as a healthy child.",
      "He received lifelong care.",
    ], "A", "დასაწყისში ვიგებთ, რომ ჯეისონს განვითარების პრობლემები ჰქონდა (აუტიზმი, განვითარების შეფერხება)."),
    standaloneItem("eng-2025-v3-t3", 2, "Who encouraged Jason to become a professor?", [
      "His friend.",
      "His parents.",
      "His advisor.",
      "His brothers.",
    ], "C", "პროფესორობისკენ მისი მენტორი/მრჩეველი Sandro Sandi უბიძგებდა."),
    standaloneItem("eng-2025-v3-t3", 3, "When did Jason start to show interest in the universe?", [
      "As a child.",
      "As a teenager.",
      "As a university student.",
      "As a university professor.",
    ], "A", "სამყაროთი დაინტერესება ბავშვობიდანვე დაიწყო."),
    standaloneItem("eng-2025-v3-t3", 4, "What influenced Jason's early interest in astronomy?", [
      "Meetings with astronomers.",
      "Encouragement from teachers.",
      "His parents' love for watching stars.",
      "Seeing paintings of various stars.",
    ], "C", "ადრეულ ინტერესს მშობლების ვარსკვლავებით გატაცება უწყობდა ხელს."),
    standaloneItem("eng-2025-v3-t3", 5, "What happened when Jason found an old book in the attic?", [
      "He lost interest in reading.",
      "He decided to become a scientist.",
      "He was not amazed by wonders any more.",
      "He stopped dreaming about travelling.",
    ], "B", "წიგნმა გადააწყვეტინა, გამბედავ მკვლევართა კვალს გაჰყოლოდა — მეცნიერი გამხდარიყო."),
    standaloneItem("eng-2025-v3-t3", 6, "What did Jason do after graduating from university?", [
      "He travelled a lot.",
      "He took up swimming.",
      "He began studying stars.",
      "He travelled the cosmos.",
    ], "C", "უნივერსიტეტის შემდეგ მთებში ტელესკოპებით ვარსკვლავების შესწავლა დაიწყო."),
    standaloneItem("eng-2025-v3-t3", 7, "Why is a ninth planet mentioned in the text?", [
      "Nobody believed in its existence.",
      "The speaker never believed he would find it.",
      "Scientists created special technology to find it.",
      "The speaker set a goal to discover it.",
    ], "D", "მეცხრე პლანეტა ნახსენებია, რადგან ჯეისონმა მისი აღმოჩენა მიზნად დაისახა."),
    standaloneItem("eng-2025-v3-t3", 8, "Which of the following would be the best title for the text?", [
      "Hard work pays off",
      "Praise should not be a goal",
      "Recognition spoils scientists",
      "The price of fame",
    ], "A", "ტექსტი აჩვენებს, რომ ჯაფა ნაყოფს იძლევა — „Hard work pays off“."),
  ],
};

const V3_T4_BANK: EnglishOption[] = [
  { label: "A", text: "afford" },
  { label: "B", text: "amount" },
  { label: "C", text: "available" },
  { label: "D", text: "changed" },
  { label: "E", text: "career" },
  { label: "F", text: "disappointment" },
  { label: "G", text: "effort" },
  { label: "H", text: "expensive" },
  { label: "I", text: "gift" },
  { label: "J", text: "improved" },
  { label: "K", text: "models" },
  { label: "L", text: "save" },
  { label: "M", text: "success" },
  { label: "N", text: "use" },
];

const V3_TASK4: EnglishTask = {
  id: "eng-2025-v3-t4",
  number: 4,
  kind: "vocabulary",
  title: "Vocabulary",
  instruction:
    "Read the text and fill the gaps with the words given (A-N). Use each word only once. Two words are extra. (12 points)",
  points: 12,
  bank: V3_T4_BANK,
  sharedText: `An important invention

The invention of the washing machine __(1)__ the way people cleaned their clothes and transformed everybody's life for the better. Before this, washing clothes by hand was a long and tiring job. It required a lot of __(2)__ and took up a significant __(3)__ of time every day. In the 1850s, an American inventor named James King made one of the first mechanical washing machines. However, it was still considered an __(4)__ item for many people, as not everyone could __(5)__ to buy one. Later, in 1874, William Blackstone, who was also from the USA, built a washing machine as a __(6)__ for his wife. His machine became the first official washing machine designed for home __(7)__, unlike earlier machines, which were bigger and more difficult to manage. It soon became a __(8)__ because it could wash clothes faster, simpler and allowed us to spend less time doing the washing and more time doing things we enjoy. Over time, other inventors also __(9)__ the washing machine, and in the early 1900s, electric __(10)__ were finally created. These machines made washing clothes even easier. With new technologies, washing machines became stronger and widely __(11)__. Today, modern washing machines are a common household item and they __(12)__ people's time and effort all over the world. They have become an important part of daily life.`,
  items: [
    matchingItem("eng-2025-v3-t4", 1, "", V3_T4_BANK, "D", "„changed the way“ — შეცვალა."),
    matchingItem("eng-2025-v3-t4", 2, "", V3_T4_BANK, "G", "„a lot of effort“ — ძალისხმევა."),
    matchingItem("eng-2025-v3-t4", 3, "", V3_T4_BANK, "B", "„a significant amount of time“ — რაოდენობა."),
    matchingItem("eng-2025-v3-t4", 4, "", V3_T4_BANK, "H", "„an expensive item“ — ძვირი."),
    matchingItem("eng-2025-v3-t4", 5, "", V3_T4_BANK, "A", "„could afford to buy“ — ვერ იმეტებდნენ ფულს."),
    matchingItem("eng-2025-v3-t4", 6, "", V3_T4_BANK, "I", "„as a gift for his wife“ — საჩუქრად."),
    matchingItem("eng-2025-v3-t4", 7, "", V3_T4_BANK, "N", "„designed for home use“ — სახლში გამოსაყენებლად."),
    matchingItem("eng-2025-v3-t4", 8, "", V3_T4_BANK, "M", "„became a success“ — წარმატება."),
    matchingItem("eng-2025-v3-t4", 9, "", V3_T4_BANK, "J", "„inventors also improved“ — გააუმჯობესეს."),
    matchingItem("eng-2025-v3-t4", 10, "", V3_T4_BANK, "K", "„electric models“ — მოდელები."),
    matchingItem("eng-2025-v3-t4", 11, "", V3_T4_BANK, "C", "„widely available“ — ხელმისაწვდომი."),
    matchingItem("eng-2025-v3-t4", 12, "", V3_T4_BANK, "L", "„save people's time and effort“ — ზოგავს."),
  ],
};

const V3_TASK5: EnglishTask = {
  id: "eng-2025-v3-t5",
  number: 5,
  kind: "grammar",
  title: "Use of English",
  instruction: "Read the text and mark the correct choice A, B, C or D. (12 points)",
  points: 12,
  sharedText: `A flash drive

A flash drive, also known as a USB stick, is a small, portable device used to keep information or transfer it from one computer to another. It is one of the most popular tools __(1)__ saving and transferring files, like documents, photos, music and videos. Flash drives are easy to use and can hold a large amount of information. To use a flash drive, you simply plug it __(2)__ a computer's USB port. The computer recognises it quickly, allowing you to copy, move __(3)__ delete files. If you run out of space, you can delete old files to make space for new ones. One of __(4)__ best things about flash drives is that they are easy to carry. They are small enough to fit __(5)__ your pocket and unlike some other tools __(6)__ can also keep information, flash drives don't scratch easily. Flash drives are also strong and can be reused thousands __(7)__ times. A flash drive does not need batteries and the information it contains can be kept safe __(8)__ many years. However, it's always a good idea to save important files somewhere else __(9)__ well, in case the drive gets lost or damaged. Flash drives come in various colours __(10)__ designs, making them fun to use. Many people use flash drives for school projects, work presentations or simply to share photos __(11)__ friends. They are especially useful __(12)__ you need to transfer files from one computer to another, as you can easily take them anywhere.`,
  items: [
    standaloneItem("eng-2025-v3-t5", 1, "Gap (1)", ["of", "for", "from", "about"], "B", "„tools for saving and transferring“ — for."),
    standaloneItem("eng-2025-v3-t5", 2, "Gap (2)", ["from", "off", "into", "of"], "C", "„plug it into a USB port“ — into."),
    standaloneItem("eng-2025-v3-t5", 3, "Gap (3)", ["or", "because", "but", "about"], "A", "„copy, move or delete“ — or."),
    standaloneItem("eng-2025-v3-t5", 4, "Gap (4)", ["this", "the", "a", "that"], "B", "„One of the best things“ — the."),
    standaloneItem("eng-2025-v3-t5", 5, "Gap (5)", ["in", "on", "for", "over"], "A", "„fit in your pocket“ — in."),
    standaloneItem("eng-2025-v3-t5", 6, "Gap (6)", ["when", "which", "who", "whose"], "B", "„tools which can also keep information“ — which."),
    standaloneItem("eng-2025-v3-t5", 7, "Gap (7)", ["from", "about", "in", "of"], "D", "„thousands of times“ — of."),
    standaloneItem("eng-2025-v3-t5", 8, "Gap (8)", ["since", "in", "for", "about"], "C", "„kept safe for many years“ — for."),
    standaloneItem("eng-2025-v3-t5", 9, "Gap (9)", ["but", "as", "for", "at"], "B", "„somewhere else as well“ — as."),
    standaloneItem("eng-2025-v3-t5", 10, "Gap (10)", ["for", "to", "from", "and"], "D", "„colours and designs“ — and."),
    standaloneItem("eng-2025-v3-t5", 11, "Gap (11)", ["with", "about", "by", "along"], "A", "„share photos with friends“ — with."),
    standaloneItem("eng-2025-v3-t5", 12, "Gap (12)", ["where", "what", "which", "when"], "D", "„useful when you need to transfer“ — when."),
  ],
};

const V3_T6_BANK: EnglishOption[] = [
  { label: "A", text: "Oh, I see. But you're not vegetarian, are you?" },
  { label: "B", text: "Well, I'm going to cook the most delicious food you've ever tasted." },
  { label: "C", text: "So you'll be fine with chicken burgers, right?" },
  { label: "D", text: "Well, I'm having a dinner party at my house and I was wondering if you'd like to come along." },
  { label: "E", text: "Great, that's good to hear. See you on Saturday at 7 in the evening then." },
  { label: "F", text: "No, it's just a casual get-together with a few old friends. We'll all have a great time. Is 7 o'clock OK?" },
  { label: "G", text: "Because I'm planning to invite a few people to my house on Saturday." },
  { label: "H", text: "Well, it's a bit of a problem as everyone likes different things. How do you feel about Chinese food?" },
];

const V3_TASK6: EnglishTask = {
  id: "eng-2025-v3-t6",
  number: 6,
  kind: "dialogue",
  title: "Dialogue",
  instruction:
    "Complete the conversation. For questions 1-6 mark the correct letter A-H. Two sentences are extra. (6 points)",
  points: 6,
  bank: V3_T6_BANK,
  sharedText: `Friends talking

Jimmy: What are you doing on Saturday evening, Sophie?
Sophie: I'm not sure yet. I might be going out but I haven't made any plans. Why are you asking?
Jimmy: __(1)__
Sophie: Oh, I'd love to. That sounds like a great event. Is it a formal occasion?
Jimmy: __(2)__
Sophie: Yes, that's perfect. I'll be there right on time! What are you going to cook?
Jimmy: __(3)__
Sophie: Well, to be honest, I don't really like it - I had a bad experience once. If I had a choice, I'd go for something else.
Jimmy: __(4)__
Sophie: No, no, I'm not. I like trying vegetarian dishes now and then, but I do enjoy eating meat.
Jimmy: __(5)__
Sophie: Yes, absolutely! I love them, especially with a good mix of cheese, pickles and crispy bacon.
Jimmy: __(6)__
Sophie: Sure, I'm really looking forward to it.`,
  items: [
    matchingItem("eng-2025-v3-t6", 1, "", V3_T6_BANK, "D", "ჯიმი იწვევს სადილზე — „I'm having a dinner party ... come along“."),
    matchingItem("eng-2025-v3-t6", 2, "", V3_T6_BANK, "F", "პასუხობს, რომ არაფორმალურია, დანიშნავს 7 საათს."),
    matchingItem("eng-2025-v3-t6", 3, "", V3_T6_BANK, "H", "საკვების არჩევანი პრობლემურია — სთავაზობს ჩინურ საკვებს."),
    matchingItem("eng-2025-v3-t6", 4, "", V3_T6_BANK, "A", "სოფი ჩინურს არ ეთანხმება — ჯიმი ეკითხება, ვეგეტარიანელი ხომ არ არის."),
    matchingItem("eng-2025-v3-t6", 5, "", V3_T6_BANK, "C", "„So you'll be fine with chicken burgers, right?“ — შემდეგი შეთავაზება."),
    matchingItem("eng-2025-v3-t6", 6, "", V3_T6_BANK, "E", "„See you on Saturday at 7“ — საუბრის დასასრული."),
  ],
};

const VARIANT_3: EnglishExamVariant = {
  id: "english-2025-v3",
  label: "III ვარიანტი",
  year: 2025,
  durationSeconds: 2 * 3600 + 30 * 60,
  totalPoints: 70,
  tasks: [V3_TASK1, V3_TASK2, V3_TASK3, V3_TASK4, V3_TASK5, V3_TASK6],
  essay: {
    id: "eng-2025-v3-t7",
    number: 7,
    prompt:
      "After the age of 18, young people should be able to make important decisions independently. What do YOU think about this? Give your own opinion and support it with arguments.",
    minWords: 120,
    maxWords: 170,
    points: 16,
  },
};

/* ============================== VARIANT IV ============================== */

const V4_TASK1: EnglishTask = {
  id: "eng-2025-v4-t1",
  number: 1,
  kind: "listening",
  title: "Listening",
  instruction:
    "Listen to the text and for each question mark the correct answer A, B, C or D. You now have 40 seconds to look through the task. You will then hear the recording twice. (8 points)",
  points: 8,
  audioSrc: "/exam-audio/english/variant-4-2025.mp3",
  playsAllowed: 2,
  items: [
    standaloneItem("eng-2025-v4-t1", 1, "Who knew about the speaker's dream to live in the USA?", [
      "Nobody.",
      "Her father.",
      "Her mother.",
      "Exchange students.",
    ], "B", "მომხსენებლის ოცნების შესახებ მამამ იცოდა."),
    standaloneItem("eng-2025-v4-t1", 2, "The speaker mentions the Seeds of Peace camp because she", [
      "was accepted there.",
      "spent a year there.",
      "didn't want to go there.",
      "failed the interview there.",
    ], "A", "Seeds of Peace-ის ბანაკს ახსენებს, რადგან იქ მიიღეს."),
    standaloneItem("eng-2025-v4-t1", 3, "How did the speaker's parents initially react to her studying abroad for a year?", [
      "They were indifferent.",
      "They weren't very enthusiastic about the idea.",
      "They were immediately supportive.",
      "They let their daughter make the decision herself.",
    ], "B", "თავიდან მშობლები დიდი ენთუზიაზმით არ შეხვდნენ იდეას."),
    standaloneItem("eng-2025-v4-t1", 4, "When the speaker was accepted as an exchange student, her parents were", [
      "disappointed.",
      "concerned.",
      "unhappy.",
      "proud.",
    ], "D", "გაცვლით სტუდენტად მიღების შემდეგ მშობლები ამაყობდნენ."),
    standaloneItem("eng-2025-v4-t1", 5, "What did the speaker and her host family do during the Thanksgiving break?", [
      "Explored national parks.",
      "Attended music festivals.",
      "Went to Disneyland.",
      "Participated in cultural events.",
    ], "C", "მადლიერების დღის არდადეგებზე დისნეილენდში წავიდნენ."),
    standaloneItem("eng-2025-v4-t1", 6, "Which activity was the speaker involved in during her exchange year in the USA?", [
      "Giving presentations.",
      "Exploring historical sites.",
      "Learning a new language.",
      "Developing new skills.",
    ], "A", "გაცვლის წლის განმავლობაში პრეზენტაციებს აკეთებდა."),
    standaloneItem("eng-2025-v4-t1", 7, "How did the speaker feel as the departure date approached?", [
      "Very excited.",
      "Indifferent.",
      "Unconfident.",
      "Sad but grateful.",
    ], "D", "წასვლის მოახლოებისას სევდიანი, მაგრამ მადლიერი იყო."),
    standaloneItem("eng-2025-v4-t1", 8, "Now that the speaker's back home, she wants to", [
      "start an English club.",
      "become the school president.",
      "participate in a new programme.",
      "become an English language teacher.",
    ], "A", "სახლში დაბრუნებული ინგლისურის კლუბის დაარსება სურს."),
  ],
};

const V4_T2_PARAGRAPHS = [
  { label: "A", text: `Legendary French actress Sarah Bernhardt won the hearts of theatregoers around the world but always remained faithful to Paris, the city of her birth and her very first triumphs. She has often been called 'the most famous actress in the history of the world'. Sarah Bernhardt made her fame on the stages of Europe in the 1870s, and was soon working in Europe and the United States. She developed a reputation as a serious actress, getting the nickname 'The Divine Sarah.'` },
  { label: "B", text: `One hundred years after her death, Sarah Bernhardt is still remembered as a star, well-known from Sydney to New York and from Cairo to Rio de Janeiro. Her talent as a tragic actress, along with what Victor Hugo called her 'golden voice,' earned her worldwide recognition. Sarah Bernhardt was also skilled at attracting people's attention, posing expertly for newspapers, photographers and gossip writers. Her enduring impact comes from her ability to create a captivating public image, making her one of the most interesting figures in theatre history.` },
  { label: "C", text: `Sarah was born in Paris in 1844. She spent much of her early childhood in a monastery near Versailles. It was only when she turned fourteen that she left the monastery to live with her mother. Her mother wanted her to get married at an early age, as she couldn't afford to keep Sarah and her sister at home. But Sarah categorically refused. When her mother's friend recommended Sarah to enroll in the acting school near her mother's home, it seemed like an excellent decision. From 1860 to 1862 Sarah showed interest in drama and was finally accepted by a theatre called the Comédie-Française. But just a few months later, in 1863, she was fired for having hit a famous actress who had violently pushed her little sister. To survive, Sarah took on small roles at the theatre called Théâtre du Gymnase.` },
  { label: "D", text: `Finally, in 1869 Sarah Bernhardt experienced her first triumph. It was at the theatre Odéon, where her performance was praised as graceful and charming. However, soon afterwards her home caught fire and she lost all of her belongings. To somehow help the actress, the Odéon organised an event in Sarah Bernhardt's honour which raised enough money for her to find a new place to live. When the Franco-Prussian War broke out in 1870, theatres closed down. But once peace was restored, Sarah Bernhardt again triumphed at the Odéon, this time in the leading role.` },
  { label: "E", text: `After this success, the Comédie-Française hired Sarah Bernhardt again and she soon became wealthy enough to build a Renaissance-style house. The mansion, which is a large expensive house, was built around her studio, where Sarah developed her sculpting skills. One of her works of art, After the Storm, was shown at what is now the Grand Palais. The studio was filled with paintings of herself in different roles, as well as strange things, like a skeleton named Lazare and a collection of stuffed bats and tigers. Sarah fulfilled all of her unusual desires; she even hired a balloon to fly over Paris during the World's Fair in 1878.` },
  { label: "F", text: `Despite all her success, Sarah spent more than she earned and in 1885 she had to sell her big house. She moved to a new home where she once again created her fantastic universe with the possessions she had saved from sale, including a painted ceiling by a famous artist. Despite a serious knee injury, she continued to perform on stage and even acted as the director of several Paris theatres. In 1915 her right leg was amputated, but she continued to perform until the very end. On March 26, 1923 the theatre legend died at her home. A huge crowd followed her funeral procession to Père Lachaise cemetery.` },
];

const V4_T2_BANK: EnglishOption[] = V4_T2_PARAGRAPHS.map((p) => ({
  label: p.label,
  text: `Paragraph ${p.label}`,
}));

const V4_TASK2: EnglishTask = {
  id: "eng-2025-v4-t2",
  number: 2,
  kind: "matching",
  title: "Reading — matching",
  instruction:
    "Read the questions (1-8) and find the answers to them in the paragraphs (A-F) of the text. Some paragraphs correspond to more than one question. (8 points)",
  points: 8,
  paragraphs: V4_T2_PARAGRAPHS,
  bank: V4_T2_BANK,
  items: [
    matchingItem("eng-2025-v4-t2", 1, "Which paragraph mentions where Sarah Bernhardt lived before joining her mother?", V4_T2_BANK, "C", "აბზაცი C: ბავშვობა ვერსალთან ახლოს მონასტერში გაატარა."),
    matchingItem("eng-2025-v4-t2", 2, "Which paragraph names the city Sarah Bernhardt was most devoted to?", V4_T2_BANK, "A", "აბზაცი A: ერთგული დარჩა პარიზის — დაბადებისა და პირველი ტრიუმფის ქალაქის."),
    matchingItem("eng-2025-v4-t2", 3, "Which paragraph describes Sarah Bernhardt's strange lifestyle?", V4_T2_BANK, "E", "აბზაცი E: ჩონჩხი Lazare, გატენილი ღამურები/ვეფხვები, ბუშტით ფრენა."),
    matchingItem("eng-2025-v4-t2", 4, "Which paragraph highlights Sarah Bernhardt's continuing international fame up to now?", V4_T2_BANK, "B", "აბზაცი B: სიკვდილიდან ასი წლის შემდეგაც ვარსკვლავად ახსოვთ."),
    matchingItem("eng-2025-v4-t2", 5, "Which paragraph mentions Sarah Bernhardt's first success at the Odéon?", V4_T2_BANK, "D", "აბზაცი D: 1869 წელს პირველი ტრიუმფი თეატრ Odéon-ში."),
    matchingItem("eng-2025-v4-t2", 6, "Which paragraph gives the reason why Sarah Bernhardt had to sell her big house?", V4_T2_BANK, "F", "აბზაცი F: მეტს ხარჯავდა, ვიდრე შოულობდა, და სახლი გაყიდა."),
    matchingItem("eng-2025-v4-t2", 7, "Which paragraph can have the title: 'Sarah Bernhardt's early struggles?'", V4_T2_BANK, "C", "აბზაცი C: სამსახურიდან გაათავისუფლეს და გადასარჩენად პატარა როლებს თამაშობდა."),
    matchingItem("eng-2025-v4-t2", 8, "Which paragraph can have the title: 'The support from the theatre community'?", V4_T2_BANK, "D", "აბზაცი D: Odéon-მა მის საპატივცემულოდ ღონისძიება მოაწყო და ფული შეაგროვა."),
  ],
};

const V4_TASK3: EnglishTask = {
  id: "eng-2025-v4-t3",
  number: 3,
  kind: "reading",
  title: "Reading",
  instruction:
    "Read the text and the questions which follow. For each question mark the correct answer (A, B, C or D). (8 points)",
  points: 8,
  passageText: `This is a true story told by Susan Evans who used to raise money for a children's home.

My family belonged to the middle class, and I was lucky enough to have all of my needs satisfied when I was growing up. However, I know that not everyone is as fortunate as I am. Even though it is impossible to help everyone, I firmly believe that kindness has the power to significantly improve the lives of those who are less fortunate. There are a lot of people who need financial and moral support. Just recently, I initiated a heartwarming fundraising activity for a children's home, which filled me with a great desire to make a positive difference in the lives of children who have experienced the loss of their parents. My dream was simple but strong: to provide these kids with more than just the things they need, like love, care and the opportunities they deserve. It was a straightforward but powerful dream. With this in mind, I reached out to members of my community, friends and colleagues, sharing the story of the children's home and the wonderful work that is being done there. My discovery that people are naturally generous and eager to make a difference in the world came as a complete surprise to me.

Fundraising became a way to unite people around a common goal. From organising charity marathons and selling homemade cookies to initiating online campaigns and collecting donations, each effort brought us closer to our goal. The response was incredible - people from different social classes came together, showing that people are kind to each other no matter what. One remarkable success story was the renovation of the children's home, which became a safe place for a young girl named Sarah. Even though Sarah had gone through a lot of problems, she was able to access high-quality education with the additional financial support which we raised. It was truly inspiring to see how she was changing from a shy, uncertain child into a confident, ambitious young woman. Her story strengthened the belief that even a small effort can have a significant impact on a child's life. As the funds grew, I saw how the children's home started to transform. Thanks to the generosity of others, living conditions improved, educational opportunities expanded and a caring environment full of hope and optimism became possible. This experience served as a powerful reminder of the positive change that can happen when people work together to support those in need. Through this journey, I've learned that raising funds is about more than just financial support; it's about building a network of kind individuals committed to making a difference.

In conclusion, raising funds for the children's home has been an incredibly meaningful experience. It has strengthened my trust in the kindness of others, as I've seen how naturally people are willing to help, and in our collective ability to create a better future for those who need it most. As I continue on this path, I'm filled with gratitude for the opportunity to contribute to the well-being and happiness of these amazing children, knowing that our efforts are paving the way for a brighter tomorrow.`,
  items: [
    standaloneItem("eng-2025-v4-t3", 1, "Why did Susan decide to gather funds for a children's home?", [
      "She came from a poor family.",
      "She wanted to assist poor families.",
      "She wanted to help children in need.",
      "She was brought up in a children's home.",
    ], "C", "სიუზანს სურდა გასჭირვებულ ბავშვებს — მშობლებდაკარგულებს — დახმარებოდა."),
    standaloneItem("eng-2025-v4-t3", 2, "When Susan shared her story with her friends, she was surprised that people", [
      "refused to help.",
      "were willing to help.",
      "didn't care about children's needs.",
      "doubted the children's home existed.",
    ], "B", "სიუზანი გაოცდა, რომ ხალხი ბუნებრივად გულუხვი და დახმარების მსურველი აღმოჩნდა."),
    standaloneItem("eng-2025-v4-t3", 3, "How did people react to the fundraising initiative?", [
      "People ignored it.",
      "It led to social divisions.",
      "Only wealthy people participated.",
      "It united people from different social groups.",
    ], "D", "ინიციატივამ სხვადასხვა სოციალური ფენის ხალხი გააერთიანა."),
    standaloneItem("eng-2025-v4-t3", 4, "The additional finances raised were used for", [
      "helping Sarah find a new home.",
      "buying an apartment for Sarah.",
      "inspiring Sarah to support other kids.",
      "giving Sarah a good education.",
    ], "D", "დამატებითი სახსრები სარას ხარისხიანი განათლებისთვის მოხმარდა."),
    standaloneItem("eng-2025-v4-t3", 5, "The community believed their fundraising made a difference because Sarah", [
      "transformed so much.",
      "worked hard.",
      "had future plans.",
      "was devoted to learning.",
    ], "A", "სარა მორცხვი ბავშვიდან თავდაჯერებულ ახალგაზრდად გარდაიქმნა."),
    standaloneItem("eng-2025-v4-t3", 6, "What happened to the children's home when it started to receive more money?", [
      "Stayed the same.",
      "Changed for the better.",
      "Received less support.",
      "Still had problems with money.",
    ], "B", "მეტი ფულის მოზიდვისას ბავშვთა სახლი უკეთესობისკენ შეიცვალა."),
    standaloneItem("eng-2025-v4-t3", 7, "How did Susan feel about her fundraising experience?", [
      "She felt it was really important.",
      "She didn't really understand it.",
      "She only did it because she had to.",
      "She realised it was a waste of time.",
    ], "A", "სიუზანისთვის ეს გამოცდილება ძალიან მნიშვნელოვანი იყო."),
    standaloneItem("eng-2025-v4-t3", 8, "Which of the following would be the best title for the text?", [
      "Challenges in fundraising",
      "Fundraiser's hard job",
      "The power of kindness",
      "Charity doesn't always work",
    ], "C", "ტექსტი სიკეთის ძალაზეა — „The power of kindness“."),
  ],
};

const V4_T4_BANK: EnglishOption[] = [
  { label: "A", text: "ability" },
  { label: "B", text: "achieve" },
  { label: "C", text: "citizens" },
  { label: "D", text: "creating" },
  { label: "E", text: "discovered" },
  { label: "F", text: "draw" },
  { label: "G", text: "drawings" },
  { label: "H", text: "encourages" },
  { label: "I", text: "famous" },
  { label: "J", text: "generations" },
  { label: "K", text: "manner" },
  { label: "L", text: "memory" },
  { label: "M", text: "unusual" },
  { label: "N", text: "worldwide" },
];

const V4_TASK4: EnglishTask = {
  id: "eng-2025-v4-t4",
  number: 4,
  kind: "vocabulary",
  title: "Vocabulary",
  instruction:
    "Read the text and fill the gaps with the words given (A-N). Use each word only once. Two words are extra. (12 points)",
  points: 12,
  bank: V4_T4_BANK,
  sharedText: `The strongest memory in the world

Stephen Wiltshire is an amazing artist. He was born in London, England. Stephen is gifted with an extraordinary mental and physical __(1)__ for drawing. He is __(2)__ for his excellent pictures of sights of the cities. He can __(3)__ entire cities from memory. His work is admired around the world and he has been called 'The Human Camera' due to his remarkable photographic memory. Stephen Wiltshire has painted cities like New York and London in an unbelievably detailed and accurate __(4)__. Stephen's story is very __(5)__. He was still very young, when doctors __(6)__ that he had autism. Despite great challenges, Stephen managed to shape his character. As a result, he became a famous and extremely talented artist who created complicated works and became popular __(7)__. Stephen's art is admired all over the world. People visit his exhibitions to see a variety of his magnificent __(8)__. His most famous works are fifteen city panoramas drawn from his __(9)__. Drawing street life and modern architecture have been Stephen's interest for as long as he can remember. Stephen's work shows that anyone can __(10)__ their goals with hard work and dedication. His achievement truly __(11)__ many people, especially those having similar difficulties. Stephen Wilshire's artwork will continue to amaze future __(12)__. His story shows the power of hard work and creativity in overcoming challenges.`,
  items: [
    matchingItem("eng-2025-v4-t4", 1, "", V4_T4_BANK, "A", "„an extraordinary … ability for drawing“ — უნარი."),
    matchingItem("eng-2025-v4-t4", 2, "", V4_T4_BANK, "I", "„He is famous for“ — ცნობილი."),
    matchingItem("eng-2025-v4-t4", 3, "", V4_T4_BANK, "F", "„He can draw entire cities“ — დახატვა."),
    matchingItem("eng-2025-v4-t4", 4, "", V4_T4_BANK, "K", "„in an … accurate manner“ — მანერით/ხერხით."),
    matchingItem("eng-2025-v4-t4", 5, "", V4_T4_BANK, "M", "„is very unusual“ — უჩვეულო."),
    matchingItem("eng-2025-v4-t4", 6, "", V4_T4_BANK, "E", "„doctors discovered that he had autism“ — აღმოაჩინეს."),
    matchingItem("eng-2025-v4-t4", 7, "", V4_T4_BANK, "N", "„became popular worldwide“ — მსოფლიოში."),
    matchingItem("eng-2025-v4-t4", 8, "", V4_T4_BANK, "G", "„his magnificent drawings“ — ნახატები."),
    matchingItem("eng-2025-v4-t4", 9, "", V4_T4_BANK, "L", "„drawn from his memory“ — მეხსიერებით."),
    matchingItem("eng-2025-v4-t4", 10, "", V4_T4_BANK, "B", "„can achieve their goals“ — მიაღწიოს."),
    matchingItem("eng-2025-v4-t4", 11, "", V4_T4_BANK, "H", "„truly encourages many people“ — ამხნევებს."),
    matchingItem("eng-2025-v4-t4", 12, "", V4_T4_BANK, "J", "„future generations“ — თაობები."),
  ],
};

const V4_TASK5: EnglishTask = {
  id: "eng-2025-v4-t5",
  number: 5,
  kind: "grammar",
  title: "Use of English",
  instruction: "Read the text and mark the correct choice A, B, C or D. (12 points)",
  points: 12,
  sharedText: `The story of the Nike logo

In 1970 Nike, now the world's largest athletic footwear and clothing company, was in need of a unique logo. The company wanted a symbol that would represent movement, speed __(1)__ excellence. In 1971 Nike's co-founder Phil Knight asked Carolyn Davidson, a young art student at Portland State University, to design the logo. Within __(2)__ week, Davidson created a symbol that would become one of the most recognisable logos in history. The inspiration for the logo's shape came __(3)__ the wings of the Greek goddess Nike, who symbolised victory and inspired countless ancient warriors. According __(4)__ Greek mythology, Nike was believed to bring victory in battle and her name became associated __(5)__ success and glory. It is said that victorious Greeks would exclaim 'This is Nike!' to celebrate their victory in her name. Carolyn Davidson was paid only 35 dollars for designing the logo, which she created __(6)__ exploring different shapes and ideas to show motion, speed and achievement. After trying several designs, Davidson came up with a shape like a stylised tick, which we now recognise __(7)__ the Swoosh - Nike's famous logo. As time went __(8)__, Davidson's simple design became a key element in Nike's success and global recognition. Some might think __(9)__ Carolyn Davidson was underpaid for the work, but in 1983 Nike's co-founder Phil Knight decided to thank her __(10)__ creating the iconic logo. He invited her __(11)__ lunch, which turned out to be a surprise party in her honour. At the party, Knight gave Davidson a gold ring with the Swoosh and a diamond, along __(12)__ 500 shares of the company.`,
  items: [
    standaloneItem("eng-2025-v4-t5", 1, "Gap (1)", ["but", "and", "nor", "until"], "B", "„movement, speed and excellence“ — and."),
    standaloneItem("eng-2025-v4-t5", 2, "Gap (2)", ["a", "an", "those", "that"], "A", "„Within a week“ — a."),
    standaloneItem("eng-2025-v4-t5", 3, "Gap (3)", ["out", "by", "from", "over"], "C", "„came from the wings“ — from."),
    standaloneItem("eng-2025-v4-t5", 4, "Gap (4)", ["with", "on", "in", "to"], "D", "„According to Greek mythology“ — to."),
    standaloneItem("eng-2025-v4-t5", 5, "Gap (5)", ["with", "for", "by", "in"], "A", "„associated with success“ — with."),
    standaloneItem("eng-2025-v4-t5", 6, "Gap (6)", ["with", "for", "by", "of"], "C", "„created by exploring different shapes“ — by."),
    standaloneItem("eng-2025-v4-t5", 7, "Gap (7)", ["so", "such", "like", "as"], "D", "„recognise as the Swoosh“ — as."),
    standaloneItem("eng-2025-v4-t5", 8, "Gap (8)", ["off", "by", "of", "for"], "B", "„As time went by“ — by."),
    standaloneItem("eng-2025-v4-t5", 9, "Gap (9)", ["that", "which", "what", "this"], "A", "„Some might think that“ — that."),
    standaloneItem("eng-2025-v4-t5", 10, "Gap (10)", ["to", "by", "for", "with"], "C", "„thank her for creating“ — for."),
    standaloneItem("eng-2025-v4-t5", 11, "Gap (11)", ["at", "to", "with", "on"], "B", "„invited her to lunch“ — to."),
    standaloneItem("eng-2025-v4-t5", 12, "Gap (12)", ["by", "on", "under", "with"], "D", "„along with 500 shares“ — with."),
  ],
};

const V4_T6_BANK: EnglishOption[] = [
  { label: "A", text: "So Sam, is it too bad?" },
  { label: "B", text: "That would be amazing! I couldn't dream of a better result!" },
  { label: "C", text: "I did. In fact, I really did my best, but you never know." },
  { label: "D", text: "So, you mean we passed?" },
  { label: "E", text: "Yes, it's the hardest exam I've ever taken." },
  { label: "F", text: "I know, but I'm too nervous. Why don't YOU go and find out how we did?" },
  { label: "G", text: "That's great, but I was hoping for more than just a pass." },
  { label: "H", text: "Sure, I'm so happy I got the highest score on the exam!" },
];

const V4_TASK6: EnglishTask = {
  id: "eng-2025-v4-t6",
  number: 6,
  kind: "dialogue",
  title: "Dialogue",
  instruction:
    "Complete the conversation. For questions 1-6 mark the correct letter A-H. Two sentences are extra. (6 points)",
  points: 6,
  bank: V4_T6_BANK,
  sharedText: `At the university

Katie: Oh look, Sam! The professor is posting the exam results on the noticeboard. But I'm too nervous to go and see them.
Sam: What are you worried about? You studied hard, didn't you?
Katie: __(1)__
Sam: Well, we won't know our marks unless we check the results ourselves.
Katie: __(2)__
Sam: All right, stay here; I'll go and check.
Katie: __(3)__
Sam: Cheer up, Katie! I've got great news for you - there's really no need to panic. It looks like our exam preparation plan has worked for both of us.
Katie: __(4)__
Sam: Yes, we did!
Katie: __(5)__
Sam: So was I, and it's definitely more than just a pass! How would you feel about being top of the class with 96%?
Katie: __(6)__
Sam: That's exactly what you got! You're first in the class and I'm right behind you! I'm so happy for both of us!`,
  items: [
    matchingItem("eng-2025-v4-t6", 1, "", V4_T6_BANK, "C", "„I really did my best, but you never know“ — გულმოდგინედ ვსწავლობდი, მაგრამ ვერ ვიცი."),
    matchingItem("eng-2025-v4-t6", 2, "", V4_T6_BANK, "F", "ძალიან ღელავს — სთხოვს სემს, თვითონ შეამოწმოს."),
    matchingItem("eng-2025-v4-t6", 3, "", V4_T6_BANK, "A", "„So Sam, is it too bad?“ — შფოთვით ეკითხება შედეგზე."),
    matchingItem("eng-2025-v4-t6", 4, "", V4_T6_BANK, "D", "„So, you mean we passed?“ — ჩავაბარეთო?"),
    matchingItem("eng-2025-v4-t6", 5, "", V4_T6_BANK, "G", "„I was hoping for more than just a pass“ — მეტს ველოდი."),
    matchingItem("eng-2025-v4-t6", 6, "", V4_T6_BANK, "B", "„That would be amazing!“ — 96%-ის ხსენების პასუხი."),
  ],
};

const VARIANT_4: EnglishExamVariant = {
  id: "english-2025-v4",
  label: "IV ვარიანტი",
  year: 2025,
  durationSeconds: 2 * 3600 + 30 * 60,
  totalPoints: 70,
  tasks: [V4_TASK1, V4_TASK2, V4_TASK3, V4_TASK4, V4_TASK5, V4_TASK6],
  essay: {
    id: "eng-2025-v4-t7",
    number: 7,
    prompt:
      "Many young people nowadays make friends through internet sites and different applications. What do YOU think about this? Give your own opinion and support it with arguments.",
    minWords: 120,
    maxWords: 170,
    points: 16,
  },
};

/* ========================= ESSAY PROMPT BANK ============================= */

/**
 * All four 2025 Task 7 essay prompts, for the writing practice's random draw.
 * Derived from the variants themselves so the prompts never drift from the exam
 * data — every prompt is verbatim from its booklet in `docs/exam-sources/english/`.
 */
export interface EnglishEssayPrompt {
  essay: EnglishEssayTask;
  year: number;
  variantLabel: string;
}

/* ============================ REGISTRY ================================== */

export const ENGLISH_2025: EnglishExamYear = {
  year: 2025,
  variants: [VARIANT_1, VARIANT_2, VARIANT_3, VARIANT_4],
};

export const ENGLISH_ESSAY_PROMPTS_2025: EnglishEssayPrompt[] = ENGLISH_2025.variants.map(
  (v) => ({ essay: v.essay, year: v.year, variantLabel: v.label }),
);
