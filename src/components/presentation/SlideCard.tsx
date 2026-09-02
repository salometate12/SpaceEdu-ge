import type { GeneratedSlide, PresentationTemplate } from "./PresentationWizard";

interface SlideCardProps {
  slide: GeneratedSlide;
  index: number;
  template: PresentationTemplate;
}

const TYPE_COLOR: Record<GeneratedSlide["type"], string> = {
  cover: "bg-purple-500/20 text-purple-200",
  content: "bg-cyan-500/20 text-cyan-200",
  image: "bg-pink-500/20 text-pink-200",
  stats: "bg-amber-500/20 text-amber-200",
  conclusion: "bg-green-500/20 text-green-200",
};

export function SlideCard({ slide, index, template }: SlideCardProps) {
  return (
    <article
      className="calendar-day-in rounded-xl border p-4"
      style={{
        backgroundColor: template.bg,
        borderColor: template.border,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="mono rounded-full bg-white/10 px-2 py-0.5 text-xs">
          #{index + 1}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${TYPE_COLOR[slide.type]}`}>
          {slide.type}
        </span>
      </div>
      <h3 className="headline text-lg font-semibold" style={{ color: template.accent }}>
        {slide.title}
      </h3>
      {slide.body && <p className="mt-2 text-sm text-[var(--text-secondary)]">{slide.body}</p>}
      {slide.points && slide.points.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
          {slide.points.map((pt) => (
            <li key={pt}>• {pt}</li>
          ))}
        </ul>
      )}
      {slide.photoBase64 && (
        <img
          src={slide.photoBase64}
          alt={slide.title}
          className="mt-3 h-40 w-full rounded-lg object-cover"
        />
      )}
    </article>
  );
}
