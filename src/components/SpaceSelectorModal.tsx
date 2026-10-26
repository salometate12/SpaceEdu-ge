"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert } from "@/components/ui/Alert";
import { Toast } from "@/components/ui/Toast";
import { joinSchoolWaitlist } from "@/lib/school-waitlist";
import "./space-selector.css";

type SpaceId = "school" | "abiturient" | "student";

interface SpaceSelectorModalProps {
  onSelect: (id: SpaceId) => void | Promise<void>;
  /** Where "back" should go. When omitted, returns to the previous page (or the
   *  landing page). Callers pass an explicit target for a signed-in user so
   *  "back" never bounces into a redirect loop. */
  backHref?: string;
}

interface OpenSpace {
  id: Exclude<SpaceId, "school">;
  title: string;
  description: string;
  /** Phones show no chips, so the one line says what the chips would. */
  phoneDescription: string;
  chips: string[];
  bar: string;
  chip: string;
}

const OPEN_SPACES: OpenSpace[] = [
  {
    id: "abiturient",
    title: "აბიტურიენტი",
    description: "ეროვნული გამოცდებისთვის მზადება",
    phoneDescription: "საგნობრივი სავარჯიშოები და გამოცდის სიმულაცია",
    chips: ["სავარჯიშოები", "გამოცდის სიმულაცია"],
    bar: "bg-[#facc15]",
    chip: "bg-[var(--ss-abit-bg)] text-[var(--ss-abit)]",
  },
  {
    id: "student",
    title: "სტუდენტი",
    description: "უნივერსიტეტის კურსები",
    phoneDescription: "სილაბუსის ანალიზატორი და AI მასწავლებელი",
    chips: ["სილაბუსის ანალიზატორი", "AI მასწავლებელი"],
    bar: "bg-[#ec4899]",
    chip: "bg-[var(--ss-student-bg)] text-[var(--ss-student)]",
  },
];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ss-focus)]";

const SAVE_FAILED = "სივრცე ვერ შეინახა. სცადე თავიდან.";
const SAVE_FAILED_CODE = "SPACE_SELECT_FAILED";

/**
 * The step between the landing and the app: choosing a space. Three cards
 * in a row on wider screens (school is still closed, with a waitlist link),
 * a single column on phones.
 */
