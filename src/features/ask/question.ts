/** Question validation for Ask Queen. Pure functions; nothing is stored. */

export const QUESTION_MIN = 5;
export const QUESTION_MAX = 250;

export type QuestionError = "empty" | "too_short" | "too_long";

export type QuestionCheck = { ok: true; value: string } | { ok: false; error: QuestionError };

export function validateQuestion(raw: string): QuestionCheck {
  const value = raw.replace(/\s+/g, " ").trim();
  if (value.length === 0) return { ok: false, error: "empty" };
  if (value.length < QUESTION_MIN) return { ok: false, error: "too_short" };
  if (value.length > QUESTION_MAX) return { ok: false, error: "too_long" };
  return { ok: true, value };
}

export const questionErrorMessages: Record<QuestionError, string> = {
  empty: "Type a question first. Sabrina's good, but she's not that good.",
  too_short: `Give Sabrina at least ${QUESTION_MIN} characters to work with.`,
  too_long: `Keep it under ${QUESTION_MAX} characters. Sabrina reads palms, not essays.`,
};

/**
 * Lowercases, strips accents and normalises apostrophes and whitespace so
 * keyword matching is predictable. Used only in memory for classification.
 */
export function normalizeQuestion(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
