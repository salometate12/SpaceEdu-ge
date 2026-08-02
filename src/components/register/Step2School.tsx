"use client";

import { Button } from "@/components/ui/Button";
import { SubjectSelector } from "./SubjectSelector";
import { SCHOOL_SUBJECTS } from "./types";

interface Step2SchoolProps {
  selected: string[];
  onToggle: (subject: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step2School({ selected, onToggle, onBack, onNext }: Step2SchoolProps) {
  return (
    <>
      <h2 className="headline text-xl font-semibold">საგნების არჩევა</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        მონიშნე ძირითადი საგნები, რაშიც გჭირდება დახმარება.
      </p>
      <div className="mt-4">
        <SubjectSelector
          items={SCHOOL_SUBJECTS}
          selected={selected}
          onToggle={onToggle}
          accent="purple"
        />
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" onClick={onBack} className="flex-1">
          ← უკან
        </Button>
        <Button onClick={onNext} className="flex-1">
          შემდეგი →
        </Button>
      </div>
    </>
  );
}

