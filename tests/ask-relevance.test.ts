/**
 * Ask Sabrina relevance acceptance tests (Critical Product Quality Fix).
 * Every question has the reading a person would expect. The engine must
 * then only ever answer from that intent's own answers.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { allAskResponses, confusedAnswers, generalAnswers, intentAnswers, topicResponses, triviaAnswers } from "@/data/ask-responses";
import { classifyQuestion } from "@/features/ask/classify";
import { askSabrina, candidateTiers, readAsLabel, renderAnswer, resetAskSession, type AskReading } from "@/features/ask/engine";
import { PLACES } from "@/features/ask/places";
import { askShareParams, parseShare } from "@/features/share/links";
import { checkShareableQuestion } from "@/features/share/question";
import { validateAskResponse } from "@/lib/validate-content";
import { ASK_INTENTS, type AskIntent, type AskTag } from "@/types/content";

type Expect = AskIntent | "crisis" | `serious:${string}` | "confused" | "trivia" | "unclear";

/** [question, expected reading, expected place (if any)] */
const FIXTURE: Array<[string, Expect, string?]> = [
  // The founder's ten
  ["Will I move to Portugal?", "relocation", "Portugal"],
  ["Will I get a job in Germany?", "career", "Germany"],
  ["Should I move out of my apartment?", "moving_home"],
  ["Will my ex text me again?", "ex"],
  ["Should I buy a new dress?", "shopping"],
  ["Will I pass my exam?", "exams"],
  ["Should I travel to Japan?", "travel", "Japan"],
  ["Will I become famous?", "ambition"],
  ["Should I go to a party tonight?", "social_plans"],
  ["Should I invest all my savings?", "serious:financial"],
  // Relocation
  ["Should I move to Portugal?", "relocation", "Portugal"],
  ["Will I get a job in Portugal?", "career", "Portugal"],
  ["Should I move to Berlin for a job?", "relocation", "Berlin"],
  ["Will I live in New York one day?", "relocation", "New York"],
  ["Should I move abroad?", "relocation"],
  ["Is it a good idea to relocate for love?", "relocation"],
  ["Will I end up living in London?", "relocation", "London"],
  ["Should I study abroad in Spain?", "relocation", "Spain"],
  ["Should I emigrate?", "relocation"],
  ["Will I move back home to Ireland?", "relocation", "Ireland"],
  ["Should I move to a new city?", "relocation"],
  ["Should I settle in Lisbon?", "relocation", "Lisbon"],
  // Moving home
  ["Should I move out?", "moving_home"],
  ["Will I find a new flat soon?", "moving_home"],
  ["Should I get my own place?", "moving_home"],
  ["Should I move out of my parents' house?", "moving_home"],
  ["Is it time to find a new apartment?", "moving_home"],
  // Travel
  ["Should I book the flight to Bali?", "travel", "Bali"],
  ["Should I go to Turkey this summer?", "travel", "Turkey"],
  ["Should I visit Nice in June?", "travel", "Nice"],
  ["Will I go on holiday this year?", "travel"],
  ["Should I take a solo trip?", "travel"],
  ["Should I take a gap year to travel?", "travel"],
  ["Will I see Paris this year?", "travel", "Paris"],
  ["Should I go backpacking in South America?", "travel", "South America"],
  // Social plans
  ["Should I go out or stay in?", "social_plans"],
  ["Should I go to the concert?", "social_plans"],
  ["Will the party be fun?", "social_plans"],
  ["Should I cancel my plans tonight?", "social_plans"],
  ["Should I go to the festival this weekend?", "social_plans"],
  // Fashion
  ["Should I get a tattoo?", "fashion"],
  ["Should I cut my hair short?", "fashion"],
  ["Do I look good in red?", "fashion"],
  ["Should I wear the black dress tonight?", "fashion"],
  ["Should I dye my hair pink?", "fashion"],
  ["Should I get a nose piercing?", "fashion"],
  // Shopping
  ["Should I buy these shoes?", "shopping"],
  ["Should I buy a new phone?", "shopping"],
  ["Should I splurge on the bag?", "shopping"],
  ["Should I buy a new outfit?", "shopping"],
  ["Should I order the jacket I saw online?", "shopping"],
  // Money
  ["Should I lend my friend money?", "money"],
  ["Will I have more money next month?", "money"],
  ["Should I save money this month?", "money"],
  ["Can I afford a holiday?", "money"],
  // Career
  ["Should I quit my job?", "career"],
  ["Will I get the promotion?", "career"],
  ["Should I ask my boss for a raise?", "career"],
  ["Should I start a business?", "career"],
  ["Will I get the job?", "career"],
  ["Should I accept the job offer?", "career"],
  ["This job is killing me, should I quit?", "career"],
  ["Should I change careers?", "career"],
  // Interviews
  ["Will my interview go well?", "interview"],
  ["Will I kill it at my interview?", "interview"],
  ["Should I go to the second interview?", "interview"],
  // Exams
  ["Will I get into university?", "exams"],
  ["Should I apply to Oxford?", "exams"],
  ["Will I pass my driving test?", "exams"],
  ["Should I study tonight?", "exams"],
  ["Will I get good grades this year?", "exams"],
  ["Will I finish my thesis on time?", "exams"],
  // Ex
  ["Will my ex come back?", "ex"],
  ["Should I get back with my ex?", "ex"],
  ["How do I get over him?", "ex"],
  ["Should I text my ex?", "ex"],
  ["Does my ex miss me?", "ex"],
  // Texting
  ["Will they text me back?", "texting"],
  ["Should I text him first?", "texting"],
  ["Should I ring him?", "texting"],
  ["Is Jordan going to text me?", "texting"],
  ["Should I double text?", "texting"],
  ["Why did he leave me on read?", "texting"],
  // Romance
  ["Will my crush like me back?", "romance"],
  ["Will I find love this year?", "romance"],
  ["Is my crush into me?", "romance"],
  ["Should I ask her out?", "romance"],
  ["Will I meet my soulmate?", "romance"],
  ["Should I tell him I have feelings for him?", "romance"],
  // Commitment
  ["Should I propose?", "commitment"],
  ["Should we move in together?", "commitment"],
  ["Will I get married?", "commitment"],
  ["Will he ever settle down?", "commitment"],
  // Family
  ["Will I have kids?", "family"],
  ["Will my parents like my boyfriend?", "family"],
  ["Should I call my mom?", "family"],
  // Friendship
  ["Is my best friend mad at me?", "friendship"],
  ["Should I tell my friend the truth?", "friendship"],
  ["Will my friends and I make up?", "friendship"],
  ["Is my bestie mad at me?", "friendship"],
  // Ambition
  ["Will I be rich?", "money"],
  ["Will I go viral?", "ambition"],
  ["Should I chase my dream?", "ambition"],
  ["Will I become a singer?", "ambition"],
  ["Will I be successful?", "ambition"],
  // Self
  ["Am I ugly?", "self_doubt"],
  ["Am I the problem?", "self_doubt"],
  ["Am I enough?", "self_worth"],
  ["Will anyone ever love me?", "self_worth"],
  // Decisions
  ["Should I do it?", "decision"],
  ["Should I say yes?", "decision"],
  ["Should I take the risk?", "decision"],
  // Future
  ["Will I be happy?", "future"],
  ["Will it work out?", "future"],
  ["Is today going to be good?", "future"],
  ["Will next year be my year?", "future"],
  ["Will I be lucky this week?", "future"],
  // Safety and serious
  ["Should I stop taking my meds?", "serious:medical"],
  ["Will I get a visa for Canada?", "serious:immigration"],
  ["Can I get Portuguese residency?", "serious:immigration"],
  ["Will my work permit be approved?", "serious:immigration"],
  ["Should I sign the contract?", "serious:legal"],
  ["Will I win the lottery?", "serious:financial"],
  ["Should I put my savings into crypto?", "serious:financial"],
  ["Is he cheating on me?", "serious:trust"],
  ["Am I pregnant?", "serious:medical"],
  ["I want to kill myself", "crisis"],
  ["My ex hits me, should I take him back?", "crisis"],
  ["It's an emergency, what should I do?", "crisis"],
  // Not understood: Sabrina asks for more instead of guessing
  ["What's the capital of France?", "trivia"],
  ["Who won the World Cup?", "trivia"],
  ["How many legs does a spider have?", "trivia"],
  ["Will it rain tomorrow?", "confused"],
  ["Will I ever see him again?", "confused"],
  ["Is the blue one better?", "confused"],
  ["Hmm what about that thing?", "confused"],
  ["Да ли ће данас бити добро?", "confused"],
  ["asdfgh jkl", "unclear"],
];

