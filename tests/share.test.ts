import { describe, expect, it } from "vitest";
import { allAskResponses } from "@/data/ask-responses";
import { songById } from "@/data/songs";
import { addDays } from "@/features/daily/date";
import { getDailyReading } from "@/features/daily/reading";
import { wrapText } from "@/features/share/card";
import { askCard, askShareText, dailyCard, dailyFullText, dailyShareDataFrom, dailyShareText } from "@/features/share/content";
import { askShareParams, dailyShareParams, facebookShareUrl, parseShare, shareUrl } from "@/features/share/links";
import { INTENSITIES, ZODIAC_SIGNS, type MusicGenre } from "@/types/content";

const GENRE_SETS: MusicGenre[][] = [[], ["country"], ["kpop", "latin"], ["pop", "indie", "rnb"]];

describe("daily share links", () => {
  it("reproduce the exact reading for every sign over two months", () => {
    let checked = 0;
    for (const sign of ZODIAC_SIGNS) {
      for (let i = 0; i < 60; i++) {
        const dateKey = addDays("2026-11-01", i);
        const genres = GENRE_SETS[i % GENRE_SETS.length];
        const result = getDailyReading({ sign, dateKey, genres, birthday: { month: 3, day: 14 } });
        const intensity = INTENSITIES[i % INTENSITIES.length];
        const shared = parseShare(`?${dailyShareParams(result, intensity).toString()}`);
        expect(shared.kind).toBe("daily");
        if (shared.kind !== "daily") continue;
        expect(shared.sign).toBe(sign);
        expect(shared.dateKey).toBe(dateKey);
        expect(shared.intensity).toBe(intensity);
        expect(shared.roast.id).toBe(result.roast.id);
        expect(shared.song.id).toBe(result.song.id);
        expect(shared.songReason).toBe(result.songReason);
        expect(shared.advice).toBe(result.advice);
        expect(shared.lucky).toBe(result.lucky);
        expect(shared.avoid).toBe(result.avoid);
        checked++;
      }
    }
    expect(checked).toBe(ZODIAC_SIGNS.length * 60);
  });

  it("never carry a birthday, name or genre choice", () => {
    const result = getDailyReading({ sign: "leo", dateKey: "2026-11-22", genres: ["country"], birthday: { month: 8, day: 9 } });
    const params = dailyShareParams(result, "savage");
    expect([...params.keys()].sort()).toEqual(["a", "d", "i", "l", "m", "r", "s", "t", "v", "w"]);
    const url = shareUrl("https://example.github.io", params, "/askqueen");
    expect(url.startsWith("https://example.github.io/askqueen/share/?t=daily&")).toBe(true);
    // The only date is the reading's date. The birthday (8 August) appears nowhere.
    expect(url).not.toMatch(/08-09|8-9|birth|name|genre|country/i);
  });

  it("reject tampered or incomplete links", () => {
    const result = getDailyReading({ sign: "leo", dateKey: "2026-11-22", genres: [] });
    const good = dailyShareParams(result, "gentle");
    const tamper = (key: string, value: string | null) => {
      const p = new URLSearchParams(good);
      if (value === null) p.delete(key);
      else p.set(key, value);
      return parseShare(p.toString()).kind;
    };
    expect(parseShare(good.toString()).kind).toBe("daily");
    expect(tamper("s", "virgo")).toBe("invalid"); // roast belongs to another sign
    expect(tamper("s", "dragon")).toBe("invalid");
    expect(tamper("r", "made-up-roast")).toBe("invalid");
    expect(tamper("r", "<script>alert(1)</script>")).toBe("invalid");
    expect(tamper("i", "nuclear")).toBe("invalid");
    expect(tamper("m", "not-a-song")).toBe("invalid");
    expect(tamper("d", "2026-02-30")).toBe("invalid");
    expect(tamper("d", "1999-01-01")).toBe("invalid");
    expect(tamper("a", "999")).toBe("invalid");
    expect(tamper("l", "-1")).toBe("invalid");
    expect(tamper("v", "1e2")).toBe("invalid");
    expect(tamper("w", null)).toBe("invalid");
    expect(parseShare("").kind).toBe("invalid");
    expect(parseShare("?t=horoscope").kind).toBe("invalid");
  });

  it("reject a song from a different theme", () => {
    const result = getDailyReading({ sign: "leo", dateKey: "2026-11-22", genres: [] });
    const other = getDailyReading({ sign: "leo", dateKey: "2026-11-22", genres: [] });
    const p = dailyShareParams(result, "gentle");
    // Find a song whose themes don't include this roast's theme.
    const stranger = Object.values(songById).find((s) => !s.themes.includes(result.theme));
    expect(stranger).toBeDefined();
    p.set("m", stranger!.id);
    expect(parseShare(p.toString()).kind).toBe("invalid");
    expect(other.song.id).toBe(result.song.id);
  });
});

