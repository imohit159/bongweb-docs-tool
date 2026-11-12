// Document dates are calendar days ("YYYY-MM-DD") in India Standard Time.

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const docDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function isIsoDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's calendar day in IST. */
export function todayIst(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

export function addDays(day: string, days: number): string {
  if (!isIsoDay(day)) throw new RangeError(`invalid day: ${day}`);
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-11-12" → "12 Nov 2026". */
export function formatDocDate(day: string): string {
  if (!isIsoDay(day)) throw new RangeError(`invalid day: ${day}`);
  return docDate.format(new Date(`${day}T00:00:00Z`)).replace(/(\w{3})\w*/, "$1");
}

/** ISO day ↔ Date at local midnight, for date pickers. */
export function isoDayToLocalDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function localDateToIsoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
