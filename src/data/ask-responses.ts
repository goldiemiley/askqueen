/**
 * Sabrina's pre-written Ask Queen answers.
 *
 * Editorial rules (PRD §6): joke about situations and decisions, never about
 * identity, bodies, disability, nationality or race; don't state as fact what
 * a third party feels or does; no confident predictions about medical, legal,
 * financial or safety decisions. 1–3 sentences each.
 */
import type { AskCategory, AskResponse } from "@/types/content";
import type { SeriousTopic } from "@/features/ask/classify";

export const topicResponses: Record<AskCategory, AskResponse[]> = {
  romance: [
    { id: "rom-yes-1", category: "romance", stance: "yes", text: "The signs are pointing at them so hard it's embarrassing. Send the text, but read it twice first." },
    { id: "rom-yes-2", category: "romance", stance: "yes", text: "Venus is in your corner, which is more than I can say for your playlist.", nudge: "Lead with honesty, not a meme." },
    { id: "rom-yes-3", category: "romance", stance: "yes", text: "It's a yes. Somebody is thinking about you right now. Please try to be normal about it." },
    { id: "rom-no-1", category: "romance", stance: "no", text: "You already knew that, you just wanted a witch to say it out loud. Consider it said." },
    { id: "rom-no-2", category: "romance", stance: "no", text: "The stars say no, and honestly they've seen your texting style.", nudge: "Someone who's into you won't make you decode them." },
    { id: "rom-maybe-1", category: "romance", stance: "maybe", text: "The vibes are there, the effort isn't. Match their energy, don't chase it." },
    { id: "rom-maybe-2", category: "romance", stance: "maybe", text: "Murky. The crystal ball fogs up when you overthink this close to it." },
    { id: "rom-maybe-3", category: "romance", stance: "maybe", text: "Ask me again after they reply with more than one word." },
  ],
  career: [
    { id: "car-yes-1", category: "career", stance: "yes", text: "Walk in like the job already has your name on the mug." },
    { id: "car-yes-2", category: "career", stance: "yes", text: "The universe approves. Your inbox might too, if you actually press send." },
    { id: "car-yes-3", category: "career", stance: "yes", text: "And ask for more while you're at it. The stars negotiate hard.", nudge: "Bring receipts: what you did and what it changed." },
    { id: "car-no-1", category: "career", stance: "no", text: "Not this one, babe. The right thing won't need you to shrink to fit it." },
    { id: "car-no-2", category: "career", stance: "no", text: "The stars say no. This one's a lesson, not a destination. Take notes and move on." },
    { id: "car-maybe-1", category: "career", stance: "maybe", text: "Update your CV and your attitude, then ask me again." },
    { id: "car-maybe-2", category: "career", stance: "maybe", text: "Unclear. Mercury is doing something weird, and so is your calendar." },
    { id: "car-maybe-3", category: "career", stance: "maybe", text: "Possibly. The talent is there, the preparation is lagging. You know which one to fix." },
  ],
  friendship: [
    { id: "fri-yes-1", category: "friendship", stance: "yes", text: "Real friends survive a little honesty. Say the thing, gently." },
    { id: "fri-yes-2", category: "friendship", stance: "yes", text: "Babe, the group chat needs you, chaos and all." },
    { id: "fri-yes-3", category: "friendship", stance: "yes", text: "This friendship has main-cast energy. Treat it that way." },
    { id: "fri-no-1", category: "friendship", stance: "no", text: "If you're always the one making plans, you're not their friend, you're their events coordinator." },
    { id: "fri-no-2", category: "friendship", stance: "no", text: "The stars say no. Some people are seasons, not furniture." },
    { id: "fri-maybe-1", category: "friendship", stance: "maybe", text: "Ask them directly instead of asking a crystal ball. I'm flattered, but still." },
    { id: "fri-maybe-2", category: "friendship", stance: "maybe", text: "Unclear. Give it a coffee and an honest chat, then see how you feel." },
    { id: "fri-maybe-3", category: "friendship", stance: "maybe", text: "Hard to say. Even the stars can't follow a group chat with that many inside jokes." },
  ],
  plans: [
    { id: "pla-yes-1", category: "plans", stance: "yes", text: "Go. You'll regret the outfit, never the night." },
    { id: "pla-yes-2", category: "plans", stance: "yes", text: "The universe has cleared your schedule. Metaphorically. Please check your actual calendar." },
    { id: "pla-yes-3", category: "plans", stance: "yes", text: "Book it, babe, before your inner gremlin talks you out of it." },
    { id: "pla-no-1", category: "plans", stance: "no", text: "Stay in. The stars prescribe a blanket, snacks and not texting anyone." },
    { id: "pla-no-2", category: "plans", stance: "no", text: "Not this time. Your battery is at 4% and this plan needs 80." },
    { id: "pla-maybe-1", category: "plans", stance: "maybe", text: "Make a backup plan, then a backup for the backup. You know yourself." },
    { id: "pla-maybe-2", category: "plans", stance: "maybe", text: "Ask again when the weather forecast and your mood agree." },
    { id: "pla-maybe-3", category: "plans", stance: "maybe", text: "Fifty-fifty. Flip a coin and notice which side you were hoping for." },
  ],
  money: [
    { id: "mon-yes-1", category: "money", stance: "yes", text: "Treat yourself, within reason. The stars are generous, but your banking app is watching." },
    { id: "mon-yes-2", category: "money", stance: "yes", text: "It's a yes, as long as you'd still want it after a good night's sleep." },
    { id: "mon-yes-3", category: "money", stance: "yes", text: "Just don't spend it all on the way in, babe." },
    { id: "mon-no-1", category: "money", stance: "no", text: "Put it in the basket and walk away. If it's still calling you in a week, we'll talk." },
    { id: "mon-no-2", category: "money", stance: "no", text: "The stars say no. Your future self asked me to intervene." },
    { id: "mon-maybe-1", category: "money", stance: "maybe", text: "Check the price, check your budget, then check your ego." },
    { id: "mon-maybe-2", category: "money", stance: "maybe", text: "Unclear. The cosmos doesn't do refunds, babe." },
    { id: "mon-maybe-3", category: "money", stance: "maybe", text: "Possibly. Wait for payday and the vibes will clear right up." },
  ],
  other: [
    { id: "oth-yes-1", category: "other", stance: "yes", text: "I'm not entirely sure what you're asking, but I love the confidence." },
    { id: "oth-yes-2", category: "other", stance: "yes", text: "The universe says yes. Don't make it say it twice." },
    { id: "oth-yes-3", category: "other", stance: "yes", text: "Signs point to yes, and so does my gut." },
    { id: "oth-no-1", category: "other", stance: "no", text: "And I say that with love and very little explanation." },
    { id: "oth-no-2", category: "other", stance: "no", text: "The stars say no. They didn't elaborate. Neither will I." },
    { id: "oth-maybe-1", category: "other", stance: "maybe", text: "The answer lives somewhere between 'absolutely' and 'absolutely not'." },
    { id: "oth-maybe-2", category: "other", stance: "maybe", text: "Ask again later. I'm having a moment with Mercury." },
    { id: "oth-maybe-3", category: "other", stance: "maybe", text: "Unclear. Even I need more context, and I'm psychic." },
  ],
};

