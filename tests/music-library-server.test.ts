import { copyFile, mkdtemp, readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHandler, DEFAULT_CATALOGUE } from "../scripts/music-library/server";
import type { SongRecord } from "@/data/catalogue";

let server: Server;
let base: string;
let file: string;
let port: number;
const spotifyCalls: string[] = [];

beforeAll(async () => {
  const dir = await mkdtemp(join(tmpdir(), "aq-lib-"));
  file = join(dir, "songs.json");
  await copyFile(DEFAULT_CATALOGUE, file);
  // Port is needed by the handler's Host check, so listen first, then attach.
  server = createServer();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  port = (server.address() as AddressInfo).port;
  const fakeFetch = (async (url: string) => {
    spotifyCalls.push(url);
    if (url.includes("0w5Bdu51Ka25Pf3hojsKHh")) return new Response(JSON.stringify({ title: "Hard Times" }), { status: 200 });
    return new Response("", { status: 404 });
  }) as typeof fetch;
  server.on("request", createHandler({ catalogue: file, port, fetchImpl: fakeFetch }));
  base = `http://127.0.0.1:${port}`;
});
afterAll(() => server.close());

const own = () => ({ origin: base, "content-type": "application/json" });

describe("Music Library server", () => {
  it("serves the editor and the catalogue", async () => {
    const page = await fetch(`${base}/`);
    expect(page.status).toBe(200);
    expect(page.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    const data = await (await fetch(`${base}/api/catalogue`)).json();
    expect(data.songs.length).toBeGreaterThanOrEqual(213);
    expect(data.report.errors).toBe(0);
    expect(data.options.genres).toHaveLength(10);
    expect(data.options.themes).toHaveLength(8);
  });

  it("refuses other websites and other host names", async () => {
    const evilOrigin = await fetch(`${base}/api/catalogue`, { method: "PUT", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
    expect(evilOrigin.status).toBe(403);
    const noOrigin = await fetch(`${base}/api/catalogue`, { method: "PUT", headers: { "content-type": "application/json" }, body: "{}" });
    expect(noOrigin.status).toBe(403);
    const form = await fetch(`${base}/api/catalogue`, { method: "PUT", headers: { origin: base, "content-type": "text/plain" }, body: "{}" });
    expect(form.status).toBe(403);
    const { request } = await import("node:http");
    const status = await new Promise<number>((resolve) => {
      const r = request({ host: "127.0.0.1", port, path: "/api/catalogue", headers: { host: "attacker.example" } }, (res) => resolve(res.statusCode ?? 0));
      r.end();
    });
    expect(status).toBe(403);
  });

  it("won't save a catalogue with errors, and leaves the file untouched", async () => {
    const before = await readFile(file, "utf8");
    const songs = JSON.parse(before).songs as SongRecord[];
    const res = await fetch(`${base}/api/catalogue`, { method: "PUT", headers: own(), body: JSON.stringify({ songs: [...songs, { ...songs[0] }] }) });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.saved).toBe(false);
    expect(body.report.errors).toBeGreaterThan(0);
    expect(await readFile(file, "utf8")).toBe(before);
  });

  it("saves a valid catalogue in the one-song-per-line format", async () => {
    const songs = JSON.parse(await readFile(file, "utf8")).songs as SongRecord[];
    const added: SongRecord = { id: "test-song", title: "Test Song", artist: "Test Artist", genres: ["rock"], themes: ["burnout"], energy: "high", spotifyTrackId: "ZZZZZZZZZZZZZZZZZZZZZZ" };
    const res = await fetch(`${base}/api/catalogue`, { method: "PUT", headers: own(), body: JSON.stringify({ songs: [...songs, added] }) });
    expect(res.status).toBe(200);
    const text = await readFile(file, "utf8");
    expect(text).toContain(`    ${JSON.stringify(added)}`);
    expect(JSON.parse(text).songs).toHaveLength(songs.length + 1);
  });

  it("validates without saving, and reports deletions of published songs", async () => {
    const songs = JSON.parse(await readFile(file, "utf8")).songs as SongRecord[];
    const res = await fetch(`${base}/api/validate`, { method: "POST", headers: own(), body: JSON.stringify({ songs: songs.slice(1) }) });
    const report = await res.json();
    expect(report.issues.some((i: { code: string }) => i.code === "deleted")).toBe(true);
  });

  it("checks track IDs with Spotify's public oEmbed", async () => {
    const ok = await (await fetch(`${base}/api/spotify?id=0w5Bdu51Ka25Pf3hojsKHh`)).json();
    expect(ok).toEqual({ ok: true, title: "Hard Times" });
    const unknown = await (await fetch(`${base}/api/spotify?id=AAAAAAAAAAAAAAAAAAAAAA`)).json();
    expect(unknown.ok).toBe(false);
    expect((await fetch(`${base}/api/spotify?id=bad`)).status).toBe(400);
    expect(spotifyCalls[0]).toBe("https://open.spotify.com/oembed?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F0w5Bdu51Ka25Pf3hojsKHh");
  });

  it("rejects oversized uploads", async () => {
    const res = await fetch(`${base}/api/validate`, { method: "POST", headers: own(), body: "x".repeat(6 * 1024 * 1024) });
    expect(res.status).toBe(413);
  });
});
