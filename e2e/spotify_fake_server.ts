/**
 * Runs the Music Library editor against a pretend Spotify, for e2e/spotify_checks.py.
 *   CATALOGUE=/tmp/x/songs.json PORT=4322 npx tsx e2e/spotify_fake_server.ts [--unconfigured]
 * Track IDs are fake test values (TEST…); nothing here touches the real Spotify.
 */
import { createServer } from "node:http";
import { createHandler } from "../scripts/music-library/server";
import { SpotifyClient, type SpotifyTrack } from "../scripts/music-library/spotify";

const port = Number(process.env.PORT ?? 4322);
const known = new Map<string, SpotifyTrack>();
let n = 0;
const mk = (name: string, artist: string, albumType = "album", album = `${name} (album)`): SpotifyTrack => {
  const id = `TEST${String(++n).padStart(18, "0")}`;
  const t = { id, name, artists: [{ name: artist }], album: { name: album, album_type: albumType, release_date: "2020-01-01" }, external_urls: { spotify: `https://open.spotify.com/track/${id}` } };
  known.set(id, t);
  return t;
};
// Decide by title so runs are repeatable: most exact, some compilation-only (review), some covers only (none).
const bucket = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
const fetchImpl = (async (input: string | URL) => {
  const url = new URL(String(input));
  if (url.pathname.endsWith("/api/token")) return Response.json({ access_token: "t", expires_in: 3600 });
  if (url.hostname === "open.spotify.com") return Response.json({ title: "ok" });
  if (url.pathname.endsWith("/search")) {
    const q = url.searchParams.get("q") ?? "";
    const m = /^track:"(.*)" artist:"(.*)"$/.exec(q);
    if (!m) return Response.json({ tracks: { items: [] } });
    const [, title, artist] = m;
    const b = bucket(title);
    const items = b === 3 ? [mk(title, artist, "compilation", "Hits"), mk(`${title} - Live`, artist)] : b === 4 ? [mk(`${title} - Karaoke Version`, "Karaoke Kings")] : [mk(title, artist)];
    return Response.json({ tracks: { items } });
  }
  const t = known.get(url.pathname.split("/").pop()!);
  return t ? Response.json(t) : new Response("", { status: 404 });
}) as typeof fetch;

const spotify = process.argv.includes("--unconfigured") ? null : new SpotifyClient({ clientId: "x", clientSecret: "y", fetchImpl, minIntervalMs: 5 });
createServer(createHandler({ catalogue: process.env.CATALOGUE!, port, fetchImpl, spotify })).listen(port, "127.0.0.1", () => console.log(`fake ready ${port}`));
