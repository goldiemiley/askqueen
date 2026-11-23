/**
 * AskQueen Music Library: the rules for the song catalogue.
 *
 * `src/data/songs.json` is the single source of truth. The website reads it
 * (via songs.ts), the tests check it, and the local Music Library editor
 * (`npm run library`) loads, validates and saves it with these same functions.
 *
 * Song IDs are permanent: shared Daily links store them. Removing a song
 * normally means retiring it (it stops being recommended, but old links
 * still show it). Deleting it outright makes old links that used it show
 * "This reading has vanished".
 */
import { ENERGY_LEVELS, MUSIC_GENRES, ROAST_THEMES } from "@/types/content";
import type { Energy, MusicGenre, RoastTheme } from "@/types/content";

/** One song as stored in songs.json. */
export type SongRecord = {
  id: string;
  title: string;
  artist: string;
  genres: MusicGenre[];
  themes: RoastTheme[];
  energy: Energy;
  /** 22-character Spotify track ID, for the preview player. Optional. */
  spotifyTrackId?: string;
  /** Retired songs stay for old share links but are never recommended. */
  retired?: true;
};

export type CatalogueFile = { version: 1; songs: SongRecord[] };

export const GENRE_LABELS: Record<MusicGenre, string> = {
  pop: "Pop",
  indie: "Indie",
  rnb: "R&B",
  hip_hop: "Hip-hop",
  rock: "Rock",
  electronic: "Electronic",
  soul: "Soul",
  country: "Country",
  latin: "Latin",
  kpop: "K-pop",
};

/** Same labels as src/data/themes.ts, kept here so the editor needs no other files. */
export const THEME_LABELS: Record<RoastTheme, string> = {
  romantic_denial: "Romantic denial",
  confidence: "Confidence",
  burnout: "Burnout",
  chaos: "Chaos",
  boundaries: "Boundaries",
  yearning: "Yearning",
  ambition: "Ambition",
  self_reflection: "Self-reflection",
};

/** A theme × genre pair with fewer songs than this gets a coverage warning. */
export const PAIR_TARGET = 3;
/** A theme with fewer active songs than this gets a warning (more repeats). */
export const THEME_TARGET = 14;

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SPOTIFY_ID_RE = /^[0-9A-Za-z]{22}$/;

// ---------- Spotify links ----------

export type SpotifyParse = { ok: true; id: string } | { ok: false; reason: string };

/**
 * Accepts a track ID, a track link (open.spotify.com/track/…, with or without
 * a language segment or ?si=…), an embed link, or a spotify:track: URI.
 */
export function parseSpotifyTrack(input: string): SpotifyParse {
  const s = input.trim();
  if (!s) return { ok: false, reason: "empty" };
  if (SPOTIFY_ID_RE.test(s)) return { ok: true, id: s };
  const uri = /^spotify:track:([0-9A-Za-z]{22})$/.exec(s);
  if (uri) return { ok: true, id: uri[1] };
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return { ok: false, reason: "Paste a Spotify track link or a 22-character track ID." };
  }
  if (url.protocol !== "https:" || !/^(open|play)\.spotify\.com$/.test(url.hostname))
    return { ok: false, reason: "That isn't a Spotify link." };
  const parts = url.pathname.split("/").filter(Boolean);
  const i = parts.findIndex((p) => p === "track");
  if (i === -1) {
    const kind = parts.find((p) => ["album", "playlist", "artist", "episode", "show"].includes(p));
    return { ok: false, reason: kind ? `That's a Spotify ${kind} link. Open the song itself and copy its link.` : "That Spotify link isn't a track." };
  }
  const id = parts[i + 1] ?? "";
  return SPOTIFY_ID_RE.test(id) ? { ok: true, id } : { ok: false, reason: "That track link looks incomplete." };
}

// ---------- IDs and duplicates ----------

/** Lowercase, no accents, no "feat." parts or brackets, no punctuation. */
export function normalizeText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\((?:feat|ft|with)\.?[^)]*\)|\[(?:feat|ft|with)\.?[^\]]*\]/g, " ")
    .replace(/\s(?:feat|ft)\.?\s.*$/, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/^the /, "")
    .trim();
}

/** Main artist only: the part before the first comma, "&", "x" or "feat". */
function mainArtist(artist: string): string {
  return normalizeText(artist.split(/,|&| x | feat\.?| ft\.?| and /i)[0] ?? artist);
}

