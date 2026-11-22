/**
 * Features that aren't finished stay off in the published site.
 * Compatibility: see src/features/compatibility/CompatibilityPage.tsx to turn it back on.
 */
export const features = {
  compatibility: false,
} as const;

export const site = {
  name: "AskQueen",
  wordmark: "askqueen.",
  tagline: "The universe has spoken, babe.",
  description:
    features.compatibility
      ? "Ask Sabrina anything, get your daily zodiac roast with a song to match, and check your compatibility. For entertainment only."
      : "Ask Sabrina anything and get your daily zodiac roast with a song to match. For entertainment only.",
} as const;

export type NavItem = {
  href: string;
  label: string;
  short: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/ask/", label: "Ask Queen", short: "Ask" },
  { href: "/daily/", label: "Daily roast", short: "Daily" },
  { href: "/compatibility/", label: "Compatibility", short: "Match" },
].filter((item) => features.compatibility || item.href !== "/compatibility/");

/** The readings, for footers and cross-links. */
export const readingItems = navItems.filter((item) => item.href !== "/");

export const infoItems: NavItem[] = [
  { href: "/about/", label: "About Sabrina", short: "About" },
  { href: "/privacy/", label: "Privacy", short: "Privacy" },
  { href: "/terms/", label: "Terms", short: "Terms" },
];

/** Normalises a pathname so "/ask" and "/ask/" compare equal. */
export function normalizePath(path: string): string {
  if (!path) return "/";
  return path.endsWith("/") ? path : `${path}/`;
}