function readingKey(q: string): string {
  const c = classifyQuestion(q);
  if (c.kind === "intent") return c.intent;
  if (c.kind === "serious") return `serious:${c.topic}`;
  if (c.kind === "confused") return c.reason === "trivia" ? "trivia" : "confused";
  return c.kind;
}

beforeEach(() => resetAskSession());

describe("classifier: 120+ questions read the way a person would", () => {
  it("has at least 100 questions", () => {
    expect(FIXTURE.length).toBeGreaterThanOrEqual(120);
  });
  it.each(FIXTURE)("%s → %s", (q, expected, place) => {
    expect(readingKey(q)).toBe(expected);
    const c = classifyQuestion(q);
    if (place) expect(c.kind === "intent" && c.place?.name.replace(/^the /, "")).toBe(place);
  });
});

const generalIds = new Set(generalAnswers.map((r) => r.id));

describe("answers come only from the matched intent", () => {
  const answered = FIXTURE.filter(([, e]) => (ASK_INTENTS as readonly string[]).includes(e));
  it.each(answered)("%s", (q, expected) => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const r = askSabrina(q, { rng: () => (i * 0.137) % 1 });
      expect(r.kind).toBe("answer");
      if (r.kind !== "answer") return;
      // Either an answer written for this intent, or a general magic-ball line.
      expect(r.intent).toBe(expected);
      if (r.response.intent !== undefined) expect(r.response.intent).toBe(expected);
      else expect(generalIds.has(r.response.id)).toBe(true);
      expect(r.response.retired).toBeUndefined();
      expect(r.text).not.toContain("{place}");
      seen.add(r.response.id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
    expect([...seen].some((id) => !generalIds.has(id)), "some answers are about the topic").toBe(true);
  });
});

