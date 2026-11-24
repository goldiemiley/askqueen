/**
 * Ask Queen response engine: question in, one of Sabrina's written answers out.
 * Pure and in-memory: nothing is logged, stored or sent.
 *
 * Answers come from the pool for the question's specific intent, filtered to
 * fit how it was asked ("Will I…?" gets predictions, "Should I…?" gets advice).
 * When a destination was recognised, answers that name it come first.
 * About a third of answers come from a shared pool of classic magic-ball
 * lines instead, for variety; everyday questions Sabrina can't place get one
 * of those too, rather than a request to rephrase.
 * Within one visit, answers rotate without repeats until a pool is used up. That memory lives in this module only and is gone on reload, so
 * there is no promise of variety across visits.
 */
import { confusedAnswers, generalAnswers, intentAnswers, seriousResponses, triviaAnswers, unclearResponses } from "@/data/ask-responses";
import type { AskCategory, AskIntent, AskResponse, AskStance, AskTag, QuestionForm } from "@/types/content";
import { classifyQuestion, type Classification, type SeriousTopic } from "./classify";
import type { Place } from "./places";

export type AskReading =
  | { kind: "crisis" }
  | {
      /** answer: a real answer. serious: "not my department". unclear/confused: please rephrase. */
      kind: "answer" | "serious" | "unclear" | "confused";
      response: AskResponse;
      /** The answer as shown, with {place} filled in. */
      text: string;
      /** Broad topic (kept for share links and older code). */
      category: AskCategory | null;
      /** Specific intent Sabrina matched, shown as "Read as: …". */
      intent: AskIntent | null;
      place: Place | null;
      topic: SeriousTopic | null;
    };

export type Rng = () => number;

/** Fills {place}. Answers with {place} are only chosen when a place is known. */
export function renderAnswer(response: Pick<AskResponse, "text">, place: Pick<Place, "name"> | null): string {
  return response.text.replace(/\{place\}/g, place?.name ?? "there");
}

/** Picks a random item, avoiding `avoidId` when there is an alternative. */
export function pick(pool: AskResponse[], rng: Rng, avoidId?: string): AskResponse {
  const candidates = pool.length > 1 && avoidId ? pool.filter((r) => r.id !== avoidId) : pool;
  const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
  return candidates[index];
}

// ---------- Session rotation (memory only) ----------

const seenThisVisit = new Map<string, Set<string>>();

/** Clears this visit's rotation memory (tests, or a fresh start). */
export function resetAskSession() {
  seenThisVisit.clear();
}

/**
 * Picks from the first tier that still has unseen answers. When every answer
 * in the pool has been seen this visit, starts over (still never the one just shown).
 */
function rotate(key: string, tiers: AskResponse[][], rng: Rng, avoidId?: string): AskResponse {
  const seen = seenThisVisit.get(key) ?? new Set<string>();
  seenThisVisit.set(key, seen);
  for (const tier of tiers) {
    const fresh = tier.filter((r) => !seen.has(r.id) && r.id !== avoidId);
    if (fresh.length) {
      const chosen = pick(fresh, rng);
      seen.add(chosen.id);
      return chosen;
    }
  }
  seen.clear();
  const all = tiers.flat();
  const chosen = pick(all, rng, avoidId);
  seen.add(chosen.id);
  return chosen;
}

/**
 * Answers for an intent that fit the question. Exported for tests.
 * - Subject-specific answers (tags) only when the question mentions that subject.
 * - Form: predictions for "Will I…", advice for "Should I…".
 * - Tiers, most specific first: names the place → about the subject → general.
 */
export function candidateTiers(intent: AskIntent, form: QuestionForm | null, place: Place | null, tags: AskTag[] = []): AskResponse[][] {
  const onTopic = intentAnswers[intent].filter((r) => !r.tags || r.tags.some((t) => tags.includes(t)));
  const fits = (r: AskResponse) => !form || !r.forms || r.forms.includes(form);
  let fitting = onTopic.filter(fits);
  // A thin pool for this form falls back to every on-topic answer.
  if (fitting.length < 3) fitting = onTopic;
  const usable = place ? fitting : fitting.filter((r) => !r.usesPlace);
  const tiers = [
    usable.filter((r) => r.usesPlace),
    usable.filter((r) => !r.usesPlace && r.tags),
    usable.filter((r) => !r.usesPlace && !r.tags),
  ];
  return tiers.filter((t) => t.length > 0);
}

