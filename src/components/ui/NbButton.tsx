import type { ButtonHTMLAttributes } from "react";
import { nbButtonClass, type NbButtonOptions } from "@/lib/nb-button";

export type NbButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & NbButtonOptions;

/**
 * A neo-brutalist pill button (see nb-button.ts / globals.css). For links,
 * put nbButtonClass(...) on the <Link> instead.
 */
export function NbButton({ variant, size, block, className, type = "button", ...props }: NbButtonProps) {
  return <button type={type} className={nbButtonClass({ variant, size, block, className })} {...props} />;
}
