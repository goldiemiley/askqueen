/**
 * Sabrina's Ask Queen answers, written per intent (see features/ask/classify).
 *
 * Editorial rules:
 * - Answer the question that was asked. A moving-abroad answer talks about
 *   moving abroad, never about outfits or nights out.
 * - Joke about situations and decisions, never about identity, bodies,
 *   nationality or race. {place} answers make no claims about the place itself.
 * - Playful verdicts, not guarantees: no facts, no promises about outcomes.
 * - Don't state as fact what someone else feels or does.
 * - The text never repeats the verdict heading ("Yes." / "No." / "Maybe.").
 * - forms: "will" answers fit predictions ("Will I…?"), "should" answers fit
 *   advice ("Should I…?"); no forms means it fits either.
 * - 1–3 sentences, under 280 characters.
 */
import { INTENT_TOPIC } from "@/features/ask/classify";
import type { AskIntent, AskResponse, AskStance, AskTag, QuestionForm } from "@/types/content";

type Opts = { forms?: QuestionForm[]; nudge?: string; tags?: AskTag[] };
const W: Opts = { forms: ["will"] };
const S: Opts = { forms: ["should"] };

function build(intent: AskIntent, prefix: string, rows: Array<[AskStance, string, Opts?]>): AskResponse[] {
  return rows.map(([stance, text, opts = {}], i) => ({
    id: `${prefix}-${i + 1}`,
    category: INTENT_TOPIC[intent],
    intent,
    stance,
    text,
    ...(opts.forms ? { forms: opts.forms } : {}),
    ...(opts.tags ? { tags: opts.tags } : {}),
    ...(text.includes("{place}") ? { usesPlace: true as const } : {}),
    ...(opts.nudge ? { nudge: opts.nudge } : {}),
  }));
}

const PAPERWORK = "Do the boring research too: costs, work and the official visa rules.";

