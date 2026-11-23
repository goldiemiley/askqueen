import { describe, expect, it } from "vitest";
import {
  coverageOf,
  duplicateKey,
  formatCatalogue,
  makeSongId,
  mergeImport,
  normalizeImported,
  parseSpotifyTrack,
  validateCatalogue,
  type SongRecord,
} from "@/data/catalogue";
import catalogueFile from "@/data/songs.json";
import { SONGS, songById } from "@/data/songs";
import { getDailyReading, songPool } from "@/features/daily/reading";
import { ROAST_THEMES } from "@/types/content";

const records = (catalogueFile as { songs: SongRecord[] }).songs;
// Import and validation tests start from the catalogue without the founder's two
// newest songs, so they test adding them whatever songs.json holds later.
const NEW = new Set(["good-luck-babe", "hard-times"]);
const base = records.filter((r) => !NEW.has(r.id));
const clone = () => base.map((s) => ({ ...s, genres: [...s.genres], themes: [...s.themes] }));

describe("songs.json, the single source of truth", () => {
  it("passes every check with no errors", () => {
    const report = validateCatalogue(records);
    expect(report.issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("keeps every original song ID from before the migration", () => {
    // A sample of IDs used in share links before the move to songs.json.
    for (const id of ["call-me-maybe", "boot-scootin-boogie", "waka-waka", "fake-love", "mirror-lil-wayne", "bzrp-53", "get-lucky"])
      expect(songById[id], id).toBeDefined();
    expect(records.length).toBeGreaterThanOrEqual(213);
  });

  it("formats one song per line and round-trips exactly", () => {
    const text = formatCatalogue(records);
    expect(text.split("\n").filter((l) => l.trim().startsWith('{"id"')).length).toBe(records.length);
    expect((JSON.parse(text) as { songs: SongRecord[] }).songs).toEqual(records);
  });
});

describe("Spotify links", () => {
  const id = "0w5Bdu51Ka25Pf3hojsKHh";
  it.each([
    id,
    `https://open.spotify.com/track/${id}`,
    `https://open.spotify.com/track/${id}?si=abc123def`,
    `https://open.spotify.com/intl-de/track/${id}`,
    `https://open.spotify.com/embed/track/${id}?utm_source=generator`,
    `spotify:track:${id}`,
    `  ${id}  `,
  ])("reads the track ID from %s", (input) => {
    expect(parseSpotifyTrack(input)).toEqual({ ok: true, id });
  });

  it("explains links that aren't tracks", () => {
    expect(parseSpotifyTrack("https://open.spotify.com/album/1bt6q2SruMsBtcerNVtpZB")).toMatchObject({ ok: false, reason: expect.stringContaining("album") });
    expect(parseSpotifyTrack("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")).toMatchObject({ ok: false, reason: expect.stringContaining("playlist") });
    expect(parseSpotifyTrack("https://evil.example.com/track/0w5Bdu51Ka25Pf3hojsKHh").ok).toBe(false);
    expect(parseSpotifyTrack("http://open.spotify.com/track/0w5Bdu51Ka25Pf3hojsKHh").ok).toBe(false);
    expect(parseSpotifyTrack("https://open.spotify.com/track/short").ok).toBe(false);
    expect(parseSpotifyTrack("not a link").ok).toBe(false);
  });
});

describe("duplicates", () => {
  it("match on normalised title and main artist", () => {
    expect(duplicateKey({ title: "Good Luck, Babe!", artist: "Chappell Roan" })).toBe(duplicateKey({ title: "good luck babe", artist: "CHAPPELL ROAN" }));
    expect(duplicateKey({ title: "Señorita", artist: "Shawn Mendes, Camila Cabello" })).toBe(duplicateKey({ title: "Senorita", artist: "Shawn Mendes & Camila Cabello" }));
    expect(duplicateKey({ title: "Mirror (feat. Bruno Mars)", artist: "Lil Wayne" })).toBe(duplicateKey({ title: "Mirror", artist: "Lil Wayne" }));
    expect(duplicateKey({ title: "Hard Times", artist: "Paramore" })).not.toBe(duplicateKey({ title: "Hard Times", artist: "Ray Charles" }));
  });

  it("block saving: same song, same ID or same Spotify track", () => {
    const songs = clone();
    const anti = songs.find((s) => s.title === "Anti-Hero")!;
    const dupSong = validateCatalogue([...songs, { ...anti, id: "anti-hero-2", spotifyTrackId: undefined }]);
    expect(dupSong.issues.some((i) => i.code === "duplicate-song")).toBe(true);
    const dupId = validateCatalogue([...songs, { ...anti, title: "Different", spotifyTrackId: undefined }]);
    expect(dupId.issues.some((i) => i.code === "duplicate-id")).toBe(true);
    const dupTrack = validateCatalogue([...songs, { ...anti, id: "other", title: "Other", artist: "Someone" }]);
    expect(dupTrack.issues.some((i) => i.code === "duplicate-spotify")).toBe(true);
  });
});

describe("validation", () => {
  const base: SongRecord = { id: "hard-times", title: "Hard Times", artist: "Paramore", genres: ["rock"], themes: ["burnout"], energy: "high" };

  it("rejects unknown genres, themes, energies and fields", () => {
    for (const bad of [
      { ...base, genres: ["polka"] },
      { ...base, themes: [] },
      { ...base, energy: "extreme" },
      { ...base, id: "Hard Times" },
      { ...base, title: "  " },
      { ...base, spotifyTrackId: "123" },
      { ...base, extra: 1 },
      { ...base, retired: false },
    ]) {
      const r = validateCatalogue([...clone(), bad]);
      expect(r.errors, JSON.stringify(bad)).toBeGreaterThan(0);
    }
  });

  it("warns, not errors, about a missing Spotify ID", () => {
    const r = validateCatalogue([...clone(), base]);
    expect(r.errors).toBe(0);
    expect(r.issues.some((i) => i.code === "no-spotify" && i.songId === "hard-times")).toBe(true);
  });

  it("blocks a theme with no active songs, and warns about thin coverage", () => {
    const songs = clone().map((s) => (s.themes.includes("burnout") ? { ...s, retired: true as const } : s));
    const r = validateCatalogue(songs);
    expect(r.issues.some((i) => i.code === "empty-theme")).toBe(true);
    const thin = clone().map((s) => (s.themes.includes("chaos") && s.genres.includes("country") ? { ...s, retired: true as const } : s));
    expect(validateCatalogue(thin).issues.some((i) => i.code === "thin-pair" && i.message.startsWith("Chaos × Country: 0"))).toBe(true);
  });

  it("warns that deleting a published song breaks old share links", () => {
    const songs = clone();
    const published = new Set(songs.map((s) => s.id));
    const r = validateCatalogue(songs.filter((s) => s.id !== "call-me-maybe"), published);
    expect(r.errors).toBe(0);
    expect(r.issues.some((i) => i.code === "deleted" && i.message.includes("call-me-maybe"))).toBe(true);
  });

  it("counts coverage from active songs only", () => {
    const songs = clone();
    const before = coverageOf(songs).byTheme.burnout;
    songs.find((s) => s.themes.includes("burnout"))!.retired = true;
    expect(coverageOf(songs).byTheme.burnout).toBe(before - 1);
    expect(coverageOf(songs).retired).toBe(1);
  });
});

describe("IDs", () => {
  it("are made from the title, and never reuse a taken one", () => {
    const taken = new Set(base.map((s) => s.id));
    expect(makeSongId("Good Luck, Babe!", "Chappell Roan", taken)).toBe("good-luck-babe");
    expect(makeSongId("Call Me Maybe", "Someone Else", taken)).toBe("call-me-maybe-someone-else");
    taken.add("call-me-maybe-someone-else");
    expect(makeSongId("Call Me Maybe", "Someone Else", taken)).toBe("call-me-maybe-someone-else-2");
  });
});

describe("import and export", () => {
  const founderList = [
    { title: "Good Luck, Babe!", artist: "Chappell Roan", genre: "Pop", theme: "Romantic denial" },
    { title: "Hard Times", artist: "Paramore", genre: "Rock", theme: "Burnout" },
    { title: "Good Days", artist: "SZA", genre: "R&B", theme: "Self-reflection" },
    { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop", theme: "Self-reflection" },
    { title: "No Scrubs", artist: "TLC", genre: "R&B", theme: "Boundaries" },
  ];

  it("reads the simple format with labels", () => {
    const { songs, problems } = normalizeImported(founderList);
    expect(problems).toEqual([]);
    expect(songs[0]).toMatchObject({ title: "Good Luck, Babe!", genres: ["pop"], themes: ["romantic_denial"] });
    expect(songs[2]).toMatchObject({ genres: ["rnb"], themes: ["self_reflection"] });
  });

  it("adds new songs and updates existing ones without duplicating", () => {
    const { songs } = normalizeImported(founderList);
    const m = mergeImport(clone(), songs, "add");
    expect(m.added).toBe(2);
    expect(m.updated).toBe(3);
    expect(m.songs.length).toBe(base.length + 2);
    expect(m.songs.find((s) => s.id === "good-luck-babe")).toMatchObject({ energy: "medium", genres: ["pop"] });
    expect(validateCatalogue(m.songs).errors).toBe(0);
  });

  it("replace retires (never deletes) songs missing from the file", () => {
    const { songs } = normalizeImported(founderList);
    const m = mergeImport(clone(), songs, "replace");
    expect(m.songs.length).toBe(base.length + 2);
    expect(m.retired).toBe(base.length - 3);
    expect(m.songs.filter((s) => !s.retired).length).toBe(5);
    // Every old ID still exists, so old share links keep working.
    for (const r of base) expect(m.songs.some((s) => s.id === r.id)).toBe(true);
  });

  it("round-trips an export", () => {
    const exported = JSON.parse(JSON.stringify({ version: 1, songs: base }));
    const { songs, problems } = normalizeImported(exported);
    expect(problems).toEqual([]);
    const m = mergeImport(clone(), songs, "add");
    expect(m.added).toBe(0);
    expect(m.songs).toEqual(base);
  });

  it("accepts Spotify links in imports and reports bad ones", () => {
    const { songs, problems } = normalizeImported([
      { title: "Hard Times", artist: "Paramore", genres: ["rock"], themes: ["burnout"], spotify: "https://open.spotify.com/track/0w5Bdu51Ka25Pf3hojsKHh?si=x" },
      { title: "X", artist: "Y", genre: "Pop", theme: "Chaos", spotify: "https://open.spotify.com/album/abc" },
    ]);
    expect(songs[0].spotifyTrackId).toBe("0w5Bdu51Ka25Pf3hojsKHh");
    expect(problems[0]).toContain("album");
  });

  it("rejects files that aren't song lists", () => {
    expect(normalizeImported({ hello: 1 }).problems).toHaveLength(1);
    expect(normalizeImported([{ title: "No artist" }]).problems[0]).toContain("title and an artist");
  });
});

describe("recommendations use the catalogue", () => {
  it("leave retired songs out of recommendations but keep them for old links", () => {
    for (const s of records.filter((r) => r.retired)) {
      expect(SONGS.some((x) => x.id === s.id)).toBe(false);
      expect(songById[s.id]).toBeDefined();
    }
    expect(SONGS.length).toBe(records.filter((r) => !r.retired).length);
    for (const t of ROAST_THEMES) expect(SONGS.some((s) => s.themes.includes(t))).toBe(true);
  });

  it("make newly added songs eligible for their theme and genre", () => {
    expect(songPool("romantic_denial", ["pop"]).pool.some((s) => s.id === "good-luck-babe")).toBe(true);
    expect(songPool("burnout", ["rock"]).pool.some((s) => s.id === "hard-times")).toBe(true);
    expect(songPool("burnout", ["pop"]).pool.some((s) => s.id === "hard-times")).toBe(false);
  });

  it("stay deterministic: the same person, day and genres always get the same song", () => {
    for (let i = 0; i < 30; i++) {
      const input = { sign: "leo" as const, dateKey: `2026-12-${String(i + 1).padStart(2, "0")}`, genres: ["rock" as const], birthday: { month: 8, day: 9 } };
      expect(getDailyReading(input).song.id).toBe(getDailyReading(input).song.id);
    }
  });
});
