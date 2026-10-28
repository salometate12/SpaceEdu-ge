import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Lightbulb } from "lucide-react";
import { NotebookSheet } from "./notebook/NotebookSheet";

const SUBTITLE_TEXT =
  "SpaceEdu შენი სასწავლო სივრცეა სკოლიდან უნივერსიტეტამდე. AI დაგიგეგმავს, აგიხსნის და შეგამოწმებს, შენ კი მხოლოდ სწავლობ.";

const SUBJECTS = ["მათემატიკა", "ქართული", "ისტორია", "ინგლისური"];

const tilt = (deg: number) => ({ "--tilt": `${deg}deg` }) as CSSProperties;

function TimerPill() {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[12.5px] font-semibold tabular-nums text-[#1c1a17]">
      <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
      02:14:30
    </span>
  );
}

/** The three notes stuck beside the hero on wide screens. Decoration only. */
function HeroStickers() {
  return (
    <div aria-hidden className="relative hidden h-[520px] lg:block">
      <div className="sticker-lift absolute left-0 top-0 z-[1] w-[300px]">
        <div className="sticker sticker-yellow p-5" style={tilt(-3)}>
          <div className="flex items-center justify-between gap-2">
            <span className="whitespace-nowrap text-[13px] font-bold text-[#854d0e]">გამოცდის სიმულაცია</span>
            <TimerPill />
          </div>
          <p className="mt-3 text-[19px] font-bold">ისტორია · ეროვნული</p>
          <p className="mt-1 text-[14px] text-[#57534e]">რეალური ფორმატი და დრო</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#fde68a]">
            <div className="h-full w-[45%] rounded-full bg-[#ca8a04]" />
          </div>
        </div>
      </div>
      <div className="sticker-lift absolute right-0 top-[150px] z-[2] w-[260px]">
        <div className="sticker sticker-green p-5" style={tilt(2.5)}>
          <span className="text-[13px] font-bold text-[#166534]">საგნების სივრცეები</span>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUBJECTS.map((subject) => (
              <span key={subject} className="rounded-full bg-white px-2.5 py-1 text-[12.5px] font-semibold text-[#1c1a17]">
                {subject}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[14px] text-[#57534e]">სავარჯიშოები თითოეულ საგანში</p>
        </div>
      </div>
      <div className="sticker-lift absolute bottom-0 left-6 z-[3] w-[270px]">
        <div className="sticker sticker-pink p-5" style={tilt(-1.5)}>
          <span className="text-[13px] font-bold text-[#9d174d]">სტუდენტისთვის</span>
          <p className="mt-2 text-[16px] font-bold">სილაბუსიდან სემესტრის გეგმა</p>
          <p className="mt-1 text-[14px] text-[#57534e]">12 ვადა ჩაჯდა კალენდარში</p>
        </div>
      </div>
    </div>
  );
}

/** Phones and tablets: two of the notes side by side under the sheet. */
function HeroStickersCompact() {
  return (
    <div aria-hidden className="mt-3 flex gap-3 lg:hidden">
      <div className="sticker sticker-yellow min-w-0 flex-1 p-3.5">
        <p className="text-[12.5px] font-bold text-[#854d0e]">გამოცდის სიმულაცია</p>
        <p className="mt-1 truncate text-[14px] font-bold">ისტორია · 02:14:30</p>
      </div>
      <div className="sticker sticker-green min-w-0 flex-1 p-3.5">
        <p className="text-[12.5px] font-bold text-[#166534]">საგნების სივრცეები</p>
        <p className="mt-1 truncate text-[14px] font-bold">სავარჯიშოები</p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative">
      <NotebookSheet>
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div className="min-w-0">
            <span className="inline-flex h-[34px] items-center gap-2 rounded-full bg-[var(--ld-yellow-bg)] px-3.5 text-[13.5px] font-semibold text-[var(--ld-yellow)] max-[379px]:h-[30px] max-[379px]:text-[12.5px]">
              <Lightbulb className="h-4 w-4" strokeWidth={2} aria-hidden />
              სასწავლო პლატფორმა შენთვის
            </span>

            <h1 className="mt-5 text-[30px] font-bold max-[379px]:mt-4 max-[379px]:text-[27px] leading-[1.18] tracking-tight text-[var(--ld-title)] sm:text-[42px] lg:text-[54px]">
              ისწავლე უფრო <span className="mark-pink">ჭკვიანურად</span>, შექმენი შენი სასწავლო{" "}
              <span className="mark-yellow">სივრცე</span>
            </h1>

            <p className="mt-4 max-w-[520px] text-[16px] leading-[1.65] text-[var(--ld-text)] max-[379px]:mt-3 max-[379px]:text-[15px] max-[379px]:leading-[1.55] sm:mt-5 sm:text-[18px]">
              {SUBTITLE_TEXT}
            </p>

            <div className="mt-6 flex flex-col gap-3 max-[379px]:mt-5 max-[379px]:gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link
                href="/select-space"
                className="ld-primary ld-focus inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-7 text-[16px] font-semibold transition-colors"
              >
                უფასოდ დაიწყე
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              </Link>
              <Link
                href="#how-it-works"
                className="ld-secondary ld-focus inline-flex h-12 items-center justify-center rounded-full px-7 text-[16px] font-semibold transition-colors max-[379px]:h-11 sm:h-[52px]"
              >
                როგორ მუშაობს
              </Link>
            </div>
          </div>

          <HeroStickers />
        </div>
      </NotebookSheet>
      <HeroStickersCompact />
    </section>
  );
}