export const intentAnswers: Record<AskIntent, AskResponse[]> = {
  relocation: build("relocation", "rel", [
    ["yes", "The signs point to {place}. Start practising how to order a coffee there without panicking.", W],
    ["yes", "I see a new postcode in your chart, babe. The boxes are already judging you.", W],
    ["yes", "{place} has a seat with your name on it. You'll still complain about the weather, wherever you land.", W],
    ["no", "Not this year. {place} isn't going anywhere, and apparently neither are you, yet.", W],
    ["no", "The stars see you staying put for now. Use the time to save, not to scroll moving videos at 2am.", W],
    ["maybe", "{place} is on your map. Whether you go depends on your savings, your nerve and your paperwork, in that order.", { ...W, nudge: PAPERWORK }],
    ["maybe", "There's a suitcase in your future, but it might be a long holiday rather than a new life. Price the flights and see how your stomach feels.", W],
    ["yes", "Go for {place}. The version of you who stays will be fine; the one who goes gets better stories.", { ...S, nudge: PAPERWORK }],
    ["yes", "Pack the brave version of you first. The rest fits in a suitcase.", { ...S, nudge: PAPERWORK }],
    ["no", "Not yet. Visit {place} first, ideally on a rainy Tuesday. If you still want it then, we'll talk.", S],
    ["no", "Not on a whim, babe. A bad week is not a relocation plan.", S],
    ["maybe", "Half yes. Try a month in {place} before you sign anything longer than a phone contract.", S],
    ["maybe", "Write two lists: what you'd miss and what you're running from. If the second one is longer, deal with that first.", S],
    ["yes", "A fresh start is written all over your chart. Start learning how to say sorry in a new language.", W],
    ["no", "Not yet. Your roots are holding on a little longer, and that isn't a bad thing.", W],
    ["yes", "Go. You can always come back, but you can't un-wonder.", { ...S, nudge: PAPERWORK }],
    ["no", "Not until you can name three reasons to go that aren't about escaping someone.", S],
  ]),

  moving_home: build("moving_home", "home", [
    ["yes", "Move out. Your future self wants a kitchen where nobody labels the milk.", S],
    ["yes", "Go. Home should feel like a sigh of relief, not a group project.", S],
    ["no", "Not yet. Do the maths on rent, deposit and the price of a fridge before you do the vibes.", S],
    ["no", "Stay for now. Moving out to avoid one awkward conversation is a very expensive way to avoid it.", S],
    ["maybe", "If you're asking a witch, you've probably outgrown the place. Check your budget, then trust the itch.", S],
    ["yes", "Signs point to new keys. Start saying no to free furniture from strangers now.", W],
    ["yes", "A new front door is coming, babe. Measure it before you buy the sofa.", W],
    ["no", "The stars see you staying put a little longer. Make the place nicer while you're there.", W],
    ["maybe", "There's a move in your chart, but the date is blurry. Keep one eye on listings and one on your bank balance.", W],
    ["maybe", "Pack one box. If it feels like freedom, keep going. If it feels like dread, unpack it and stay."],
  ]),

  travel: build("travel", "trv", [
    ["yes", "Book {place}. You'll forget the price and remember the view.", S],
    ["yes", "Go to {place} and do at least one thing that isn't on any list online.", S],
    ["yes", "Go. Collect stories, not fridge magnets (one fridge magnet is allowed).", S],
    ["no", "Not this time. {place} deserves your full attention, not a weekend squeezed between deadlines.", S],
    ["no", "Not right now. Rest first; a trip you're too tired to enjoy is just expensive napping.", S],
    ["maybe", "{place}, or somewhere you haven't thought of yet? Check the dates before the daydreams.", S],
    ["maybe", "Go if you're running towards something, not just away from your inbox.", S],
    ["yes", "I see you in {place}, overpacked and very happy about it.", W],
    ["yes", "Signs point to a boarding pass. Please buy a neck pillow this time.", W],
    ["no", "The stars see a staycation. Make it a good one and let the savings grow.", W],
    ["maybe", "{place} is in your stars, but the timing is fuzzy. Start a savings jar with its name on it.", W],
    ["maybe", "There's a trip on the horizon. Whether it's this year depends on your bank balance and your annual leave.", W],
    ["yes", "A passport stamp is in your near future. Pack less than you think you need.", W],
    ["maybe", "There's a getaway coming, even if it's only a long weekend somewhere with good coffee.", W],
    ["yes", "Book it before you talk yourself out of it. Future you will thank present you from a sunlounger.", S],
    ["no", "Not this time. Sort the budget first, then go somewhere you won't check prices every five minutes.", S],
  ]),

  social_plans: build("social_plans", "soc", [
    ["yes", "Go. You'll regret the outfit, never the night.", S],
    ["yes", "Go out. Even if it's mid, you'll have something to talk about tomorrow.", S],
    ["yes", "Say yes to the plan. Main characters don't stay home every single weekend.", S],
    ["no", "Stay in. The stars prescribe a blanket, snacks and not texting anyone.", S],
    ["no", "Not tonight. Your social battery is at 4% and this plan needs 80.", S],
    ["maybe", "Go for one drink. If the vibe is off, leave like a cat: no announcement.", S],
    ["yes", "It's going to be a good one. Charge your phone and drink some water between the fun.", W],
    ["no", "The stars see an early night. Your future self says thank you.", W],
    ["maybe", "Fifty-fifty. The whole night depends on who's in charge of the music.", W],
    ["maybe", "Make a backup plan, then a backup for the backup. You know yourself."],
  ]),

  fashion: build("fashion", "fsh", [
    ["yes", "Wear it. Confidence is the only accessory anyone actually remembers.", { ...S, tags: ["clothes"] }],
    ["yes", "Go bold. Nobody remembers the person who played it safe.", S],
    ["yes", "It's hair, babe. It grows back. Go wild.", { ...S, tags: ["hair"] }],
    ["no", "Skip it. Never make a big hair decision after a breakup or after midnight.", { ...S, tags: ["hair"] }],
    ["yes", "Get it, but live with the design for two weeks first. If you still love it, it's yours forever.", { ...S, tags: ["ink"] }],
    ["no", "Not yet. Never get ink to mark something that happened this month.", { ...S, tags: ["ink"] }],
    ["maybe", "Pick the artist before the design. A great artist makes a so-so idea look intentional.", { ...S, tags: ["ink"] }],
    ["yes", "It'll heal, you'll love it, and you'll start planning the next one. Classic.", { ...W, tags: ["ink"] }],
    ["no", "Not that one, babe. If you have to ask a witch, you already have doubts about it.", S],
    ["maybe", "Try it on, take a photo, wait an hour. If you still like it, that's your answer.", { ...S, tags: ["clothes"] }],
    ["maybe", "Ask your most honest friend, not your nicest one.", S],
    ["yes", "You'll pull it off. The trick is acting like you meant to.", W],
    ["no", "The stars aren't sold on it, and neither is the future you scrolling back through the photos.", W],
    ["yes", "It'll suit you, mostly because you'll stop fidgeting with it after ten minutes.", W],
    ["maybe", "Trends fade, photos don't. Go with what you'd still like in five years."],
  ]),

  shopping: build("shopping", "shp", [
    ["yes", "Treat yourself, within reason. The stars are generous, but your banking app is watching.", S],
    ["yes", "Get it if you'd still want it after a good night's sleep.", S],
    ["yes", "Buy it. If you'll use it every week, it's not a splurge, it's a tool.", S],
    ["no", "Put it in the basket and walk away. If it's still calling you in a week, we'll talk.", S],
    ["no", "Not today. Your future self asked me to intervene.", S],
    ["no", "Skip it. You probably own something almost identical with the tags still on.", { ...S, tags: ["clothes"] }],
    ["maybe", "Check the price, check your budget, then check your ego.", S],
    ["maybe", "Wait for payday and the vibes will clear right up.", S],
    ["yes", "It's coming home with you. We both know it. Just check the returns policy first.", W],
    ["no", "You'll want it less tomorrow. Sleep on it and see.", W],
    ["maybe", "It might be in your future, just at a better price.", W],
    ["maybe", "Would you buy it at full price? If not, the sale is shopping you, not the other way round."],
  ]),

  money: build("money", "mon", [
    ["yes", "Save it. Future you is a real person with real bills.", S],
    ["yes", "Pay the boring thing first, then have your fun. The order matters.", S],
    ["no", "Don't lend what you can't afford to lose. That goes for money and for patience.", { ...S, tags: ["lend"] }],
    ["maybe", "Only lend what you'd be fine calling a gift. Friendship and IOUs are a messy mix.", { ...S, tags: ["lend"] }],
    ["yes", "If they've paid you back before, help them out. If they haven't, you already know.", { ...S, tags: ["lend"] }],
    ["no", "Not this month. If you have to check your balance twice, the answer is in the balance.", S],
    ["maybe", "Write down where your money went last month. Then ask me again, if you dare.", S],
    ["yes", "Things look brighter money-wise. Don't spend it all celebrating.", W],
    ["no", "The stars see a quiet month for your wallet. Budget like a Virgo, even if you aren't one.", W],
    ["yes", "I see more money in your future. Not yacht money, but nice-dinner-without-checking-the-price money.", W],
    ["maybe", "Rich in what, babe? Money comes slowly to people who save boringly. Start boring.", W],
    ["no", "Not lottery-rich, sorry. Comfortable is on the cards if you stop buying things at midnight.", W],
    ["maybe", "Money's coming in and going out at about the same speed. Fix the leak first.", W],
    ["maybe", "It's not about the amount, it's about whether you'll still be thinking about it at 3am.", { nudge: "For big money decisions, talk to someone qualified." }],
  ]),

  career: build("career", "car", [
    ["yes", "A job in {place} is on the cards. Make sure your CV says loudly where you want to be.", W],
    ["maybe", "{place} has jobs and you have a CV. Introduce them, often.", W],
    ["yes", "Signs point to good news at work. Your inbox might agree, if you actually press send.", W],
    ["no", "Not this time. Treat it as a rehearsal, take notes and go again.", W],
    ["maybe", "Possibly. The talent is there, the follow-up isn't. Chase it, politely.", W],
    ["yes", "Something good is lining up at work. Check your inbox, including the spam folder.", W],
    ["maybe", "It depends on the follow-up email you haven't sent yet. Send it.", W],
    ["yes", "Look for work in {place}. The stars like a person with a plan and a translated CV.", S],
    ["yes", "Apply like the job already has your name on the mug.", { ...S, tags: ["jobhunt"] }],
    ["yes", "Go for it. The version of you who tries is more interesting than the one who wonders.", S],
    ["maybe", "Ask what it gives you in a year, not just next month. Then decide.", S],
    ["no", "Not on a hunch. Write the plan down; if it survives a week of your own doubts, go.", S],
    ["yes", "Ask for more. The worst they can say is no, and you'll still have the job you've got.", { ...S, tags: ["raise"], nudge: "Bring receipts: what you did and what it changed." }],
    ["no", "Not this one, babe. The right job won't need you to shrink to fit it.", S],
    ["no", "Don't quit in a rage. Quit with a plan, a date and some savings.", { ...S, tags: ["quit"] }],
    ["maybe", "Update your CV and your attitude, then ask me again.", { ...S, tags: ["jobhunt", "quit"] }],
    ["maybe", "List what you'd miss and what you wouldn't. If the second list is longer, start looking.", { ...S, tags: ["quit"] }],
  ]),

  interview: build("interview", "int", [
    ["yes", "You'll walk in nervous and walk out impressive. That's the usual order.", W],
    ["yes", "Signs point to a callback. Have an answer ready for 'Where do you see yourself in five years?'", W],
    ["no", "This one might not be the one, but the practice will be. Every interview is a dress rehearsal.", W],
    ["maybe", "It comes down to the last ten minutes. Ask them one really good question back.", W],
    ["yes", "Take the interview. Even if you don't want the job, you want the confidence.", S],
    ["no", "If you already know you don't want it, don't waste a good outfit on it.", S],
    ["maybe", "Prepare three stories about problems you fixed. The stars can't do that part for you."],
    ["yes", "Research them like you'd research an ex, wear what makes you feel employable, and breathe."],
  ]),

  exams: build("exams", "exm", [
    ["yes", "You'll pass, babe, as long as tonight is for revision and not for 'research' on your phone.", W],
    ["yes", "Signs point to a pass. Celebrate after, not before.", W],
    ["yes", "Your brain knows more than it thinks. Sleep tonight; it files things while you snooze.", W],
    ["no", "Not if you keep asking me instead of opening your notes. Go. Now.", W],
    ["maybe", "It's close. The difference is one more practice paper.", W],
    ["maybe", "It depends on what you send and how well you proofread it. Read it twice, then press submit.", { ...W, tags: ["apply"] }],
    ["yes", "Signs point to an acceptance letter. Keep your inbox tidy for it.", { ...W, tags: ["apply"] }],
    ["yes", "Send the application. They can't say yes to something they never receive.", { ...S, tags: ["apply"] }],
    ["yes", "Study first, panic later. Actually, skip the panic.", S],
    ["no", "Don't pull an all-nighter. Tired you can't read the question, let alone answer it.", S],
    ["maybe", "Start with the topic you're avoiding. That's where the marks are hiding.", S],
    ["yes", "The grade isn't the whole story, but this time it's a good chapter."],
  ]),

  ex: build("ex", "ex", [
    ["no", "Babe, even recycling has its limits.", W],
    ["no", "The stars say no, and honestly the stars sound relieved.", W],
    ["yes", "Signs point to a 'hey stranger'. Read it, breathe, and remember why it ended.", W],
    ["maybe", "They might come back around. The real question is whether you'll still be standing in the same spot.", W],
    ["no", "Your ex might text. That doesn't mean you have to answer like it's breaking news.", W],
    ["no", "Leave the ex in the past. They're an ex for a reason, and the reason had receipts.", S],
    ["no", "Don't text first. Your thumbs have made enough decisions.", { ...S, tags: ["text"] }],
    ["maybe", "Only if it's closure, not a sequel. Be honest about which one you want.", S],
    ["yes", "If something unsaid is keeping you stuck, say it once, kindly, then close the door.", S],
    ["maybe", "Missing someone isn't the same as wanting them back. Sit with that before you do anything."],
  ]),

  texting: build("texting", "txt", [
    ["yes", "Signs point to a reply. Please don't answer within four seconds.", W],
    ["yes", "Your phone is about to light up. Try to act surprised.", W],
    ["no", "If they wanted to, they would. The stars won't do the chasing for them.", W],
    ["maybe", "They'll reply when they reply. Put your phone in another room and watch time fly.", W],
    ["maybe", "There's a message in your future, but it might be from your bank.", W],
    ["yes", "Text them. Short, clear, no essay. This is not a dissertation.", S],
    ["yes", "Make the first move. Worst case, you get a story. Best case, you get a date.", S],
    ["no", "Don't double text. Your message was delivered; it isn't lost at sea.", S],
    ["no", "Not tonight. Nothing good was ever sent after midnight.", S],
    ["maybe", "Write it, wait an hour, read it out loud. If you cringe, delete it.", S],
  ]),

  romance: build("romance", "rom2", [
    ["yes", "The signs are pointing at them so hard it's embarrassing. Please be normal about it.", W],
    ["yes", "Somebody is thinking about you right now. Try to stay calm.", W],
    ["yes", "Love is on its way, but it's taking the scenic route. Keep living your life meanwhile.", W],
    ["no", "You already knew that, you just wanted a witch to say it out loud. Consider it said.", W],
    ["no", "Not this one, babe. Someone who's into you won't make you decode them.", W],
    ["maybe", "The vibes are there, the effort isn't. Match their energy, don't chase it.", W],
    ["maybe", "Ask me again after they reply with more than one word.", W],
    ["yes", "Ask them out. Rejection lasts a day, wondering lasts a year.", S],
    ["yes", "Tell them how you feel. In words, not in song lyrics posted to your story.", S],
    ["no", "If you have to convince yourself, it's not a crush, it's a project.", S],
    ["maybe", "Spend time with them in daylight, sober, with friends around. Then ask me again.", S],
    ["maybe", "Murky. The crystal ball fogs up when you overthink this close to it."],
  ]),

  commitment: build("commitment", "com", [
    ["yes", "Signs point to a ring someday. Please don't let anyone propose at a sports game.", { ...W, tags: ["propose"] }],
    ["maybe", "There's commitment in your future, but the timeline is yours, not your aunt's.", W],
    ["no", "Not soon. Enjoy the part where you're still learning their coffee order.", W],
    ["yes", "If you're asking how rather than whether, you already know.", { ...S, tags: ["propose"] }],
    ["yes", "Move in together, but keep one drawer that's only yours. Trust me.", { ...S, tags: ["move_in"] }],
    ["no", "Not yet. Survive one full holiday season and one flat-pack wardrobe together first.", { ...S, tags: ["move_in"] }],
    ["no", "Don't rush it. Marriage is a lot of ordinary Tuesdays, not one big Saturday.", { ...S, tags: ["propose"] }],
    ["maybe", "Have the boring talks first: money, chores, kids, where you'd live. Then the romantic one.", S],
    ["maybe", "Love's the easy part. Ask yourself whether you like them on a bad day."],
  ]),

  family: build("family", "fam", [
    // Kids: never a prediction, only "your timeline, your call".
    ["maybe", "The stars don't schedule family plans. That's between you, your people and your timing.", { tags: ["kids"] }],
    ["maybe", "That's your story to write, on your timeline, with whoever you choose. No crystal ball gets a vote.", { tags: ["kids"] }],
    ["maybe", "Whatever you decide about that, it should be what you want, not what the group chat expects.", { tags: ["kids"] }],
    ["maybe", "Some futures aren't mine to call, babe. This one belongs to you and whoever you build it with.", { tags: ["kids"] }],
    // Parents, siblings and the rest
    ["yes", "There's more warmth in your family's future than this week suggests.", { ...W, tags: ["relatives"] }],
    ["no", "Not this week, but family weather changes fast. Keep the door open.", { ...W, tags: ["relatives"] }],
    ["yes", "There's a good conversation coming with someone you love. Let it happen.", { ...W, tags: ["relatives"] }],
    ["maybe", "Family is above my pay grade, so here's the sass-free version: talk to them, honestly and kindly.", { tags: ["relatives"] }],
    ["yes", "Call them. Whatever it is, it lands better out loud than in a group chat.", { ...S, tags: ["relatives"] }],
    ["no", "Don't decide this while you're angry. Family arguments age like milk.", { ...S, tags: ["relatives"] }],
    ["maybe", "Set the boundary kindly and clearly, then hold it, even when someone sighs.", { ...S, tags: ["relatives"] }],
  ]),

  friendship: build("friendship", "fri2", [
    ["yes", "Real friends survive a little honesty. Say the thing, gently.", S],
    ["no", "Don't vent about them in the group chat. Screenshots are forever.", S],
    ["maybe", "Ask them directly instead of asking a crystal ball. I'm flattered, but still.", S],
    ["yes", "Babe, the group chat needs you, chaos and all.", W],
    ["yes", "You'll make up. One of you just has to blink first. Make it you.", W],
    ["no", "Some people are seasons, not furniture.", W],
    ["maybe", "Hard to say. Even the stars can't follow a group chat with that many inside jokes.", W],
    ["yes", "This friendship has main-cast energy. Treat it that way."],
    ["no", "If you're always the one making plans, you're not their friend, you're their events coordinator."],
    ["maybe", "Give it a coffee and an honest chat, then see how you feel."],
  ]),

  ambition: build("ambition", "amb", [
    ["yes", "Fame is in your chart. Start practising a humble face for interviews.", W],
    ["yes", "Big things are coming, but the stars need you to actually post the thing.", W],
    ["no", "Not overnight, babe. Overnight success usually took ten years and nobody filmed the boring part.", W],
    ["maybe", "Famous to whom? Your mum already thinks you're a star. Work outwards from there.", W],
    ["maybe", "Success looks likely. Fame is a coin toss. Decide which one you actually want.", W],
    ["yes", "Go for it. The only bad version is the one you never tried.", S],
    ["no", "Don't quit everything for it yet. Build it on the side until it's loud enough to hear.", S],
    ["maybe", "Chase it, but keep the day job until the dream pays the rent.", S],
    ["yes", "Dream big, then write the first tiny step on a sticky note. Do that one today."],
  ]),

  self_doubt: build("self_doubt", "sd", [
    ["no", "Babe. I roast people for a living, and I'm telling you: you're not."],
    ["no", "Your brain is being a terrible narrator tonight. Don't let it write the whole book."],
    ["no", "The stars checked. You're just tired, and tired lies.", { nudge: "If this feeling sticks around, talk to someone you trust." }],
    ["no", "Not even close. Talk to yourself the way you'd talk to your best friend, then ask again."],
    ["no", "It's a feeling, not a fact. Everyone has nights like this."],
    ["no", "If you were, you wouldn't be worrying about it. That's how this works."],
  ]),

  self_worth: build("self_worth", "sw", [
    ["yes", "Obviously. I'm a witch, not a liar."],
    ["yes", "And I don't hand those out for free. Write it down somewhere you'll see it."],
    ["yes", "More than you think. Your harshest critic lives rent-free in your head; evict them."],
    ["yes", "Someone will, and the first someone should be you. Corny, but the stars insisted.", { nudge: "If you're feeling low, talk to someone you trust." }],
    ["yes", "You're asking a crystal ball for reassurance, which is adorable. And also, yes."],
  ]),

  decision: build("decision", "dec", [
    ["yes", "Do it. If your gut wasn't already leaning yes, you wouldn't be asking a witch.", S],
    ["yes", "Go for it. Future you is tired of hearing about this.", S],
    ["yes", "Take the leap, but look where you're landing first.", S],
    ["no", "Not yet. A decision made in a rush is a decision made by your mood.", S],
    ["no", "Wait a day. If it still feels right tomorrow, it probably is.", S],
    ["maybe", "Flip a coin and notice which side you were hoping for. That's your answer.", S],
    ["maybe", "What would you tell a friend who asked this? Take your own advice.", S],
    ["maybe", "There's no wrong answer here, only a slightly different plot."],
  ]),

  future: build("future", "fut", [
    ["yes", "It's going to be fine. Better than fine, once you stop checking the forecast every hour.", W],
    ["yes", "Signs point to a good stretch. Notice it when it arrives.", W],
    ["yes", "It'll work out, maybe not the way you planned. The stars love a plot twist.", W],
    ["yes", "Luck is on your side this week. Spend it on something that matters.", W],
    ["yes", "Happiness is in your chart. It's in the small stuff, so look down as well as ahead.", W],
    ["no", "Not today, but today isn't the whole story. Tomorrow has a better script.", W],
    ["maybe", "The future is still loading. Be nice to it and it'll be nice back.", W],
    ["maybe", "Half the future is what happens to you. The other half is what you do about it."],
  ]),
};

