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

const SHORT_MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

/** The short form for lists: „ახლა“, „5 წთ“, „2 სთ“, „გუშინ“, „3 დღე“, „15 ოქტ“. */
export function relativeTimeShortKa(then: number, now: number = Date.now()): string {
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "ახლა";
  if (minutes < 60) return `${minutes} წთ`;
  const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0);
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days === 0) return `${Math.floor(minutes / 60)} სთ`;
  if (days === 1) return "გუშინ";
  if (days < 7) return `${days} დღე`;
  const date = new Date(then);
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}
