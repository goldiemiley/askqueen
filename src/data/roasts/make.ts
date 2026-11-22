import type { Roast, RoastTheme, ZodiacSign } from "@/types/content";

/** Compact constructor so the roast files stay readable. */
export function r(
  id: string,
  sign: ZodiacSign,
  theme: RoastTheme,
  gentle: string,
  savage: string,
  unhinged: string,
): Roast {
  return { id, sign, theme, variants: { gentle, savage, unhinged } };
}
