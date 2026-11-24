/**
 * Ask Queen question understanding. Transparent, keyword-and-pattern based,
 * runs entirely in the browser; nothing is logged, stored or sent.
 *
 * Order (hierarchical):
 *  1. Safety: crisis → real-world support, never a joke.
 *  2. Serious topics (medical, legal, immigration eligibility, money at risk,
 *     infidelity) → "not my department", never a prediction.
 *  3. Keyboard mashes → ask for a real question.
 *  4. Specific intent (moving abroad, exams, texting…), scored from weighted
 *     cues. Each intent has its own answers, so unrelated questions never
 *     share a pool just because they share a broad topic.
 *  5. Low confidence or a factual quiz question → Sabrina says she's
 *     confused and asks for more detail, rather than inventing an answer.
 *
 * It does not understand arbitrary language and the UI must not claim it does.
 */
import type { AskCategory, AskIntent, AskTag, QuestionForm } from "@/types/content";
import { findPlace, type Place } from "./places";
import { normalizeQuestion } from "./question";

export type SeriousTopic = "medical" | "legal" | "immigration" | "financial" | "trust";

export type Classification =
  | { kind: "crisis" }
  | { kind: "serious"; topic: SeriousTopic }
  | { kind: "unclear" }
  | { kind: "confused"; reason: "low_confidence" | "trivia"; form?: QuestionForm | null }
  | {
      kind: "intent";
      intent: AskIntent;
      topic: AskCategory;
      form: QuestionForm | null;
      place: Place | null;
      /** Subjects mentioned, so subject-specific answers only go to matching questions. */
      tags: AskTag[];
      score: number;
    };

