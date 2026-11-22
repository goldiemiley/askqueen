import Link from "next/link";
import { ArcanaCard } from "@/components/ArcanaCard";
import { CrystalBall } from "@/components/CrystalBall";
import { OrbGlyph, RingsGlyph, SunMoonGlyph } from "@/components/Glyphs";
import { features, site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      {/* Hero: the night sky */}
      <section className="on-dark relative overflow-hidden bg-plum text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:gap-14 md:pb-24 md:pt-20">
          <div>
            <h1 className="text-hero text-cream sm:text-[4.5rem] lg:text-[5.5rem]">{site.tagline}</h1>
            <p className="mt-6 max-w-[46ch] text-lede leading-relaxed text-cream/80">
              Sabrina reads the stars, your questions and your questionable taste in partners. She&rsquo;s
              dramatic, brutally honest and, annoyingly, usually right.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/ask/" className="btn btn-primary">
                Ask Sabrina
              </Link>
              <Link href="/daily/" className="btn btn-ghost-dark">
                Get today&rsquo;s roast
              </Link>
            </div>
            <p className="mt-6 text-sm text-cream/65">Free, no sign-up, and strictly for entertainment.</p>
          </div>

          <div className="relative mx-auto w-full max-w-[22rem] md:max-w-none">
            <div className="arch relative bg-plum-ink px-6 pb-6 pt-10 shadow-[0_0_0_1px_var(--color-gold)]">
              <span className="arch-inner opacity-60" aria-hidden="true" />
              <CrystalBall className="relative mx-auto block h-auto w-full max-w-[19rem]" idPrefix="hero-orb" />
            </div>
          </div>
        </div>
      </section>

      {/* The three readings */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24" aria-labelledby="readings-heading">
        <div className="max-w-2xl">
          <h2 id="readings-heading" className="text-h2 text-burgundy sm:text-[2.75rem]">
            Pick your reading
          </h2>
          <p className="mt-4 max-w-[56ch] text-plum/80">
            {features.compatibility ? "Three" : "Two"} ways to let Sabrina into your business. Each one takes under a minute and gives you a
            card you can share.
          </p>
        </div>

        <div className={`mt-12 grid gap-6 sm:grid-cols-2 ${features.compatibility ? "lg:grid-cols-3" : "max-w-4xl"}`}>
          <ArcanaCard
            numeral="I"
            title="Ask Queen"
            href="/ask/"
            cta="Ask a question"
            tone="plum"
            glyph={<OrbGlyph />}
          >
            Ask her a question and get a straight answer. Possibly too straight.
          </ArcanaCard>
          <ArcanaCard
            numeral="II"
            title="Daily roast"
            href="/daily/"
            cta="Get my roast"
            tone="burgundy"
            glyph={<SunMoonGlyph />}
          >
            Your sign, today&rsquo;s roast and one song that gets it. Gentle, savage or unhinged: your call.
          </ArcanaCard>
          {features.compatibility && (
          <ArcanaCard
            numeral="III"
            title="Compatibility"
            href="/compatibility/"
            cta="Check compatibility"
            tone="blush"
            glyph={<RingsGlyph />}
          >
            Two birthdays, one score, a red flag report and a verdict you didn&rsquo;t ask for.
          </ArcanaCard>
          )}
        </div>
      </section>

      {/* Meet Sabrina */}
      <section className="border-y border-plum/10 bg-cream" aria-labelledby="sabrina-heading">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:py-24">
          <div>
            <h2 id="sabrina-heading" className="text-h2 text-burgundy sm:text-[2.75rem]">
              Meet Sabrina
            </h2>
            <p className="mt-4 max-w-[48ch] text-plum/80">
              Sabrina is AskQueen&rsquo;s fictional cosmic reader: sarcastic, theatrical and secretly on your
              side. She roasts your sign, never who you are.
            </p>
            <Link
              href="/about/"
              className="mt-5 inline-block font-semibold text-burgundy underline decoration-1 underline-offset-[6px]"
            >
              More about Sabrina
            </Link>
          </div>
          <figure>
            <blockquote>
              <p className="font-display text-[1.85rem] leading-[1.25] text-plum sm:text-[2.25rem]">
                &ldquo;I&rsquo;m not mean, babe. I&rsquo;m accurate. The stars just happen to agree with me.&rdquo;
              </p>
            </blockquote>
            <figcaption className="mt-4 text-plum/70">Sabrina, on being misunderstood</figcaption>
          </figure>
        </div>
      </section>

      {/* Privacy promise */}
      <section className="bg-blush-soft" aria-labelledby="privacy-heading">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 id="privacy-heading" className="text-h3 text-plum sm:text-h2">
            What happens to your details
          </h2>
          <p className="mt-4 max-w-[62ch] text-plum/85">
            Nothing leaves your device. AskQueen runs in your browser, there are no accounts, and the birthdays
            and questions you type aren&rsquo;t sent to a server or saved.
          </p>
          <Link
            href="/privacy/"
            className="mt-5 inline-block font-semibold text-burgundy underline decoration-1 underline-offset-[6px]"
          >
            Read the privacy notes
          </Link>
        </div>
      </section>
    </>
  );
}
