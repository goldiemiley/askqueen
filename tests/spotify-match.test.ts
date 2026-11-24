/**
 * Spotify link finder. Uses a fake Spotify: every track ID here is an
 * obviously fake test value (TEST…), so nothing real is invented, and the
 * tests check the matcher only ever returns IDs that Spotify itself sent.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtemp, copyFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHandler, DEFAULT_CATALOGUE } from "../scripts/music-library/server";
import {
  applySpotifyIds,
  findMatch,
  loadSpotifyConfig,
  normText,
  parseEnvFile,
  scoreTrack,
  splitTitle,
  SpotifyClient,
  SpotifyError,
  unwantedVersions,
  type SpotifyTrack,
} from "../scripts/music-library/spotify";

let n = 0;
const fakeId = () => `TEST${String(++n).padStart(18, "0")}`;
function track(name: string, artists: string | string[], album = "Some Album", albumType = "album", extra: Partial<SpotifyTrack> = {}): SpotifyTrack {
  const id = fakeId();
  return { id, name, artists: (Array.isArray(artists) ? artists : [artists]).map((a) => ({ name: a })), album: { name: album, album_type: albumType, release_date: "2019-05-01" }, external_urls: { spotify: `https://open.spotify.com/track/${id}` }, ...extra };
}

/** A pretend Spotify API: search returns `results(q)`, /tracks/{id} returns what search returned unless listed in `gone`. */
function fakeSpotify(results: (q: string) => SpotifyTrack[], opts: { gone?: Set<string>; script?: Array<() => Response> } = {}) {
  const calls: string[] = [];
  const known = new Map<string, SpotifyTrack>();
  const fetchImpl = (async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/api/token")) return Response.json({ access_token: "tok", expires_in: 3600 });
    const scripted = opts.script?.shift();
    if (scripted) return scripted();
    const u = new URL(url);
    if (u.pathname.endsWith("/search")) {
      const items = results(u.searchParams.get("q") ?? "");
      items.forEach((t) => known.set(t.id, t));
      return Response.json({ tracks: { items } });
    }
    const id = u.pathname.split("/").pop()!;
    if (opts.gone?.has(id) || !known.has(id)) return Response.json({ error: { status: 404 } }, { status: 404 });
    return Response.json(known.get(id));
  }) as typeof fetch;
  const sleeps: number[] = [];
  const client = new SpotifyClient({ clientId: "id", clientSecret: "SUPERSECRET123", fetchImpl, minIntervalMs: 0, sleep: async (ms) => void sleeps.push(ms) });
  return { client, calls, sleeps, known };
}

describe("text matching", () => {
  it("normalises accents, punctuation, & and leading 'the'", () => {
    expect(normText("Sóley")).toBe("soley");
    expect(normText("The Fur.")).toBe("fur");
    expect(normText("Oh, Flamingo!")).toBe("oh flamingo");
    expect(normText("Parekh & Singh")).toBe(normText("Parekh and Singh"));
    expect(normText("60's Cardin")).toBe("60s cardin");
  });
  it("splits extras off a Spotify title", () => {
    expect(splitTitle("Bad (feat. X) - Remastered 2011")).toEqual({ base: "Bad", extras: ["feat. X", "Remastered 2011"] });
    expect(splitTitle("Hello, Anxiety").base).toBe("Hello, Anxiety");
  });
  it.each([
    ["Sure", "Sure - Live at KEXP", "Sure", ["live"]],
    ["Sure", "Sure (Remix)", "Sure", ["remix"]],
    ["Sure", "Sure - Karaoke Version", "Sure", ["karaoke"]],
    ["Sure", "Sure", "Karaoke Hits Vol. 3", ["karaoke"]],
    ["Sure", "Sure", "A Tribute to Hatchie", ["cover"]],
    ["Sure", "Sure - Acoustic", "Sure", ["acoustic"]],
    ["Sure", "Sure (Instrumental)", "Sure", ["instrumental"]],
    ["Sure", "Sure - Sped Up", "Sure", ["sped up or slowed"]],
    ["Sure", "Sure - Remastered 2019", "Sure", []],
    ["Sure", "Sure - Radio Mix", "Sure", []],
    ["Live Forever", "Live Forever - Remastered", "Definitely Maybe", []],
    ["Dancing On My Own (Remix)", "Dancing On My Own - Remix", "Single", []],
    ["Shake It Off", "Shake It Off (Taylor's Version)", "1989 (Taylor's Version)", []],
    ["Alive", "Alive", "Live Through This", []],
  ])("%s vs %s on %s → %j", (want, name, album, expected) => {
    expect(unwantedVersions(want, name, album)).toEqual(expected);
  });
});

