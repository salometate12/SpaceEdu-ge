"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { RegisterSpace } from "@/lib/auth";
import { PasswordStrength } from "./PasswordStrength";
import type { RegistrationState } from "./types";

interface Step1AccountProps {
  state: RegistrationState;
  errors: Partial<Record<"firstName" | "lastName" | "email" | "password" | "terms" | "spaceField", string>>;
  acceptedTerms: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onChange: <K extends keyof RegistrationState>(field: K, value: RegistrationState[K]) => void;
  onToggleTerms: () => void;
  onNext: () => void;
  onOAuth: (provider: "google" | "github") => void;
}

function spaceExtraLabel(space: RegisterSpace) {
  if (space === "school") return "კლასი";
  if (space === "abiturient") return "გამოცდის წელი";
  return "უნივერსიტეტი";
}

export function Step1Account({
  state,
  errors,
  acceptedTerms,
  showPassword,
  onTogglePassword,
  onChange,
  onToggleTerms,
  onNext,
  onOAuth,
}: Step1AccountProps) {
  const spaceFieldValue =
    state.space === "school"
      ? state.schoolClass ?? ""
      : state.space === "abiturient"
        ? state.examYear ?? "2026"
        : state.university ?? "";

  return (
    <>
      <h2 className="headline text-xl font-semibold">ანგარიშის შექმნა</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        შეიყვანე პირადი ინფორმაცია და გააგრძელე.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onOAuth("google")}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm hover:border-[var(--border-hover)]"
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => onOAuth("github")}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm hover:border-[var(--border-hover)]"
        >
          GitHub
        </button>
      </div>

      <div className="my-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <div className="h-px flex-1 bg-[var(--border)]" />
        ან ელ-ფოსტით
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input
            value={state.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="სახელი"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[#7C3AED]"
          />
          {errors.firstName && <p className="mt-1 text-[11px] text-[#f472b6]">{errors.firstName}</p>}
        </div>
        <div>
          <input
            value={state.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="გვარი"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[#7C3AED]"
          />
          {errors.lastName && <p className="mt-1 text-[11px] text-[#f472b6]">{errors.lastName}</p>}
        </div>
      </div>

      <div className="mt-3">
        <input
          type="email"
          value={state.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="ელ-ფოსტა"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[#7C3AED]"
        />
        {errors.email && <p className="mt-1 text-[11px] text-[#f472b6]">{errors.email}</p>}
      </div>

      <div className="mt-3">
        <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pr-2 focus-within:border-[#7C3AED]">
          <input
            type={showPassword ? "text" : "password"}
            value={state.password}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="პაროლი"
            className="w-full bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button type="button" onClick={onTogglePassword} className="text-[var(--text-secondary)]">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrength password={state.password} />
        {errors.password && <p className="mt-1 text-[11px] text-[#f472b6]">{errors.password}</p>}
      </div>

      <div className="mt-3">
        {state.space === "abiturient" ? (
          <select
            value={spaceFieldValue}
            onChange={(e) => onChange("examYear", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[#7C3AED]"
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        ) : (
          <input
            value={spaceFieldValue}
            onChange={(e) =>
              state.space === "school"
                ? onChange("schoolClass", e.target.value)
                : onChange("university", e.target.value)
            }
            placeholder={spaceExtraLabel(state.space)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[#7C3AED]"
          />
        )}
        {errors.spaceField && <p className="mt-1 text-[11px] text-[#f472b6]">{errors.spaceField}</p>}
      </div>

      <label className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <input type="checkbox" checked={acceptedTerms} onChange={onToggleTerms} />
        ვეთანხმები წესებს და პირობებს
      </label>
      {errors.terms && <p className="mt-1 text-[11px] text-[#f472b6]">{errors.terms}</p>}

      <div className="mt-4">
        <Button onClick={onNext} className="w-full">
          შემდეგი ნაბიჯი →
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-[var(--text-secondary)]">
        უკვე გაქვს ანგარიში? <a href="/login" className="text-[#a78bfa]">შესვლა ↗</a>
      </p>
    </>
  );
}

