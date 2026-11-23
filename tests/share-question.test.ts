import { describe, expect, it } from "vitest";
import { seriousResponses, topicResponses, unclearResponses } from "@/data/ask-responses";
import { askShareParams, parseShare, shareUrl, whatsappShareUrl } from "@/features/share/links";
import {
  checkShareableQuestion,
  cleanQuestion,
  questionFromHash,
  SHARED_QUESTION_MAX,
  withQuestion,
} from "@/features/share/question";

const yes = topicResponses.romance.find((r) => r.stance === "yes")!;
const notMyDept = seriousResponses.medical[0];
const base = shareUrl("https://x.github.io", askShareParams(yes, "romance"), "/askqueen");

function hashOf(url: string) {
  return url.slice(url.indexOf("#"));
}

describe("question sharing is opt-in", () => {
  it("leaves links without a question exactly as before", () => {
    expect(withQuestion(base, null)).toBe(base);
    expect(base).not.toContain("#");
    expect(questionFromHash("", yes)).toEqual({ question: null, rejected: false });
  });

  it("keeps old answer-only links working", () => {
    const old = parseShare(askShareParams(yes, "romance").toString());
    expect(old.kind).toBe("ask");
    if (old.kind === "ask") expect(questionFromHash("", old.response).question).toBeNull();
  });

  it("puts the question only in the #fragment, never the query sent to the server", () => {
    const url = withQuestion(base, "Will my ex ever come back?");
    const u = new URL(url);
    expect(u.search).not.toMatch(/ex|come|back/);
    expect(u.hash).toContain("q=");
    expect(questionFromHash(u.hash, yes).question).toBe("Will my ex ever come back?");
  });
});

describe("shared questions round-trip", () => {
  const samples = [
    "Will my ex ever come back?",
    "Should I text them first? 🙈",
    "Is it a good idea to quit & move to Paris #yolo",
    "Ça va marcher avec mon crush ?",
    "Should I go to the party? 100% honest answer please",
    "Will we be friends again — or is it over?",
    `${"Will this work ".repeat(16).trim()}?`.slice(0, SHARED_QUESTION_MAX),
  ];
  for (const q of samples) {
    it(`keeps "${q.slice(0, 40)}" intact`, () => {
      const check = checkShareableQuestion(q, yes);
      expect(check.ok).toBe(true);
      const url = withQuestion(base, q);
      expect(questionFromHash(hashOf(url), yes).question).toBe(cleanQuestion(q));
    });
  }
});

describe("shared questions are untrusted text", () => {
  it("never shows crisis questions, whoever wrote the link", () => {
    for (const q of ["Should I kill myself?", "I want to die, will it get better?", "Is it ok that he hits me?"]) {
      expect(checkShareableQuestion(q, yes)).toEqual({ ok: false, problem: "crisis" });
      expect(questionFromHash(hashOf(withQuestion(base, q)), yes)).toEqual({ question: null, rejected: true });
    }
  });

  it("only pairs serious questions with 'not my department' answers", () => {
    const q = "Should I stop taking my medication?";
    expect(checkShareableQuestion(q, yes)).toEqual({ ok: false, problem: "serious_mismatch" });
    expect(checkShareableQuestion(q, notMyDept)).toEqual({ ok: true, question: q });
    expect(checkShareableQuestion("Should I sue my landlord?", yes).ok).toBe(false);
    expect(checkShareableQuestion("Should I put my savings into crypto?", yes).ok).toBe(false);
  });

  it("rejects links, emails and phone numbers", () => {
    expect(checkShareableQuestion("Should I visit https://evil.example.com now?", yes)).toEqual({ ok: false, problem: "link" });
    expect(checkShareableQuestion("Is www.something.io legit for love?", yes).ok).toBe(false);
    expect(checkShareableQuestion("Should I date the guy from freebies.com", yes).ok).toBe(false);
    expect(checkShareableQuestion("Should I email jo@example.org tonight?", yes)).toEqual({ ok: false, problem: "contact" });
    expect(checkShareableQuestion("Should I call +44 7700 900123 back?", yes)).toEqual({ ok: false, problem: "contact" });
    // Ordinary numbers and dotted text are fine.
    expect(checkShareableQuestion("Will I get 3 dates by 2027?", yes).ok).toBe(true);
    expect(checkShareableQuestion("Is he the one... or not?", yes).ok).toBe(true);
  });

  it("strips invisible and direction-changing characters", () => {
    const sneaky = "Will‮this​ work\u0007 out﻿?";
    expect(cleanQuestion(sneaky)).toBe("Will this work out ?");
  });

  it("shows markup as plain text rather than refusing to parse it", () => {
    const q = "<img src=x onerror=alert(1)> will they text me?";
    const check = checkShareableQuestion(q, yes);
    // Allowed as text: React and canvas never interpret it as HTML.
    expect(check.ok).toBe(true);
    expect(questionFromHash(hashOf(withQuestion(base, q)), yes).question).toBe(q);
  });

  it("enforces length limits and rejects oversized links cheaply", () => {
    expect(checkShareableQuestion("Hey?", yes)).toEqual({ ok: false, problem: "too_short" });
    expect(checkShareableQuestion("a ".repeat(200), yes)).toEqual({ ok: false, problem: "too_long" });
    expect(questionFromHash(`#q=${"a".repeat(5000)}`, yes)).toEqual({ question: null, rejected: true });
    expect(questionFromHash("#q=%E0%A4%A", yes).question).toBeNull();
  });

  it("never attaches a question to 'try again' answers", () => {
    expect(checkShareableQuestion("Will it work out?", unclearResponses[0])).toEqual({ ok: false, problem: "answer_not_shareable" });
  });

  it("rejects gibberish", () => {
    expect(checkShareableQuestion("asdfghjkl qwrtzp", yes).ok).toBe(false);
  });
});

describe("social links", () => {
  it("build a WhatsApp link with the message encoded", () => {
    const url = whatsappShareUrl('I asked Sabrina: "Will it work?"\nhttps://x.io/share/?t=ask&a=b#q=Will');
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(url.slice("https://wa.me/?text=".length))).toContain("#q=Will");
  });
});
