import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ADVICE, AVOID, LUCKY } from "@/data/daily-extras";
import { allRoasts, roastsForSign } from "@/data/roasts";
import { SONGS, spotifyEmbedUrl, spotifySearchUrl } from "@/data/songs";
import { THEMES } from "@/data/themes";
import { addDays, dayNumber } from "@/features/daily/date";
import {
  fallbackNote,
  getDailyReading,
  normalizeGenres,
  pickFromPool,
  roastText,
  rotationIndex,
  selectRoast,
  selectSong,
  songPool,
  SONG_HISTORY_START,
  SONG_NO_REPEAT_DAYS,
  type Birthday,
} from "@/features/daily/reading";
import { dailyPageUrl, formatDailyShareText } from "@/features/daily/share";
import { validateAll, validateRoast, validateSong, validateTheme } from "@/lib/validate-content";
import { INTENSITIES, MUSIC_GENRES, ROAST_THEMES, ZODIAC_SIGNS, type MusicGenre } from "@/types/content";

const START = "2026-11-21";
const LEO_BDAY: Birthday = { month: 8, day: 5 };

describe("roast database", () => {
  it("has at least 252 valid roasts with unique ids", () => {
    expect(allRoasts.length).toBeGreaterThanOrEqual(252);
    expect(validateAll(allRoasts, validateRoast)).toEqual([]);
  });

  it("gives every sign at least 21 roasts covering all 8 themes at least twice", () => {
    for (const sign of ZODIAC_SIGNS) {
      const roasts = roastsForSign(sign);
      expect(roasts.length, sign).toBeGreaterThanOrEqual(21);
      for (const theme of ROAST_THEMES) {
        expect(roasts.filter((r) => r.theme === theme).length, `${sign} ${theme}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("has three distinct intensity variants for every roast", () => {
    for (const r of allRoasts) {
      expect(new Set(INTENSITIES.map((i) => r.variants[i])).size, r.id).toBe(3);
    }
  });

  it("never repeats a line anywhere in the database", () => {
    const texts = allRoasts.flatMap((r) => INTENSITIES.map((i) => r.variants[i]));
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("keeps ex-partner jokes rare", () => {
    const exJokes = allRoasts.filter((r) => INTENSITIES.some((i) => /\bex(es)?\b/i.test(r.variants[i])));
    expect(exJokes.length).toBeLessThanOrEqual(5);
  });
});

describe("themes and daily extras", () => {
  it("defines all 8 themes with at least 7 song explanations each", () => {
    expect(THEMES.map((t) => t.id).sort()).toEqual([...ROAST_THEMES].sort());
    expect(validateAll(THEMES as unknown[], validateTheme)).toEqual([]);
    for (const t of THEMES) expect(t.songReasons.length, t.id).toBeGreaterThanOrEqual(7);
  });

  it("has advice for every theme and big lucky/avoid pools with no duplicates", () => {
    for (const theme of ROAST_THEMES) expect(ADVICE[theme].length, theme).toBeGreaterThanOrEqual(6);
    expect(LUCKY.length).toBeGreaterThanOrEqual(40);
    expect(AVOID.length).toBeGreaterThanOrEqual(40);
    const all = [...Object.values(ADVICE).flat(), ...LUCKY, ...AVOID];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("music dataset", () => {
  it("has at least 200 valid songs with unique ids and no duplicate tracks", () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(200);
    expect(validateAll(SONGS, validateSong)).toEqual([]);
    const keys = SONGS.map((s) => `${s.title.toLowerCase()}|${s.artist.toLowerCase()}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("builds Spotify search links from title and artist", () => {
    for (const s of SONGS) {
      expect(s.listenUrl).toBe(spotifySearchUrl(s.title, s.artist));
      expect(decodeURIComponent(s.listenUrl.split("/search/")[1])).toBe(`${s.title} ${s.artist}`);
    }
    expect(spotifySearchUrl("Telepatía", "Kali Uchis")).toBe("https://open.spotify.com/search/Telepat%C3%ADa%20Kali%20Uchis");
  });

  it("gives every Spotify track ID a unique, well-formed value (the link itself is optional)", () => {
    const withIds = SONGS.filter((s) => s.spotifyTrackId);
    for (const s of withIds) expect(s.spotifyTrackId, s.id).toMatch(/^[0-9A-Za-z]{22}$/);
    expect(new Set(withIds.map((s) => s.spotifyTrackId)).size).toBe(withIds.length);
    expect(spotifyEmbedUrl("3TGRqZ0a2l1LRblBkJoaDx")).toBe(
      "https://open.spotify.com/embed/track/3TGRqZ0a2l1LRblBkJoaDx?utm_source=generator",
    );
  });

  it("has at least one active song for every theme, so every reading gets a song", () => {
    for (const theme of ROAST_THEMES) expect(SONGS.some((s) => s.themes.includes(theme)), theme).toBe(true);
  });
});

describe("rotation", () => {
  it("shows every item exactly once per cycle and never twice in a row", () => {
    for (const n of [6, 21, 40]) {
      let previous = -1;
      for (let day = 20000; day < 20000 + n * 12; day++) {
        const i = rotationIndex(n, `t|${n}`, day);
        expect(i).not.toBe(previous);
        previous = i;
      }
      const cycleStart = Math.ceil(20000 / n) * n;
      for (let c = 0; c < 10; c++) {
        const seen = new Set(Array.from({ length: n }, (_, d) => rotationIndex(n, `t|${n}`, cycleStart + c * n + d)));
        expect(seen.size).toBe(n);
      }
    }
  });
});

describe("roast selection", () => {
  it("changes every day, never repeats two days running, and covers all 21 roasts per cycle", () => {
    for (const sign of ZODIAC_SIGNS) {
      let previous = "";
      for (let d = 0; d < 400; d++) {
        const id = selectRoast(sign, addDays("2025-06-01", d), LEO_BDAY).id;
        expect(id, `${sign} day ${d}`).not.toBe(previous);
        previous = id;
      }
      let start = "2026-11-01";
      while (dayNumber(start) % 21 !== 0) start = addDays(start, 1);
      const cycle = Array.from({ length: 21 }, (_, d) => selectRoast(sign, addDays(start, d)).id);
      expect(new Set(cycle).size, sign).toBe(21);
    }
  });

  it("gives same-sign people with different birthdays mostly different roasts", () => {
    let same = 0;
    let total = 0;
    for (let d = 0; d < 60; d++) {
      const day = addDays(START, d);
      const a = selectRoast("leo", day, { month: 7, day: 25 }).id;
      for (const b of [{ month: 8, day: 1 }, { month: 8, day: 10 }, { month: 8, day: 20 }]) {
        total++;
        if (selectRoast("leo", day, b).id === a) same++;
      }
    }
    expect(same / total).toBeLessThan(0.15);
  });

  it("gives the same roast to the same birthday on the same day", () => {
    expect(selectRoast("leo", START, LEO_BDAY)).toEqual(selectRoast("leo", START, { month: 8, day: 5 }));
  });
});

describe("song matching", () => {
  const genreSets: MusicGenre[][] = [[], ["pop"], ["kpop"], ["country"], ["country", "latin"], ["rock", "indie", "soul"]];

  it("always picks a song that shares the roast's theme", () => {
    for (const sign of ZODIAC_SIGNS) {
      for (let d = 0; d < 30; d++) {
        for (const genres of genreSets) {
          const r = getDailyReading({ sign, dateKey: addDays(START, d), genres, birthday: LEO_BDAY });
          expect(r.song.themes, `${sign} ${d} ${genres}`).toContain(r.theme);
          expect(r.theme).toBe(r.roast.theme);
          expect(r.songReason).toContain(r.song.title);
        }
      }
    }
  });

  it("uses the user's genres for every theme (catalogue has no gaps now)", () => {
    for (const theme of ROAST_THEMES) {
      for (const genre of MUSIC_GENRES) {
        const { pool, genreFallback } = songPool(theme, [genre]);
        expect(genreFallback).toBe(false);
        for (const s of pool) {
          expect(s.genres).toContain(genre);
          expect(s.themes).toContain(theme);
        }
      }
    }
  });

  it("still falls back to a same-theme song if a genre pool were empty, and says so", () => {
    const pick = pickFromPool(SONGS.filter((s) => s.themes.includes("burnout")), "seed");
    expect(pick.themes).toContain("burnout");
    expect(fallbackNote("burnout")).toBe("None of your genres had a burnout song today, so Sabrina went off-list.");
  });

  it("prefers songs not played recently, then the one played longest ago", () => {
    const pool = SONGS.filter((s) => s.themes.includes("yearning") && s.genres.includes("country")).slice(0, 3);
    const ids = pool.map((s) => s.id);
    expect(ids).not.toContain(pickFromPool(pool, "x", ids.slice(0, 2)).id === ids[2] ? "" : ids[2]);
    expect(pickFromPool(pool, "x", [ids[1], ids[0], ids[2]]).id).toBe(ids[1]);
  });

  it(`only repeats a song within ${SONG_NO_REPEAT_DAYS} days when every fitting song was just played`, () => {
    const from = addDays(SONG_HISTORY_START, 30);
    let repeats = 0;
    let total = 0;
    for (const sign of ZODIAC_SIGNS) {
      for (const genres of genreSets) {
        const days = Array.from({ length: 200 }, (_, d) => addDays(from, d));
        const picks = days.map((day) => selectSong(sign, day, genres, LEO_BDAY).song.id);
        for (let i = 0; i < picks.length; i++) {
          total++;
          const window = picks.slice(Math.max(0, i - SONG_NO_REPEAT_DAYS + 1), i);
          if (!window.includes(picks[i])) continue;
          repeats++;
          // A repeat is only allowed when the whole pool for that day was used recently.
          const theme = selectRoast(sign, days[i], LEO_BDAY).theme;
          const { pool } = songPool(theme, genres);
          expect(pool.every((s) => window.includes(s.id)), `${sign} ${genres} day ${i}`).toBe(true);
        }
      }
    }
    expect(repeats / total).toBeLessThan(0.05);
  });

  it("gives niche-genre fans plenty of different songs in four weeks", () => {
    for (const genres of [["country"], ["kpop"]] as MusicGenre[][]) {
      for (const sign of ZODIAC_SIGNS) {
        const songs = new Set(Array.from({ length: 28 }, (_, d) => selectSong(sign, addDays(START, d), genres, LEO_BDAY).song.id));
        expect(songs.size, `${sign} ${genres}`).toBeGreaterThanOrEqual(14);
      }
    }
  });

  it("normalises genres: dedupes, drops unknowns, caps at 3, ignores order", () => {
    expect(normalizeGenres(["rock", "pop", "rock", "polka"])).toEqual(["pop", "rock"]);
    expect(normalizeGenres(["soul", "rock", "pop", "indie"])).toHaveLength(3);
    const a = getDailyReading({ sign: "leo", dateKey: START, genres: ["rock", "pop"], birthday: LEO_BDAY });
    const b = getDailyReading({ sign: "leo", dateKey: START, genres: ["pop", "rock"], birthday: LEO_BDAY });
    expect(a).toEqual(b);
  });
});

describe("daily consistency", () => {
  it("gives the same reading for the same inputs and date", () => {
    for (const sign of ZODIAC_SIGNS) {
      const a = getDailyReading({ sign, dateKey: START, genres: ["indie"], birthday: LEO_BDAY });
      const b = getDailyReading({ sign, dateKey: START, genres: ["indie"], birthday: LEO_BDAY });
      expect(a).toEqual(b);
    }
  });

  it("differs across dates, including the extras", () => {
    const readings = Array.from({ length: 7 }, (_, d) =>
      getDailyReading({ sign: "virgo", dateKey: addDays(START, d), birthday: { month: 9, day: 1 } }),
    );
    expect(new Set(readings.map((r) => r.roast.id)).size).toBe(7);
    expect(new Set(readings.map((r) => r.lucky)).size).toBe(7);
    expect(new Set(readings.map((r) => r.avoid)).size).toBe(7);
  });

  it("matches advice to the roast's theme", () => {
    for (let d = 0; d < 30; d++) {
      const r = getDailyReading({ sign: "aries", dateKey: addDays(START, d), birthday: { month: 4, day: 1 } });
      expect(ADVICE[r.theme]).toContain(r.advice);
    }
  });

  it("changes tone with intensity but never the roast, theme, song or extras", () => {
    const r = getDailyReading({ sign: "pisces", dateKey: START, genres: ["kpop"], birthday: { month: 3, day: 1 } });
    expect(new Set(INTENSITIES.map((i) => roastText(r, i))).size).toBe(3);
    expect(getDailyReading({ sign: "pisces", dateKey: START, genres: ["kpop"], birthday: { month: 3, day: 1 } })).toEqual(r);
  });
});

describe("privacy", () => {
  it("copied text leaves out name, birth date and genres", () => {
    const r = getDailyReading({ sign: "gemini", dateKey: START, genres: ["latin"], birthday: { month: 6, day: 2 } });
    const text = formatDailyShareText(r, "savage", dailyPageUrl("https://me.github.io", "/askqueen"));
    expect(text).toContain("Gemini");
    expect(text).toContain("Saturday 21 November 2026");
    expect(text).toContain(r.song.title);
    expect(text).toContain(r.advice);
    expect(text).toContain("https://me.github.io/askqueen/daily/");
    expect(text).not.toMatch(/latin/i);
    expect(text).not.toMatch(/\b(19|20)\d\d-\d\d-\d\d\b/);
    expect(text).not.toMatch(/2 June|June 2|6-2/);
  });

  it("no app code uses browser storage, cookies or IndexedDB", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(name)) files.push(p);
      }
    };
    walk(join(__dirname, "..", "src"));
    expect(files.length).toBeGreaterThan(10);
    const offenders = files.filter((f) =>
      /localStorage|sessionStorage|document\.cookie|indexedDB|history\.(push|replace)State/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
