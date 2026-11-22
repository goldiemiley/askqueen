/**
 * Lightweight, keyword-based question classification for the Ask Queen
 * prototype. This is deliberately simple and transparent: it matches a
 * question to a topic so Sabrina can pick a pre-written answer. It does not
 * understand arbitrary questions and the UI must not claim it does.
 *
 * Priority: crisis > serious (medical/legal/financial/trust) > unclear > topic.
 */
import type { AskCategory } from "@/types/content";
import { normalizeQuestion } from "./question";

export type SeriousTopic = "medical" | "legal" | "financial" | "trust";

export type Classification =
  | { kind: "crisis" }
  | { kind: "serious"; topic: SeriousTopic }
  | { kind: "unclear" }
  | { kind: "topic"; category: AskCategory };

/** Builds a word-boundary regex from a list of words or phrases. */
function words(list: string[]): RegExp {
  const escaped = list.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${escaped.join("|")})(?=$|[^\\p{L}\\p{N}])`, "u");
}

/** Immediate harm, self-harm, abuse or emergencies: show real-world support, never a joke. */
const CRISIS: RegExp[] = [
  /\bsuicid/,
  /\bkill(?:ing)? (?:myself|him|her|them|someone|somebody|my (?:boss|ex|mum|mom|dad|husband|wife|boyfriend|girlfriend|partner|brother|sister|friend|roommate|teacher|parents?))\b/,
  /\bend (?:my life|it all|myself)\b/,
  /\bwant(?:s)? to die\b/,
  /\bdon'?t want to (?:live|be alive|exist)\b/,
  /\bself[- ]?harm/,
  /\b(?:hurt|hurting|cut|cutting|harm|harming) myself\b/,
  /\boverdos/,
  /\babus(?:e|ed|es|ive|ing)\b/,
  /\b(?:he|she|they|someone|somebody|my \w+) (?:hits|hit|beats|beat|chokes|choked|threatens|threatened|hurts|hurt) me\b/,
  /\bassault/,
  /\brap(?:e|ed)\b/,
  /\bnot safe\b/,
  /\bunsafe\b/,
  /\bin danger\b/,
  /\bemergency\b/,
];

const SERIOUS: Array<[SeriousTopic, RegExp]> = [
  [
    "medical",
    words([
      "doctor", "doctors", "gp", "medication", "medications", "medicine", "meds", "pill", "pills",
      "prescription", "symptom", "symptoms", "diagnosis", "diagnosed", "pregnant", "pregnancy",
      "surgery", "cancer", "tumor", "tumour", "hospital", "disease", "infection", "vaccine", "dose",
      "dosage", "therapy", "therapist", "health", "mental health", "depressed", "depression",
      "anxiety", "eating disorder", "std", "sti",
    ]),
  ],
  [
    "legal",
    words([
      "lawyer", "attorney", "sue", "suing", "lawsuit", "court", "contract", "divorce", "custody",
      "arrest", "arrested", "police", "visa", "immigration", "illegal", "legal", "lease", "evict",
      "evicted", "eviction",
    ]),
  ],
  [
    "financial",
    words([
      "invest", "investing", "investment", "investments", "stock", "stocks", "shares", "crypto",
      "bitcoin", "ethereum", "loan", "loans", "mortgage", "debt", "debts", "savings", "pension",
      "bet", "bets", "betting", "gamble", "gambling", "casino", "lottery", "trading", "forex",
    ]),
  ],
  [
    "trust",
    words([
      "cheat", "cheating", "cheated", "cheats", "unfaithful", "affair", "lying to me", "lie to me",
      "lied to me", "lies to me",
    ]),
  ],
];

const TOPICS: Array<[AskCategory, RegExp]> = [
  [
    "romance",
    words([
      "love", "loves", "loved", "lover", "crush", "crushes", "date", "dates", "dating", "boyfriend",
      "girlfriend", "bf", "gf", "partner", "husband", "wife", "ex", "exes", "situationship",
      "relationship", "marry", "marriage", "married", "propose", "kiss", "flirt", "flirting",
      "text me", "text back", "texts me", "like me", "into me", "miss me", "misses me", "soulmate",
      "single", "tinder", "hinge", "bumble", "valentine", "romance", "romantic", "babe", "dm", "dms",
      "ghosted", "ghosting", "rizz", "first move", "make a move",
    ]),
  ],
  [
    "career",
    words([
      "job", "jobs", "at work", "my work", "workplace", "boss", "promotion", "promoted", "raise", "interview",
      "interviews", "career", "cv", "resume", "hired", "hire", "fired", "quit", "office", "coworker",
      "coworkers", "colleague", "colleagues", "manager", "business", "startup", "project",
      "deadline", "exam", "exams", "test", "uni", "university", "college", "school", "study",
      "degree", "grades", "internship", "client", "clients", "apply", "application", "side hustle",
    ]),
  ],
  [
    "friendship",
    words([
      "friend", "friends", "friendship", "bestie", "besties", "bff", "best friend", "mate", "mates",
      "group chat", "gc", "squad", "roommate", "roommates", "flatmate", "flatmates", "falling out",
      "drama", "frenemy",
    ]),
  ],
  [
    "money",
    words([
      "money", "buy", "buying", "spend", "spending", "afford", "rich", "cash", "shopping", "shop",
      "purchase", "budget", "sale", "paycheck", "payday", "splurge", "cost", "costs", "expensive",
      "cheap", "bag", "shoes", "outfit", "treat myself", "basket", "cart",
    ]),
  ],
  [
    "plans",
    words([
      "trip", "travel", "travelling", "traveling", "holiday", "vacation", "party", "tonight",
      "weekend", "go out", "going out", "move", "moving", "concert", "festival", "plan", "plans",
      "event", "birthday", "haircut", "tattoo", "piercing", "dye my hair", "should i go", "gym",
      "tomorrow", "summer", "new year",
    ]),
  ],
];

/** Topic order used to break ties between equally matched topics. */
const TOPIC_PRIORITY: AskCategory[] = ["romance", "career", "friendship", "money", "plans"];

function countMatches(text: string, pattern: RegExp): number {
  const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  return text.match(global)?.length ?? 0;
}

/** True when a Latin-script token looks like a keyboard mash (no vowels, long consonant run, or a repeated letter). */
function isMashToken(token: string): boolean {
  if (!/^[a-z]+$/.test(token)) return false; // non-Latin scripts and mixed tokens are not judged
  if (token.length <= 2) return false;
  if (!/[aeiouy]/.test(token)) return true;
  if (/(.)\1{3,}/.test(token)) return true;
  if (/[^aeiouy]{5,}/.test(token)) return true;
  return false;
}

export function isUnclear(normalized: string): boolean {
  const letters = normalized.match(/\p{L}/gu)?.length ?? 0;
  if (letters < 3) return true;
  const tokens = normalized.match(/\p{L}+/gu) ?? [];
  if (tokens.length === 0) return true;
  const mash = tokens.filter(isMashToken).length;
  return mash / tokens.length >= 0.5;
}

export function classifyQuestion(question: string): Classification {
  const text = normalizeQuestion(question);

  if (CRISIS.some((re) => re.test(text))) return { kind: "crisis" };

  for (const [topic, re] of SERIOUS) {
    if (re.test(text)) return { kind: "serious", topic };
  }

  if (isUnclear(text)) return { kind: "unclear" };

  let best: AskCategory = "other";
  let bestScore = 0;
  for (const category of TOPIC_PRIORITY) {
    const pattern = TOPICS.find(([c]) => c === category)![1];
    const score = countMatches(text, pattern);
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return { kind: "topic", category: best };
}
