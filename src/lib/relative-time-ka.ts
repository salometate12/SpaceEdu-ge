/** „5 წუთის წინ“, „2 საათის წინ“… for „ბოლოს შეიცვალა“. */
export function relativeTimeKa(then: number, now: number = Date.now()): string {
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "ახლახან";
  if (minutes < 60) return `${minutes} წუთის წინ`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} საათის წინ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "გუშინ" : `${days} დღის წინ`;
  const date = new Date(then);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
