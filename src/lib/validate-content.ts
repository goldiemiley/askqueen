/**
 * Dependency-free runtime validators for AskQueen editorial content.
 * Each validator returns a list of human-readable problems; an empty list
 * means the record is valid. Used by tests to check every data file.
 */
import {
  ENERGY_LEVELS,
  ASK_CATEGORIES,
  ASK_STANCES,
  INTENSITIES,
  MUSIC_GENRES,
  ROAST_THEMES,
  ZODIAC_SIGNS,
  type AskResponse,
  type CompatibilityPair,
  type MonthDay,
  type Roast,
  type SignProfile,
  type Song,
  type ThemeDefinition,
} from "@/types/content";

type Problems = string[];

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const oneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] =>
  typeof v === "string" && (list as readonly string[]).includes(v);

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function checkMonthDay(v: unknown, field: string, out: Problems) {
  if (!isObj(v)) return void out.push(`${field} must be an object`);
  const { month, day } = v as MonthDay;
  if (!Number.isInteger(month) || month < 1 || month > 12) out.push(`${field}.month must be 1–12`);
  else if (!Number.isInteger(day) || day < 1 || day > DAYS_IN_MONTH[month - 1])
    out.push(`${field}.day is not a valid day for month ${month}`);
}

function checkId(v: Record<string, unknown>, out: Problems) {
  if (!nonEmpty(v.id) || !/^[a-z0-9][a-z0-9_-]*$/.test(v.id as string))
    out.push("id must be a lowercase slug");
}

export function validateSignProfile(v: unknown): Problems {
  const out: Problems = [];
  if (!isObj(v)) return ["record must be an object"];
  if (!oneOf(ZODIAC_SIGNS, v.sign)) out.push("sign is not a known zodiac sign");
  if (!nonEmpty(v.displayName)) out.push("displayName is required");
  checkMonthDay(v.start, "start", out);
  checkMonthDay(v.end, "end", out);
  if (!oneOf(["fire", "earth", "air", "water"] as const, v.element)) out.push("element is invalid");
  if (!nonEmpty(v.vibe)) out.push("vibe is required");
  return out;
}

export function validateTheme(v: unknown): Problems {
  const out: Problems = [];
  if (!isObj(v)) return ["record must be an object"];
  if (!oneOf(ROAST_THEMES, v.id)) out.push("id is not a known theme");
  if (!nonEmpty(v.label)) out.push("label is required");
  if (!nonEmpty(v.description)) out.push("description is required");
  if (
    !Array.isArray(v.songReasons) ||
    v.songReasons.length === 0 ||
    !v.songReasons.every((r) => nonEmpty(r) && String(r).includes("{title}"))
  )
    out.push("songReasons must be a non-empty list of lines that each include {title}");
  return out;
}

export function validateRoast(v: unknown): Problems {
  const out: Problems = [];
  if (!isObj(v)) return ["record must be an object"];
  checkId(v, out);
  if (!oneOf(ZODIAC_SIGNS, v.sign)) out.push("sign is not a known zodiac sign");
  if (!oneOf(ROAST_THEMES, v.theme)) out.push("theme is not a known theme");
  if (!isObj(v.variants)) out.push("variants must include gentle, savage and unhinged");
  else
    for (const i of INTENSITIES) {
      const text = (v.variants as Record<string, unknown>)[i];
      if (!nonEmpty(text)) out.push(`variants.${i} is required`);
      else if (text.length > 280) out.push(`variants.${i} should be 1–3 short sentences (max 280 chars)`);
    }
  return out;
}

export function validateSong(v: unknown): Problems {
  const out: Problems = [];
  if (!isObj(v)) return ["record must be an object"];
  checkId(v, out);
  if (!nonEmpty(v.title)) out.push("title is required");
  if (!nonEmpty(v.artist)) out.push("artist is required");
  if (!Array.isArray(v.themes) || v.themes.length === 0 || !v.themes.every((t) => oneOf(ROAST_THEMES, t)))
    out.push("themes must be a non-empty list of known themes");
  if (!Array.isArray(v.genres) || v.genres.length === 0 || !v.genres.every((g) => oneOf(MUSIC_GENRES, g)))
    out.push("genres must be a non-empty list of known genres");
  if (v.energy !== undefined && !oneOf(ENERGY_LEVELS, v.energy)) out.push("energy must be low, medium or high");
  if (v.spotifyTrackId !== undefined && !/^[0-9A-Za-z]{22}$/.test(String(v.spotifyTrackId)))
    out.push("spotifyTrackId must be a 22-character Spotify ID");
  try {
    const u = new URL(String(v.listenUrl));
    if (u.protocol !== "https:") out.push("listenUrl must use https");
  } catch {
    out.push("listenUrl must be a valid URL");
  }
  return out;
}

export function validateAskResponse(v: unknown): Problems {
  const out: Problems = [];
  if (!isObj(v)) return ["record must be an object"];
  checkId(v, out);
  if (!oneOf(ASK_CATEGORIES, v.category)) out.push("category is invalid");
  if (!oneOf(ASK_STANCES, v.stance)) out.push("stance is invalid");
  if (!nonEmpty(v.text)) out.push("text is required");
  else if ((v.text as string).length > 280) out.push("text should be 1–3 short sentences (max 280 chars)");
  if (v.nudge !== undefined && !nonEmpty(v.nudge)) out.push("nudge must be text when present");
  return out;
}

export function validateCompatibilityPair(v: unknown): Problems {
  const out: Problems = [];
  if (!isObj(v)) return ["record must be an object"];
  if (!Array.isArray(v.signs) || v.signs.length !== 2 || !v.signs.every((s) => oneOf(ZODIAC_SIGNS, s)))
    out.push("signs must be two known zodiac signs");
  if (typeof v.baseScore !== "number" || !Number.isInteger(v.baseScore) || v.baseScore < 0 || v.baseScore > 100)
    out.push("baseScore must be an integer 0–100");
  for (const f of ["chemistry", "communication", "emotionalChaos"] as const)
    if (!nonEmpty(v[f])) out.push(`${f} is required`);
  return out;
}

/** Validates a whole list and reports problems with the record's index/id. */
export function validateAll(records: unknown[], fn: (v: unknown) => Problems): string[] {
  const ids = new Set<string>();
  const out: string[] = [];
  records.forEach((r, i) => {
    const label = isObj(r) && typeof r.id === "string" ? r.id : `#${i}`;
    for (const p of fn(r)) out.push(`${label}: ${p}`);
    if (isObj(r) && typeof r.id === "string") {
      if (ids.has(r.id)) out.push(`${label}: duplicate id`);
      ids.add(r.id);
    }
  });
  return out;
}

export type {
  AskResponse,
  CompatibilityPair,
  Roast,
  SignProfile,
  Song,
  ThemeDefinition,
};
