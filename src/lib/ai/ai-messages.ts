/** User-facing AI error texts shared by the server (/api/ai) and the
 * client (fetch-ai), so both say the same thing. */
export const AI_UNAVAILABLE_MESSAGE = "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.";
export const AI_BUSY_MESSAGE = "AI დროებით დატვირთულია. სცადე 1–2 წუთში.";
export const AI_TIMEOUT_MESSAGE =
  "ანალიზს ძალიან დიდხანს დასჭირდა. სცადე კიდევ ერთხელ ან ატვირთე უფრო მოკლე ფაილი.";
export const AI_TOO_LARGE_MESSAGE = "ფაილი ძალიან დიდია. ატვირთე უფრო მცირე ფაილი.";
export const AI_RATE_LIMIT_MESSAGE = "ძალიან ბევრი მოთხოვნა. სცადე ერთ წუთში.";

/** The message for an error response that has no readable JSON body
 * (e.g. a platform timeout page), by HTTP status. */
export function aiMessageForStatus(status: number): string {
  if (status === 503) return AI_BUSY_MESSAGE;
  if (status === 504) return AI_TIMEOUT_MESSAGE;
  if (status === 413) return AI_TOO_LARGE_MESSAGE;
  if (status === 429) return AI_RATE_LIMIT_MESSAGE;
  return AI_UNAVAILABLE_MESSAGE;
}