export function duplicateKey(r: Pick<SongRecord, "title" | "artist">): string {
  return `${normalizeText(r.title)}|${mainArtist(r.artist)}`;
}

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/** A new, unused ID from the title (plus the artist if needed). */
export function makeSongId(title: string, artist: string, taken: ReadonlySet<string>): string {
  const base = slugify(title) || "song";
  if (!taken.has(base)) return base;
  const withArtist = slugify(`${title} ${mainArtist(artist)}`) || base;
  if (!taken.has(withArtist)) return withArtist;
  for (let n = 2; ; n++) if (!taken.has(`${withArtist}-${n}`)) return `${withArtist}-${n}`;
}

// ---------- Validation ----------

export type Issue = {
  level: "error" | "warning";
  /** Song this is about, when it's about one song. */
  songId?: string;
  code: string;
  message: string;
};

export type Coverage = {
  total: number;
  active: number;
  retired: number;
  missingSpotify: number;
  byGenre: Record<MusicGenre, number>;
  byTheme: Record<RoastTheme, number>;
  /** Active songs per theme × genre. */
  pairs: Record<RoastTheme, Record<MusicGenre, number>>;
};

export type Report = { issues: Issue[]; errors: number; warnings: number; coverage: Coverage };

const isActive = (r: SongRecord) => !r.retired;

export function coverageOf(songs: readonly SongRecord[]): Coverage {
  const zeroGenres = () => Object.fromEntries(MUSIC_GENRES.map((g) => [g, 0])) as Record<MusicGenre, number>;
  const byGenre = zeroGenres();
  const byTheme = Object.fromEntries(ROAST_THEMES.map((t) => [t, 0])) as Record<RoastTheme, number>;
  const pairs = Object.fromEntries(ROAST_THEMES.map((t) => [t, zeroGenres()])) as Coverage["pairs"];
  const active = songs.filter(isActive);
  for (const s of active) {
    for (const g of s.genres) if (g in byGenre) byGenre[g]++;
    for (const t of s.themes) {
      if (!(t in byTheme)) continue;
      byTheme[t]++;
      for (const g of s.genres) if (g in pairs[t]) pairs[t][g]++;
    }
  }
  return {
    total: songs.length,
    active: active.length,
    retired: songs.length - active.length,
    missingSpotify: active.filter((s) => !s.spotifyTrackId).length,
    byGenre,
    byTheme,
    pairs,
  };
}

/** Problems with one record on its own. */
export function validateRecord(v: unknown): string[] {
  const out: string[] = [];
  if (typeof v !== "object" || v === null || Array.isArray(v)) return ["must be an object"];
  const r = v as Record<string, unknown>;
  const allowed = new Set(["id", "title", "artist", "genres", "themes", "energy", "spotifyTrackId", "retired"]);
  for (const k of Object.keys(r)) if (!allowed.has(k)) out.push(`unknown field "${k}"`);
  if (typeof r.id !== "string" || !ID_RE.test(r.id)) out.push("ID must be lowercase letters, numbers and dashes");
  if (typeof r.title !== "string" || !r.title.trim()) out.push("Song title is required");
  else if (r.title.length > 120) out.push("Song title is longer than 120 characters");
  if (typeof r.artist !== "string" || !r.artist.trim()) out.push("Artist is required");
  else if (r.artist.length > 120) out.push("Artist is longer than 120 characters");
  const listOf = (val: unknown, known: readonly string[]) =>
    Array.isArray(val) && val.length > 0 && val.every((x) => known.includes(x as string)) && new Set(val).size === val.length;
  if (!listOf(r.genres, MUSIC_GENRES)) out.push("Pick at least one genre from the list");
  if (!listOf(r.themes, ROAST_THEMES)) out.push("Pick at least one theme from the list");
  if (!(ENERGY_LEVELS as readonly unknown[]).includes(r.energy)) out.push("Energy must be low, medium or high");
  if (r.spotifyTrackId !== undefined && (typeof r.spotifyTrackId !== "string" || !SPOTIFY_ID_RE.test(r.spotifyTrackId)))
    out.push("Spotify track ID must be 22 letters and numbers");
  if (r.retired !== undefined && r.retired !== true) out.push('"retired" must be true or left out');
  return out;
}

/**
 * Checks a whole catalogue. Errors block saving and fail the build;
 * warnings are advice. `published` (the IDs in the last saved catalogue)
 * turns deleted IDs into warnings about broken share links.
 */