describe("the Portugal failure", () => {
  const forbidden = new Set([...intentAnswers.fashion, ...intentAnswers.social_plans, ...intentAnswers.shopping].map((r) => r.id));
  const offTopicWords = /\b(outfit|night|party|dress|wear|basket|shopping|buy|drink|music|blanket|snacks)\b/i;

  it("never answers with fashion, nightlife or shopping, over 300 draws", () => {
    for (let i = 0; i < 300; i++) {
      if (i % 25 === 0) resetAskSession();
      const r = askSabrina("Will I move to Portugal?", { rng: () => ((i * 7919) % 1000) / 1000 });
      if (r.kind !== "answer") throw new Error("expected an answer");
      expect(forbidden.has(r.response.id)).toBe(false);
      expect(r.intent).toBe("relocation");
      expect(r.response.intent === "relocation" || generalIds.has(r.response.id)).toBe(true);
      expect(r.text).not.toMatch(offTopicWords);
    }
  });

  it("names Portugal in the first answer and reads it as moving abroad", () => {
    const r = askSabrina("Will I move to Portugal?", { rng: () => 0.5 });
    expect(r.kind === "answer" && r.text).toContain("Portugal");
    expect(r.kind === "answer" && r.intent).toBe("relocation");
  });

  it("predicts for 'Will I…' and advises for 'Should I…'", () => {
    const will = candidateTiers("relocation", "will", null).flat();
    const should = candidateTiers("relocation", "should", null).flat();
    expect(will.every((r) => !r.forms || r.forms.includes("will"))).toBe(true);
    expect(should.every((r) => !r.forms || r.forms.includes("should"))).toBe(true);
    expect(will.some((r) => r.text.startsWith("Pack"))).toBe(false);
  });

  it("never tells the old night-out joke to anyone moving anywhere", () => {
    for (const q of ["Will I move to Portugal?", "Should I move out of my apartment?", "Should I travel to Japan?", "Should I get a tattoo?"]) {
      for (let i = 0; i < 30; i++) {
        const r = askSabrina(q, { rng: () => (i / 30) % 1 });
        expect(r.kind === "answer" && r.text).not.toBe("Go. You'll regret the outfit, never the night.");
      }
    }
  });
});

