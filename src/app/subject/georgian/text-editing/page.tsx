import type { Metadata } from "next";
import { TextEditingExercise } from "@/components/abiturient/georgian/TextEditingExercise";

export const metadata: Metadata = {
  title: "ტექსტის რედაქტირება — სავარჯიშო",
  description:
    "ივარჯიშე ეროვნული გამოცდის I ნაწილზე — წინა წლების რეალურ სარედაქციო დავალებებზე, შემფასებლის კრიტერიუმებით.",
  alternates: { canonical: "/subject/georgian/text-editing" },
};

export default function GeorgianTextEditingPage() {
  return <TextEditingExercise />;
}