export function validateCatalogue(input: unknown, published?: ReadonlySet<string>): Report {
  const issues: Issue[] = [];
  const err = (code: string, message: string, songId?: string) => issues.push({ level: "error", code, message, songId });
  const warn = (code: string, message: string, songId?: string) => issues.push({ level: "warning", code, message, songId });

  const list: unknown[] = Array.isArray(input) ? input : [];
  if (!Array.isArray(input)) err("shape", "The catalogue must be a list of songs.");

  const good: SongRecord[] = [];
  list.forEach((v, i) => {
    const problems = validateRecord(v);
    const id = typeof (v as SongRecord)?.id === "string" ? (v as SongRecord).id : undefined;
    for (const p of problems) err("record", `${id ?? `Song #${i + 1}`}: ${p}`, id);
    if (problems.length === 0) good.push(v as SongRecord);
  });

  const seen = new Map<string, string>();
  const ids = new Set<string>();
  const spotify = new Map<string, string>();
  for (const r of good) {
    if (ids.has(r.id)) err("duplicate-id", `Two songs use the ID "${r.id}".`, r.id);
    ids.add(r.id);
    const key = duplicateKey(r);
    const other = seen.get(key);
    if (other) err("duplicate-song", `"${r.title}" by ${r.artist} is already in the library (${other}).`, r.id);
    else seen.set(key, r.id);
    if (r.spotifyTrackId) {
      const o = spotify.get(r.spotifyTrackId);
      if (o) err("duplicate-spotify", `${r.id} uses the same Spotify track as ${o}.`, r.id);
      else spotify.set(r.spotifyTrackId, r.id);
    } else if (!r.retired) warn("no-spotify", `${r.title}: no Spotify track ID, so no preview player (the Spotify search link still works).`, r.id);
  }

  if (published) {
    for (const id of published)
      if (!ids.has(id))
        warn("deleted", `"${id}" was deleted. Old share links that used it will show "This reading has vanished". Retire it instead to keep them working.`);
  }

  const coverage = coverageOf(good);
  for (const t of ROAST_THEMES) {
    if (coverage.byTheme[t] === 0) err("empty-theme", `No active songs for ${THEME_LABELS[t]}. Daily roasts with this theme would have no song.`);
    else if (coverage.byTheme[t] < THEME_TARGET)
      warn("thin-theme", `${THEME_LABELS[t]} has ${coverage.byTheme[t]} active songs. Under ${THEME_TARGET}, people will hear repeats within two weeks.`);
    for (const g of MUSIC_GENRES) {
      const n = coverage.pairs[t][g];
      if (n < PAIR_TARGET)
        warn(
          "thin-pair",
          `${THEME_LABELS[t]} × ${GENRE_LABELS[g]}: ${n} song${n === 1 ? "" : "s"}. ${GENRE_LABELS[g]} fans ${n === 0 ? "get songs from other genres" : "hear repeats"} on ${THEME_LABELS[t].toLowerCase()} days.`,
        );
    }
  }

  return {
    issues,
    errors: issues.filter((x) => x.level === "error").length,
    warnings: issues.filter((x) => x.level === "warning").length,
    coverage,
  };
}

// ---------- File format ----------

/** songs.json with one song per line, so git diffs show exactly which songs changed. */
export function formatCatalogue(songs: readonly SongRecord[]): string {
  const ordered = songs.map((s) => {
    const o: Record<string, unknown> = {
      id: s.id,
      title: s.title.trim(),
      artist: s.artist.trim(),
      genres: s.genres,
      themes: s.themes,
      energy: s.energy,
    };
    if (s.spotifyTrackId) o.spotifyTrackId = s.spotifyTrackId;
    if (s.retired) o.retired = true;
    return o;
  });
  return `{\n  "version": 1,\n  "songs": [\n${ordered.map((o) => `    ${JSON.stringify(o)}`).join(",\n")}\n  ]\n}\n`;
}

// ---------- Import ----------

export type ImportResult = { songs: SongRecord[]; added: number; updated: number; skipped: string[]; retired: number };

function matchLabel<T extends string>(value: unknown, labels: Record<T, string>): T | undefined {
  if (typeof value !== "string") return undefined;
  const v = normalizeText(value).replace(/ /g, "");
  return (Object.keys(labels) as T[]).find(
    (k) => normalizeText(k).replace(/ /g, "") === v || normalizeText(labels[k]).replace(/ /g, "") === v,
  );
}

function listFrom<T extends string>(value: unknown, labels: Record<T, string>): T[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,;/]/) : [];
  const out: T[] = [];
  for (const x of raw) {
    const m = matchLabel(x, labels);
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}

/**
 * Reads songs from JSON in either the full format ({version, songs} or a list
 * of SongRecords) or a simple one such as
 *   [{ "title": "Hard Times", "artist": "Paramore", "genre": "Rock", "theme": "Burnout" }]
 * Labels or IDs both work for genres and themes; "genre"/"genres" and
 * "theme"/"themes" may be text or lists; "spotify" may be a link.
 */
