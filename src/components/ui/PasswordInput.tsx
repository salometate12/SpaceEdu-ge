"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

type NativeInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

/** Accessible label for the reveal toggle, given the current reveal state. */
export function passwordToggleLabel(visible: boolean): string {
  return visible ? "პაროლის დამალვა" : "პაროლის ჩვენება";
}

/** The input's `type` for a given reveal state — text when shown, password when hidden. */
export function passwordInputType(visible: boolean): "text" | "password" {
  return visible ? "text" : "password";
}

export interface PasswordInputProps extends NativeInputProps {
  /**
   * Optional decorative icon (e.g. a Lock) rendered on the left, fully styled
   * by the caller so each form keeps its own look. Positioned against this
   * component's own relative wrapper.
   */
  icon?: ReactNode;
  /**
   * Marks the field as invalid so the reveal toggle turns rose, mirroring the
   * left icon. Defaults to a truthy `aria-invalid`.
   */
  invalid?: boolean;
  /** Extra classes for the relative wrapper. */
  wrapperClassName?: string;
}

/**
 * A password field with a show/hide (eye) toggle, shared by the login,
 * registration and admin forms so the behaviour and a11y are identical.
 *
 * `autoComplete` is passed straight through and never changes with the toggle,
 * so password managers still see a stable field. The toggle button is not a
 * submit button and preserves focus (mousedown is prevented). To force the
 * field back to hidden on submit, give it a `key` that changes each submit
 * (e.g. a submit counter) so it remounts with the password re-masked.
 */
export function PasswordInput({
  icon,
  invalid,
  wrapperClassName,
  className,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const isInvalid = invalid ?? inputProps["aria-invalid"] === true;
  // Fall back to a generated id so aria-controls always points at this input,
  // and so two copies kept in the DOM by React Activity never share an id.
  const reactId = useId();
  const inputId = inputProps.id ?? reactId;

  return (
    <div className={`relative${wrapperClassName ? ` ${wrapperClassName}` : ""}`}>
      {icon}
      <input
        {...inputProps}
        id={inputId}
        type={passwordInputType(visible)}
        className={`${className ?? ""} pr-11`.trim()}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={passwordToggleLabel(visible)}
        aria-pressed={visible}
        aria-controls={inputId}
        className={`absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
          isInvalid
            ? "text-rose-500 hover:text-rose-600"
            : "text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
        }`}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
