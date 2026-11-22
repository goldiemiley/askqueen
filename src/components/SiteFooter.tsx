import Link from "next/link";
import { infoItems, readingItems, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-plum text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="font-display text-[2rem] leading-none text-blush">{site.wordmark}</p>
          <p className="mt-3 max-w-xs text-cream/75">{site.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-sans text-sm font-semibold text-gold">Readings</h2>
          <ul className="mt-3 space-y-2">
            {readingItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-cream/85 underline-offset-4 hover:text-cream hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-sans text-sm font-semibold text-gold">About</h2>
          <ul className="mt-3 space-y-2">
            {infoItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-cream/85 underline-offset-4 hover:text-cream hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-sans text-sm font-semibold text-gold">The small print</h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-cream/75">
            AskQueen is for entertainment only. Sabrina is a fictional character, and her answers
            and roasts are made up for fun. Please don&rsquo;t base real
            decisions on them.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <p className="mx-auto max-w-6xl px-5 py-5 text-sm text-cream/60 sm:px-8">
          &copy; {new Date().getFullYear()} {site.name}. Public beta.
        </p>
      </div>
    </footer>
  );
}
