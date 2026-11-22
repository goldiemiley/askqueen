/**
 * Daily reading engine. Deterministic and in-memory:
 *
 *   person = sign + birthday (month/day only; never stored)
 *   roast  = rotation over the sign's roasts, shuffled per person and cycle
 *   song   = roast's theme first, then genres; no repeat within 14 days
 *   extras = advice (matched to the theme), lucky and avoid, each rotating
 *
 * Intensity never affects any choice, only which wording of the roast is shown.
 * Same person + date + genres always gives the same reading, so a refresh
 * changes nothing and nothing has to be saved anywhere.
 */
import { ADVICE, AVOID, LUCKY } from "@/data/daily-extras";
import { roastsForSign } from "@/data/roasts";
import { SONGS, songById } from "@/data/songs";
import { themeById } from "@/data/themes";
import { fnv1a, seededShuffle } from "@/lib/hash";
import {
  MUSIC_GENRES,
  type DailyResult,
  type Intensity,
  type MusicGenre,
  type Roast,
  type RoastTheme,
  type Song,
  type ZodiacSign,
} from "@/types/content";
import { dayNumber, keyFromDayNumber } from "./date";

export const MAX_GENRES = 3;
/** A song isn't picked again within this many days for the same person and genres. */
export const SONG_NO_REPEAT_DAYS = 14;
/** Song history is replayed from this date so the no-repeat rule needs no storage. */
export const SONG_HISTORY_START = "2026-01-01";

export type Birthday = { month: number; day: number };

/** Dedupes, drops unknown values, caps at three and sorts so order never matters. */
export function normalizeGenres(genres: readonly string[]): MusicGenre[] {
  const valid = new Set<MusicGenre>();
  for (const g of genres) if ((MUSIC_GENRES as readonly string[]).includes(g)) valid.add(g as MusicGenre);
  return [...valid].slice(0, MAX_GENRES).sort();
}

function personKey(birthday?: Birthday): string {
  return birthday ? `${birthday.month}-${birthday.day}` : "any";
}

const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/**
 * Picks an index 0..n-1 for a given day. Every n days form a cycle in which
 * each index appears exactly once, in a shuffled order unique to `seed`.
 * The first two of a cycle are swapped if needed, so the same index never
 * appears two days running across a cycle boundary.
 */
export function rotationIndex(n: number, seed: string, day: number): number {
  if (n <= 1) return 0;
  const cycle = Math.floor(day / n);
  const position = ((day % n) + n) % n;
  const order = seededShuffle(range(n), `${seed}|${cycle}`);
  if (n > 2) {
    const previousLast = seededShuffle(range(n), `${seed}|${cycle - 1}`)[n - 1];
    if (order[0] === previousLast) [order[0], order[1]] = [order[1], order[0]];
  }
  return order[position];
}

export function selectRoast(sign: ZodiacSign, dateKey: string, birthday?: Birthday): Roast {
  const pool = roastsForSign(sign).sort(byId);
  if (pool.length === 0) throw new Error(`No roasts for ${sign}`);
  return pool[rotationIndex(pool.length, `roast|${sign}|${personKey(birthday)}`, dayNumber(dateKey))];
}

export type SongPool = { pool: Song[]; genreFallback: boolean };

/** Songs sharing the theme, narrowed to the user's genres when any of them carry it. */
export function songPool(theme: RoastTheme, genres: readonly MusicGenre[]): SongPool {
  const themed = SONGS.filter((s) => s.themes.includes(theme)).sort(byId);
  if (themed.length === 0) throw new Error(`No songs for theme ${theme}`);
  const wanted = new Set(genres);
  const inGenre = wanted.size > 0 ? themed.filter((s) => s.genres.some((g) => wanted.has(g))) : themed;
  return inGenre.length > 0 ? { pool: inGenre, genreFallback: false } : { pool: themed, genreFallback: wanted.size > 0 };
}

