import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

export interface QuizQuestion {
  id: number;
  type: "multiple_choice" | "open_ended";
  question: string;
  options?: string[];
  correct_answer?: number;
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  total: number;
  selectedOption: number | null;
  openAnswer: string;
  onSelect: (index: number) => void;
  onOpenAnswer: (value: string) => void;
  onNext: () => void;
}

export function QuestionCard({
  question,
  index,
  total,
  selectedOption,
  openAnswer,
  onSelect,
  onOpenAnswer,
  onNext,
}: QuestionCardProps) {
  const progress = Math.round(((index + 1) / total) * 100);

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <span>
          კითხვა {index + 1} / {total}
        </span>
        <span className="mono">30 🔥</span>
      </div>
      <ProgressBar value={progress} />

      <h3 className="mt-6 text-lg font-semibold">{question.question}</h3>

      {question.type === "multiple_choice" ? (
        <div className="mt-4 space-y-2">
          {(question.options ?? []).map((option, optionIndex) => {
            const active = selectedOption === optionIndex;
            return (
              <button
                key={`${question.id}-${optionIndex}`}
                type="button"
                onClick={() => onSelect(optionIndex)}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? "border-[var(--accent-primary)] bg-[color-mix(in_oklab,var(--accent-primary),transparent_85%)]"
                    : "border-[var(--border-hover)] bg-[var(--bg-secondary)]"
                }`}
              >
                <span>{active ? "●" : "○"}</span>
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={openAnswer}
          onChange={(e) => onOpenAnswer(e.target.value)}
          placeholder="შენი პასუხი..."
          className="mt-4 min-h-28 w-full rounded-xl border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 outline-none focus:border-[var(--accent-primary)]"
        />
      )}

      <div className="mt-5 flex justify-end">
        <Button onClick={onNext}>შემდეგი →</Button>
      </div>
    </section>
  );
}