export const unclearResponses: AskResponse[] = [
  { id: "unc-1", category: "other", stance: "try_again", text: "Babe, be serious. That's not a question, that's a keyboard sneeze." },
  { id: "unc-2", category: "other", stance: "try_again", text: "I read tea leaves, not keysmashes. Try a real question." },
  { id: "unc-3", category: "other", stance: "try_again", text: "The crystal ball needs actual words. Give me a question with a little substance." },
  { id: "unc-4", category: "other", stance: "try_again", text: "I asked the stars and they asked me what you meant. Try again?" },
  { id: "unc-5", category: "other", stance: "try_again", text: "That's giving mystery, but not the fun kind. Rephrase it for me." },
  { id: "unc-6", category: "other", stance: "try_again", text: "Even I can't read that, and I read people for a living. Try a full question." },
];

/** "Not my department": Sabrina steps out of character for high-stakes topics. */
export const seriousResponses: Record<SeriousTopic, AskResponse[]> = {
  medical: [
    { id: "ser-med-1", category: "other", stance: "not_an_oracle", text: "A crystal ball isn't a doctor, babe. Please ask a medical professional about this one.", nudge: "If it's urgent, contact your local emergency number." },
    { id: "ser-med-2", category: "other", stance: "not_an_oracle", text: "I'm putting the sass down for this one. Your health deserves a real doctor or pharmacist, not a fictional witch." },
  ],
  legal: [
    { id: "ser-leg-1", category: "other", stance: "not_an_oracle", text: "This one needs a lawyer, not a reader. Please talk to someone qualified before you decide anything." },
    { id: "ser-leg-2", category: "other", stance: "not_an_oracle", text: "The stars aren't licensed to practise law, and neither am I. Get proper legal advice on this." },
  ],
  financial: [
    { id: "ser-fin-1", category: "money", stance: "not_an_oracle", text: "Big money decisions deserve a qualified financial adviser, not a crystal ball." },
    { id: "ser-fin-2", category: "money", stance: "not_an_oracle", text: "I'll roast your shopping basket all day, but I won't gamble with your savings. Talk to someone qualified first." },
  ],
  trust: [
    { id: "ser-tru-1", category: "romance", stance: "not_an_oracle", text: "I can't see what someone else is doing, babe, and I won't guess about something this big. If trust feels shaky, that deserves a real conversation." },
    { id: "ser-tru-2", category: "romance", stance: "not_an_oracle", text: "Not even a witch should accuse someone on a hunch. Trust what you can actually see, and talk to someone you trust about it." },
  ],
};

export const allAskResponses: AskResponse[] = [
  ...Object.values(topicResponses).flat(),
  ...unclearResponses,
  ...Object.values(seriousResponses).flat(),
];
