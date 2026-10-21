"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type KeyboardEvent } from "react";

interface EditableTextProps {
  value: string;
  /** Off → plain text (thumbnails, export, the read-only list). */
  editable: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Shift+Enter makes a new line; otherwise Enter only finishes the edit. */
  multiline?: boolean;
  placeholder?: string;
  label: string;
  /** Focus this field as soon as it renders (a point just added with Enter). */
  autoFocus?: boolean;
  onFocus?: () => void;
  onCommit: (value: string) => void;
  /** Enter with the caret at the end (bullet points: a new point). */
  onEnterAtEnd?: () => void;
  /** Backspace in an empty field (bullet points: remove it). */
  onBackspaceEmpty?: () => void;
}

/** Normalises what the browser gives back from a contentEditable. */
const readText = (element: HTMLElement) => element.innerText.replace(/\u00a0/g, " ").replace(/\n+$/, "");

function caretAtEnd(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0).cloneRange();
  range.selectNodeContents(element);
  range.setStart(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset);
  return range.toString().length === 0;
}

function placeCaretAtEnd(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Slide text edited in place, in the slide's own style. Plain text only
 * (pasted HTML arrives as text). Esc cancels; leaving the field (click
 * outside, Tab, Enter) saves it as one undo step.
 */
export function EditableText({
  value,
  editable,
  as: Tag = "span",
  className = "",
  style,
  multiline = false,
  placeholder,
  label,
  autoFocus = false,
  onFocus,
  onCommit,
  onEnterAtEnd,
  onBackspaceEmpty,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const cancelled = useRef(false);
  // The browser edits the DOM directly; a new key after each edit gives
  // React a fresh element instead of reconciling against the typed text.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!autoFocus || !ref.current) return;
    ref.current.focus();
    placeCaretAtEnd(ref.current);
  }, [autoFocus, version]);

  if (!editable) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  const finish = () => {
    const element = ref.current;
    if (!element) return;
    if (cancelled.current) {
      cancelled.current = false;
      setVersion((v) => v + 1);
      return;
    }
    const next = readText(element);
    if (next !== value) onCommit(next);
    setVersion((v) => v + 1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const element = event.currentTarget;
    // Keep editor shortcuts (undo in the page) from firing while typing.
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      cancelled.current = true;
      element.blur();
      return;
    }
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      if (multiline && event.shiftKey) return;
      event.preventDefault();
      if (onEnterAtEnd && caretAtEnd(element)) {
        const next = readText(element);
        if (next !== value) onCommit(next);
        cancelled.current = true; // already committed
        element.blur();
        onEnterAtEnd();
        return;
      }
      element.blur();
      return;
    }
    if (event.key === "Backspace" && onBackspaceEmpty && readText(element).length === 0) {
      event.preventDefault();
      cancelled.current = true;
      element.blur();
      onBackspaceEmpty();
    }
  };

  return (
    <Tag
      key={version}
      ref={ref}
      role="textbox"
      aria-label={label}
      aria-multiline={multiline || undefined}
      tabIndex={0}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onFocus={onFocus}
      onBlur={finish}
      onKeyDown={onKeyDown}
      onPointerDown={(event: React.PointerEvent) => event.stopPropagation()}
      className={`slide-editable cursor-text select-text whitespace-pre-wrap rounded-[0.3cqw] ${className}`}
      style={style}
    >
      {value}
    </Tag>
  );
}
