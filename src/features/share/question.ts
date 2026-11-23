/**
 * Opt-in sharing of the Ask question.
 *
 * The question is only shared when the user switches it on, previews it and
 * (optionally) edits it. It travels in the link's #fragment, which browsers
 * never send to the web server, so GitHub Pages' logs never see it.
 *
 * Anyone can hand-write a link, so a question is treated as untrusted text and
 * checked twice, by the same rules: when it's shared and when a link is opened.
 * - Crisis questions are never shown.
 * - Medical, legal, money and trust questions only appear next to Sabrina's
 *   "not my department" answers, never next to a yes or no.
 * - Links, email addresses and phone numbers are rejected.
 * - Length limits match Ask Queen's own (5 to 250 characters).
 * React and canvas both render it as plain text, so no HTML can run.
 */
import { seriousResponses, unclearResponses } from "@/data/ask-responses";
import { classifyQuestion } from "@/features/ask/classify";
import { QUESTION_MAX, QUESTION_MIN } from "@/features/ask/question";
import type { AskResponse } from "@/types/content";

export const SHARED_QUESTION_MAX = QUESTION_MAX;

export type QuestionProblem =
  | "empty"
  | "too_short"
  | "too_long"
  | "link"
  | "contact"
  | "crisis"
  | "serious_mismatch"
  | "unclear"
  | "answer_not_shareable";

export type QuestionCheck = { ok: true; question: string } | { ok: false; problem: QuestionProblem };

const seriousIds = new Set(Object.values(seriousResponses).flat().map((r) => r.id));
const unclearIds = new Set(unclearResponses.map((r) => r.id));

// Control characters, zero-width characters and text-direction overrides
// (which can disguise text) are replaced with spaces.
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁩﻿]/g;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const URLISH =
  /(?:https?:\/\/|www\.|(?:^|[^\p{L}\p{N}@])[\p{L}\p{N}-]+\.(?:com|net|org|io|co|app|dev|xyz|ly|me|link|info|biz|ru|tk|gg|tv|rs|uk|de|fr|site|online|shop|click)(?:$|[^\p{L}\p{N}]))/iu;
// Eight or more digits, allowing spaces, dashes, dots and brackets between them.
const PHONE = /(?:\+?\d[\s\-.()]*){8,}/;

/** Normalises untrusted text: removes invisible characters and collapses spaces. */
export function cleanQuestion(raw: string): string {
  return raw.normalize("NFC").replace(INVISIBLE, " ").replace(/\s+/g, " ").trim();
}

/** Can this question be shown next to this answer? */
export function checkShareableQuestion(raw: string, response: AskResponse): QuestionCheck {
  if (unclearIds.has(response.id)) return { ok: false, problem: "answer_not_shareable" };
  const question = cleanQuestion(raw);
  if (!question) return { ok: false, problem: "empty" };
  if (question.length < QUESTION_MIN) return { ok: false, problem: "too_short" };
  if (question.length > SHARED_QUESTION_MAX) return { ok: false, problem: "too_long" };
  if (EMAIL.test(question) || PHONE.test(question)) return { ok: false, problem: "contact" };
  if (URLISH.test(question)) return { ok: false, problem: "link" };
  const c = classifyQuestion(question);
  if (c.kind === "crisis") return { ok: false, problem: "crisis" };
  if (c.kind === "unclear") return { ok: false, problem: "unclear" };
  if (c.kind === "serious" && !seriousIds.has(response.id)) return { ok: false, problem: "serious_mismatch" };
  return { ok: true, question };
}

export const questionProblemMessages: Record<QuestionProblem, string> = {
  empty: "Type the question you want to show, or switch off Show my question.",
  too_short: `Questions need at least ${QUESTION_MIN} characters.`,
  too_long: `Keep it under ${SHARED_QUESTION_MAX} characters so it fits on the card.`,
  link: "Remove the web address. Shared questions can't contain links.",
  contact: "Remove the email address or phone number before sharing.",
  crisis: "This question can't be shared. If you're going through something hard, please reach out to someone you trust or a local helpline.",
  serious_mismatch: "Sabrina can't pair this question with this answer. Ask it as a new question instead.",
  unclear: "Sabrina can't make sense of this question. Write it the way you'd say it out loud.",
  answer_not_shareable: "This answer can't be shared with a question.",
};

/** Adds the question to a share link as #q=… (or returns the link unchanged). */
export function withQuestion(url: string, question: string | null): string {
  if (!question) return url;
  return `${url}#${new URLSearchParams({ q: question }).toString()}`;
}

/**
 * Reads #q=… from a link and runs the same checks. Returns null when there
 * is no question, or when it fails a check (the answer is still shown).
 */
export function questionFromHash(hash: string, response: AskResponse): { question: string | null; rejected: boolean } {
  const raw = new URLSearchParams(hash.replace(/^#/, "")).get("q");
  if (raw === null) return { question: null, rejected: false };
  // Reject oversized input before doing any work on it.
  if (raw.length > SHARED_QUESTION_MAX * 4) return { question: null, rejected: true };
  const check = checkShareableQuestion(raw, response);
  return check.ok ? { question: check.question, rejected: false } : { question: null, rejected: true };
}
