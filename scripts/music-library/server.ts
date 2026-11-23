/**
 * AskQueen Music Library: a local-only editor for src/data/songs.json.
 *
 *   npm run library        then open http://localhost:4321
 *
 * Runs on your own computer only. It listens on 127.0.0.1 (not your network),
 * refuses requests that don't come from its own page, and has no login or
 * tokens because nothing about it is on the public website. Saving writes
 * songs.json; publishing is still commit + push (GitHub Actions redeploys).
 */
import { readFile, rename, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatCatalogue,
  GENRE_LABELS,
  PAIR_TARGET,
  THEME_LABELS,
  THEME_TARGET,
  validateCatalogue,
  type CatalogueFile,
  type SongRecord,
} from "../../src/data/catalogue";
import { ENERGY_LEVELS, MUSIC_GENRES, ROAST_THEMES } from "../../src/types/content";

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CATALOGUE = resolve(here, "../../src/data/songs.json");
const PAGE = join(here, "index.html");
const FONTS: Record<string, string> = {
  "/fonts/gloock.woff2": resolve(here, "../../node_modules/@fontsource/gloock/files/gloock-latin-400-normal.woff2"),
  "/fonts/instrument-sans.woff2": resolve(
    here,
    "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
  ),
};
const MAX_BODY = 5 * 1024 * 1024;

type Options = { catalogue: string; port: number; fetchImpl?: typeof fetch };

async function readCatalogue(path: string): Promise<SongRecord[]> {
  const file = JSON.parse(await readFile(path, "utf8")) as CatalogueFile;
  return file.songs;
}

function send(res: ServerResponse, status: number, body: unknown, type = "application/json; charset=utf-8") {
  if (Buffer.isBuffer(body)) {
    res.writeHead(status, { "content-type": type, "cache-control": "max-age=86400" });
    return res.end(body);
  }
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "content-security-policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src https://open.spotify.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new Error("too large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/** Only this computer, only this page. Blocks other websites and DNS tricks. */
function allowed(req: IncomingMessage, port: number): boolean {
  const hosts = [`localhost:${port}`, `127.0.0.1:${port}`];
  if (!hosts.includes(req.headers.host ?? "")) return false;
  if (req.method !== "GET") {
    const origin = req.headers.origin;
    if (!origin || !hosts.some((h) => origin === `http://${h}`)) return false;
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return false;
  }
  return true;
}

export function createHandler({ catalogue, port, fetchImpl = fetch }: Options) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (!allowed(req, port)) return send(res, 403, { error: "This editor only accepts requests from its own page." });
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);

      if (req.method === "GET" && url.pathname === "/") return send(res, 200, await readFile(PAGE, "utf8"), "text/html; charset=utf-8");

      if (req.method === "GET" && FONTS[url.pathname]) return send(res, 200, await readFile(FONTS[url.pathname]), "font/woff2");

      if (req.method === "GET" && url.pathname === "/api/catalogue") {
        const songs = await readCatalogue(catalogue);
        return send(res, 200, {
          songs,
          published: songs.map((s) => s.id),
          report: validateCatalogue(songs),
          options: {
            genres: MUSIC_GENRES.map((id) => ({ id, label: GENRE_LABELS[id] })),
            themes: ROAST_THEMES.map((id) => ({ id, label: THEME_LABELS[id] })),
            energies: ENERGY_LEVELS,
            pairTarget: PAIR_TARGET,
            themeTarget: THEME_TARGET,
          },
        });
      }

      if (req.method === "POST" && url.pathname === "/api/validate") {
        const body = (await readBody(req)) as { songs?: unknown };
        const saved = new Set((await readCatalogue(catalogue)).map((s) => s.id));
        return send(res, 200, validateCatalogue(body.songs, saved));
      }

      if (req.method === "PUT" && url.pathname === "/api/catalogue") {
        const body = (await readBody(req)) as { songs?: unknown };
        const saved = new Set((await readCatalogue(catalogue)).map((s) => s.id));
        const report = validateCatalogue(body.songs, saved);
        if (report.errors > 0) return send(res, 422, { saved: false, report });
        // Write to a temporary file first, so a crash can't leave half a catalogue.
        const tmp = `${catalogue}.tmp`;
        await writeFile(tmp, formatCatalogue(body.songs as SongRecord[]), "utf8");
        await rename(tmp, catalogue);
        return send(res, 200, { saved: true, report });
      }

      // Asks Spotify's public oEmbed service for the track's title (no key, no sign-in).
      if (req.method === "GET" && url.pathname === "/api/spotify") {
        const id = url.searchParams.get("id") ?? "";
        if (!/^[0-9A-Za-z]{22}$/.test(id)) return send(res, 400, { ok: false, reason: "Not a track ID." });
        try {
          const r = await fetchImpl(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${id}`)}`, {
            signal: AbortSignal.timeout(8000),
          });
          if (r.status === 404 || r.status === 400) return send(res, 200, { ok: false, reason: "Spotify doesn't know this track ID." });
          if (!r.ok) return send(res, 200, { ok: null, reason: "Spotify didn't answer. You can still save; check later." });
          const data = (await r.json()) as { title?: string };
          return send(res, 200, { ok: true, title: data.title ?? "" });
        } catch {
          return send(res, 200, { ok: null, reason: "Couldn't reach Spotify (offline?). You can still save; check later." });
        }
      }

      return send(res, 404, { error: "Not found" });
    } catch (e) {
      const tooLarge = e instanceof Error && e.message === "too large";
      return send(res, tooLarge ? 413 : 400, { error: tooLarge ? "File too large." : "Couldn't read that request." });
    }
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT ?? 4321);
  const catalogue = process.env.CATALOGUE ? resolve(process.env.CATALOGUE) : DEFAULT_CATALOGUE;
  createServer(createHandler({ catalogue, port })).listen(port, "127.0.0.1", () => {
    console.log(`\n  AskQueen Music Library\n  Open http://localhost:${port}\n  Editing ${catalogue}\n  Press Ctrl+C to stop.\n`);
  });
}
