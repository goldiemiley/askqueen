/**
 * Conventional tropical sun-sign date ranges (inclusive). Sources differ by a
 * day around the edges and real cusps shift slightly by year, so the UI calls
 * this a simplified sun-sign calculation, not a natal chart.
 */
import type { SignProfile, ZodiacSign } from "@/types/content";

export const SIGN_PROFILES: SignProfile[] = [
  { sign: "aries", displayName: "Aries", start: { month: 3, day: 21 }, end: { month: 4, day: 19 }, element: "fire", vibe: "Starts fires. Mostly metaphorical." },
  { sign: "taurus", displayName: "Taurus", start: { month: 4, day: 20 }, end: { month: 5, day: 20 }, element: "earth", vibe: "Comfort, snacks and a very firm opinion." },
  { sign: "gemini", displayName: "Gemini", start: { month: 5, day: 21 }, end: { month: 6, day: 20 }, element: "air", vibe: "Two moods, forty tabs, one group chat." },
  { sign: "cancer", displayName: "Cancer", start: { month: 6, day: 21 }, end: { month: 7, day: 22 }, element: "water", vibe: "Soft shell, softer heart, long memory." },
  { sign: "leo", displayName: "Leo", start: { month: 7, day: 23 }, end: { month: 8, day: 22 }, element: "fire", vibe: "Main character. Has the lighting to prove it." },
  { sign: "virgo", displayName: "Virgo", start: { month: 8, day: 23 }, end: { month: 9, day: 22 }, element: "earth", vibe: "Helpful, organised, quietly judging the font." },
  { sign: "libra", displayName: "Libra", start: { month: 9, day: 23 }, end: { month: 10, day: 22 }, element: "air", vibe: "Charming, balanced, can't choose a restaurant." },
  { sign: "scorpio", displayName: "Scorpio", start: { month: 10, day: 23 }, end: { month: 11, day: 21 }, element: "water", vibe: "Knows your secrets. Keeps its own." },
  { sign: "sagittarius", displayName: "Sagittarius", start: { month: 11, day: 22 }, end: { month: 12, day: 21 }, element: "fire", vibe: "Already halfway out the door. Lovingly." },
  { sign: "capricorn", displayName: "Capricorn", start: { month: 12, day: 22 }, end: { month: 1, day: 19 }, element: "earth", vibe: "Works hard, rests reluctantly." },
  { sign: "aquarius", displayName: "Aquarius", start: { month: 1, day: 20 }, end: { month: 2, day: 18 }, element: "air", vibe: "Different on purpose, kind by accident." },
  { sign: "pisces", displayName: "Pisces", start: { month: 2, day: 19 }, end: { month: 3, day: 20 }, element: "water", vibe: "Lives half in a daydream. The good half." },
];

export const signProfileById: Record<ZodiacSign, SignProfile> = Object.fromEntries(
  SIGN_PROFILES.map((p) => [p.sign, p]),
) as Record<ZodiacSign, SignProfile>;