/** Sabrina isn't sure what was asked: she says so instead of guessing. */
export const confusedAnswers: AskResponse[] = build("future", "cnf", [
  ["try_again", "Babe, my crystal ball is confused. Give me a little more detail."],
  ["try_again", "I'm getting static. Tell me who, what or where and I'll do my best witchery."],
  ["try_again", "The stars need a bit more to go on. What exactly are you deciding?"],
  ["try_again", "I'd rather not guess and get it wrong. Ask it as a yes-or-no question about your life."],
  ["try_again", "Ooh, mysterious. Too mysterious. Add the juicy detail and ask again."],
  ["try_again", "My cards came out blank. Try 'Should I…' or 'Will I…' with the important part included."],
]).map((r) => ({ ...r, intent: undefined, category: "other" as const }));

/** Factual quiz questions: not her department. */
export const triviaAnswers: AskResponse[] = build("future", "tri", [
  ["try_again", "I predict vibes, not facts. Ask a search engine, then come back and ask me how to feel about it."],
  ["try_again", "Babe, I'm an oracle, not a quiz show. Ask me something about your life."],
  ["try_again", "Facts aren't my department. Fortunes are. Try a question about you."],
]).map((r) => ({ ...r, intent: undefined, category: "other" as const }));

/**
 * Classic magic-ball answers that fit any personal question. They are mixed
 * in with the topic answers for variety, and answer everyday questions
 * Sabrina can't place. They never mention a topic, place or person, so they
 * can't land on the wrong subject. "will" ones predict, "should" ones advise.
 */
