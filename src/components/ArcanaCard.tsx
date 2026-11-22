import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "plum" | "burgundy" | "blush";

const tones: Record<Tone, { card: string; numeral: string; body: string; cta: string; glyph: string }> = {
  plum: {
    card: "bg-plum text-cream on-dark",
    numeral: "text-gold",
    body: "text-cream/80",
    cta: "text-blush",
    glyph: "text-gold",
  },
  burgundy: {
    card: "bg-burgundy text-cream on-dark",
    numeral: "text-gold-soft",
    body: "text-cream/85",
    cta: "text-cream",
    glyph: "text-gold-soft",
  },
  blush: {
    card: "bg-blush text-plum",
    numeral: "text-burgundy",
    body: "text-plum/85",
    cta: "text-burgundy",
    glyph: "text-burgundy",
  },
};

type Props = {
  numeral: string;
  title: string;
  href: string;
  cta: string;
  tone: Tone;
  glyph: ReactNode;
  children: ReactNode;
};

/** A tarot-style card. The whole card is clickable via a stretched link. */
export function ArcanaCard({ numeral, title, href, cta, tone, glyph, children }: Props) {
  const t = tones[tone];
  return (
    <article className={`arch relative mx-auto flex w-full max-w-sm flex-col sm:max-w-none items-center px-7 pb-8 pt-12 text-center ${t.card}`}>
      <span className="arch-inner" aria-hidden="true" />
      <p className={`font-display text-xl ${t.numeral}`} aria-hidden="true">
        {numeral}
      </p>
      <div className={`mt-4 h-16 w-16 ${t.glyph}`}>{glyph}</div>
      <h3 className="mt-5 text-h3">{title}</h3>
      <p className={`mt-3 max-w-[28ch] ${t.body}`}>{children}</p>
      <Link
        href={href}
        className={`mt-6 font-semibold underline decoration-1 underline-offset-[6px] after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] ${t.cta}`}
      >
        {cta}
      </Link>
    </article>
  );
}
