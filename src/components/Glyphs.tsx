/** Small gold line glyphs used on the tarot-style feature cards. */

type GlyphProps = { className?: string };

export function OrbGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="32" cy="28" r="17" />
      <path d="M22 23 c4-6 10-7 14-6" strokeLinecap="round" />
      <path d="M20 46 h24 l4 8 H16 z" strokeLinejoin="round" />
      <path d="M32 4 v4 M50 12 l-3 3 M14 12 l3 3" strokeLinecap="round" />
    </svg>
  );
}

export function SunMoonGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="32" cy="32" r="12" />
      <path d="M38 23 a10 10 0 1 0 0 18 a8 8 0 1 1 0 -18z" fill="currentColor" stroke="none" opacity="0.9" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        const x1 = 32 + Math.cos(a) * 18;
        const y1 = 32 + Math.sin(a) * 18;
        const x2 = 32 + Math.cos(a) * (i % 2 ? 23 : 27);
        const y2 = 32 + Math.sin(a) * (i % 2 ? 23 : 27);
        return <path key={i} d={`M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}`} strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function RingsGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="24" cy="36" r="14" />
      <circle cx="40" cy="36" r="14" />
      <path d="M32 6 l3 6 l-3 6 l-3 -6 z" fill="currentColor" stroke="none" />
      <path d="M22 12 l2 3 M42 12 l-2 3" strokeLinecap="round" />
    </svg>
  );
}