describe("scoring", () => {
  const song = { title: "Future Me Hates Me", artist: "The Beths" };
  it("exact title + main artist on an album or single = 100", () => {
    expect(scoreTrack(song, track("Future Me Hates Me", "The Beths")).confidence).toBe(100);
    expect(scoreTrack(song, track("Future Me Hates Me", "The Beths", "Single", "single")).confidence).toBe(100);
  });
  it("a compilation copy is below auto-accept", () => {
    expect(scoreTrack(song, track("Future Me Hates Me", "The Beths", "Indie Hits 2018", "compilation")).confidence).toBeLessThan(90);
  });
  it("a featured artist is not the main artist", () => {
    expect(scoreTrack(song, track("Future Me Hates Me", ["Someone Else", "The Beths"])).confidence).toBeLessThan(90);
  });
  it("same title by another artist scores low", () => {
    expect(scoreTrack(song, track("Future Me Hates Me", "Karaoke Stars")).confidence).toBeLessThan(55);
  });
  it("rejects covers, live and remix versions", () => {
    expect(scoreTrack(song, track("Future Me Hates Me - Live", "The Beths")).rejected).toMatch(/live/);
    expect(scoreTrack(song, track("Future Me Hates Me", "The Beths", "Best of Indie Karaoke")).rejected).toMatch(/karaoke/);
  });
  it("rejects tracks Spotify says can't play in the market", () => {
    expect(scoreTrack(song, track("Future Me Hates Me", "The Beths", "x", "album", { is_playable: false })).rejected).toMatch(/market/);
  });
  it("handles awkward artist names from the catalogue", () => {
    for (const [title, artist, spotifyArtist] of [
      ["If You Know That I'm Lonely", "The Fur.", "The Fur."],
      ["June", "Oh, Flamingo!", "Oh, Flamingo!"],
      ["Ghost", "Parekh & Singh", "Parekh & Singh"],
      ["Pretty Face", "Sóley", "Sóley"],
      ["Despair, Hangover & Ecstasy", "The Dø", "The Dø"],
      ["Black Amplifier", "The S.I.G.I.T.", "The S.I.G.I.T"],
    ]) expect(scoreTrack({ title, artist }, track(title, spotifyArtist)).confidence, artist).toBe(100);
  });
  it("two different titles in other scripts don't count as the same", () => {
    expect(scoreTrack({ title: "사랑", artist: "ADOY" }, track("바다", "ADOY")).confidence).toBeLessThan(90);
    expect(scoreTrack({ title: "사랑", artist: "ADOY" }, track("사랑", "ADOY")).confidence).toBe(100);
  });
});

