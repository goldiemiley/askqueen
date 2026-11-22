/**
 * AskQueen editorial content contracts (AQ-004).
 *
 * These types describe the *editorial* data shipped with the app: sign
 * profiles, roasts, themes, songs, Ask responses and compatibility pairs.
 * They deliberately contain no user data. Full birthdates, names, question
 * text and sexual orientation must never be added to these records or to
 * any tracking event; form input is processed in memory only.
 */

export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export const ROAST_THEMES = [
  "romantic_denial",
  "confidence",
  "burnout",
  "chaos",
  "boundaries",
  "yearning",
  "ambition",
  "self_reflection",
] as const;
export type RoastTheme = (typeof ROAST_THEMES)[number];

export const INTENSITIES = ["gentle", "savage", "unhinged"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const MUSIC_GENRES = [
  "pop",
  "indie",
  "rnb",
  "hip_hop",
  "rock",
  "electronic",
  "soul",
  "country",
  "latin",
  "kpop",
] as const;
export type MusicGenre = (typeof MUSIC_GENRES)[number];

export const ASK_CATEGORIES = [
  "romance",
  "career",
  "friendship",
  "plans",
  "money",
  "other",
] as const;
export type AskCategory = (typeof ASK_CATEGORIES)[number];

export const ASK_STANCES = ["yes", "no", "maybe", "try_again", "not_an_oracle"] as const;
export type AskStance = (typeof ASK_STANCES)[number];

export const RELATIONSHIP_TYPES = [
  "crush",
  "dating",
  "partner",
  "ex",
  "situationship",
  "curious",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/** Month (1–12) and day (1–31) only. No year: sun signs don't need one. */
export type MonthDay = { month: number; day: number };

export type SignProfile = {
  sign: ZodiacSign;
  displayName: string;
  /** Conventional tropical sun-sign range, inclusive. Simplified, not a natal chart. */
  start: MonthDay;
  end: MonthDay;
  element: "fire" | "earth" | "air" | "water";
  /** One-line Sabrina description of the sign's vibe. */
  vibe: string;
};

export type ThemeDefinition = {
  id: RoastTheme;
  label: string;
  /** One line shown under the theme label on the Daily page. */
  description: string;
  /**
   * Sabrina's explanations for picking a song with this theme. "{title}" is
   * replaced with the song title. One is chosen deterministically per reading.
   */
  songReasons: string[];
};

export type Roast = {
  id: string;
  sign: ZodiacSign;
  theme: RoastTheme;
  variants: Record<Intensity, string>;
};

export const ENERGY_LEVELS = ["low", "medium", "high"] as const;
export type Energy = (typeof ENERGY_LEVELS)[number];

export type Song = {
  id: string;
  title: string;
  artist: string;
  themes: RoastTheme[];
  genres: MusicGenre[];
  /** Optional mood tag. */
  energy?: Energy;
  /** Spotify search link built from title and artist. Never audio or artwork. */
  listenUrl: string;
  /** Spotify track ID for the official embedded player (22 characters). */
  spotifyTrackId?: string;
};

export type AskResponse = {
  id: string;
  category: AskCategory;
  stance: AskStance;
  /** 1–3 sentences. */
  text: string;
  /** Optional short supportive nudge. */
  nudge?: string;
};

/** One unordered sign pair. The matrix holds 78 of these (12×12, symmetric). */
export type CompatibilityPair = {
  signs: [ZodiacSign, ZodiacSign];
  /** Fictional base score, 0–100. Independent of names, orientation and relationship type. */
  baseScore: number;
  chemistry: string;
  communication: string;
  emotionalChaos: string;
};

/* ---------- Computed results (never persisted) ---------- */

export type DailyResult = {
  /** YYYY-MM-DD in the user's local calendar. */
  dateKey: string;
  sign: ZodiacSign;
  roast: Roast;
  theme: RoastTheme;
  song: Song;
  /** True when no song matched both the theme and the chosen genres. */
  genreFallback: boolean;
  /** Sabrina's explanation linking the song to the roast's theme. */
  songReason: string;
  /** Sabrina's advice, matched to the roast's theme. */
  advice: string;
  /** Something lucky today. */
  lucky: string;
  /** Something to avoid today. */
  avoid: string;
};

export type CompatibilityResult = {
  signA: ZodiacSign;
  signB: ZodiacSign;
  score: number;
  chemistry: string;
  communication: string;
  emotionalChaos: string;
  verdict: string;
  entertainmentOnly: true;
};
