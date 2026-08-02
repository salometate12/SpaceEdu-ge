import type { Deck } from "../types";

export const universityDataStructuresDeck: Deck = {
  id: "university-data-structures",
  title: "მონაცემთა სტრუქტურები",
  description:
    "საუნივერსიტეტო სივრცე: აბსტრაქტული მონაცემთა ტიპები, დროითი სირთულე და პრაქტიკული ალგორითმული ანალიზი.",
  category: "math",
  cards: [
    {
      id: "uni-ds-1",
      question: "რა განსხვავებაა Array-სა და Linked List-ს შორის?",
      answer:
        "Array ინახება უწყვეტ მეხსიერებაში და ინდექსით წვდომა სწრაფია, Linked List კი კვანძების ჯაჭვია და ჩასმა/წაშლა პოზიციაზე ხშირად მოქნილია.",
    },
    {
      id: "uni-ds-2",
      question: "Stack-ისა და Queue-ის ძირითადი პრინციპები რა არის?",
      answer:
        "Stack მუშაობს LIFO პრინციპით (ბოლოს შემოსული პირველი გადის), Queue კი FIFO პრინციპით (პირველი შემოსული პირველი გადის).",
    },
    {
      id: "uni-ds-3",
      question: "Big-O აღნიშვნა რა მიზანს ემსახურება?",
      answer:
        "Big-O აღწერს ალგორითმის ზრდად სირთულეს შეყვანის ზომის მიმართ და გვაძლევს ეფექტურობის შედარების ფორმალურ ჩარჩოს.",
    },
  ],
};
