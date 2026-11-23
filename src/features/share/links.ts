/**
 * Share links that reproduce a result exactly.
 *
 * A link carries the result itself (which roast, song and extras were
 * shown), never the inputs that produced it: no birthday, no name, no
 * genres and no Ask question. Every value is checked against AskQueen's own
 * content on the way back in, so a link can only ever display text that
 * AskQueen wrote. Nobody can craft a link that puts their own words on the
 * site.
 */
import { allAskResponses } from "@/data/ask-responses";
import { ADVICE, AVOID, LUCKY } from "@/data/daily-extras";
import { allRoasts } from "@/data/roasts";
import { songById } from "@/data/songs";
import { themeById } from "@/data/themes";
import {
  ASK_CATEGORIES,
  INTENSITIES,
  ZODIAC_SIGNS,
  type AskCategory,
  type AskResponse,
  type DailyResult,
  type Intensity,
  type Roast,
  type RoastTheme,
  type Song,
  type ZodiacSign,
} from "@/types/content";

export type SharedDaily = {
  kind: "daily";
  sign: ZodiacSign;
  dateKey: string;
  roast: Roast;
  theme: RoastTheme;
  intensity: Intensity;
  song: Song;
  songReason: string;
  advice: string;
  lucky: string;
  avoid: string;
};

export type SharedAsk = {
  kind: "ask";
  response: AskResponse;
  category: AskCategory | null;
};

export type SharedResult = SharedDaily | SharedAsk | { kind: "invalid" };

const roastById = new Map(allRoasts.map((r) => [r.id, r]));
const askById = new Map(allAskResponses.map((r) => [r.id, r]));

function reasonIndex(theme: RoastTheme, song: Song, reason: string): number {
  return themeById[theme].songReasons.findIndex((t) => t.replaceAll("{title}", song.title) === reason);
}

export function dailyShareParams(result: DailyResult, intensity: Intensity): URLSearchParams {
  return new URLSearchParams({
    t: "daily",
    s: result.sign,
    d: result.dateKey,
    r: result.roast.id,
    i: intensity,
    m: result.song.id,
    w: String(Math.max(0, reasonIndex(result.theme, result.song, result.songReason))),
    a: String(Math.max(0, ADVICE[result.theme].indexOf(result.advice))),
    l: String(Math.max(0, LUCKY.indexOf(result.lucky))),
    v: String(Math.max(0, AVOID.indexOf(result.avoid))),
  });
}

export function askShareParams(response: AskResponse, category: AskCategory | null): URLSearchParams {
  const p = new URLSearchParams({ t: "ask", a: response.id });
  if (category) p.set("c", category);
  return p;
}

export function shareUrl(
  origin: string,
  params: URLSearchParams,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "",
): string {
  return `${origin}${basePath}/share/?${params.toString()}`;
}

function index(raw: string | null, length: number): number | null {
  if (raw === null || !/^\d{1,3}$/.test(raw)) return null;
  const n = Number(raw);
  return n < length ? n : null;
}

function validDateKey(raw: string | null): raw is string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const [y, m, d] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && y >= 2025;
}

/** Turns a share link's query string back into a result, or "invalid". */
export function parseShare(search: string): SharedResult {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const invalid = { kind: "invalid" } as const;

  if (p.get("t") === "daily") {
    const sign = p.get("s");
    if (!sign || !(ZODIAC_SIGNS as readonly string[]).includes(sign)) return invalid;
    const dateKey = p.get("d");
    if (!validDateKey(dateKey)) return invalid;
    const roast = roastById.get(p.get("r") ?? "");
    if (!roast || roast.sign !== sign) return invalid;
    const intensity = p.get("i");
    if (!intensity || !(INTENSITIES as readonly string[]).includes(intensity)) return invalid;
    const song = songById[p.get("m") ?? ""];
    if (!song || !song.themes.includes(roast.theme)) return invalid;
    const theme = themeById[roast.theme];
    const w = index(p.get("w"), theme.songReasons.length);
    const a = index(p.get("a"), ADVICE[roast.theme].length);
    const l = index(p.get("l"), LUCKY.length);
    const v = index(p.get("v"), AVOID.length);
    if (w === null || a === null || l === null || v === null) return invalid;
    return {
      kind: "daily",
      sign: sign as ZodiacSign,
      dateKey,
      roast,
      theme: roast.theme,
      intensity: intensity as Intensity,
      song,
      songReason: theme.songReasons[w].replaceAll("{title}", song.title),
      advice: ADVICE[roast.theme][a],
      lucky: LUCKY[l],
      avoid: AVOID[v],
    };
  }

  if (p.get("t") === "ask") {
    const response = askById.get(p.get("a") ?? "");
    if (!response) return invalid;
    const c = p.get("c");
    if (c !== null && !(ASK_CATEGORIES as readonly string[]).includes(c)) return invalid;
    return { kind: "ask", response, category: (c as AskCategory | null) ?? null };
  }

  return invalid;
}

/** WhatsApp's own share link: opens the app (or WhatsApp Web) with the message filled in. */
export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