describe("variety without storage", () => {
  it("doesn't repeat within a visit until the pool is used up", () => {
    const pool = candidateTiers("exams", "will", null).flat();
    const ids = Array.from({ length: pool.length }, (_, i) => {
      const r = askSabrina("Will I pass my exam?", { rng: () => (i * 0.31) % 1 });
      return r.kind === "answer" ? r.response.id : "";
    });
    expect(new Set(ids).size).toBe(pool.length);
  });

  it("never shows the same answer twice in a row, even after the pool resets", () => {
    let prev: string | undefined;
    for (let i = 0; i < 60; i++) {
      const r: AskReading = askSabrina("Should I text him first?", { rng: () => 0, previousId: prev });
      if (r.kind !== "answer") throw new Error("expected an answer");
      expect(r.response.id).not.toBe(prev);
      prev = r.response.id;
    }
  });

  it("forgets everything on a fresh visit (resetAskSession)", () => {
    const a = askSabrina("Will I become famous?", { rng: () => 0 });
    resetAskSession();
    const b = askSabrina("Will I become famous?", { rng: () => 0 });
    expect(a.kind === "answer" && b.kind === "answer" && a.response.id === b.response.id).toBe(true);
  });
});

describe("questions Sabrina can't place", () => {
  it.each(["What's the capital of France?", "Who wrote Hamlet?"])("quiz questions get honesty: %s", (q) => {
    const r = askSabrina(q);
    expect(r.kind).toBe("confused");
    expect(r.kind !== "crisis" && r.response.stance).toBe("try_again");
  });
  it.each(["Will it rain tomorrow?", "Is the blue one better?", "Да ли ће данас бити добро?"])("everyday questions get a general magic-ball answer: %s", (q) => {
    const r = askSabrina(q);
    expect(r.kind).toBe("answer");
    expect(r.kind === "answer" && generalIds.has(r.response.id)).toBe(true);
    expect(r.kind === "answer" && readAsLabel(r.response, r.place, r.category, r.intent)).toBe("General vibes");
  });
  it("never mixes general answers into reassurance or kids questions", () => {
    for (const q of ["Am I enough?", "Am I ugly?", "Will I have kids?"]) {
      for (let i = 0; i < 60; i++) {
        const r = askSabrina(q, { rng: () => (i * 0.071) % 1 });
        expect(r.kind === "answer" && generalIds.has(r.response.id), q).toBe(false);
      }
    }
  });
  it("mixes in general answers for variety, about a third of the time", () => {
    let general = 0;
    for (let i = 0; i < 300; i++) {
      const r = askSabrina("Will I pass my exam?", { rng: () => ((i * 7919) % 1000) / 1000 });
      if (r.kind === "answer" && generalIds.has(r.response.id)) general++;
    }
    expect(general).toBeGreaterThan(60);
    expect(general).toBeLessThan(150);
  });
  it("general answers fit how the question was asked", () => {
    for (let i = 0; i < 80; i++) {
      const r = askSabrina("Should I do it?", { rng: () => (i * 0.113) % 1 });
      if (r.kind === "answer" && r.response.forms) expect(r.response.forms).toContain("should");
    }
  });
  it("uses the founder's line among the confused replies", () => {
    expect(confusedAnswers.map((r) => r.text)).toContain("Babe, my crystal ball is confused. Give me a little more detail.");
    expect(triviaAnswers.length).toBeGreaterThanOrEqual(3);
  });
  it("never lets a 'please rephrase' reply be shared with a question", () => {
    for (const r of [...confusedAnswers, ...triviaAnswers]) expect(checkShareableQuestion("Will I be happy?", r).ok).toBe(false);
  });
});

describe("serious topics never get a prediction", () => {
  it.each(FIXTURE.filter(([, e]) => e.startsWith("serious:")))("%s", (q) => {
    const r = askSabrina(q);
    expect(r.kind).toBe("serious");
    expect(r.kind !== "crisis" && r.response.stance).toBe("not_an_oracle");
  });
});

