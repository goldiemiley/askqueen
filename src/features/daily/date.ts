/** Local-calendar date helpers. Readings follow the user's own day, not UTC. */

/** "YYYY-MM-DD" for the user's local calendar date. */
export function localDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new RangeError(`Invalid date key: ${key}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Whole days since 1970-01-01 for a calendar date. Independent of time zone. */
export function dayNumber(key: string): number {
  const { year, month, day } = parseDateKey(key);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** The key for the calendar day `offset` days after `key`. */
export function addDays(key: string, offset: number): string {
  const ms = (dayNumber(key) + offset) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Saturday 21 November 2026". Built by hand so every browser shows the same text. */
export function formatLongDate(key: string): string {
  const { year, month, day } = parseDateKey(key);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS[month - 1]} ${year}`;
}

/** The "YYYY-MM-DD" key for a day number (inverse of dayNumber). */
export function keyFromDayNumber(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}
