/**
 * Finds Spotify track IDs for catalogue songs, using Spotify's official Web
 * API (Client Credentials flow). Local only: the editor server and the
 * spotify:test script import this; nothing under src/ does, so the
 * credentials can never reach the public site.
 *
 * Credentials live in .env.local at the repo root (git-ignored):
 *   SPOTIFY_CLIENT_ID=…
 *   SPOTIFY_CLIENT_SECRET=…
 *   SPOTIFY_MARKET=US   (optional; tracks not playable there are skipped)
 *
 * Every ID this returns came from a Spotify response, and auto-accepted ones
 * are re-fetched by ID before being trusted. Nothing is guessed.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------- Text normalisation ----------

/** Lowercase, no accents, "&" = "and", punctuation dropped, leading "the" dropped. */
export function normText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "");
}

/**
 * Splits "Song (feat. X) - Remastered 2011" into the base title and its extras
 * ("feat. X", "Remastered 2011"). Version markers are only looked for in extras,
 * so a song called "Live Forever" is not mistaken for a live recording.
 */
export function splitTitle(title: string): { base: string; extras: string[] } {
  const extras: string[] = [];
  let base = title.replace(/[([]([^)\]]*)[)\]]/g, (_, inner: string) => {
    extras.push(inner.trim());
    return " ";
  });
  const dash = base.split(/\s+[-–—]\s+/);
  base = dash.shift() ?? base;
  extras.push(...dash.map((d) => d.trim()));
  return { base: base.replace(/\s+/g, " ").trim(), extras: extras.filter(Boolean) };
}

/** Recordings we don't want unless the catalogue title asks for them. */
const VERSION_MARKERS: Array<[string, RegExp]> = [
  ["live", /\b(live|en vivo|ao vivo|unplugged|in concert|live at|live from|live in)\b/],
  ["remix", /\b(remix|rmx|mix|bootleg|rework|flip|vip)\b/],
  ["karaoke", /\b(karaoke|backing track|minus one)\b/],
  ["instrumental", /\binstrumental\b/],
  ["acoustic", /\b(acoustic|stripped|piano version|orchestral)\b/],
  ["cover", /\b(cover|tribute|made famous|originally performed|in the style of|as made popular)\b/],
  ["demo", /\bdemo\b/],
  ["sped up or slowed", /\b(sped up|speed up|slowed|reverb|nightcore|8d|lofi|lo fi)\b/],
];
const HARMLESS_MIX = /\b(original mix|album mix|single mix|radio mix|mono mix|stereo mix|2\d{3} mix|mixed)\b/;
/** Albums that are tribute or karaoke collections, or live records. */
const ALBUM_MARKERS: Array<[string, RegExp]> = [
  ["karaoke", /\bkaraoke\b/],
  ["cover", /\b(tribute|covers|made famous|in the style of|as made popular|lullaby renditions|string quartet renditions)\b/],
  ["live", /\b(live at|live from|live in|unplugged|in concert|\(live\)|live sessions?)\b/],
];

/** The version markers in a Spotify title/album that the catalogue title didn't ask for. */
export function unwantedVersions(catalogueTitle: string, trackName: string, albumName: string): string[] {
  const asked = normText(catalogueTitle);
  const found = new Set<string>();
  for (const extra of splitTitle(trackName).extras) {
    const e = normText(extra).replace(HARMLESS_MIX, " ");
    for (const [label, re] of VERSION_MARKERS) if (re.test(e)) found.add(label);
  }
  const album = normText(albumName).replace(/\blive\b(?! (at|from|in|sessions?)\b)/g, " ");
  for (const [label, re] of ALBUM_MARKERS) if (re.test(album) || re.test(albumName.toLowerCase())) found.add(label);
  // Explicitly requested ("Dancing On My Own (Remix)") is fine.
  return [...found].filter((label) => !VERSION_MARKERS.find(([l]) => l === label)?.[1].test(asked));
}

/** Equal after normalising; text that normalises to nothing (other scripts) must match exactly. */
function same(a: string, b: string): boolean {
  const na = normText(a), nb = normText(b);
  return na || nb ? na === nb : a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== "";
}

// ---------- Scoring ----------

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; album_type?: string; release_date?: string };
  external_urls?: { spotify?: string };
  is_playable?: boolean;
};

export type Candidate = {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumType: string;
  year: string;
  url: string;
  /** 0–100. 90+ can be accepted automatically. */
  confidence: number;
  /** Why it scored what it did, in plain words. */
  notes: string[];
  rejected?: string;
};

