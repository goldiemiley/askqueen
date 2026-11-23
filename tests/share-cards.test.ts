/**
 * Layout tests for the share cards. A recording stand-in for the canvas
 * measures text at a deliberately wide 0.62em per character, so text that
 * fits here fits with the real fonts too.
 */
import { describe, expect, it } from "vitest";
import { CARD_SIZES, drawCard, fitText, wrapText, type CardContent, type CardFormat } from "@/features/share/card";

type Drawn = { text: string; x: number; y: number; width: number; size: number; align: CanvasTextAlign };

function recorder() {
  const drawn: Drawn[] = [];
  const state = { font: "16px serif", textAlign: "start" as CanvasTextAlign };
  const size = () => Number(/(\d+(?:\.\d+)?)px/.exec(state.font)?.[1] ?? 16);
  const measure = (s: string) => Array.from(s).length * size() * 0.62;
  const ctx = new Proxy(
    {
      get font() {
        return state.font;
      },
      set font(v: string) {
        state.font = v;
      },
      get textAlign() {
        return state.textAlign;
      },
      set textAlign(v: CanvasTextAlign) {
        state.textAlign = v;
      },
      measureText: (s: string) => ({ width: measure(s) }),
      fillText: (text: string, x: number, y: number) =>
        drawn.push({ text, x, y, width: measure(text), size: size(), align: state.textAlign }),
      createLinearGradient: () => ({ addColorStop: () => undefined }),
    } as Record<string, unknown>,
    { get: (t, k: string) => (k in t ? t[k] : () => undefined), set: (t, k: string, v) => ((t[k] = v), true) },
  );
  return { ctx: ctx as unknown as CanvasRenderingContext2D, drawn };
}

function extent(d: Drawn) {
  const left = d.align === "center" ? d.x - d.width / 2 : d.align === "right" || d.align === "end" ? d.x - d.width : d.x;
  return { left, right: left + d.width, top: d.y - d.size, bottom: d.y + d.size * 0.25 };
}

function render(format: CardFormat, card: CardContent) {
  const { ctx, drawn } = recorder();
  drawCard(ctx, format, card);
  return drawn;
}

function expectInside(format: CardFormat, drawn: Drawn[]) {
  const { width, height } = CARD_SIZES[format];
  for (const d of drawn) {
    const e = extent(d);
    expect(e.left, `"${d.text}" starts off the card`).toBeGreaterThanOrEqual(60);
    expect(e.right, `"${d.text}" runs off the card`).toBeLessThanOrEqual(width - 60);
    expect(e.top).toBeGreaterThanOrEqual(60);
    expect(e.bottom).toBeLessThanOrEqual(height - 50);
  }
}

const site = "goldiemiley.github.io/askqueen";
const daily = (title: string, artist: string, roast = "You call it a vibe check. Everyone else calls it avoiding your inbox for nine days."): CardContent => ({
  kind: "daily",
  sign: "Sagittarius",
  dateLabel: "Wednesday 30 September 2026",
  intensityLabel: "Unhinged",
  themeLabel: "Romantic denial",
  roast,
  song: { title, artist, reason: `Because "${title}" is basically your group chat set to music, and you know it.` },
  site,
});

const LONG_ROAST =
  "You've rewritten the same message eleven times, deleted it twice, and are now asking the moon for permission. The moon is busy. Send it, or put the phone in a drawer and go drink some water like a functioning adult.";

describe("Daily cards", () => {
  const songs: Array<[string, string]> = [
    ["Yes", "Drake"],
    ["Good Luck, Babe!", "Chappell Roan"],
    ["The Ballad of Someone Who Definitely Should Have Texted Back Sooner (Extended Version)", "Florence + The Machine"],
    ["Waka Waka (This Time for Africa) [The Official 2010 FIFA World Cup Song]", "Shakira, Freshlyground, and a Very Long List of Featured Artists"],
    ["Supercalifragilisticexpialidociouslyheartbroken", "X"],
  ];
  for (const format of ["story", "square"] as const) {
    for (const [title, artist] of songs) {
      it(`${format}: keeps "${title.slice(0, 30)}" inside the card`, () => {
        const drawn = render(format, daily(title, artist, LONG_ROAST));
        expectInside(format, drawn);
        // The song is drawn (possibly shortened with …), with its artist.
        const titleStart = title.slice(0, 4);
        expect(drawn.some((d) => d.text.startsWith(titleStart))).toBe(true);
        expect(drawn.some((d) => d.text.startsWith(artist.slice(0, 3)))).toBe(true);
      });
    }
  }

  it("story: the music block is prominent and below the roast", () => {
    const drawn = render("story", daily("Good Luck, Babe!", "Chappell Roan"));
    const roast = drawn.find((d) => d.text.includes("vibe"))!;
    const title = drawn.find((d) => d.text === "Good Luck, Babe!")!;
    expect(title.y).toBeGreaterThan(roast.y);
    expect(title.size).toBeGreaterThanOrEqual(48);
    expect(drawn.some((d) => d.text.startsWith("Sabrina’s song for this roast"))).toBe(true);
  });
});

describe("Ask cards", () => {
  const answer = "Babe, even recycling has its limits. Some things are meant to stay in the bin.";
  const ask = (question?: string): CardContent => ({ kind: "ask", question, verdict: "No, babe.", answer, nudge: "Block, delete, glow up.", site });

  for (const format of ["story", "square"] as const) {
    it(`${format}: shows the question above the answer, in a different style`, () => {
      const drawn = render(format, ask("Will my ex ever come back?"));
      expectInside(format, drawn);
      const q = drawn.find((d) => d.text.includes("Will my ex"))!;
      const v = drawn.find((d) => d.text === "No, babe.")!;
      expect(q.y).toBeLessThan(v.y);
      expect(drawn.findIndex((d) => d.text === "Asked Sabrina")).toBeLessThan(drawn.findIndex((d) => d.text === "Sabrina’s answer"));
    });

    it(`${format}: fits a 250-character question`, () => {
      const q = "Okay so hypothetically if someone kept watching my stories at 3am and liking posts from 2019 but never actually texting back, and my friends all say move on, and my horoscope says Venus is doing something weird, should I message them first?".slice(0, 250);
      expectInside(format, render(format, ask(q)));
    });

    it(`${format}: breaks a 250-character word instead of running off the card`, () => {
      expectInside(format, render(format, ask("a".repeat(250))));
    });

    it(`${format}: answer-only cards have no question`, () => {
      const drawn = render(format, ask());
      expectInside(format, drawn);
      expect(drawn.some((d) => d.text === "Asked Sabrina")).toBe(false);
    });
  }
});

describe("text fitting", () => {
  it("shrinks before it shortens, and marks shortened text with …", () => {
    const { ctx } = recorder();
    const short = fitText(ctx, "Hello there", (n) => `${n}px x`, 1000, [60, 40], { maxLines: 1 });
    expect(short.size).toBe(60);
    const long = fitText(ctx, "word ".repeat(80), (n) => `${n}px x`, 400, [60, 40], { maxLines: 2 });
    expect(long.size).toBe(40);
    expect(long.lines).toHaveLength(2);
    expect(long.lines[1].endsWith("…")).toBe(true);
  });

  it("wraps without losing words, and splits words longer than a line", () => {
    const measure = (s: string) => s.length * 10;
    const lines = wrapText(measure, "a".repeat(55), 200);
    expect(lines.every((l) => measure(l) <= 200)).toBe(true);
    expect(lines.join("")).toBe("a".repeat(55));
  });
});