describe("findMatch", () => {
  const beths = { title: "Future Me Hates Me", artist: "The Beths" };

  it("auto-accepts only after Spotify confirms the ID, and returns an ID Spotify sent", async () => {
    const good = track("Future Me Hates Me", "The Beths");
    const f = fakeSpotify(() => [track("Future Me Hates Me - Live", "The Beths"), good]);
    const r = await findMatch(f.client, beths);
    expect(r.decision).toBe("auto");
    expect(r.trackId).toBe(good.id);
    expect(f.known.has(r.trackId!)).toBe(true);
    expect(f.calls.some((c) => c.includes(`/tracks/${good.id}`))).toBe(true);
    expect(r.rejected.map((c) => c.rejected)).toContain("live version");
  });

  it("doesn't auto-accept a track that's gone when re-checked", async () => {
    const gone = track("Future Me Hates Me", "The Beths");
    const f = fakeSpotify(() => [gone], { gone: new Set([gone.id]) });
    const r = await findMatch(f.client, beths);
    expect(r.decision).toBe("none");
    expect(r.rejected[0].rejected).toBe("no longer on Spotify");
  });

  it("falls back to a second copy when the first is unavailable", async () => {
    const a = track("Future Me Hates Me", "The Beths");
    const b = track("Future Me Hates Me", "The Beths", "Single", "single");
    const f = fakeSpotify(() => [a, b], { gone: new Set([a.id]) });
    const r = await findMatch(f.client, beths);
    expect(r).toMatchObject({ decision: "auto", trackId: b.id });
  });

  it("sends uncertain matches to review with listening links", async () => {
    const f = fakeSpotify(() => [track("Future Me Hates Me", "The Beths", "Indie Hits", "compilation")]);
    const r = await findMatch(f.client, beths);
    expect(r.decision).toBe("review");
    expect(r.trackId).toBeUndefined();
    expect(r.best?.url).toMatch(/^https:\/\/open\.spotify\.com\/track\//);
  });

  it("reports nothing found when Spotify only has covers", async () => {
    const f = fakeSpotify(() => [track("Future Me Hates Me", "Vitamin String Quartet", "VSQ Performs The Beths"), track("Future Me Hates Me - Karaoke", "The Beths")]);
    const r = await findMatch(f.client, beths);
    expect(r.decision).toBe("none");
    expect(r.searchUrl).toContain("open.spotify.com/search/");
  });

  it("tries a plain search when the precise one finds nothing", async () => {
    const f = fakeSpotify((q) => (q.startsWith("track:") ? [] : [track("Future Me Hates Me", "The Beths")]));
    const r = await findMatch(f.client, beths);
    expect(r.decision).toBe("auto");
    expect(f.calls.filter((c) => c.includes("/search")).length).toBe(2);
  });

  it("asks Spotify for at most 10 results (the Development Mode limit)", async () => {
    const f = fakeSpotify(() => []);
    await findMatch(f.client, beths);
    for (const c of f.calls.filter((x) => x.includes("/search"))) expect(new URL(c).searchParams.get("limit")).toBe("10");
  });
});

describe("rate limits and errors", () => {
  const song = { title: "Sure", artist: "Hatchie" };
  it("waits out a 429 for as long as Retry-After says, then carries on", async () => {
    const f = fakeSpotify(() => [track("Sure", "Hatchie")], { script: [() => new Response("{}", { status: 429, headers: { "retry-after": "3" } })] });
    const r = await findMatch(f.client, song);
    expect(f.sleeps).toContain(3000);
    expect(r.decision).toBe("auto");
  });
  it("stops the batch when the quota is used up", async () => {
    const f = fakeSpotify(() => [], { script: [() => Response.json({ error: { status: 429, message: "Too many requests", reason: "QUOTA_EXCEEDED" } }, { status: 429, headers: { "retry-after": "3600" } })] });
    await expect(findMatch(f.client, song)).rejects.toMatchObject({ kind: "quota" });
  });
  it("retries Spotify server errors", async () => {
    const f = fakeSpotify(() => [track("Sure", "Hatchie")], { script: [() => new Response("", { status: 503 })] });
    expect((await findMatch(f.client, song)).decision).toBe("auto");
  });
  it("explains a 403 (Premium needed for Development Mode)", async () => {
    const f = fakeSpotify(() => [], { script: [() => new Response("", { status: 403 })] });
    await expect(findMatch(f.client, song)).rejects.toThrow(/Premium/);
  });
  it("explains bad credentials without echoing them", async () => {
    const fetchImpl = (async () => new Response("", { status: 400 })) as unknown as typeof fetch;
    const c = new SpotifyClient({ clientId: "id", clientSecret: "SUPERSECRET123", fetchImpl, minIntervalMs: 0 });
    const err = (await findMatch(c, song).catch((e) => e)) as SpotifyError;
    expect(err).toBeInstanceOf(SpotifyError);
    expect(err.message).toMatch(/credentials/);
    expect(err.message).not.toContain("SUPERSECRET123");
  });
  it("spaces requests out", async () => {
    const sleeps: number[] = [];
    const fetchImpl = (async (u: string) => (String(u).endsWith("/api/token") ? Response.json({ access_token: "t", expires_in: 3600 }) : Response.json({ tracks: { items: [] } }))) as unknown as typeof fetch;
    const c = new SpotifyClient({ clientId: "a", clientSecret: "b", fetchImpl, minIntervalMs: 400, sleep: async (ms) => void sleeps.push(ms) });
    await c.search("a");
    await c.search("b");
    expect(sleeps.length).toBe(1);
    expect(sleeps[0]).toBeGreaterThan(300);
  });
});

describe("saving", () => {
  const songs = [
    { id: "sure", title: "Sure", artist: "Hatchie", genres: ["indie"], energy: "medium" },
    { id: "trying", title: "Trying", artist: "Jay Som", spotifyTrackId: "TEST000000000000000001" },
    { id: "old", title: "Old", artist: "X", retired: true },
  ];
  it("fills only missing IDs and keeps song IDs, order and other fields", () => {
    const { songs: out, applied } = applySpotifyIds(songs, { sure: "TEST000000000000000009", trying: "TEST000000000000000008", nope: "TEST000000000000000007" });
    expect(applied).toEqual(["sure"]);
    expect(out.map((s) => s.id)).toEqual(["sure", "trying", "old"]);
    expect(out[0]).toEqual({ ...songs[0], spotifyTrackId: "TEST000000000000000009" });
    expect(out[1]).toBe(songs[1]);
    expect(out[2]).toBe(songs[2]);
  });
  it("ignores anything that isn't a 22-character ID", () => {
    expect(applySpotifyIds(songs, { sure: "not-an-id" }).applied).toEqual([]);
  });
});

describe("credentials stay local", () => {
  it("reads .env.local, with env vars taking priority", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aq-env-"));
    await writeFile(join(dir, ".env.local"), '# comment\nSPOTIFY_CLIENT_ID="abc"\nSPOTIFY_CLIENT_SECRET=def\nSPOTIFY_MARKET=rs\n');
    expect(loadSpotifyConfig(dir, {})).toEqual({ clientId: "abc", clientSecret: "def", market: "RS" });
    expect(loadSpotifyConfig(dir, { SPOTIFY_CLIENT_ID: "env" })?.clientId).toBe("env");
    expect(loadSpotifyConfig(join(dir, "nowhere"), {})).toBeNull();
    expect(parseEnvFile("export A=1\n#B=2")).toEqual({ A: "1" });
  });
  it(".env.local and the match report are git-ignored; the example isn't", () => {
    const gi = readFileSync(".gitignore", "utf8");
    expect(gi).toMatch(/^\.env\*$/m);
    expect(gi).toMatch(/^!\.env\.example$/m);
    expect(gi).toMatch(/^spotify-match-report\.md$/m);
    expect(readFileSync(".env.example", "utf8")).toMatch(/SPOTIFY_CLIENT_SECRET=\s*$/m);
  });
  it("nothing in the website's code touches Spotify credentials", () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
    for (const f of walk("src")) expect(readFileSync(f, "utf8"), f).not.toMatch(/SPOTIFY_CLIENT|music-library\/spotify|api\.spotify\.com|accounts\.spotify\.com/);
    if (existsSync("out")) for (const f of walk("out").filter((x) => /\.(js|html)$/.test(x))) expect(readFileSync(f, "utf8"), f).not.toMatch(/SPOTIFY_CLIENT|accounts\.spotify\.com\/api\/token/);
  });
});

