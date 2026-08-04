/**
 * Most abiturients don't know their exact national exam date yet when
 * they're first planning study time — exact scheduling comes out later.
 * This picks a plausible placeholder date somewhere in July (the usual
 * exam window in Georgia), rolling over to next year's July once this
 * year's has already passed, so the estimate is never in the past.
 */
export function pickEstimatedExamDate(referenceDate: Date = new Date()): string {
  const JULY_INDEX = 6; // Date.getMonth() is 0-indexed
  const LAST_PICKABLE_DAY = 25;

  const referenceMonth = referenceDate.getMonth();
  const referenceDay = referenceDate.getDate();
  const alreadyPastThisJuly =
    referenceMonth > JULY_INDEX ||
    (referenceMonth === JULY_INDEX && referenceDay > LAST_PICKABLE_DAY);

  const year = referenceDate.getFullYear() + (alreadyPastThisJuly ? 1 : 0);
  const day = Math.floor(Math.random() * LAST_PICKABLE_DAY) + 1;

  const mm = "07";
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
