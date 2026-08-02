export interface LitWork {
  id: string;
  author: string;
  title: string;
  detail?: string;
  programHint?: string;
}

export interface LitPeriod {
  id: string;
  label: string;
  works: LitWork[];
}

export const LIT_PERIODS: LitPeriod[] = [
  {
    id: "hagiographic",
    label: "სასულიერი და ჰაგიოგრაფიული",
    works: [
      {
        id: "susaniki",
        author: "იაკობ ცუცაშვილი",
        title: "სუსანიკის წამება",
        programHint: "სასკოლო შემოკლებული ვარიანტი; ჰაგიოგრაფიული ნარატივი.",
      },
      {
        id: "abo",
        author: "იოვანე საბანისძე",
        title: "აბო თბილისელი",
        programHint: "სასკოლო შემოკლებული ვარიანტი.",
      },
      {
        id: "grigol-khandzteli",
        author: "გიორგი მერჩულე",
        title: "გრიგოლ ხანძთელის ცხოვრება",
        programHint: "სასკოლო შემოკლებული ვარიანტი.",
      },
    ],
  },
  {
    id: "medieval",
    label: "ქართული სამიერი",
    works: [
      {
        id: "vepkhistkaosani",
        author: "შოთა რუსტაველი",
        title: "ვეფხისტყაოსანი",
        detail:
          "დასაწყისიდან ტარიელის ფიცამდე, დასასრული; ეპიზოდები: სიბრძნე-სიწყალე, მეფე ხორასანი, ზუნუნი, უგუნური მკურნალი, დავითიანი",
        programHint: "2026 საგამოცდო პროგრამის ფრაგმენტები და ეპიზოდები.",
      },
      {
        id: "sibrdzne-sitsruisa",
        author: "სულხან-საბა ორბელიანი",
        title: "წიგნი სიბრძნე-სიცრუისა",
        detail: "ლეონის თავგადასავალი",
      },
      {
        id: "davitiani",
        author: "დავით გურამიშვილი",
        title: "დავითიანი",
        detail: "ქართლის ჭირი; ეპიზოდები: დავითის დურმი, მხიარული ზაფხული",
        programHint: "ისტორიული ნარატივი „ქართლის ჭირი“.",
      },
    ],
  },
  {
    id: "xviii",
    label: "XVIII საუკუნე",
    works: [
      {
        id: "gogcha",
        author: "ალექსანდრე ჭავჭავაძე",
        title: "გოგჩა",
        detail: "ლექსი",
      },
    ],
  },
  {
    id: "xix-romantic",
    label: "XIX საუკუნე — რომანტიზმი",
    works: [
      {
        id: "baratashvili",
        author: "ნიკოლოზ ბარათაშვილი",
        title: "პოეზია",
        detail:
          "თამარ მეფის სახე ბეთანიის ეკლესიაში, სარამო გამოსალმებისა, პასუხი შვილთა; პოემა „ბედი ქართლისა“",
      },
      {
        id: "grigol-orbeliani",
        author: "გრიგოლ ორბელიანი",
        title: "პოეზია",
        detail: "საყვარელი, მერანი და სხვა ლექსები XIX საუკუნის რომანტიკული პოეზიიდან",
      },
    ],
  },
  {
    id: "xix-realism",
    label: "XIX საუკუნე — რეალიზმი",
    works: [
      {
        id: "ilia",
        author: "ილია ჭავჭავაძე",
        title: "ნაწარმოებები",
        detail:
          "ლექსები: ბედნიერი ერი, პასუხის პასუხი, ჩემო ქალამო; პოემები: განდეგილი, აჩრდილი; მოთხრობები; „რა გითხრათ? რით გაგხაროთ?“",
      },
      {
        id: "akaki",
        author: "აკაკი ცხენბელა",
        title: "ნაწარმოებები",
        detail:
          "პოემები: თორნიკე ერისთავი, გამზრდელი; მოთხრობა „ხევისბერი გოჩა“; ლექსები: სულიკო, განთიადი",
      },
      {
        id: "kazbegi",
        author: "ალექსანდრე ყაზბეგი",
        title: "სამანისების დედინაცვალი",
        detail: "მოთხრობა",
      },
      {
        id: "vazha",
        author: "ვაჟა-ფშაველა",
        title: "ნაწარმოებები",
        detail:
          "პოემები: ალუდა ქეთელაური, ბახტრიონი, სტუმარ-მასპინძელი; მოთხრობა „ამოდის, ნათდება“",
      },
      {
        id: "kldiashvili",
        author: "დავით კლდიაშვილი",
        title: "სამანიშვილის დედინაცვალი",
        detail: "სოციალური სატირა, ფეოდალური ურთიერთობების კრიტიკა",
      },
    ],
  },
  {
    id: "xx",
    label: "XX საუკუნე",
    works: [
      {
        id: "jokha",
        author: "მიხეილ ჯავახიშვილი",
        title: "ნაწარმოებები",
        detail: "დიდოსტატის მარჯვენა; ჯაყოს ხიზნები",
      },
      {
        id: "kiacheli",
        author: "ლეო კიაჩელი",
        title: "ნაწარმოებები",
        detail: "ჰაქი აზნაური; პიესა „ყვარევ, თუთაშხირა“",
      },
      {
        id: "galaktion",
        author: "გალაქტიონ ტაბიძე",
        title: "პოეზია",
        detail:
          "ფიქრთა თვალსაზღვარზე, თოვლი, მე და რამე, მთავნდის მთვარე, სილაჟვარდე, შერიგება",
      },
      {
        id: "titian",
        author: "ტიციან ტაბიძე",
        title: "პოეზია",
        detail: "ლექსი მწერისა; ანანურთან",
      },
      {
        id: "gamsakhurdia",
        author: "კონსტანტინე გამსახურდია",
        title: "ნაწარმოებები",
        detail: "დიდი ეპოპეა „დიდი ნაბიჯი“; პოემა „ალუდა“",
      },
      {
        id: "guram",
        author: "გურამ რიშველაშვილი",
        title: "ალავერდობა",
      },
      {
        id: "kharabadze",
        author: "ჯემალ ხარჭყაძე",
        title: "მოთხრობები",
        detail: "იგი; კაცი, რომელსაც ლიტერატურა ძლიერ უყვარდა",
      },
      {
        id: "ana",
        author: "ანა კალანდაძე",
        title: "მკვდართა მზე ვარ",
      },
      {
        id: "pablo",
        author: "პაოლო იაშვილი",
        title: "პოეზია",
      },
      {
        id: "niko",
        author: "ნიკო ლორთქიფანიძე",
        title: "შელოცვა რადიოთი",
      },
    ],
  },
];

export const ALL_LIT_WORKS: LitWork[] = LIT_PERIODS.flatMap((p) => p.works);

export function getLitWorkById(id: string): LitWork | undefined {
  return ALL_LIT_WORKS.find((w) => w.id === id);
}

export function formatLitWorkLabel(work: LitWork): string {
  return `${work.author} — „${work.title}“`;
}