describe("editor server endpoints", () => {
  let server: Server;
  let base: string;
  const make = async (spotify: SpotifyClient | null) => {
    const dir = await mkdtemp(join(tmpdir(), "aq-sp-"));
    const file = join(dir, "songs.json");
    await copyFile(DEFAULT_CATALOGUE, file);
    server = createServer();
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as AddressInfo).port;
    server.on("request", createHandler({ catalogue: file, port, spotify }));
    base = `http://127.0.0.1:${port}`;
  };
  const own = () => ({ origin: base, "content-type": "application/json" });
  afterAll(() => server?.close());

  it("says when Spotify isn't set up", async () => {
    await make(null);
    expect(await (await fetch(`${base}/api/spotify/status`)).json()).toEqual({ configured: false, market: null });
    const r = await fetch(`${base}/api/spotify/find`, { method: "POST", headers: own(), body: JSON.stringify({ title: "Sure", artist: "Hatchie" }) });
    expect(r.status).toBe(409);
    server.close();
  });

  describe("when set up", () => {
    let f: ReturnType<typeof fakeSpotify>;
    beforeAll(async () => {
      f = fakeSpotify((q) => (q.includes("Hatchie") ? [track("Sure", "Hatchie")] : []));
      await make(f.client);
    });
    it("finds a song and never sends the secret to the page", async () => {
      const status = await (await fetch(`${base}/api/spotify/status`)).text();
      expect(JSON.parse(status).configured).toBe(true);
      const r = await fetch(`${base}/api/spotify/find`, { method: "POST", headers: own(), body: JSON.stringify({ title: "Sure", artist: "Hatchie" }) });
      const text = await r.text();
      expect(r.status).toBe(200);
      expect(JSON.parse(text).decision).toBe("auto");
      for (const t of [status, text]) expect(t).not.toMatch(/SUPERSECRET123|access_token|"tok"/);
    });
    it("only accepts requests from its own page", async () => {
      const r = await fetch(`${base}/api/spotify/find`, { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: JSON.stringify({ title: "Sure", artist: "Hatchie" }) });
      expect(r.status).toBe(403);
    });
    it("needs a title and an artist", async () => {
      const r = await fetch(`${base}/api/spotify/find`, { method: "POST", headers: own(), body: JSON.stringify({ title: "Sure" }) });
      expect(r.status).toBe(400);
    });
  });
});
