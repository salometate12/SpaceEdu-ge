/**
 * Group a number the same way on the server and in the browser.
 *
 * `toLocaleString("ka-GE")` is not safe to render: Node's ICU data has no
 * grouping separator for Georgian and returns "2178", while browsers
 * return "2,178". React hydrates the two against each other, the text
 * doesn't match, and hydration fails — which silently kills interactivity
 * for the rest of that tree. Doing the grouping ourselves keeps both
 * sides identical.
 */
export function formatCount(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
