import type { Metadata } from "next";
import Link from "next/link";
import { features } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The basic terms for using the AskQueen public beta.",
};

const allTerms: Array<{ title: string; body: string; compatibilityOnly?: boolean }> = [
  {
    title: "It's entertainment",
    body: "AskQueen and its character Sabrina are for fun. Answers, roasts and songs are fictional and aren't predictions, advice or scientific results. Don't rely on them for real decisions.",
  },
  {
    title: "It's a beta",
    body: "Features may change, break or disappear while we test. The site is provided as it is, without guarantees.",
  },
  {
    compatibilityOnly: true,
    title: "Compatibility is 16+",
    body: "The compatibility check is only for people aged 16 and over. We check this from the full dates of birth you enter, which are used for the calculation and then discarded.",
  },
  {
    compatibilityOnly: true,
    title: "Be kind with other people's details",
    body: "Only enter someone else's nickname and birthday if you're comfortable they'd be fine with it. Nothing you enter is stored, but share cards are yours to post responsibly.",
  },
  {
    title: "Music links",
    body: "Song suggestions link out to third-party services such as Spotify. Those services have their own terms. AskQueen doesn't host any music; song previews play in Spotify's own player.",
  },
  {
    title: "Our content",
    body: "AskQueen's name, Sabrina, the writing and the artwork belong to AskQueen. You're welcome to share your own result cards.",
  },
];

const terms = allTerms.filter((t) => features.compatibility || !t.compatibilityOnly);

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="text-h1 text-burgundy sm:text-[3.75rem]">Terms</h1>
      <p className="mt-6 max-w-[60ch] text-lede text-plum/85">The short version for the public beta.</p>
      <p className="mt-4 rounded-2xl bg-blush-soft px-5 py-4 text-plum">
        Draft terms for the beta. These will be reviewed before any commercial launch.
      </p>
      <dl className="mt-12 space-y-8">
        {terms.map((t) => (
          <div key={t.title} className="border-t border-plum/15 pt-6">
            <dt className="font-display text-h3 text-plum">{t.title}</dt>
            <dd className="mt-2 max-w-[62ch] text-plum/85">{t.body}</dd>
          </div>
        ))}
      </dl>
      <Link href="/" className="btn btn-primary mt-10">
        Back to the homepage
      </Link>
    </section>
  );
}