export const generalAnswers: AskResponse[] = build("future", "gen", [
  ["yes", "Signs point to yes, babe."],
  ["yes", "It is certain. I'd bet my crystal ball on it."],
  ["yes", "Without a doubt. The stars didn't even need a meeting about this one."],
  ["yes", "Absolutely, and I'm a little jealous."],
  ["yes", "My crystal ball just did a happy little sparkle."],
  ["yes", "Outlook good. Very good. Suspiciously good, actually."],
  ["yes", "The universe says yes. Don't make it repeat itself."],
  ["yes", "All the cards came up hearts. Make of that what you will."],
  ["yes", "Count on it, babe. Act surprised when it happens."],
  ["yes", "Mercury is behaving and the moon is in a good mood. That's a yes."],
  ["yes", "It's a yes. Screenshot this for when you doubt yourself.", W],
  ["yes", "Most likely. The stars are already gossiping about it.", W],
  ["yes", "I see it happening. Possibly sooner than you'd like.", W],
  ["yes", "That's in your future. I'd start practising your humble face.", W],
  ["yes", "Do it. Future you is already saying thank you.", S],
  ["yes", "Go on. You were going to anyway, I'm just making it official.", S],
  ["yes", "Stop asking the ball and start asking yourself why you're waiting.", S],
  ["yes", "Absolutely. Main character energy, please.", S],
  ["no", "My sources say no. My sources are very dramatic, but still."],
  ["no", "Don't count on it, babe."],
  ["no", "Outlook not so good. Outlook, frankly, a bit grey."],
  ["no", "The stars said no and then went quiet. Awkward."],
  ["no", "Very doubtful. Even my crystal ball raised an eyebrow."],
  ["no", "Doesn't look like it, and honestly? It's a blessing in disguise."],
  ["no", "The cards say no. One of them laughed."],
  ["no", "Not in this timeline, babe."],
  ["no", "Not happening, at least not the way you're picturing it.", W],
  ["no", "I don't see it. I looked twice, I promise.", W],
  ["no", "Not this one. Something better is queued up behind it.", W],
  ["no", "Skip it. Your peace is worth more.", S],
  ["no", "Don't. Sleep on it and ask me again tomorrow.", S],
  ["no", "Put the phone down and take a breath. The answer is no.", S],
  ["no", "Hard pass. Even the moon said ew.", S],
  ["maybe", "Reply hazy. Ask again after a snack."],
  ["maybe", "Cannot predict now. The stars are on their lunch break."],
  ["maybe", "Better not tell you now. Suspense is good for you."],
  ["maybe", "Concentrate and ask again. Dramatically, if possible."],
  ["maybe", "It's a maybe, babe. Maybes are just yeses that need a pep talk."],
  ["maybe", "The ball is spinning. Even it can't decide."],
  ["maybe", "Fifty-fifty, and the other fifty is up to you."],
  ["maybe", "My crystal ball is buffering. Strong vibes, weak signal."],
  ["maybe", "Possibly. The universe left you on read for now."],
  ["maybe", "Too close to call. Flip a coin and notice which side you're hoping for."],
  ["maybe", "Could go either way. Keep your options and your chin up.", W],
  ["maybe", "Not yet decided up there. You still get a vote.", W],
  ["maybe", "Only if you actually want it, and I think you're not sure yet.", S],
  ["maybe", "Ask your gut, then ask your best friend. If they agree, that's your answer.", S],
]).map((r) => ({ ...r, intent: undefined, category: "other" as const }));