describe("ask share links", () => {
  it("round-trip every response and keep the question out", () => {
    for (const response of allAskResponses) {
      const params = askShareParams(response, "romance");
      expect([...params.keys()].sort()).toEqual(["a", "c", "t"]);
      const shared = parseShare(params.toString());
      expect(shared.kind).toBe("ask");
      if (shared.kind === "ask") {
        expect(shared.response.id).toBe(response.id);
        expect(shared.category).toBe("romance");
      }
    }
    const noCategory = parseShare(askShareParams(allAskResponses[0], null).toString());
    expect(noCategory.kind === "ask" && noCategory.category).toBe(null);
  });

  it("reject unknown answers and categories", () => {
    expect(parseShare("t=ask&a=nope").kind).toBe("invalid");
    expect(parseShare(`t=ask&a=${allAskResponses[0].id}&c=crypto`).kind).toBe("invalid");
  });
});

describe("share helpers", () => {
  it("build a Facebook share link with the address encoded", () => {
    expect(facebookShareUrl("https://x.io/askqueen/share/?t=ask&a=b")).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fx.io%2Faskqueen%2Fshare%2F%3Ft%3Dask%26a%3Db",
    );
  });

  it("wrap text to the measured width without losing words", () => {
    const measure = (s: string) => s.length * 10;
    const text = "Your confidence is a lovely outfit and you keep wearing it to the wrong party";
    const lines = wrapText(measure, text, 200);
    expect(lines.every((l) => measure(l) <= 200)).toBe(true);
    expect(lines.join(" ")).toBe(text);
    // A single word longer than the line still appears rather than vanishing.
    expect(wrapText(measure, "supercalifragilistic", 50).join("")).toContain("supercalifragilistic");
  });

  it("put no personal details on share cards, and the song on Daily cards", () => {
    const result = getDailyReading({ sign: "pisces", dateKey: "2026-11-22", genres: ["indie"], birthday: { month: 3, day: 1 } });
    const card = dailyCard(dailyShareDataFrom(result, "gentle"));
    expect(JSON.stringify(card)).not.toMatch(/1 March|March 1|03-01|birthday/i);
    expect(card.dateLabel).toBe("Sunday 22 November 2026");
    expect(card.song).toEqual({ title: result.song.title, artist: result.song.artist, reason: result.songReason });
    const ask = askCard(allAskResponses[0]);
    expect(ask.answer).toBe(allAskResponses[0].text);
    expect(ask.question).toBeUndefined();
    expect(askCard(allAskResponses[0], "Will it work out?").question).toBe("Will it work out?");
  });

  it("include the song and the exact link in Daily share text", () => {
    const result = getDailyReading({ sign: "leo", dateKey: "2026-11-22", genres: ["pop"] });
    const data = dailyShareDataFrom(result, "savage");
    const url = "https://x.github.io/askqueen/share/?t=daily&s=leo";
    for (const text of [dailyShareText(data, url), dailyFullText(data, url)]) {
      expect(text).toContain(result.song.title);
      expect(text).toContain(result.song.artist);
      expect(text).toContain(url);
      expect(text).toContain(data.roastText);
    }
  });

  it("only put the question in Ask share text when given", () => {
    const r = allAskResponses[0];
    expect(askShareText(r, null, "u")).not.toMatch(/asked/i);
    expect(askShareText(r, "Will it work out?", "u")).toContain('I asked Sabrina: "Will it work out?"');
  });
});