export const AUTO_ACCEPT = 90;
export const REVIEW_MIN = 55;

function artistParts(artist: string): string[] {
  return artist
    .split(/\s*(?:,|&|\bfeat\.?|\bft\.?|\bfeaturing\b|\bwith\b|\bx\b|\band\b)\s*/i)
    .map(normText)
    .filter(Boolean);
}

export function scoreTrack(song: { title: string; artist: string }, track: SpotifyTrack): Candidate {
  const artists = track.artists.map((a) => a.name);
  const base: Omit<Candidate, "confidence" | "notes"> = {
    id: track.id,
    name: track.name,
    artists: artists.join(", "),
    album: track.album?.name ?? "",
    albumType: track.album?.album_type ?? "",
    year: (track.album?.release_date ?? "").slice(0, 4),
    url: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
  };
  const notes: string[] = [];

  // Title
  const want = splitTitle(song.title);
  const got = splitTitle(track.name);
  const wantBase = normText(want.base);
  const gotBase = normText(got.base);
  let title = 0;
  if (same(song.title, track.name) || same(want.base, got.base)) {
    title = 50;
    notes.push("title matches");
  } else if (wantBase && gotBase && (gotBase.startsWith(`${wantBase} `) || wantBase.startsWith(`${gotBase} `))) {
    title = 30;
    notes.push("title is close");
  } else {
    notes.push("different title");
  }

  // Artist
  const wantArtist = normText(song.artist);
  const got0 = normText(artists[0] ?? "");
  const gotAll = artists.map(normText);
  const parts = artistParts(song.artist);
  let artist = 0;
  if (same(song.artist, artists[0] ?? "") || (wantArtist !== "" && wantArtist === normText(artists.join(" and ")))) {
    artist = 40;
    notes.push("main artist matches");
  } else if (parts.length > 1 && parts[0] === got0 && parts.every((p) => gotAll.includes(p))) {
    artist = 40;
    notes.push("artists match");
  } else if ((wantArtist && gotAll.includes(wantArtist)) || (parts[0] && gotAll.includes(parts[0]))) {
    artist = 25;
    notes.push("artist is featured, not the main artist");
  } else {
    const wt = new Set(wantArtist.split(" ").filter(Boolean));
    const overlap = wt.size ? got0.split(" ").filter((t) => wt.has(t)).length / wt.size : 0;
    if (overlap >= 0.6) {
      artist = 12;
      notes.push("artist name is similar");
    } else notes.push("different artist");
  }

  // Release type: the original album or single beats a compilation.
  let release = 10;
  if (base.albumType === "compilation") {
    release = -5;
    notes.push("from a compilation");
  }
  // A different artist (or a different title) is never a plausible match on its own.
  const confidence = artist === 0 || title === 0 ? Math.min(40, title + artist) : Math.max(0, Math.min(100, title + artist + release));

  const unwanted = unwantedVersions(song.title, track.name, base.album);
  if (unwanted.length) return { ...base, confidence: 0, notes, rejected: `${unwanted.join(", ")} version` };
  if (track.is_playable === false) return { ...base, confidence: 0, notes, rejected: "not available in your market" };
  if (!/^[0-9A-Za-z]{22}$/.test(track.id)) return { ...base, confidence: 0, notes, rejected: "not a valid track ID" };
  return { ...base, confidence, notes };
}

/** Best first: confidence, then album over single over compilation, then Spotify's order. */
export function rankCandidates(cands: Candidate[]): Candidate[] {
  const typeRank = (t: string) => (t === "album" ? 0 : t === "single" ? 1 : 2);
  return cands
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.confidence - a.c.confidence || typeRank(a.c.albumType) - typeRank(b.c.albumType) || a.i - b.i)
    .map(({ c }) => c);
}

// ---------- Spotify client (rate limited) ----------

export class SpotifyError extends Error {
  constructor(
    message: string,
    readonly kind: "config" | "auth" | "rate_limit" | "quota" | "network" | "spotify",
  ) {
    super(message);
  }
}

type ClientOptions = {
  clientId: string;
  clientSecret: string;
  market?: string;
  fetchImpl?: typeof fetch;
  /** Minimum gap between requests. Spotify doesn't publish its limits, so stay gentle. */
  minIntervalMs?: number;
  /** Longest Retry-After we'll wait out before giving up the batch. */
  maxRetryAfterSec?: number;
  sleep?: (ms: number) => Promise<void>;
  apiBase?: string;
  accountsBase?: string;
};

