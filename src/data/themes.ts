/** The eight emotional themes from the PRD, with Sabrina's song explanations. */
import type { RoastTheme, ThemeDefinition } from "@/types/content";

export const THEMES: ThemeDefinition[] = [
  {
    id: "romantic_denial",
    label: "Romantic denial",
    description: "Pretending you don't care, loudly.",
    songReasons: [
      "\"{title}\" is for the feelings you keep insisting you don't have.",
      "Your denial deserves a soundtrack, so Sabrina picked \"{title}\".",
      "\"{title}\": for being totally fine while checking your phone every four minutes.",
      "\"{title}\" is for pretending you're not waiting for a reply.",
      "Sabrina picked \"{title}\" because your \"I don't care\" needs a beat.",
      "\"{title}\": the official song of \"it's not a crush, it's an interest\".",
      "Press play on \"{title}\" and stop checking whether they're online.",
    ],
  },
  {
    id: "confidence",
    label: "Main-character energy",
    description: "Confidence: too much of it, or not quite enough.",
    songReasons: [
      "\"{title}\" is walk-in music for the version of you that doesn't ask permission.",
      "Play \"{title}\" and strut somewhere. The kitchen counts.",
      "Today's confidence needs a bassline, and \"{title}\" has one.",
      "\"{title}\" is your permission slip to take up space.",
      "Put on \"{title}\" and walk like the pavement is your runway.",
      "Your hype person is busy, so \"{title}\" will do the job.",
      "\"{title}\" is for the mirror pep talk you're definitely about to give.",
    ],
  },
  {
    id: "burnout",
    label: "Burnout",
    description: "Running on fumes, caffeine and stubbornness.",
    songReasons: [
      "\"{title}\" is for the part of you that's been running on fumes since Tuesday.",
      "Sabrina chose \"{title}\" so you can lie on the floor with intention.",
      "\"{title}\": a reminder that rest isn't a reward. It's maintenance.",
      "\"{title}\" is a lie-down disguised as a song.",
      "Sabrina picked \"{title}\" because your to-do list can wait three minutes.",
      "\"{title}\": put the kettle on and let this one carry you for a bit.",
      "Press play on \"{title}\" and do absolutely nothing until it ends.",
    ],
  },
  {
    id: "chaos",
    label: "Beautiful chaos",
    description: "Emotions on shuffle, plans in pieces.",
    songReasons: [
      "\"{title}\" matches your brain's current tab situation.",
      "Chaos deserves a theme song, and today it's \"{title}\".",
      "\"{title}\" is for dancing through a day that refuses to follow the plan.",
      "\"{title}\" pairs perfectly with forty open tabs.",
      "The plan left but the vibes stayed, so Sabrina picked \"{title}\".",
      "\"{title}\" is for turning a messy day into a montage.",
      "Play \"{title}\" loudly and pretend the chaos was choreographed.",
    ],
  },
  {
    id: "boundaries",
    label: "Boundaries",
    description: "Saying no, letting go, protecting your peace.",
    songReasons: [
      "\"{title}\" is a polite but firm \"no\", set to music.",
      "Sabrina picked \"{title}\" so you can practise saying \"no\" out loud.",
      "\"{title}\", because your peace is not a group project.",
      "\"{title}\" is for leaving the group chat on \"seen\" with dignity.",
      "\"No\" is a complete sentence, and \"{title}\" is its theme tune.",
      "\"{title}\": play it on your way out of the plan you never wanted.",
      "\"{title}\" is your soundtrack for finally asking for your things back.",
    ],
  },
  {
    id: "yearning",
    label: "Yearning",
    description: "Missing somewhere, someone or some time.",
    songReasons: [
      "\"{title}\" is for staring out of a window like you're in a music video.",
      "Your yearning has been very loud today, so \"{title}\" will keep it company.",
      "\"{title}\": for missing something you can't quite name.",
      "\"{title}\" is for the bus-window daydream you're about to have.",
      "Nostalgia hits harder with a melody, so Sabrina picked \"{title}\".",
      "\"{title}\": for missing someone and blaming the weather.",
      "Play \"{title}\", miss it properly, then go and make something new.",
    ],
  },
  {
    id: "ambition",
    label: "Ambition",
    description: "Big plans and an even bigger to-do list.",
    songReasons: [
      "\"{title}\" is the soundtrack for finally starting the thing.",
      "Your ambition needs something to march to, so Sabrina picked \"{title}\".",
      "Step one: press play on \"{title}\". Step two is the actual work.",
      "\"{title}\" is for the first five minutes of the thing you keep putting off.",
      "Your goals need a soundtrack and a deadline. \"{title}\" is the soundtrack.",
      "\"{title}\": montage music for your next big move.",
      "Play \"{title}\" and open the document you've been avoiding.",
    ],
  },
  {
    id: "self_reflection",
    label: "Self-reflection",
    description: "A long look in the mirror, with good lighting.",
    songReasons: [
      "\"{title}\" is for a quiet, honest moment with yourself.",
      "Your inner monologue has been busy, so Sabrina picked \"{title}\" to keep it company.",
      "\"{title}\", because today the main character is the one in the mirror.",
      "\"{title}\" is for an honest chat with yourself, no judgement.",
      "Sabrina picked \"{title}\" for the thinking you do in the shower.",
      "\"{title}\": a gentle mirror with a good beat.",
      "Play \"{title}\" and notice how far you've come.",
    ],
  },
];

export const themeById: Record<RoastTheme, ThemeDefinition> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<RoastTheme, ThemeDefinition>;
