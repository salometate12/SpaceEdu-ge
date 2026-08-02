"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const FAQ_ITEMS = [
  {
    q: "შემიძლია გაუქმება ნებისმიერ დროს?",
    a: "დიახ, გამოწერის გაუქმება ნებისმიერ დროს შეგიძლიათ. პრემიუმ ფუნქციებზე წვდომა მიმდინარე საანგარიშო თვის ბოლომდე შეგინარჩუნდებათ.",
  },
  {
    q: "რა ენაზე მუშაობს AI?",
    a: "ძირითადად ქართულად, ინგლისურზეც პასუხობს.",
  },
  {
    q: "ეროვნულების პაკეტი მხოლოდ 3 თვეა?",
    a: "კი, მარტი-ივნისი — გამოცდების სეზონზე მორგებული.",
  },
  {
    q: "გადახდა როგორ ხდება?",
    a: "Visa/Mastercard, BOG Pay, TBC Pay.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h2 className="headline mb-5 text-2xl font-bold">FAQ</h2>
      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const open = openIndex === idx;
          return (
            <RevealOnScroll key={item.q} delayMs={100 * (idx + 1)}>
              <div className="card landing-wow p-0">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--text-secondary)]">
                    {item.a}
                  </div>
                )}
              </div>
            </RevealOnScroll>
          );
        })}
      </div>
    </section>
  );
}