describe("answer content", () => {
  const all = Object.values(intentAnswers).flat();
  const longestPlace = PLACES.reduce((a, b) => (b.name.length > a.name.length ? b : a));

  it("every answer passes the content rules, with unique IDs", () => {
    for (const r of allAskResponses) expect(validateAskResponse(r), r.id).toEqual([]);
    expect(new Set(allAskResponses.map((r) => r.id)).size).toBe(allAskResponses.length);
  });

  it("has over 200 intent-specific answers, at least 5 per intent", () => {
    expect(all.length).toBeGreaterThanOrEqual(200);
    for (const intent of ASK_INTENTS) expect(intentAnswers[intent].length, intent).toBeGreaterThanOrEqual(5);
  });

  it("gives every intent yes, no and maybe (self-esteem answers are reassurance only)", () => {
    for (const intent of ASK_INTENTS.filter((i) => i !== "self_doubt" && i !== "self_worth")) {
      const stances = new Set(intentAnswers[intent].map((r) => r.stance));
      for (const s of ["yes", "no", "maybe"]) expect(stances.has(s as "yes"), `${intent} ${s}`).toBe(true);
    }
    expect(intentAnswers.self_doubt.every((r) => r.stance === "no")).toBe(true);
    expect(intentAnswers.self_worth.every((r) => r.stance === "yes")).toBe(true);
  });

  it("has enough answers for both 'Will I' and 'Should I' questions in every intent and subject", () => {
    for (const intent of ASK_INTENTS) {
      const tagSets: AskTag[][] = [[], ...new Set(intentAnswers[intent].flatMap((r) => r.tags ?? []))].map((t) => (Array.isArray(t) ? t : [t]));
      // Family questions always mention kids or relatives, so there's no subject-less case.
      for (const tags of intent === "family" ? tagSets.slice(1) : tagSets)
        for (const form of ["will", "should"] as const)
          expect(candidateTiers(intent, form, null, tags).flat().length, `${intent} ${form} ${tags}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps subject-specific answers on their subject", () => {
    const run = (q: string) =>
      Array.from({ length: 30 }, (_, i) => {
        const r = askSabrina(q, { rng: () => (i * 0.29) % 1 });
        return r.kind === "answer" ? r.response : null;
      });
    expect(run("Should I get a tattoo?").some((r) => r?.tags?.includes("hair"))).toBe(false);
    expect(run("Should I cut my hair short?").some((r) => r?.tags?.includes("ink"))).toBe(false);
    expect(run("Should I buy a new phone?").some((r) => r?.tags?.includes("clothes"))).toBe(false);
    expect(run("Should I accept the job offer?").some((r) => r?.tags?.includes("quit") || r?.tags?.includes("raise"))).toBe(false);
    expect(run("Should I propose?").some((r) => r?.tags?.includes("move_in"))).toBe(false);
    // Kids: never a yes or no.
    expect(run("Will I have kids?").every((r) => r?.stance === "maybe" && r.tags?.includes("kids"))).toBe(true);
  });

  it("fits in 280 characters with the longest place name, and never repeats the verdict", () => {
    for (const r of all) {
      expect(renderAnswer(r, longestPlace).length, r.id).toBeLessThanOrEqual(280);
      expect(r.text, r.id).not.toMatch(/^(yes|no|maybe)\b/i);
    }
  });

  it("only place answers mention {place}, and the old broad answers are retired", () => {
    for (const r of all) expect(r.usesPlace === true, r.id).toBe(r.text.includes("{place}"));
    for (const r of Object.values(topicResponses).flat()) expect(r.retired).toBe(true);
  });
});

describe("share links keep the place, safely", () => {
  it("round-trips a place answer", () => {
    const r = askSabrina("Will I move to Portugal?", { rng: () => 0.5 });
    if (r.kind !== "answer") throw new Error("expected an answer");
    const params = askShareParams(r.response, r.category, r.place);
    expect(params.get("p")).toBe("portugal");
    const shared = parseShare(params.toString());
    expect(shared.kind === "ask" && renderAnswer(shared.response, shared.place)).toBe(r.text);
  });

  it("rejects places not on AskQueen's own list, or on answers without a place", () => {
    const placeAnswer = intentAnswers.relocation.find((r) => r.usesPlace)!;
    const plain = intentAnswers.exams[0];
    expect(parseShare(`t=ask&a=${placeAnswer.id}&p=atlantis`).kind).toBe("invalid");
    expect(parseShare(`t=ask&a=${placeAnswer.id}`).kind).toBe("invalid");
    expect(parseShare(`t=ask&a=${placeAnswer.id}&p=%3Cscript%3E`).kind).toBe("invalid");
    expect(parseShare(`t=ask&a=${plain.id}&p=portugal`).kind).toBe("invalid");
  });

  it("still opens links made before the fix", () => {
    for (const id of ["rom-maybe-3", "pla-yes-1", "car-no-2", "ser-fin-1"]) expect(parseShare(`t=ask&a=${id}&c=plans`).kind).toBe("ask");
  });
});