export function normalizeImported(json: unknown): { songs: Array<Partial<SongRecord> & { title: string; artist: string }>; problems: string[] } {
  const list = Array.isArray(json) ? json : (json as { songs?: unknown })?.songs;
  if (!Array.isArray(list)) return { songs: [], problems: ["The file must contain a list of songs."] };
  const songs: Array<Partial<SongRecord> & { title: string; artist: string }> = [];
  const problems: string[] = [];
  list.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null) return problems.push(`Item ${i + 1} isn't a song.`);
    const r = raw as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const artist = typeof r.artist === "string" ? r.artist.trim() : "";
    if (!title || !artist) return problems.push(`Item ${i + 1} needs a title and an artist.`);
    const genres = listFrom(r.genres ?? r.genre, GENRE_LABELS);
    const themes = listFrom(r.themes ?? r.theme, THEME_LABELS);
    const energy = (ENERGY_LEVELS as readonly string[]).includes(String(r.energy).toLowerCase())
      ? (String(r.energy).toLowerCase() as Energy)
      : undefined;
    const spotifyRaw = r.spotifyTrackId ?? r.spotify ?? r.spotifyUrl ?? r.spotifyLink;
    const sp = typeof spotifyRaw === "string" ? parseSpotifyTrack(spotifyRaw) : null;
    if (sp && !sp.ok && spotifyRaw !== "") problems.push(`${title}: ${sp.reason}`);
    songs.push({
      ...(typeof r.id === "string" && ID_RE.test(r.id) ? { id: r.id } : {}),
      title,
      artist,
      genres,
      themes,
      ...(energy ? { energy } : {}),
      ...(sp?.ok ? { spotifyTrackId: sp.id } : {}),
      ...(r.retired === true ? { retired: true as const } : {}),
    });
  });
  return { songs, problems };
}

/**
 * Merges imported songs into the catalogue.
 * - "add": new songs are added; songs already in the library (same ID, same
 *   title + artist, or same Spotify track) are updated with any fields the
 *   import provides.
 * - "replace": as "add", and every existing song missing from the import is
 *   retired (never deleted), so old share links keep working.
 * Missing energy defaults to medium. Songs without a genre or theme are
 * kept but will show as errors until fixed.
 */
export function mergeImport(
  current: readonly SongRecord[],
  imported: ReadonlyArray<Partial<SongRecord> & { title: string; artist: string }>,
  mode: "add" | "replace",
): ImportResult {
  const songs = current.map((s) => ({ ...s }));
  const byId = new Map(songs.map((s) => [s.id, s]));
  const byKey = new Map(songs.map((s) => [duplicateKey(s), s]));
  const bySpotify = new Map(songs.filter((s) => s.spotifyTrackId).map((s) => [s.spotifyTrackId!, s]));
  const taken = new Set(songs.map((s) => s.id));
  const touched = new Set<string>();
  let added = 0;
  let updated = 0;
  const skipped: string[] = [];

  for (const im of imported) {
    const existing =
      (im.id && byId.get(im.id)) ||
      byKey.get(duplicateKey(im)) ||
      (im.spotifyTrackId ? bySpotify.get(im.spotifyTrackId) : undefined);
    if (existing) {
      if (touched.has(existing.id)) {
        skipped.push(`${im.title} (listed twice)`);
        continue;
      }
      touched.add(existing.id);
      if (im.genres?.length) existing.genres = im.genres;
      if (im.themes?.length) existing.themes = im.themes;
      if (im.energy) existing.energy = im.energy;
      if (im.spotifyTrackId) existing.spotifyTrackId = im.spotifyTrackId;
      if (mode === "replace" || im.retired === undefined) delete existing.retired;
      if (im.retired) existing.retired = true;
      updated++;
    } else {
      const id = im.id && !taken.has(im.id) ? im.id : makeSongId(im.title, im.artist, taken);
      taken.add(id);
      const rec: SongRecord = {
        id,
        title: im.title,
        artist: im.artist,
        genres: im.genres ?? [],
        themes: im.themes ?? [],
        energy: im.energy ?? "medium",
        ...(im.spotifyTrackId ? { spotifyTrackId: im.spotifyTrackId } : {}),
        ...(im.retired ? { retired: true as const } : {}),
      };
      songs.push(rec);
      byId.set(id, rec);
      byKey.set(duplicateKey(rec), rec);
      if (rec.spotifyTrackId) bySpotify.set(rec.spotifyTrackId, rec);
      touched.add(id);
      added++;
    }
  }

  let retired = 0;
  if (mode === "replace") {
    for (const s of songs)
      if (!touched.has(s.id) && !s.retired) {
        s.retired = true;
        retired++;
      }
  }
  return { songs, added, updated, skipped, retired };
}