export class SpotifyClient {
  private token: { value: string; expires: number } | null = null;
  private last = 0;
  private queue: Promise<unknown> = Promise.resolve();
  readonly market: string | undefined;
  requests = 0;
  private readonly o: Required<Omit<ClientOptions, "market">>;

  constructor(opts: ClientOptions) {
    this.market = opts.market || undefined;
    this.o = {
      fetchImpl: fetch,
      minIntervalMs: 350,
      maxRetryAfterSec: 90,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      apiBase: "https://api.spotify.com/v1",
      accountsBase: "https://accounts.spotify.com",
      ...opts,
    } as Required<Omit<ClientOptions, "market">>;
  }

  private async getToken(force = false): Promise<string> {
    if (!force && this.token && Date.now() < this.token.expires) return this.token.value;
    let r: Response;
    try {
      r = await this.o.fetchImpl(`${this.o.accountsBase}/api/token`, {
        method: "POST",
        headers: {
          authorization: `Basic ${Buffer.from(`${this.o.clientId}:${this.o.clientSecret}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new SpotifyError("Couldn't reach Spotify. Check your internet connection.", "network");
    }
    if (r.status === 400 || r.status === 401)
      throw new SpotifyError("Spotify rejected the app credentials. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local.", "auth");
    if (!r.ok) throw new SpotifyError(`Spotify's sign-in service answered ${r.status}. Try again in a few minutes.`, "spotify");
    const data = (await r.json()) as { access_token: string; expires_in: number };
    this.token = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
    return this.token.value;
  }

  /** One request at a time, spaced out; waits out 429s, retries 5xx, refreshes an expired token once. */
  get<T>(path: string): Promise<T | null> {
    const run = this.queue.then(() => this.doGet<T>(path));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async doGet<T>(path: string): Promise<T | null> {
    let refreshed = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const wait = this.last + this.o.minIntervalMs - Date.now();
      if (wait > 0) await this.o.sleep(wait);
      this.last = Date.now();
      const token = await this.getToken();
      this.requests++;
      let r: Response;
      try {
        r = await this.o.fetchImpl(`${this.o.apiBase}${path}`, {
          headers: { authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        if (attempt < 2) {
          await this.o.sleep(1000 * 2 ** attempt);
          continue;
        }
        throw new SpotifyError("Couldn't reach Spotify. Check your internet connection.", "network");
      }
      if (r.ok) return (await r.json()) as T;
      if (r.status === 404 || r.status === 400) return null;
      if (r.status === 401 && !refreshed) {
        refreshed = true;
        await this.getToken(true);
        continue;
      }
      if (r.status === 403)
        throw new SpotifyError(
          "Spotify refused access (403). Development Mode apps need the app owner to have Spotify Premium.",
          "auth",
        );
      if (r.status === 429) {
        const body = (await r.json().catch(() => ({}))) as { error?: { reason?: string } };
        const after = Number(r.headers.get("retry-after") ?? "5") || 5;
        if (after > this.o.maxRetryAfterSec || body.error?.reason === "QUOTA_EXCEEDED")
          throw new SpotifyError(
            `Spotify's request limit is used up for now (try again in about ${Math.ceil(after / 60)} min). Matches so far are kept.`,
            "quota",
          );
        await this.o.sleep(after * 1000);
        continue;
      }
      if (r.status >= 500 && attempt < 3) {
        await this.o.sleep(1000 * 2 ** attempt);
        continue;
      }
      throw new SpotifyError(`Spotify answered ${r.status}.`, "spotify");
    }
    throw new SpotifyError("Spotify kept asking us to slow down. Try again later.", "rate_limit");
  }

  async search(q: string, limit = 10): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({ q, type: "track", limit: String(Math.min(limit, 10)) });
    if (this.market) params.set("market", this.market);
    const data = await this.get<{ tracks?: { items?: SpotifyTrack[] } }>(`/search?${params}`);
    return (data?.tracks?.items ?? []).filter((t) => t && typeof t.id === "string");
  }

  async track(id: string): Promise<SpotifyTrack | null> {
    if (!/^[0-9A-Za-z]{22}$/.test(id)) return null;
    const params = this.market ? `?market=${encodeURIComponent(this.market)}` : "";
    return this.get<SpotifyTrack>(`/tracks/${id}${params}`);
  }
}

// ---------- Matching one song ----------

export type MatchDecision = "auto" | "review" | "none";

export type MatchResult = {
  decision: MatchDecision;
  /** Set only when decision is "auto": a validated ID from Spotify. */
  trackId?: string;
  best?: Candidate;
  /** Up to 5 plausible candidates, best first, for the review table. */
  candidates: Candidate[];
  /** Candidates thrown out (covers, live, karaoke…), for the report. */
  rejected: Candidate[];
  /** A Spotify search link for songs nobody could match. */
  searchUrl: string;
};

const quote = (s: string) => s.replace(/"/g, " ").replace(/\s+/g, " ").trim();

export async function findMatch(client: SpotifyClient, song: { title: string; artist: string }): Promise<MatchResult> {
  const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`;
  const seen = new Map<string, Candidate>();
  const take = (tracks: SpotifyTrack[]) => {
    for (const t of tracks) if (!seen.has(t.id)) seen.set(t.id, scoreTrack(song, t));
  };
  // Field search first (precise), then a plain search for odd spellings.
  take(await client.search(`track:"${quote(splitTitle(song.title).base || song.title)}" artist:"${quote(song.artist)}"`));
  const good = () => [...seen.values()].filter((c) => !c.rejected && c.confidence >= AUTO_ACCEPT);
  if (!good().length) take(await client.search(`${quote(song.title)} ${quote(song.artist)}`));

  const all = [...seen.values()];
  const rejected = all.filter((c) => c.rejected);
  let ranked = rankCandidates(all.filter((c) => !c.rejected && c.confidence >= REVIEW_MIN));

  // Auto-accept only after Spotify confirms the ID still exists and still matches.
  for (const cand of ranked.filter((c) => c.confidence >= AUTO_ACCEPT)) {
    const fresh = await client.track(cand.id);
    if (!fresh) {
      cand.rejected = "no longer on Spotify";
      rejected.push(cand);
      continue;
    }
    const recheck = scoreTrack(song, fresh);
    if (recheck.rejected || recheck.confidence < AUTO_ACCEPT || fresh.id !== cand.id) {
      cand.confidence = Math.min(cand.confidence, AUTO_ACCEPT - 1);
      cand.notes.push(recheck.rejected ? `on re-check: ${recheck.rejected}` : "changed on re-check");
      continue;
    }
    cand.notes.push("ID confirmed with Spotify");
    ranked = ranked.filter((c) => !c.rejected);
    return { decision: "auto", trackId: cand.id, best: cand, candidates: ranked.slice(0, 5), rejected, searchUrl };
  }
  ranked = rankCandidates(ranked.filter((c) => !c.rejected));
  if (ranked.length) return { decision: "review", best: ranked[0], candidates: ranked.slice(0, 5), rejected, searchUrl };
  return { decision: "none", candidates: [], rejected, searchUrl };
}

// ---------- Local credentials ----------

export type SpotifyConfig = { clientId: string; clientSecret: string; market?: string };

/** Minimal KEY=value reader for .env.local (comments, quotes and blank lines allowed). */
export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trimStart().startsWith("#")) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

/** Credentials from the environment, or else from .env.local (git-ignored) at the repo root. */
export function loadSpotifyConfig(repoRoot: string, env: Record<string, string | undefined> = process.env): SpotifyConfig | null {
  const file = resolve(repoRoot, ".env.local");
  const fromFile = existsSync(file) ? parseEnvFile(readFileSync(file, "utf8")) : {};
  const get = (k: string) => (env[k] ?? fromFile[k] ?? "").trim();
  const clientId = get("SPOTIFY_CLIENT_ID");
  const clientSecret = get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  const market = get("SPOTIFY_MARKET").toUpperCase();
  return { clientId, clientSecret, market: /^[A-Z]{2}$/.test(market) ? market : undefined };
}

// ---------- Saving ----------

/**
 * Adds confirmed Spotify IDs to the catalogue. Only fills songs that have no
 * ID yet; every other field, every song ID and the song order stay as they were.
 */
export function applySpotifyIds<T extends { id: string; spotifyTrackId?: string }>(songs: T[], ids: Record<string, string>): { songs: T[]; applied: string[] } {
  const applied: string[] = [];
  const out = songs.map((s) => {
    const id = ids[s.id];
    if (!id || s.spotifyTrackId || !/^[0-9A-Za-z]{22}$/.test(id)) return s;
    applied.push(s.id);
    return { ...s, spotifyTrackId: id };
  });
  return { songs: out, applied };
}
