import { describe, expect, it } from "vitest";
import { SIGN_PROFILES } from "@/data/signs";
import { addDays, dayNumber, formatLongDate, localDateKey } from "@/features/daily/date";
import { daysInMonth, isLeapYear, signForMonthDay, validateBirthDate } from "@/features/daily/zodiac";
import { validateAll, validateSignProfile } from "@/lib/validate-content";
import { ZODIAC_SIGNS } from "@/types/content";

const TODAY = new Date(2026, 10, 21, 12, 0); // 21 Nov 2026, local time

describe("signForMonthDay: all 12 signs", () => {
  it.each([
    [4, 5, "aries"],
    [5, 5, "taurus"],
    [6, 5, "gemini"],
    [7, 5, "cancer"],
    [8, 5, "leo"],
    [9, 5, "virgo"],
    [10, 5, "libra"],
    [11, 5, "scorpio"],
    [12, 5, "sagittarius"],
    [1, 5, "capricorn"],
    [2, 5, "aquarius"],
    [3, 5, "pisces"],
  ])("%i/%i → %s", (m, d, sign) => {
    expect(signForMonthDay(m, d)).toBe(sign);
  });
});

describe("signForMonthDay: boundary dates", () => {
  // Written out by hand so the test doesn't just re-read the data table.
  it.each([
    [3, 20, "pisces"], [3, 21, "aries"],
    [4, 19, "aries"], [4, 20, "taurus"],
    [5, 20, "taurus"], [5, 21, "gemini"],
    [6, 20, "gemini"], [6, 21, "cancer"],
    [7, 22, "cancer"], [7, 23, "leo"],
    [8, 22, "leo"], [8, 23, "virgo"],
    [9, 22, "virgo"], [9, 23, "libra"],
    [10, 22, "libra"], [10, 23, "scorpio"],
    [11, 21, "scorpio"], [11, 22, "sagittarius"],
    [12, 21, "sagittarius"], [12, 22, "capricorn"],
    [12, 31, "capricorn"], [1, 1, "capricorn"],
    [1, 19, "capricorn"], [1, 20, "aquarius"],
    [2, 18, "aquarius"], [2, 19, "pisces"],
    [2, 29, "pisces"],
  ])("%i/%i → %s", (m, d, sign) => {
    expect(signForMonthDay(m, d)).toBe(sign);
  });

  it("covers every day of a leap year exactly once, in 12 contiguous runs", () => {
    const counts: Record<string, number> = {};
    let changes = 0;
    let previous = signForMonthDay(12, 31);
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInMonth(2024, m); d++) {
        const sign = signForMonthDay(m, d);
        counts[sign] = (counts[sign] ?? 0) + 1;
        if (sign !== previous) changes++;
        previous = sign;
      }
    }
    expect(Object.keys(counts).sort()).toEqual([...ZODIAC_SIGNS].sort());
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(366);
    expect(changes).toBe(12);
  });

  it("rejects impossible month/day values", () => {
    expect(() => signForMonthDay(13, 1)).toThrow();
    expect(() => signForMonthDay(1, 0)).toThrow();
  });

  it("sign profiles are valid", () => {
    expect(validateAll(SIGN_PROFILES, validateSignProfile)).toEqual([]);
    expect(SIGN_PROFILES).toHaveLength(12);
  });
});

describe("leap years", () => {
  it.each([
    [2000, true], [2024, true], [1996, true],
    [1900, false], [2023, false], [2100, false],
  ])("%i leap: %s", (y, leap) => {
    expect(isLeapYear(y)).toBe(leap);
  });
});

describe("validateBirthDate", () => {
  const v = (day: string, month: string, year: string) => validateBirthDate({ day, month, year }, TODAY);

  it("accepts real dates, including 29 February in leap years", () => {
    expect(v("29", "2", "2000")).toEqual({ ok: true, date: { year: 2000, month: 2, day: 29 } });
    expect(v("29", "2", "2024").ok).toBe(true);
    expect(v("1", "1", "1900").ok).toBe(true);
    expect(v(" 7 ", "07", "1995")).toEqual({ ok: true, date: { year: 1995, month: 7, day: 7 } });
  });

  it("accepts today and rejects tomorrow", () => {
    expect(v("21", "11", "2026").ok).toBe(true);
    expect(v("22", "11", "2026")).toMatchObject({ ok: false, field: "year" });
  });

  it("rejects 29 February in non-leap years, including 1900", () => {
    expect(v("29", "2", "2023")).toEqual({
      ok: false,
      field: "day",
      message: "2023 wasn't a leap year, so February only had 28 days.",
    });
    expect(v("29", "2", "1900").ok).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(v("31", "4", "1999")).toEqual({ ok: false, field: "day", message: "April only has 30 days." });
    expect(v("30", "2", "2000")).toMatchObject({ ok: false, field: "day" });
    expect(v("0", "5", "1999")).toMatchObject({ ok: false, field: "day" });
    expect(v("32", "1", "1999")).toMatchObject({ ok: false, field: "day" });
    expect(v("10", "13", "1999")).toMatchObject({ ok: false, field: "month" });
    expect(v("10", "0", "1999")).toMatchObject({ ok: false, field: "month" });
  });

  it("rejects missing, non-numeric and out-of-range input", () => {
    expect(v("", "", "")).toMatchObject({ ok: false, field: "day" });
    expect(v("12", "", "1999")).toMatchObject({ ok: false, field: "month" });
    expect(v("12", "3", "")).toMatchObject({ ok: false, field: "year" });
    expect(v("1e1", "3", "1999")).toMatchObject({ ok: false, field: "day" });
    expect(v("12", "3", "99")).toMatchObject({ ok: false, field: "year" });
    expect(v("12", "3", "1899")).toMatchObject({ ok: false, field: "year" });
    expect(v("12.5", "3", "1999")).toMatchObject({ ok: false, field: "day" });
  });
});

describe("local calendar dates", () => {
  it("uses the local date, not UTC, late at night and early in the morning", () => {
    expect(localDateKey(new Date(2026, 10, 21, 23, 59, 59))).toBe("2026-11-21");
    expect(localDateKey(new Date(2026, 10, 22, 0, 0, 1))).toBe("2026-11-22");
    expect(localDateKey(new Date(2027, 0, 1, 0, 30))).toBe("2027-01-01");
  });

  it("counts days consistently across DST changes and year ends", () => {
    expect(dayNumber("2026-03-30") - dayNumber("2026-03-28")).toBe(2);
    expect(dayNumber("2026-11-02") - dayNumber("2026-10-31")).toBe(2);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("formats the date for display", () => {
    expect(formatLongDate("2026-11-21")).toBe("Saturday 21 November 2026");
  });
});
