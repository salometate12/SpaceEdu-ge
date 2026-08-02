import { Button } from "@/components/ui/Button";

interface ResultsProps {
  score: number;
  total: number;
  weakTopics: string[];
  onRestart: () => void;
}

export function Results({ score, total, weakTopics, onRestart }: ResultsProps) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  return (
    <section className="card">
      <h2 className="headline text-xl font-semibold">შედეგები</h2>
      <p className="mono mt-2 text-2xl font-bold text-[var(--accent-secondary)]">
        {score} / {total} ({percent}%)
      </p>
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
          სუსტი თემები
        </h3>
        {weakTopics.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            შესანიშნავი შედეგი — სუსტი თემა არ დაფიქსირდა.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
            {weakTopics.map((topic) => (
              <li key={topic}>• {topic}</li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        რჩევა: სუსტი თემებისთვის გააკეთე მოკლე განმეორება და შემდეგ გაუშვი ახალი Quiz.
      </p>
      <Button className="mt-5" onClick={onRestart}>
        თავიდან დაწყება
      </Button>
    </section>
  );
}
