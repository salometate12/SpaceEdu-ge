"use client";

import Link from "next/link";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Award,
  BookText,
  Check,
  ChevronLeft,
  Flame,
  Gem,
  Info,
  Lightbulb,
  RefreshCw,
  Shuffle,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import {
  READING_COMPREHENSION_PASSAGES,
  buildRandomQuestionQueue,
  passageCategoryLabel,
  pickRandomPassage,
  questionTypeLabel,
  type Passage,
  type Question,
} from "@/data/readingComprehensionData";

const GEORGIAN_HUB_HREF = "/subject/georgian/space";

type Phase = "intro" | "active" | "results";

interface AnswerRecord {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  pointsEarned: number;
}

/* -------------------------------------------------------------------------- */
/*                            GAME SCORING HELPERS                            */
/* -------------------------------------------------------------------------- */

const POINTS_BASE = 10;
const POINTS_STREAK_STEP = 5;
const POINTS_STREAK_CAP = 4;

/** Correct answers earn more the longer the current streak runs. */
function pointsForStreak(streakAfterAnswer: number): number {
  const bonusSteps = Math.min(Math.max(streakAfterAnswer - 1, 0), POINTS_STREAK_CAP);
  return POINTS_BASE + bonusSteps * POINTS_STREAK_STEP;
}

function starsForPercent(percent: number): number {
  if (percent >= 85) return 3;
  if (percent >= 55) return 2;
  if (percent > 0) return 1;
  return 0;
}

function fireCorrectBurst() {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 24,
    spread: 48,
    startVelocity: 26,
    gravity: 1.1,
    ticks: 75,
    scalar: 0.75,
    origin: { x: 0.82, y: 0.25 },
    colors: ["#22D3EE", "#38BDF8", "#A78BFA", "#FBBF24"],
    disableForReducedMotion: true,
  });
}

function fireResultsBurst() {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 36,
    gravity: 1,
    ticks: 130,
    scalar: 0.9,
    origin: { x: 0.5, y: 0.3 },
    colors: ["#22D3EE", "#38BDF8", "#A78BFA", "#FBBF24", "#34D399"],
    disableForReducedMotion: true,
  });
}

/* -------------------------------------------------------------------------- */
/*                             HELPER — HIGHLIGHT                             */
/* -------------------------------------------------------------------------- */

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Render an excerpt with optional in-place highlighting of a phrase.
 * Case-sensitive; matches Georgian text exactly as authored in data.
 */
