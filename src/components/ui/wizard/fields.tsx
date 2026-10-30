"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, X, type LucideIcon } from "lucide-react";
import { FieldError } from "@/components/ui/Alert";

/** A label (and „არასავალდებულო“), the control, and its error under it. */
export function Field({
  label,
  optional = false,
  error,
  errorId,
  htmlFor,
  aside,
  children,
  className = "",
}: {
  label: string;
  optional?: boolean;
  error?: string | null;
  /** Give the input `aria-describedby={errorId}`. */
  errorId?: string;
  htmlFor?: string;
  /** Something small on the label's right instead of „არასავალდებულო“. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[14px] font-semibold text-[var(--wz-title)]">
          {label}
        </label>
        {aside ?? (optional ? <span className="text-[13px] text-[var(--wz-faint)]">არასავალდებულო</span> : null)}
      </div>
      {children}
      {errorId ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

/** An input with an icon on the left. */
export function IconInput({ icon: Icon, ...props }: { icon: LucideIcon } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--wz-future)]" aria-hidden />
      <input {...props} className={`wz-input wz-input--icon ${props.className ?? ""}`} />
    </div>
  );
}

/** Chips to pick one (`multiple` false) or several of; picked ones are dark with a check. */
export function ChoiceChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  trailing,
  className = "",
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | T[];
  onChange: (value: T) => void;
  /** After the chips, in the same row (e.g. „+ სხვა“). */
  trailing?: ReactNode;
  className?: string;
}) {
  const multiple = Array.isArray(value);
  const picked = (option: T) => (multiple ? (value as T[]).includes(option) : value === option);
  return (
    <div role={multiple ? "group" : "radiogroup"} aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role={multiple ? undefined : "radio"}
          aria-checked={multiple ? undefined : picked(option.value)}
          aria-pressed={multiple ? picked(option.value) : undefined}
          onClick={() => onChange(option.value)}
          className="wz-chip"
        >
          {picked(option.value) ? <Check className="h-[13px] w-[13px]" strokeWidth={3} aria-hidden /> : null}
          {option.label}
        </button>
      ))}
      {trailing}
    </div>
  );
}

/** An on/off switch with its label (role="switch"). */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="wz-switch">
      <span aria-hidden />
    </button>
  );
}

/** Splits typed text into tags on commas; the last part (still being typed) stays in the field. */
export function splitTagInput(raw: string): { tags: string[]; rest: string } {
  const parts = raw.split(",");
  const rest = parts.pop() ?? "";
  return { tags: parts.map((part) => part.trim()).filter(Boolean), rest };
}

/**
 * Tags typed into one field: Enter or a comma adds one, ✕ removes it,
 * Backspace on an empty field removes the last. At most `max`.
 */
export function TagInput({
  tags,
  onChange,
  max = 20,
  placeholder = "დაწერე და დააჭირე Enter",
  label,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const add = (values: string[]) => {
    const next = [...tags];
    for (const value of values) {
      const tag = value.trim();
      if (tag && next.length < max && !next.some((item) => item.toLowerCase() === tag.toLowerCase())) next.push(tag);
    }
    if (next.length !== tags.length) onChange(next);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add([draft]);
      setDraft("");
    } else if (event.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };
  return (
    <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-[14px] border border-[var(--wz-field-border)] bg-[var(--wz-field)] px-2.5 py-2 focus-within:border-transparent focus-within:shadow-[0_0_0_2px_#e11d74]">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--wz-soft)] pl-3 pr-1 text-[13.5px] font-medium text-[var(--wz-title)]">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))} aria-label={`${tag}: მოშორება`} className="wz-focus flex h-6 w-6 items-center justify-center rounded-full text-[var(--wz-muted)] hover:bg-[var(--wz-hover)]">
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </span>
      ))}
      {tags.length < max ? (
        <input
          id={id}
          value={draft}
          aria-label={label}
          onChange={(event) => {
            const { tags: complete, rest } = splitTagInput(event.target.value);
            if (complete.length) add(complete);
            setDraft(rest);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              add([draft]);
              setDraft("");
            }
          }}
          placeholder={tags.length ? "" : placeholder}
          className="h-8 min-w-[10rem] flex-1 bg-transparent px-1.5 text-[15px] text-[var(--wz-title)] outline-none placeholder:text-[var(--wz-future)]"
        />
      ) : (
        <span className="px-1.5 text-[13px] text-[var(--wz-faint)]">მაქსიმუმ {max}</span>
      )}
    </div>
  );
}
