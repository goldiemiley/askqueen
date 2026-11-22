/**
 * Ask Queen response engine: question in, one of Sabrina's pre-written
 * answers out. Pure and in-memory: nothing is logged, stored or sent.
 */
import { seriousResponses, topicResponses, unclearResponses } from "@/data/ask-responses";
import type { AskCategory, AskResponse, AskStance } from "@/types/content";
import { classifyQuestion, type Classification, type SeriousTopic } from "./classify";

export type AskReading =
  | { kind: "crisis" }
  | {
      kind: "answer" | "unclear" | "serious";
      response: AskResponse;
      /** Topic Sabrina matched the question to, shown to the user for transparency. */
      category: AskCategory | null;
      topic: SeriousTopic | null;
    };

export type Rng = () => number;

/** Picks a random item, avoiding `avoidId` when there is an alternative. */
export function pick(pool: AskResponse[], rng: Rng, avoidId?: string): AskResponse {
  const candidates = pool.length > 1 && avoidId ? pool.filter((r) => r.id !== avoidId) : pool;
  const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
  return candidates[index];
}

export function readingFor(classification: Classification, rng: Rng, previousId?: string): AskReading {
  switch (classification.kind) {
    case "crisis":
      return { kind: "crisis" };
    case "serious":
      return {
        kind: "serious",
        response: pick(seriousResponses[classification.topic], rng, previousId),
        category: null,
        topic: classification.topic,
      };
    case "unclear":
      return { kind: "unclear", response: pick(unclearResponses, rng, previousId), category: null, topic: null };
    case "topic":
      return {
        kind: "answer",
        response: pick(topicResponses[classification.category], rng, previousId),
        category: classification.category,
        topic: null,
      };
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