function HighlightedExcerpt({
  text,
  highlight,
}: {
  text: string;
  highlight?: string;
}) {
  const paragraphs = useMemo(() => text.split(/\n{2,}/), [text]);

  return (
    <div className="reading-panel-body space-y-5 text-[15.5px] leading-[2] text-white/90">
      {paragraphs.map((paragraph, index) => {
        if (!highlight || !paragraph.includes(highlight)) {
          return <p key={`p-${index}`}>{paragraph}</p>;
        }

        const parts = paragraph.split(new RegExp(`(${escapeRegExp(highlight)})`));
        return (
          <p key={`p-${index}`}>
            {parts.map((part, partIndex) => {
              if (part === highlight) {
                return (
                  <motion.mark
                    key={`hl-${index}-${partIndex}`}
                    initial={{ backgroundColor: "rgba(34,211,238,0)" }}
                    animate={{ backgroundColor: "rgba(34,211,238,0.16)" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="rounded-md bg-cyan-500/15 px-1 py-0.5 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]"
                  >
                    {part}
                  </motion.mark>
                );
              }
              return <span key={`s-${index}-${partIndex}`}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            HELPER — TYPE BADGE                             */
/* -------------------------------------------------------------------------- */

const TYPE_BADGE: Record<
  Question["type"],
  { label: string; className: string; icon: ReactNode; dot: string }
> = {
  main_idea: {
    label: questionTypeLabel("main_idea"),
    className: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    icon: <BookText className="h-3.5 w-3.5 stroke-[1.75]" />,
    dot: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]",
  },
  implied_meaning: {
    label: questionTypeLabel("implied_meaning"),
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    icon: <Lightbulb className="h-3.5 w-3.5 stroke-[1.75]" />,
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
  },
  literary_trope: {
    label: questionTypeLabel("literary_trope"),
    className: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    icon: <Sparkles className="h-3.5 w-3.5 stroke-[1.75]" />,
    dot: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]",
  },
};

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function ReadingComprehensionExercise() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [passage, setPassage] = useState<Passage | null>(null);
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  // Gamification state — score, live streak, and the best streak reached
  // during the current session (used for the results-screen badge).
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [scoreToast, setScoreToast] = useState<{ id: number; amount: number } | null>(null);

  const rightPanelRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questionQueue[currentIndex];
  const isLastQuestion = currentIndex >= questionQueue.length - 1;
  const totalQuestions = questionQueue.length;
  const correctCount = answers.filter((a) => a.correct).length;

  /* --------------------------- lifecycle actions -------------------------- */

  const startNewSession = useCallback(() => {
    const nextPassage = pickRandomPassage(passage?.id);
    const queue = buildRandomQuestionQueue(nextPassage);
    setPassage(nextPassage);
    setQuestionQueue(queue);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsRevealed(false);
    setShowExplanation(false);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setScoreToast(null);
    setPhase("active");
  }, [passage?.id]);

  const abandonSession = useCallback(() => {
    setPhase("intro");
    setSelectedIndex(null);
    setIsRevealed(false);
    setShowExplanation(false);
    setScoreToast(null);
  }, []);

  const revealAnswer = useCallback(() => {
    if (selectedIndex === null || !currentQuestion || isRevealed) return;
    const correct = selectedIndex === currentQuestion.correctIndex;
    setIsRevealed(true);
    setShowExplanation(true);

    if (correct) {
      const nextStreak = streak + 1;
      const earned = pointsForStreak(nextStreak);
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setScore((prev) => prev + earned);
      setScoreToast({ id: Date.now(), amount: earned });
      setAnswers((prev) => [
        ...prev,
        { questionId: currentQuestion.id, selectedIndex, correct: true, pointsEarned: earned },
      ]);
      fireCorrectBurst();
    } else {
      setStreak(0);
      setAnswers((prev) => [
        ...prev,
        { questionId: currentQuestion.id, selectedIndex, correct: false, pointsEarned: 0 },
      ]);
    }
  }, [currentQuestion, isRevealed, selectedIndex, streak]);

  const goNext = useCallback(() => {
    if (isLastQuestion) {
      setPhase("results");
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
    setIsRevealed(false);
    setShowExplanation(false);
  }, [isLastQuestion]);

  /* On question change, gently scroll the right panel to the top so the
   * new question header is always fully visible on shorter viewports. */
  useEffect(() => {
    if (phase !== "active") return;
    rightPanelRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [currentIndex, phase]);

  /* Auto-dismiss the floating "+N ქულა" toast next to the score chip. */
  useEffect(() => {
    if (!scoreToast) return;
    const timeout = setTimeout(() => setScoreToast(null), 900);
    return () => clearTimeout(timeout);
  }, [scoreToast]);

  /* ------------------------------ INTRO PHASE ----------------------------- */

  if (phase === "intro") {
    return (
      <IntroScreen
        onStart={startNewSession}
        libraryHighlights={{
          passageCount: passageCount(),
        }}
      />
    );
  }

  /* ------------------------------ RESULTS PHASE --------------------------- */

  if (phase === "results" && passage) {
    return (
      <ResultsScreen
        passage={passage}
        correctCount={correctCount}
        total={totalQuestions}
        answers={answers}
        totalScore={score}
        bestStreak={bestStreak}
        onRestartNew={startNewSession}
        onExit={abandonSession}
      />
    );
  }

  /* ------------------------------ ACTIVE PHASE ---------------------------- */

  if (!passage || !currentQuestion) {
    return null;
  }

  const typeBadge = TYPE_BADGE[currentQuestion.type];

  return (
    <div className="relative min-h-full bg-transparent">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={abandonSession}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
            ტესტის შეწყვეტა
          </button>

          {/* --------------------------- game HUD --------------------------- */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[11px] font-semibold transition-colors duration-300 ${
                streak > 0
                  ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                  : "border-white/10 bg-transparent text-zinc-500"
              }`}
              aria-label="მიმდინარე სერია"
            >
              <motion.span
                key={streak}
                initial={{ scale: streak > 0 ? 1.35 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="flex items-center gap-1"
              >
                <Flame
                  className={`h-3.5 w-3.5 stroke-[1.75] ${streak > 0 ? "fill-orange-400/30" : ""}`}
                />
                <span className="font-mono tabular-nums">{streak}</span>
              </motion.span>
            </div>

            <div
              className="relative flex items-center gap-1.5 rounded-full border-2 border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-200"
              aria-label="ქულა"
            >
              <Gem className="h-3.5 w-3.5 stroke-[1.75]" />
              <span className="font-mono tabular-nums">{score}</span>
              <AnimatePresence>
                {scoreToast && (
                  <motion.span
                    key={scoreToast.id}
                    initial={{ opacity: 0, y: 0, scale: 0.85 }}
                    animate={{ opacity: 1, y: -22, scale: 1 }}
                    exit={{ opacity: 0, y: -34 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="pointer-events-none absolute -top-1 right-2 text-[11px] font-bold text-emerald-300"
                  >
                    +{scoreToast.amount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ---------------------- LEFT: reading panel ---------------------- */}
          <section
            aria-label="საკითხავი ტექსტი"
            className="relative overflow-hidden rounded-[32px] border-2 border-white/12 bg-[#100f16]/70 p-6 backdrop-blur-xl sm:p-8"
            style={
              {
                minHeight: "560px",
              } as CSSProperties
            }
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-[0.06] blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, #06B6D4 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative z-[1]">
              <div
                className={`relative mb-6 inline-flex -rotate-1 items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                  passage.category === "მხატვრული"
                    ? "border-purple-500/30 text-purple-300"
                    : "border-emerald-500/30 text-emerald-300"
                }`}
              >
                {passageCategoryLabel(passage.category)}
                <span
                  className={`absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full ${
                    passage.category === "მხატვრული"
                      ? "bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]"
                      : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                  }`}
                  aria-hidden
                />
              </div>
              <header className="mb-6">
                <h2 className="text-xl font-bold leading-tight text-white sm:text-2xl">
                  {passage.title}
                </h2>
                <p className="mt-1.5 text-xs text-zinc-500">
                  ავტორი / წყარო:{" "}
                  <span className="text-zinc-400">{passage.authorOrSource}</span>
                </p>
              </header>

              <HighlightedExcerpt
                text={passage.textExcerpt}
                highlight={currentQuestion.highlightPhrase}
              />

              {currentQuestion.highlightPhrase && (
                <p className="mt-6 flex items-center gap-2 rounded-lg border border-cyan-500/15 bg-cyan-500/[0.03] px-3 py-2 text-[11px] leading-relaxed text-cyan-200/80">
                  <Info className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
                  ხაზგასმულია მიმდინარე კითხვასთან დაკავშირებული მონაკვეთი.
                </p>
              )}
            </div>
          </section>

          {/* ---------------------- RIGHT: question wizard ------------------- */}
          <section
            ref={rightPanelRef}
            aria-label="კითხვების ვიზარდი"
            className="relative overflow-hidden rounded-[32px] border-2 border-white/12 bg-[#100f16]/70 p-6 backdrop-blur-xl sm:p-8"
          >
            <div className="relative mb-8 inline-flex flex-col items-start">
              <span className="-rotate-2 rounded-full border-2 border-white/20 bg-white/[0.03] px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-white/80">
                კითხვა {currentIndex + 1} / {totalQuestions}
              </span>
              <span
                className={`-mt-2 ml-8 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 px-5 py-2 text-[11px] font-bold ${typeBadge.className}`}
              >
                {typeBadge.icon}
                {typeBadge.label}
              </span>
              <span
                className={`absolute left-14 top-6 h-3 w-3 rounded-full ${typeBadge.dot}`}
                aria-hidden
              />
            </div>

            {/* segmented "level path" progress — one pill per question */}
            <div className="mb-6 flex items-center gap-1.5" aria-hidden>
              {questionQueue.map((q, i) => (
                <div
                  key={q.id}
                  className={`h-1.5 flex-1 overflow-hidden rounded-full transition-colors duration-300 ${
                    i < currentIndex
                      ? "bg-cyan-400"
                      : i === currentIndex
                        ? "bg-white/10"
                        : "bg-white/[0.06]"
                  }`}
                >
                  {i === currentIndex && (
                    <motion.div
                      key={`fill-${currentIndex}-${isRevealed}`}
                      initial={{ width: "0%" }}
                      animate={{ width: isRevealed ? "100%" : "45%" }}
                      transition={{
                        duration: isRevealed ? 0.4 : 1.1,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                    />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="relative mb-6 rounded-[28px] border-2 border-white/15 bg-white/[0.02] p-6">
                  <span
                    className={`absolute -right-2 -top-2 h-5 w-5 rounded-full ring-4 ring-[#100f16] ${typeBadge.dot}`}
                    aria-hidden
                  />
                  <h3 className="text-[17px] font-semibold leading-relaxed text-white">
                    {currentQuestion.questionText}
                  </h3>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isSelected = selectedIndex === optionIndex;
                    const isCorrectOption =
                      optionIndex === currentQuestion.correctIndex;

                    const pillClass = resolveOptionPillClass({
                      isSelected,
                      isCorrectOption,
                      isRevealed,
                    });
                    const circleClass = resolveOptionCircleClass({
                      isSelected,
                      isCorrectOption,
                      isRevealed,
                    });

                    return (
                      <motion.button
                        key={`${currentQuestion.id}-${optionIndex}`}
                        type="button"
                        disabled={isRevealed}
                        onClick={() => setSelectedIndex(optionIndex)}
                        whileTap={isRevealed ? undefined : { scale: 0.985 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={
                          isRevealed && isCorrectOption
                            ? { opacity: 1, y: 0, scale: [1, 1.015, 1] }
                            : isRevealed && isSelected && !isCorrectOption
                              ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                              : { opacity: 1, y: 0, scale: 1, x: 0 }
                        }
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                          delay: isRevealed ? 0 : optionIndex * 0.06,
                        }}
                        className="group flex w-full items-center gap-3 text-left text-sm leading-relaxed"
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200 ${circleClass}`}
                        >
                          {isRevealed && isCorrectOption ? (
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          ) : isRevealed && isSelected && !isCorrectOption ? (
                            <X className="h-4 w-4 stroke-[2.5]" />
                          ) : (
                            String.fromCharCode(65 + optionIndex)
                          )}
                        </span>
                        <span
                          className={`min-w-0 flex-1 rounded-full border-2 px-5 py-3.5 transition-all duration-200 ${pillClass}`}
                        >
                          {option}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  key="explanation"
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="mt-5 overflow-hidden"
                >
                  <div
                    className={`rounded-xl border p-4 ${
                      selectedIndex === currentQuestion.correctIndex
                        ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                        : "border-rose-500/25 bg-rose-500/[0.04]"
                    }`}
                  >
                    <p
                      className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
                        selectedIndex === currentQuestion.correctIndex
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {selectedIndex === currentQuestion.correctIndex ? (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[2]" />
                          სწორია
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 stroke-[2]" />
                          არასწორია
                        </>
                      )}
                    </p>
                    <p className="text-[13.5px] leading-relaxed text-zinc-200">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!isRevealed ? (
                <button
                  type="button"
                  onClick={revealAnswer}
                  disabled={selectedIndex === null}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  პასუხის შემოწმება
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
                >
                  {isLastQuestion ? "შედეგების ნახვა" : "შემდეგი კითხვა"}
                  <ArrowRight className="h-4 w-4 stroke-[1.75]" />
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               INTRO SCREEN                                 */
/* -------------------------------------------------------------------------- */

const TROPE_CHIPS: { label: string; className: string }[] = [
  { label: "მეტაფორა", className: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300" },
  { label: "გაპიროვნება", className: "border-violet-500/25 bg-violet-500/10 text-violet-300" },
  { label: "ეპითეტი", className: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
  { label: "შედარება", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" },
  { label: "ჰიპერბოლა", className: "border-rose-500/25 bg-rose-500/10 text-rose-300" },
  { label: "ალეგორია", className: "border-blue-500/25 bg-blue-500/10 text-blue-300" },
];

function IntroScreen({
  onStart,
  libraryHighlights,
}: {
  onStart: () => void;
  libraryHighlights: { passageCount: number };
}) {
  return (
    <div className="relative min-h-full bg-transparent">
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={GEORGIAN_HUB_HREF}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          ქართულის ცენტრში დაბრუნება
        </Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.18)] animate-float-soft">
            <BookText className="h-7 w-7 stroke-[1.5]" />
          </div>
          <div>
            <span className="relative -rotate-2 inline-flex items-center rounded-full border-2 border-cyan-500/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300/90">
              მეორე სავარჯიშო
              <span
                className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                aria-hidden
              />
            </span>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              წაკითხულის გააზრება
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
              იმუშავე მხატვრულ თუ საინფორმაციო ტექსტებზე. ივარჯიშე მთავარი აზრის
              ამოცნობაში, ნაგულისხმევი შინაარსის ანალიზსა და მხატვრული საშუალებების
              — მეტაფორის, გაპიროვნების, ეპითეტის, შედარების, ჰიპერბოლისა და
              ალეგორიის — გამორჩევაში.
            </p>
          </div>
        </header>

        <section
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          aria-label="სავარჯიშოს მიმოხილვა"
        >
          <StatCard
            label="ტექსტების ბანკი"
            value={`${libraryHighlights.passageCount}+`}
            hint="მხატვრული + საინფორმაციო"
            icon={<BookText className="h-4 w-4 stroke-[1.75] text-violet-300" />}
            accent="border-violet-500/30 text-violet-300"
            dot="bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]"
          />
          <StatCard
            label="მხატვრული საშუალებები"
            value="6"
            hint="მეტაფორა, გაპიროვნება, ეპითეტი, შედარება, ჰიპერბოლა, ალეგორია"
            icon={<Sparkles className="h-4 w-4 stroke-[1.75] text-cyan-300" />}
            accent="border-cyan-500/30 text-cyan-300"
            dot="bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
          />
          <StatCard
            label="კითხვის ტიპები"
            value="3"
            hint="მთავარი აზრი · ნაგულისხმევი · მხატვრული ხერხი"
            icon={<Trophy className="h-4 w-4 stroke-[1.75] text-amber-300" />}
            accent="border-amber-500/30 text-amber-300"
            dot="bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
          />
        </section>

        <section className="mt-6" aria-label="მხატვრული საშუალებები, რომლებზეც ივარჯიშებ">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            ივარჯიშებ ამ მხატვრულ საშუალებებზე
          </p>
          <div className="flex flex-wrap gap-2">
            {TROPE_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-medium transition-transform hover:-translate-y-0.5 ${chip.className}`}
              >
                <Sparkles className="h-3 w-3 stroke-[2]" />
                {chip.label}
              </span>
            ))}
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-[32px] border-2 border-cyan-500/25 bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
          <span
            className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
            aria-hidden
          />
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              <Shuffle className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white">
                ტესტის დაწყება ავტომატური რენდომიზაციით
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                ყოველი დაწყებისას სისტემა შემთხვევით ამოირჩევს ერთ ტექსტს ბანკიდან
                და მისთვის სპეციალურად ჩამოყალიბებულ კითხვათა კომპლექტს. მიიღებ
                ქულებს სწორ პასუხებზე და ბონუსს — თუ ზედიზედ პასუხობ სწორად.
              </p>
              <div className="relative mt-5 inline-block">
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md"
                  animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <button
                  type="button"
                  onClick={onStart}
                  className="relative z-[1] inline-flex items-center gap-2 rounded-full border-2 border-transparent bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/15 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4 stroke-[1.75]" />
                  ტესტის დაწყება
                  <ArrowRight className="h-4 w-4 stroke-[1.75]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8" aria-label="სავარჯიშოს ინსტრუქცია">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            როგორ მუშაობს
          </h2>
          <ol className="relative space-y-3">
            {[
              "სისტემა ბანკიდან შემთხვევით ამოირჩევს ერთ ტექსტს — მხატვრულს ან საინფორმაციოს.",
              "მარცხნივ ნახავ ტექსტს, მარჯვნივ — მასთან დაკავშირებულ 3–4 კითხვას.",
              "პასუხის შემოწმებისას მიიღებ დეტალურ განმარტებას და ქულებს — ზედიზედ სწორი პასუხები მეტ ქულას გაძლევს.",
              "ბოლოს ნახავ ვარსკვლავურ შეფასებას, ჯამურ ქულასა და მოპოვებულ მიღწევებს.",
            ].map((step, index) => (
              <li
                key={`step-${index}`}
                className="relative z-[1] flex items-center gap-3 rounded-[24px] border-2 border-white/10 bg-white/[0.02] p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-cyan-500/30 bg-cyan-500/10 text-[12px] font-bold text-cyan-300">
                  {index + 1}
                </span>
                <span className="text-[13px] leading-relaxed text-zinc-300">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
  dot,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: ReactNode;
  accent?: string;
  dot?: string;
}) {
  return (
    <div className="group relative rounded-[28px] border-2 border-white/12 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
      {dot && (
        <span
          className={`absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full ${dot}`}
          aria-hidden
        />
      )}
      {icon && (
        <div
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 ${accent ?? "border-white/15 text-white/70"}`}
        >
          {icon}
        </div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{hint}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              RESULTS SCREEN                                */
/* -------------------------------------------------------------------------- */

interface Badge {
  icon: ReactNode;
  label: string;
  className: string;
}

function computeBadges({
  correctCount,
  total,
  bestStreak,
  passage,
  answers,
}: {
  correctCount: number;
  total: number;
  bestStreak: number;
  passage: Passage;
  answers: AnswerRecord[];
}): Badge[] {
  const badges: Badge[] = [];

  if (total > 0 && correctCount === total) {
    badges.push({
      icon: <Trophy className="h-3.5 w-3.5 stroke-[1.75]" />,
      label: "იდეალური შედეგი",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    });
  }

  const tropeQuestions = passage.questions.filter((q) => q.type === "literary_trope");
  if (tropeQuestions.length > 0) {
    const allTropesCorrect = tropeQuestions.every(
      (q) => answers.find((a) => a.questionId === q.id)?.correct,
    );
    if (allTropesCorrect) {
      badges.push({
        icon: <Sparkles className="h-3.5 w-3.5 stroke-[1.75]" />,
        label: "ტროპების ოსტატი",
        className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      });
    }
  }

  if (bestStreak >= 3) {
    badges.push({
      icon: <Flame className="h-3.5 w-3.5 stroke-[1.75]" />,
      label: `სერია x${bestStreak}`,
      className: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    });
  }

  return badges;
}

function ResultsScreen({
  passage,
  correctCount,
  total,
  answers,
  totalScore,
  bestStreak,
  onRestartNew,
  onExit,
}: {
  passage: Passage;
  correctCount: number;
  total: number;
  answers: AnswerRecord[];
  totalScore: number;
  bestStreak: number;
  onRestartNew: () => void;
  onExit: () => void;
}) {
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const starCount = starsForPercent(percent);
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (hasCelebrated.current) return;
    hasCelebrated.current = true;
    if (percent >= 55) {
      fireResultsBurst();
    }
  }, [percent]);

  const rating: { title: string; hint: string; tone: string } = useMemo(() => {
    if (percent >= 80) {
      return {
        title: "შესანიშნავი შედეგი",
        hint: "მშვენივრად ცნობ მხატვრულ საშუალებებს და აანალიზებ ტექსტს. ივარჯიშე ცალკეულ სუსტ თემებზე.",
        tone: "text-emerald-300",
      };
    }
    if (percent >= 50) {
      return {
        title: "საშუალო შედეგი",
        hint: "საფუძველი გაქვს, თუმცა რეკომენდებულია ტროპებისა და ნაგულისხმევი აზრის დამატებითი გავარჯიშება.",
        tone: "text-cyan-300",
      };
    }
    return {
      title: "საჭიროა დამატებითი მუშაობა",
      hint: "დაბრუნდი მხატვრული საშუალებების განმარტებებთან და გაიარე კიდევ რამდენიმე ტესტი — თითო კითხვის ახსნა კარგი შესწავლის საშუალებაა.",
      tone: "text-amber-300",
    };
  }, [percent]);

  const questionsById = useMemo(
    () => new Map(passage.questions.map((q) => [q.id, q])),
    [passage.questions],
  );

  const badges = useMemo(
    () => computeBadges({ correctCount, total, bestStreak, passage, answers }),
    [correctCount, total, bestStreak, passage, answers],
  );

  return (
    <div className="relative min-h-full bg-transparent">
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={onExit}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-all hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          სავარჯიშოს გვერდზე დაბრუნება
        </button>

        <section className="relative overflow-hidden rounded-[32px] border-2 border-white/12 bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
              <Trophy className="h-7 w-7 stroke-[1.5]" />
            </div>
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90">
                სესიის შედეგი
                <span
                  className={`relative inline-flex items-center rounded-full border-2 px-2.5 py-1 text-[9px] font-bold normal-case tracking-normal ${
                    passage.category === "მხატვრული"
                      ? "border-purple-500/30 text-purple-300"
                      : "border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  {passageCategoryLabel(passage.category)}
                </span>
              </p>
              <h2 className={`mt-1 text-2xl font-bold ${rating.tone}`}>
                {rating.title}
              </h2>
            </div>
          </div>

          {/* animated star rating — the "level complete" moment */}
          <div className="mt-6 flex flex-col items-center gap-2 rounded-[28px] border-2 border-white/10 bg-white/[0.02] py-6">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 14,
                    delay: 0.15 + i * 0.15,
                  }}
                >
                  <Star
                    className={`h-9 w-9 stroke-[1.5] ${
                      i < starCount
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                        : "fill-transparent text-white/15"
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">სიზუსტე: {percent}%</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ResultStat label="სწორი პასუხი" value={`${correctCount} / ${total}`} tone="text-white" />
            <ResultStat
              label="ჯამური ქულა"
              value={String(totalScore)}
              tone="text-cyan-300"
              icon={<Gem className="h-3.5 w-3.5 stroke-[1.75] text-cyan-300" />}
            />
            <ResultStat
              label="საუკეთესო სერია"
              value={`x${bestStreak}`}
              tone="text-orange-300"
              icon={<Flame className="h-3.5 w-3.5 stroke-[1.75] text-orange-300" />}
            />
          </div>

          <p className="mt-6 text-sm leading-relaxed text-zinc-400">{rating.hint}</p>

          {badges.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <Award className="h-3.5 w-3.5 stroke-[1.75]" />
                მიღწევები
              </p>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                  <motion.span
                    key={badge.label}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 300, damping: 18 }}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRestartNew}
              className="inline-flex items-center gap-2 rounded-full border-2 border-transparent bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4 stroke-[1.75]" />
              ახალი ტესტი (სხვა ტექსტი)
            </button>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full border-2 border-white/15 bg-transparent px-5 py-2.5 text-sm text-white/85 transition-all hover:border-white/30 hover:bg-white/[0.04]"
            >
              შესვლის ეკრანზე დაბრუნება
            </button>
          </div>
        </section>

        <section className="mt-8" aria-label="პასუხების მიმოხილვა">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            პასუხების მიმოხილვა — {passage.title}
          </h3>
          <ul className="space-y-3">
            {answers.map((record, index) => {
              const q = questionsById.get(record.questionId);
              if (!q) return null;
              const badge = TYPE_BADGE[q.type];
              return (
                <li
                  key={record.questionId}
                  className={`rounded-[24px] border-2 p-4 ${
                    record.correct
                      ? "border-emerald-500/25 bg-emerald-500/[0.03]"
                      : "border-rose-500/25 bg-rose-500/[0.03]"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white/15 text-[10px] font-bold text-zinc-400">
                      {index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span
                      className={`ml-auto inline-flex items-center gap-1 text-[11px] font-semibold ${
                        record.correct ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {record.correct ? (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[2]" /> სწორია
                          <span className="text-cyan-300">+{record.pointsEarned}</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 stroke-[2]" /> არასწორია
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-zinc-200">
                    {q.questionText}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    <span className="text-emerald-300">სწორი პასუხი:</span>{" "}
                    {q.options[q.correctIndex]}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}

function ResultStat({
  label,
  value,
  tone,
  small,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  small?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border-2 border-white/10 bg-white/[0.02] p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {icon}
        {label}
      </p>
      <p
        className={`mt-1.5 font-bold tracking-tight ${tone} ${
          small ? "text-base" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          OPTION STYLING HELPERS                            */
/* -------------------------------------------------------------------------- */

function resolveOptionPillClass({
  isSelected,
  isCorrectOption,
  isRevealed,
}: {
  isSelected: boolean;
  isCorrectOption: boolean;
  isRevealed: boolean;
}): string {
  if (isRevealed) {
    if (isCorrectOption) {
      return "border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20";
    }
    if (isSelected) {
      return "border-transparent bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20";
    }
    return "border-white/10 bg-transparent text-white/25";
  }
  if (isSelected) {
    return "border-transparent bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20";
  }
  return "border-white/15 bg-transparent text-zinc-200 group-hover:border-cyan-400/50 group-hover:bg-cyan-500/[0.03]";
}

function resolveOptionCircleClass({
  isSelected,
  isCorrectOption,
  isRevealed,
}: {
  isSelected: boolean;
  isCorrectOption: boolean;
  isRevealed: boolean;
}): string {
  if (isRevealed) {
    if (isCorrectOption) {
      return "border-transparent bg-gradient-to-br from-emerald-500 to-emerald-600 text-white";
    }
    if (isSelected) {
      return "border-transparent bg-gradient-to-br from-rose-500 to-rose-600 text-white";
    }
    return "border-white/10 text-white/20";
  }
  if (isSelected) {
    return "border-transparent bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_16px_rgba(34,211,238,0.35)]";
  }
  return "border-white/15 text-white/60 group-hover:border-cyan-400/50 group-hover:text-cyan-200";
}

/* -------------------------------------------------------------------------- */
/*                            LIBRARY META HELPER                             */
/* -------------------------------------------------------------------------- */

function passageCount(): number {
  return READING_COMPREHENSION_PASSAGES.length;
}