/** Avoids songs in `recent`; if every option was played recently, takes the one played longest ago. */
export function pickFromPool(pool: Song[], seed: string, recent: readonly string[] = []): Song {
  const fresh = pool.filter((s) => !recent.includes(s.id));
  if (fresh.length > 0) return fresh[fnv1a(seed) % fresh.length];
  let best = pool[0];
  let bestPosition = Infinity;
  for (const s of pool) {
    const position = recent.lastIndexOf(s.id);
    if (position < bestPosition) {
      best = s;
      bestPosition = position;
    }
  }
  return best;
}

function songSeed(dateKey: string, sign: ZodiacSign, person: string, roastId: string, genres: readonly MusicGenre[]) {
  return `song|${dateKey}|${sign}|${person}|${roastId}|${genres.join(",")}`;
}

/** In-memory only (cleared when the tab closes): replayed song picks per person and genre set. */
const songHistory = new Map<string, string[]>();

/**
 * The song for one day. From SONG_HISTORY_START onwards, earlier days are
 * replayed in order so the last 13 picks can be excluded. The replay is
 * deterministic, so today's song is always the same and needs no storage.
 */
export function selectSong(
  sign: ZodiacSign,
  dateKey: string,
  genres: readonly MusicGenre[],
  birthday?: Birthday,
): { song: Song; genreFallback: boolean; seed: string } {
  const person = personKey(birthday);
  const day = dayNumber(dateKey);
  const start = dayNumber(SONG_HISTORY_START);
  const roast = selectRoast(sign, dateKey, birthday);
  const { pool, genreFallback } = songPool(roast.theme, genres);
  const seed = songSeed(dateKey, sign, person, roast.id, genres);

  if (day < start) return { song: pickFromPool(pool, seed), genreFallback, seed };

  const key = `${sign}|${person}|${genres.join(",")}`;
  const picks = songHistory.get(key) ?? [];
  songHistory.set(key, picks);
  while (start + picks.length <= day) {
    const d = start + picks.length;
    const dk = keyFromDayNumber(d);
    const r = selectRoast(sign, dk, birthday);
    const p = songPool(r.theme, genres).pool;
    const recent = picks.slice(-(SONG_NO_REPEAT_DAYS - 1));
    picks.push(pickFromPool(p, songSeed(dk, sign, person, r.id, genres), recent).id);
  }
  return { song: songById[picks[day - start]], genreFallback, seed };
}

export function songReasonFor(theme: RoastTheme, song: Song, seed: string): string {
  const reasons = themeById[theme].songReasons;
  return reasons[fnv1a(`${seed}|reason`) % reasons.length].replaceAll("{title}", song.title);
}

export function fallbackNote(theme: RoastTheme): string {
  return `None of your genres had a ${themeById[theme].label.toLowerCase()} song today, so Sabrina went off-list.`;
}

export function selectExtras(sign: ZodiacSign, dateKey: string, theme: RoastTheme, birthday?: Birthday) {
  const person = personKey(birthday);
  const day = dayNumber(dateKey);
  const advicePool = ADVICE[theme];
  return {
    advice: advicePool[rotationIndex(advicePool.length, `advice|${sign}|${person}|${theme}`, day)],
    lucky: LUCKY[rotationIndex(LUCKY.length, `lucky|${sign}|${person}`, day)],
    avoid: AVOID[rotationIndex(AVOID.length, `avoid|${sign}|${person}`, day)],
  };
}

export function getDailyReading(input: {
  sign: ZodiacSign;
  dateKey: string;
  genres?: readonly string[];
  birthday?: Birthday;
}): DailyResult {
  const genres = normalizeGenres(input.genres ?? []);
  const roast = selectRoast(input.sign, input.dateKey, input.birthday);
  const { song, genreFallback, seed } = selectSong(input.sign, input.dateKey, genres, input.birthday);
  return {
    dateKey: input.dateKey,
    sign: input.sign,
    roast,
    theme: roast.theme,
    song,
    genreFallback,
    songReason: songReasonFor(roast.theme, song, seed),
    ...selectExtras(input.sign, input.dateKey, roast.theme, input.birthday),
  };
}

export function roastText(result: DailyResult, intensity: Intensity): string {
  return result.roast.variants[intensity];
}
