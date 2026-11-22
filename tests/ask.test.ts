import { describe, expect, it } from "vitest";
import { allAskResponses, seriousResponses, topicResponses, unclearResponses } from "@/data/ask-responses";
import { classifyQuestion } from "@/features/ask/classify";
import { askSabrina, pick } from "@/features/ask/engine";
import { QUESTION_MAX, validateQuestion } from "@/features/ask/question";
import { askPageUrl, formatShareText } from "@/features/ask/share";
import { validateAll, validateAskResponse } from "@/lib/validate-content";
import { ASK_CATEGORIES } from "@/types/content";

/** Deterministic pseudo-random generator for tests. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("validateQuestion", () => {
  it("blocks empty, whitespace-only and too-short questions", () => {
    expect(validateQuestion("")).toEqual({ ok: false, error: "empty" });
    expect(validateQuestion("    \n  ")).toEqual({ ok: false, error: "empty" });
    expect(validateQuestion("abcd")).toEqual({ ok: false, error: "too_short" });
  });

  it("accepts 5 to 250 characters and collapses whitespace", () => {
    expect(validateQuestion("  Will  I?  ")).toEqual({ ok: true, value: "Will I?" });
    expect(validateQuestion("a".repeat(QUESTION_MAX)).ok).toBe(true);
    expect(validateQuestion("a".repeat(QUESTION_MAX + 1))).toEqual({ ok: false, error: "too_long" });
  });
});

describe("classifyQuestion: topics", () => {
  const cases: Array<[string, string]> = [
    ["Will they text me back?", "romance"],
    ["Is my crush into me?", "romance"],
    ["Should I make the first move?", "romance"],
    ["Should I ask my boss for a raise?", "career"],
    ["Will I pass my exam?", "career"],
    ["Will I kill it at my interview?", "career"],
    ["Is my bestie mad at me?", "friendship"],
    ["Should I go to the party tonight?", "plans"],
    ["Should I buy these shoes?", "money"],
    ["Is today going to be good?", "other"],
    ["Will it work out?", "other"],
    ["Да ли ће данас бити добро?", "other"],
  ];
  it.each(cases)("%s → %s", (question, category) => {
    expect(classifyQuestion(question)).toEqual({ kind: "topic", category });
  });
});

describe("classifyQuestion: safety", () => {
  it.each([
    "I want to kill myself",
    "Should I end it all?",
    "I don't want to live anymore",
    "Is it bad that I keep hurting myself?",
    "my boyfriend hits me, should I stay?",
    "I'm not safe at home",
    "Thinking about suicide tonight",
  ])("routes '%s' to crisis support", (q) => {
    expect(classifyQuestion(q)).toEqual({ kind: "crisis" });
  });

  it.each([
    ["Should I stop taking my meds?", "medical"],
    ["Am I pregnant?", "medical"],
    ["Should I sign the contract?", "legal"],
    ["Should I invest my savings in crypto?", "financial"],
    ["Will I win the lottery?", "financial"],
    ["Is he cheating on me?", "trust"],
  ])("routes '%s' to %s (no prediction)", (q, topic) => {
    expect(classifyQuestion(q)).toEqual({ kind: "serious", topic });
  });

  it("does not treat common hyperbole as a crisis", () => {
    expect(classifyQuestion("This job is killing me, should I quit?").kind).toBe("topic");
    expect(classifyQuestion("Will I kill it at my interview?").kind).toBe("topic");
  });

  it("crisis wins over every other topic", () => {
    expect(classifyQuestion("My ex hits me, should I take him back?")).toEqual({ kind: "crisis" });
  });
});

describe("classifyQuestion: unclear input", () => {
  it.each(["asdfgh jkl", "?????", "hmmm", "aaaaaaa", "qwrtp zxcvb"])("'%s' is unclear", (q) => {
    expect(classifyQuestion(q)).toEqual({ kind: "unclear" });
  });
  it("a real question with one odd word is still answered", () => {
    expect(classifyQuestion("What are my strengths at work?").kind).toBe("topic");
  });
});

describe("askSabrina", () => {
  it("answers from the matched category and reports it", () => {
    const reading = askSabrina("Will they text me back?", { rng: seeded(1) });
    expect(reading.kind).toBe("answer");
    if (reading.kind !== "answer") return;
    expect(reading.category).toBe("romance");
    expect(topicResponses.romance).toContainEqual(reading.response);
  });

  it("never repeats the previous answer when asked again", () => {
    const rng = seeded(7);
    let previous: string | undefined;
    for (let i = 0; i < 50; i++) {
      const r = askSabrina("Should I buy these shoes?", { rng, previousId: previous });
      if (r.kind === "crisis") throw new Error("unexpected crisis");
      expect(r.response.id).not.toBe(previous);
      previous = r.response.id;
    }
  });

  it("repeated asks can produce different punchlines", () => {
    const rng = seeded(3);
    const ids = new Set(
      Array.from({ length: 20 }, () => {
        const r = askSabrina("Is today going to be good?", { rng });
        return r.kind === "crisis" ? "crisis" : r.response.id;
      }),
    );
    expect(ids.size).toBeGreaterThan(3);
  });

  it("returns a crisis reading with no joke", () => {
    expect(askSabrina("I want to end my life")).toEqual({ kind: "crisis" });
  });

  it("gives a non-predictive answer for serious topics", () => {
    const r = askSabrina("Should I stop taking my meds?", { rng: seeded(2) });
    expect(r.kind).toBe("serious");
    if (r.kind === "serious") expect(r.response.stance).toBe("not_an_oracle");
  });

  it("pick() handles edge values of the random generator", () => {
    const pool = topicResponses.other;
    expect(pick(pool, () => 0)).toBe(pool[0]);
    expect(pick(pool, () => 0.9999999)).toBe(pool[pool.length - 1]);
  });
});

describe("Ask content", () => {
  it("every response passes the content schema and ids are unique", () => {
    expect(validateAll(allAskResponses, validateAskResponse)).toEqual([]);
  });

  it("every topic has yes, no and maybe answers and at least 6 options", () => {
    for (const category of ASK_CATEGORIES) {
      const pool = topicResponses[category];
      expect(pool.length).toBeGreaterThanOrEqual(6);
      for (const stance of ["yes", "no", "maybe"] as const) {
        expect(pool.some((r) => r.stance === stance)).toBe(true);
      }
      expect(pool.every((r) => r.category === category)).toBe(true);
    }
  });

  it("no answer repeats the verdict shown in its heading", () => {
    const heading: Record<string, RegExp> = {
      yes: /^yes\b/i,
      no: /^no\b/i,
      maybe: /^maybe\b/i,
      try_again: /^try again\b/i,
      not_an_oracle: /^not my department\b/i,
    };
    for (const r of allAskResponses) expect(r.text, r.id).not.toMatch(heading[r.stance]);
  });

  it("serious and unclear answers never give a yes/no prediction", () => {
    for (const r of Object.values(seriousResponses).flat()) expect(r.stance).toBe("not_an_oracle");
    for (const r of unclearResponses) expect(r.stance).toBe("try_again");
  });
});

describe("share text", () => {
  const response = topicResponses.romance[1];
  it("leaves the question out by default", () => {
    const text = formatShareText(response, { url: "https://x.github.io/askqueen/ask/" });
    expect(text).not.toContain("I asked");
    expect(text).toContain("Sabrina says: Yes.");
    expect(text).toContain(response.nudge!);
    expect(text).toContain("https://x.github.io/askqueen/ask/");
  });
  it("includes the question only when asked to", () => {
    const text = formatShareText(response, { question: "Will they text me?", url: "u" });
    expect(text.startsWith("I asked: Will they text me?")).toBe(true);
  });
  it("builds the page URL under the base path", () => {
    expect(askPageUrl("https://me.github.io", "/askqueen")).toBe("https://me.github.io/askqueen/ask/");
    expect(askPageUrl("http://localhost:3000", "")).toBe("http://localhost:3000/ask/");
  });
});
