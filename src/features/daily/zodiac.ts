/**
 * Western (tropical) sun-sign calculation and date-of-birth validation (AQ-006).
 * Pure functions. Birth dates are only ever held in memory by the caller.
 */
import { SIGN_PROFILES } from "@/data/signs";
import type { MonthDay, ZodiacSign } from "@/types/content";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const MIN_BIRTH_YEAR = 1900;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

const ord = ({ month, day }: MonthDay) => month * 100 + day;

/** Sun sign for a month/day. Year isn't needed: 29 February is always Pisces. */
export function signForMonthDay(month: number, day: number): ZodiacSign {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError(`Invalid month/day: ${month}/${day}`);
  }
  const value = month * 100 + day;
  for (const p of SIGN_PROFILES) {
    const start = ord(p.start);
    const end = ord(p.end);
    const inRange = start <= end ? value >= start && value <= end : value >= start || value <= end; // wraps the new year
    if (inRange) return p.sign;
  }
  throw new RangeError(`No sign covers ${month}/${day}`);
}

export type BirthDate = { year: number; month: number; day: number };

export type BirthDateField = "day" | "month" | "year";

export type BirthDateCheck =
  | { ok: true; date: BirthDate }
  | { ok: false; field: BirthDateField; message: string };

/** Accepts only whole numbers written with digits (no "1e3", no "12.0"). */
function toInt(raw: string): number | null {
  const t = raw.trim();
  return /^\d+$/.test(t) ? Number(t) : null;
}

/**
 * Validates a date of birth entered as separate day, month and year fields.
 * `today` is the user's current local date, used to reject future dates.
 */
export function validateBirthDate(
  input: { day: string; month: string; year: string },
  today: Date,
): BirthDateCheck {
  if (!input.day.trim() && !input.month.trim() && !input.year.trim()) {
    return { ok: false, field: "day", message: "Enter your date of birth so Sabrina can find your sign." };
  }
  const day = toInt(input.day);
  if (day === null || day < 1 || day > 31) {
    return { ok: false, field: "day", message: "Day must be a number from 1 to 31." };
  }
  const month = toInt(input.month);
  if (month === null || month < 1 || month > 12) {
    return { ok: false, field: "month", message: "Choose the month you were born." };
  }
  const year = toInt(input.year);
  if (year === null || input.year.trim().length !== 4) {
    return { ok: false, field: "year", message: "Year must have 4 digits, like 1998." };
  }
  if (year < MIN_BIRTH_YEAR) {
    return { ok: false, field: "year", message: `Year must be ${MIN_BIRTH_YEAR} or later.` };
  }
  const max = daysInMonth(year, month);
  if (day > max) {
    const message =
      month === 2 && day === 29
        ? `${year} wasn't a leap year, so February only had 28 days.`
        : `${MONTH_NAMES[month - 1]} only has ${max} days.`;
    return { ok: false, field: "day", message };
  }
  const todayValue = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  if (year * 10000 + month * 100 + day > todayValue) {
    return { ok: false, field: "year", message: "That date is in the future. Sabrina reads stars, not time machines." };
  }
  return { ok: true, date: { year, month, day } };
}