/** Share of topic answers drawn from the general magic-ball pool. */
export const GENERAL_SHARE = 0.35;

/**
 * Whether a general answer may stand in for a topic answer. Not for
 * reassurance questions (a random "No" to "Am I enough?" would be cruel) or
 * kids questions, which must stay non-predictive.
 */
export function allowsGeneral(intent: AskIntent, tags: AskTag[] = []): boolean {
  return intent !== "self_doubt" && intent !== "self_worth" && !tags.includes("kids");
}

/** General answers that fit how the question was asked. */
export function generalPool(form: QuestionForm | null): AskResponse[] {
  return generalAnswers.filter((r) => !form || !r.forms || r.forms.includes(form));
}

export function readingFor(c: Classification, rng: Rng, previousId?: string): AskReading {
  const base = { category: null, intent: null, place: null, topic: null };
  switch (c.kind) {
    case "crisis":
      return { kind: "crisis" };
    case "serious": {
      const response = rotate(`serious:${c.topic}`, [seriousResponses[c.topic]], rng, previousId);
      return { ...base, kind: "serious", response, text: response.text, topic: c.topic };
    }
    case "unclear": {
      const response = rotate("unclear", [unclearResponses], rng, previousId);
      return { ...base, kind: "unclear", response, text: response.text };
    }
    case "confused": {
      if (c.reason === "low_confidence") {
        // An everyday question Sabrina can't place: a classic magic-ball answer.
        const response = rotate("general", [generalPool(c.form ?? null)], rng, previousId);
        return { ...base, kind: "answer", response, text: response.text, category: "other" };
      }
      const response = rotate(`confused:${c.reason}`, [c.reason === "trivia" ? triviaAnswers : confusedAnswers], rng, previousId);
      return { ...base, kind: "confused", response, text: response.text };
    }
    case "intent": {
      const general = allowsGeneral(c.intent, c.tags) && rng() < GENERAL_SHARE;
      const response = general
        ? rotate("general", [generalPool(c.form)], rng, previousId)
        : rotate(`intent:${c.intent}`, candidateTiers(c.intent, c.form, c.place, c.tags), rng, previousId);
      // The label always shows the place Sabrina recognised; the text only names it when written to.
      return { kind: "answer", response, text: renderAnswer(response, c.place), category: c.topic, intent: c.intent, place: c.place, topic: null };
    }
  }
}

/** Main entry point. `previousId` lets "Get another answer" avoid repeating itself. */
export function askSabrina(question: string, options: { rng?: Rng; previousId?: string } = {}): AskReading {
  return readingFor(classifyQuestion(question), options.rng ?? Math.random, options.previousId);
}

export const stanceLabels: Record<AskStance, string> = {
  yes: "Yes.",
  no: "No.",
  maybe: "Maybe.",
  try_again: "Try again.",
  not_an_oracle: "Not my department.",
};

/** Short word shown inside the crystal ball's window. */
export const stanceOrbWords: Record<AskStance, string> = {
  yes: "Yes",
  no: "No",
  maybe: "Maybe",
  try_again: "Again?",
  not_an_oracle: "Ask a pro",
};

export const categoryLabels: Record<AskCategory, string> = {
  romance: "Love life",
  career: "Work and study",
  friendship: "Friends",
  plans: "Plans",
  money: "Money",
  other: "General vibes",
};

/** What Sabrina understood the question to be about ("Read as: …"). */
export const intentLabels: Record<AskIntent, string> = {
  relocation: "Moving abroad",
  moving_home: "Moving home",
  travel: "Travel",
  social_plans: "Plans and nights out",
  fashion: "Style",
  shopping: "Shopping",
  money: "Money",
  career: "Work and career",
  interview: "Job interviews",
  exams: "Exams and studying",
  ex: "Your ex",
  texting: "Texting",
  romance: "Love life",
  commitment: "Commitment",
  family: "Family",
  friendship: "Friends",
  ambition: "Big dreams",
  self_doubt: "You",
  self_worth: "You",
  decision: "A decision",
  future: "Your future",
};

/** "Moving abroad: Portugal", "Exams and studying", or the old broad label. */
export function readAsLabel(
  r: Pick<AskResponse, "intent" | "category">,
  place: Pick<Place, "name"> | null,
  category?: AskCategory | null,
  intent?: AskIntent | null,
): string {
  const matched = intent ?? r.intent;
  if (matched) return place ? `${intentLabels[matched]}: ${place.name}` : intentLabels[matched];
  return categoryLabels[category ?? r.category];
}
