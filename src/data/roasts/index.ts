import type { Roast, ZodiacSign } from "@/types/content";
import { airRoasts } from "./air";
import { airRoastsMore } from "./air-more";
import { earthRoasts } from "./earth";
import { earthRoastsMore } from "./earth-more";
import { fireRoasts } from "./fire";
import { fireRoastsMore } from "./fire-more";
import { waterRoasts } from "./water";
import { waterRoastsMore } from "./water-more";

export const allRoasts: Roast[] = [
  ...fireRoasts,
  ...fireRoastsMore,
  ...earthRoasts,
  ...earthRoastsMore,
  ...airRoasts,
  ...airRoastsMore,
  ...waterRoasts,
  ...waterRoastsMore,
];

export function roastsForSign(sign: ZodiacSign): Roast[] {
  return allRoasts.filter((r) => r.sign === sign);
}