export function SpaceSelectorModal({ onSelect, backHref }: SpaceSelectorModalProps) {
  const router = useRouter();
  const [pending, setPending] = useState<SpaceId | null>(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  // The page navigates away on success, so the spinner stays until then.
  const choose = async (id: SpaceId) => {
    if (pending) return;
    setError(false);
    setPending(id);
    try {
      await onSelect(id);
    } catch {
      setPending(null);
      setError(true);
    }
  };

  const notifyMe = () => {
    setToast("შეგატყობინებთ, როცა გაიხსნება");
    void joinSchoolWaitlist();
  };

  const dimmed = (id: SpaceId) => (pending && pending !== id ? "pointer-events-none opacity-60" : "");

  return (
    <main className="space-select flex min-h-dvh w-full flex-col max-md:-mt-[var(--safe-top)]">
      <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 pb-6 pt-[calc(var(--safe-top)+16px)] md:px-8 md:pb-10 md:pt-8">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center">
          <button
            type="button"
            onClick={handleBack}
            aria-label="უკან"
            className={`inline-flex h-10 items-center justify-center gap-1.5 justify-self-start rounded-full border border-[var(--ss-button-border)] bg-[var(--ss-card)] text-[14px] font-semibold text-[var(--ss-title)] transition-colors hover:border-[var(--ss-card-hover)] max-md:w-10 md:px-4 ${FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            <span className="max-md:hidden">უკან</span>
          </button>
          <div className="flex items-center gap-2">
            <img src="/spaceedu-mark.svg" alt="" width={36} height={36} className="h-7 w-7 md:h-9 md:w-9 dark:hidden" />
            <img src="/spaceedu-mark-dark.svg" alt="" width={36} height={36} className="hidden h-7 w-7 md:h-9 md:w-9 dark:block" />
            <span className="headline text-[16px] font-bold tracking-tight text-[var(--ss-title)] md:text-[19px]">SpaceEdu</span>
          </div>
          <ThemeToggle
            className={`!h-10 !w-10 justify-self-end !border-[var(--ss-button-border)] !bg-[var(--ss-card)] ${FOCUS}`}
          />
        </header>

        <section className="flex flex-1 flex-col gap-6 pt-7 md:justify-center md:gap-9 md:pt-10">
          <div className="md:text-center">
            <p className="text-[13px] font-semibold text-[var(--ss-muted)]">ნაბიჯი 1 / 2</p>
            <h1 className="headline mt-2 text-[28px] font-bold leading-tight tracking-tight text-[var(--ss-title)] md:text-[38px]">
              აირჩიე შენი <span className="ss-mark">სივრცე</span>
            </h1>
            <p className="mt-2 text-[14.5px] text-[var(--ss-muted)] md:text-[16px]">
              სკოლიდან უნივერსიტეტამდე ყოველ ეტაპზე შენთან
            </p>
          </div>

          {error ? (
            <Alert tone="error">
              {SAVE_FAILED} <span className="opacity-70">(კოდი: {SAVE_FAILED_CODE})</span>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_28px_1fr_28px_1fr] md:gap-0">
            <div
              role="group"
              aria-label="სკოლა"
              aria-disabled="true"
              data-space="school"
              className={`flex items-center justify-between gap-3 rounded-[24px] border border-dashed border-[var(--ss-off-border)] bg-[var(--ss-off)] px-4 py-3.5 transition-opacity md:flex-col md:items-stretch md:justify-start md:gap-3.5 md:p-6 ${dimmed("school")}`}
            >
              <span aria-hidden className="hidden h-9 items-center md:flex">
                <span className="h-1.5 w-12 rounded-full bg-[#4ade80] opacity-60" />
              </span>
              <div className="flex min-w-0 flex-col items-start gap-1 md:contents">
                <h2 className="flex items-center gap-2 text-[19px] font-bold leading-tight text-[var(--ss-muted)] md:text-[22px]">
                  სკოლა
                  <SoonPill className="hidden md:inline-flex" />
                </h2>
                <p className="hidden text-[14.5px] text-[var(--ss-muted)] md:block">9–12 კლასი</p>
                <button
                  type="button"
                  onClick={notifyMe}
                  className={`rounded-sm text-left text-[13px] font-semibold text-[var(--ss-link)] underline-offset-4 hover:underline md:mt-auto md:self-start ${FOCUS}`}
                >
                  შემატყობინე, როცა გაიხსნება
                </button>
              </div>
              <SoonPill className="inline-flex shrink-0 md:hidden" />
            </div>

            {OPEN_SPACES.map((space) => (
              <SpaceItem key={space.id} space={space} pending={pending === space.id} dimmed={dimmed(space.id)} onChoose={choose} />
            ))}
          </div>

          <p className="text-center text-[14px] text-[var(--ss-muted)] max-md:mt-auto max-md:pt-4">
            უკვე გაქვს ანგარიში?{" "}
            <Link href="/login" className={`rounded-sm font-semibold text-[var(--ss-link)] underline-offset-4 hover:underline ${FOCUS}`}>
              შესვლა
            </Link>
          </p>
        </section>
      </div>

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </main>
  );
}

function SoonPill({ className = "" }: { className?: string }) {
  return (
    <span
      className={`h-6 items-center rounded-full border border-[var(--ss-off-border)] px-2.5 text-[12px] font-semibold text-[var(--ss-muted)] ${className}`}
    >
      მალე
    </span>
  );
}

function SpaceItem({
  space,
  pending,
  dimmed,
  onChoose,
}: {
  space: OpenSpace;
  pending: boolean;
  dimmed: string;
  onChoose: (id: SpaceId) => void;
}) {
  const descriptionId = `space-${space.id}-description`;
  return (
    <>
      <span aria-hidden className="hidden items-center justify-center text-[16px] text-[var(--ss-sep)] md:flex">
        ›
      </span>
      <button
        type="button"
        data-space={space.id}
        onClick={() => onChoose(space.id)}
        aria-label={space.title}
        aria-describedby={descriptionId}
        aria-busy={pending || undefined}
        className={`group flex flex-col gap-3 rounded-[24px] border border-[var(--ss-card-border)] bg-[var(--ss-card)] p-4 text-left transition-[border-color,opacity] duration-150 hover:border-[var(--ss-card-hover)] md:gap-3.5 md:p-6 ${FOCUS} ${dimmed}`}
      >
        <span className="flex w-full items-center justify-between">
          <span aria-hidden className={`h-1.5 w-12 rounded-full ${space.bar}`} />
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ss-ink)] text-[var(--ss-ink-text)] transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none md:h-9 md:w-9"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" strokeWidth={2.2} />}
          </span>
        </span>
        <span className="block text-[19px] font-bold leading-tight text-[var(--ss-title)] md:text-[22px]">{space.title}</span>
        <span id={descriptionId} className="block text-[14px] leading-snug text-[var(--ss-text)] md:text-[14.5px]">
          <span className="md:hidden">{space.phoneDescription}</span>
          <span className="max-md:hidden">{space.description}</span>
        </span>
        <span className="mt-auto hidden flex-wrap gap-1.5 md:flex">
          {space.chips.map((chip) => (
            <span key={chip} className={`inline-flex h-[26px] items-center rounded-full px-2.5 text-[12px] font-semibold ${space.chip}`}>
              {chip}
            </span>
          ))}
        </span>
      </button>
    </>
  );
}