/** Builds a word-boundary regex from a list of words or phrases. */
function words(list: string[]): RegExp {
  const escaped = list.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));
  return new RegExp(`(?:^|[^\\p{L}\\p{N}@])(?:${escaped.join("|")})(?=$|[^\\p{L}\\p{N}])`, "u");
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
      "prescription", "symptom", "symptoms", "diagnosis", "diagnosed", "diagnose", "pregnant", "pregnancy",
      "surgery", "cancer", "tumor", "tumour", "hospital", "disease", "infection", "vaccine", "dose",
      "dosage", "therapy", "therapist", "health", "mental health", "depressed", "depression",
      "anxiety", "eating disorder", "std", "sti", "sick", "illness", "ill", "test results", "lump",
    ]),
  ],
  [
    "immigration",
    words([
      "visa", "visas", "immigration", "immigrate", "residency", "residence permit", "work permit",
      "citizenship", "citizen", "green card", "asylum", "deport", "deported", "deportation", "passport application",
      "golden visa", "nomad visa", "permanent residence",
    ]),
  ],
  [
    "legal",
    words([
      "lawyer", "attorney", "sue", "suing", "lawsuit", "court", "contract", "divorce", "custody",
      "arrest", "arrested", "police", "illegal", "legal", "lease", "evict", "evicted", "eviction", "fined",
    ]),
  ],
  [
    "financial",
    words([
      "invest", "investing", "investment", "investments", "stock", "stocks", "shares", "crypto",
      "bitcoin", "ethereum", "loan", "loans", "mortgage", "debt", "debts", "savings", "pension",
      "bet", "bets", "betting", "gamble", "gambling", "casino", "lottery", "trading", "forex", "nft", "nfts",
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

type Cue = [RegExp, number];

/**
 * Weighted cues per intent. `@place` stands for a recognised destination.
 * A cue's weight is how strongly it points at the intent; the best total wins,
 * and anything under MIN_SCORE is treated as "not sure".
 */
const CUES: Record<AskIntent, Cue[]> = {
  relocation: [
    [/\b(?:move|moving|moved|relocate|relocating|relocation|emigrate|emigrating|live|living|settle|settling|start (?:a )?new life)\b(?:\s+\S+){0,3}\s+(?:to|in)\s+@place/, 8],
    [/\b(?:move|moving|relocate|relocating|live|living)\s+(?:abroad|overseas)\b/, 8],
    [/\b(?:emigrate|emigrating|relocate|relocating|relocation|expat)\b/, 5],
    [/\bstudy(?:ing)? abroad\b|\b(?:study|studying|exchange|erasmus|semester|year)\b(?:\s+\S+){0,3}\s+in\s+@place/, 6],
    [/\b(?:move|moving)\s+(?:countries|country|cities)\b|\b(?:another|a new|a different|other) (?:country|city)\b/, 5],
    [/\b(?:move|moving)\s+(?:back\s+)?(?:home\s+to|back to)\s+@place/, 8],
  ],
  moving_home: [
    [/\b(?:move|moving)\s+out\b/, 7],
    [/\b(?:find|get|rent|buy)\s+(?:a\s+|my\s+)?(?:new\s+|own\s+)?(?:flat|apartment|place|house|home|studio|room)\b|\bmy own place\b/, 6],
    [/\b(?:apartment|flat|house|houseshare|studio|room|place of my own|my own place)\b/, 3],
    [/\b(?:landlord|rent|roommate|roommates|flatmate|flatmates|housemate|housemates)\b/, 2],
    [/\b(?:move|moving)\b(?!.*@place)/, 2],
  ],
  travel: [
    [/\b(?:travel|travelling|traveling|trip|holiday|holidays|vacation|getaway|backpack|backpacking|honeymoon|road trip|cruise|flight|fly|flying|interrail|sightseeing|solo trip)\b/, 5],
    [/\b(?:go|going|get|head|heading)\s+to\s+@place/, 5],
    [/\b(?:visit|visiting|see|explore|exploring)\s+@place/, 6],
    [/\b(?:weekend|week|summer|winter)\s+in\s+@place/, 6],
    [/@place/, 2],
  ],
  social_plans: [
    [/\b(?:party|parties|club|clubbing|go out|going out|night out|concert|festival|rave|gig|drinks|bar|pub|brunch|karaoke|event|afterparty|after party|pregame)\b/, 5],
    [/\b(?:tonight|this weekend|on friday|on saturday)\b/, 3],
    [/\b(?:stay in|stay home|cancel (?:my |the |our )?plans|bail|flake)\b/, 5],
    [/\b(?:plans?)\b/, 2],
  ],
  fashion: [
    [/\b(?:wear|wearing|outfit|outfits|dress|dresses|skirt|jeans|heels|boots|sneakers|suit|style|haircut|hair|bangs|fringe|dye|bleach|tattoo|tattoos|piercing|piercings|makeup|make up|nails|lipstick|eyeliner|glow up|look good|my look|aesthetic|accessor(?:y|ies))\b/, 5],
  ],
  shopping: [
    [/\b(?:buy|buying|bought|purchase|purchasing|order|ordering|splurge|treat myself|add to cart|checkout|check out|shopping|shop|sale|black friday|haul|upgrade)\b/, 6],
    [/\bnew (?:phone|laptop|car|bag|shoes|dress|outfit|jacket|console|watch|bike|sofa|couch)\b/, 3],
  ],
  money: [
    [/\b(?:lend|lending|borrow|borrowing|pay (?:him|her|them|it) back|split the bill|owe|owes|afford)\b/, 7],
    [/\b(?:money|save money|saving money|saving up|spend|spending|budget|budgeting|afford|salary|pay rise|lend|borrow|owe|owes|bills|paycheck|payday|expensive|broke|cheap|split the bill|refund|rich|millionaire|billionaire|wealthy|win the lottery|lottery)\b/, 5],
  ],
  career: [
    [/\b(?:job|jobs|career|careers|boss|promotion|promoted|raise|quit|resign|resignation|fired|hired|job offer|offer|employer|company|office|coworker|coworkers|colleague|colleagues|manager|business|startup|side hustle|freelance|freelancing|clients?|internship|cv|resume|linkedin|work(?!\s+out))\b/, 5],
    [/@place/, 1],
  ],
  interview: [[/\binterview(?:s|ing|ed)?\b/, 9]],
  exams: [
    [/\b(?:exam|exams|test|tests|finals|midterm|midterms|quiz|grade|grades|gpa|essay|thesis|dissertation|homework|assignment|coursework|revise|revision|study|studying|uni|university|college|school|degree|course|class|classes|admission|admissions|get into|driving test)\b/, 5],
    [/\b(?:pass|fail|graduate|graduating)\b/, 3],
    [/\b(?:oxford|cambridge|harvard|yale|stanford|med school|medical school|law school|grad school|masters|master's|phd|scholarship|apply to uni|apply to university|apply to college)\b/, 6],
  ],
  ex: [
    [/\b(?:my ex|the ex|ex boyfriend|ex girlfriend|ex husband|ex wife|ex partner|exes|ex's)\b/, 9],
    [/\b(?:back together|get back with|getting back with|take (?:him|her|them) back|win (?:him|her|them) back|come back to me|get over (?:him|her|them)|getting over (?:him|her|them)|move on from (?:him|her|them))\b/, 7],
    [/\bex\b/, 6],
  ],
  texting: [
    [/\b(?:text|texts|texted|texting|reply|replies|replied|respond|answer my|message|messaged|messages|dm|dms|call me|call back|ghost|ghosted|ghosting|left on read|on read|double text|snap me|first move)\b/, 6],
    [/\b(?:ring|call|phone|facetime)\s+(?:him|her|them)\b/, 6],
  ],
  romance: [
    [/\b(?:love|loves|crush|crushes|date|dates|dating|boyfriend|girlfriend|bf|gf|partner|relationship|situationship|like me|likes me|into me|miss me|misses me|soulmate|single|tinder|hinge|bumble|kiss|flirt|flirting|romance|romantic|the one|fall in love|falling for|feelings for|ask (?:him|her|them) out|have a chance with)\b/, 5],
  ],
  commitment: [
    [/\b(?:marry|married|marriage|propose|proposal|engaged|engagement|engagement ring|settle down|move in together|move in with|moving in together|commit|commitment|forever|wifey|hubby)\b/, 7],
    [/\b(?:husband|wife)\b/, 3],
    [/\bwedding\b(?!\s+(?:invite|guest))/, 4],
  ],
  family: [
    [/\b(?:kids|children|a baby|have a baby|start a family|be a mom|be a mum|be a dad|be a parent|parents|mum|mom|dad|sister|brother|family)\b/, 5],
  ],
  friendship: [
    [/\b(?:friend|friends|friendship|bestie|besties|bff|best friend|mate|mates|group chat|gc|squad|falling out|fell out|frenemy)\b/, 6],
    [/\b(?:roommate|flatmate)\b/, 2],
  ],
  ambition: [
    [/\b(?:famous|fame|successful|success|viral|go viral|influencer|followers|my dream|dreams|make it|achieve|celebrity|a star|book deal|record deal|singer|actor|actress|artist|athlete|my goals?|make it big|hit it big)\b/, 5],
    [/\bbecome (?:a|an)\b/, 3],
  ],
  // Worry about yourself: Sabrina reassures with a kind "No."
  self_doubt: [
    [/\bam i (?:(?:too |so |really )?(?:ugly|fat|stupid|dumb|annoying|boring|weird|a bad person|unlovable|a failure|the problem|the drama|a burden|cringe|unlikeable|unlikable|worthless|useless|too much))\b/, 10],
    [/\b(?:is something wrong with me|why am i like this|is it my fault)\b/, 10],
  ],
  // Hoping something good is true about you: Sabrina reassures with a kind "Yes."
  self_worth: [
    [/\bam i (?:(?:pretty|beautiful|hot|attractive|smart|enough|good enough|a good person|lovable|cute|interesting|funny|likeable|likable|special|talented))\b/, 10],
    [/\b(?:will anyone (?:ever )?love me|does anyone (?:like|love) me|will i find someone|will someone love me)\b/, 10],
  ],
  decision: [
    [/^(?:should|shall|do|can|could) i\s+(?:just\s+)?(?:do it|go for it|say yes|say no|risk it|take (?:the|a) (?:chance|risk|leap)|try|wait|tell (?:him|her|them)|say something|do this|go|stay|leave|change|let it go|give up|keep going|trust my gut|follow my heart)\s*[?!.]*$/, 6],
    [/^should i\s*\??$/, 6],
    [/\b(?:should i|or should i)\b.*\bor\b/, 3],
  ],
  future: [
    [/\b(?:today|tomorrow|this week|this month|this weekend)\b.*\b(?:good|great|bad|okay|ok|fine|lucky)\b/, 5],
    [/\b(?:future|be happy|happiness|be okay|be ok|be alright|be fine|lucky|luck|good day|good week|good year|my year|everything (?:be|work)|work out|fate|destiny|meant to be|the universe|in store|this year|next year|will today|today be)\b/, 5],
  ],
};

const TAG_CUES: Array<[AskTag, RegExp]> = [
  ["hair", /\b(?:hair|haircut|bangs|fringe|dye|bleach|shave|buzz cut|bob)\b/],
  ["ink", /\b(?:tattoo|tattoos|piercing|piercings|pierced|ink)\b/],
  ["clothes", /\b(?:wear|wearing|outfit|outfits|dress|dresses|skirt|jeans|heels|boots|sneakers|shoes|suit|jacket|top|coat|clothes)\b/],
  ["raise", /\b(?:raise|pay rise|promotion|promoted|salary|pay)\b/],
  ["quit", /\b(?:quit|quitting|resign|resigning|leave my job|leave the job|change careers?|career change)\b/],
  ["jobhunt", /\b(?:apply|applying|application|job hunt|job hunting|looking for (?:a )?(?:new )?job|get (?:a|the) job|find (?:a )?(?:new )?job|new job|get hired)\b/],
  ["apply", /\b(?:apply|applying|application|applications|get into|admission|admissions|accepted|offer from)\b/],
  ["lend", /\b(?:lend|lending|borrow|borrowing|owe|owes|pay (?:him|her|them|me|it) back)\b/],
  ["propose", /\b(?:propose|proposal|marry|married|marriage|engaged|engagement|wedding|settle down)\b/],
  ["move_in", /\b(?:move in|moving in|live together|living together)\b/],
  ["kids", /\b(?:kids|children|a baby|have a baby|start a family|be a (?:mom|mum|dad|parent))\b/],
  ["relatives", /\b(?:parents|mum|mom|dad|mother|father|sister|brother|siblings?|family|grandma|grandpa|aunt|uncle|cousin)\b/],
  ["text", /\b(?:text|texts|texting|message|messaged|dm|dms|call|ring|reply)\b/],
];

export function questionTags(text: string): AskTag[] {
  return TAG_CUES.filter(([, re]) => re.test(text)).map(([t]) => t);
}

/** Intents checked first when scores tie: the more specific one wins. */
const PRIORITY: AskIntent[] = [
  "self_doubt", "self_worth", "interview", "ex", "exams", "relocation", "moving_home", "commitment", "texting", "shopping",
  "travel", "fashion", "social_plans", "career", "money", "friendship", "family", "romance", "ambition",
  "decision", "future",
];

export const INTENT_TOPIC: Record<AskIntent, AskCategory> = {
  relocation: "plans", moving_home: "plans", travel: "plans", social_plans: "plans", fashion: "other",
  shopping: "money", money: "money", career: "career", interview: "career", exams: "career", ex: "romance",
  texting: "romance", romance: "romance", commitment: "romance", family: "other", friendship: "friendship",
  ambition: "other", self_doubt: "other", self_worth: "other", decision: "other", future: "other",
};

/** Below this, Sabrina isn't sure enough to answer. */
export const MIN_SCORE = 5;

/** "What's the capital of France?": facts about the world, not the asker's life. */
const TRIVIA = /^(?:what|whats|what's|who|when|where|how many|how much|how far|how old|which|define|translate)\b/;
const PERSONAL = /\b(?:i|i'm|im|i'll|me|my|mine|we|us|our)\b/;

export function questionForm(text: string): QuestionForm | null {
  if (/^(?:should|shall|do i|can i|could i|must i|ought|would it be|is it (?:a good idea|smart|worth|wise|okay|ok|time)|is now|am i ready)\b/.test(text)) return "should";
  if (/^(?:will|am i going to|am i gonna|are we going to|is (?:he|she|it|this|that|my|the)\b|are (?:they|we)\b|does|do (?:they|you think)|would (?:he|she|they)|is there|are there|when will|who will|where will|how will)\b/.test(text))
    return "will";
  if (/\bgoing to\b|\bgonna\b/.test(text)) return "will";
  return null;
}

/** True when a Latin-script token looks like a keyboard mash (no vowels, long consonant run, or a repeated letter). */
function isMashToken(token: string): boolean {
  if (!/^[a-z]+$/.test(token)) return false;
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

export type IntentScores = Record<AskIntent, number>;

/** Scores every intent; exported for tests and tuning. */
export function scoreIntents(text: string): IntentScores {
  const scores = {} as IntentScores;
  for (const intent of PRIORITY) scores[intent] = CUES[intent].reduce((sum, [re, w]) => sum + (re.test(text) ? w : 0), 0);
  return scores;
}

export function classifyQuestion(question: string): Classification {
  const text = normalizeQuestion(question);

  if (CRISIS.some((re) => re.test(text))) return { kind: "crisis" };
  for (const [topic, re] of SERIOUS) if (re.test(text)) return { kind: "serious", topic };
  if (isUnclear(text)) return { kind: "unclear" };

  // Swap a recognised place for "@place" so cues can say "move to @place".
  const found = findPlace(text);
  const marked = found ? `${text.slice(0, found.start)}@place${text.slice(found.end)}` : text;

  if (TRIVIA.test(marked) && !PERSONAL.test(marked)) return { kind: "confused", reason: "trivia" };

  const scores = scoreIntents(marked);
  let best: AskIntent | null = null;
  for (const intent of PRIORITY) if (scores[intent] > (best ? scores[best] : 0)) best = intent;
  if (!best || scores[best] < MIN_SCORE) return { kind: "confused", reason: "low_confidence", form: questionForm(text) };

  return { kind: "intent", intent: best, topic: INTENT_TOPIC[best], form: questionForm(text), place: found?.place ?? null, tags: questionTags(text), score: scores[best] };
}
