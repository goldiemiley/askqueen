import type { Metadata } from "next";
import Link from "next/link";
import { features } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How AskQueen handles the details you type in.",
};

const points: Array<{ title: string; body: string }> = [
  {
    title: "Everything runs in your browser",
    body: "Your questions, birthdays and answers are worked out on your own device. AskQueen has no server that receives them.",
  },
  {
    title: "Nothing is saved",
    body: features.compatibility
      ? "We ask for a full date of birth to work out star signs and, for compatibility, to check that both people are 16 or older. We don't store your birthday or any sexual orientation you choose to share: not in a database, not in the web address and not in your browser's storage. Close the tab and it's gone."
      : "We ask for a full date of birth to work out your star sign and check it's a real date. We don't store your birthday: not in a database, not in the web address and not in your browser's storage. Close the tab and it's gone.",
  },
  {
    title: "No accounts and no tracking",
    body: "There's nothing to sign up for. This beta doesn't use analytics or advertising trackers.",
  },
  {
    title: "Sharing shows the reading, not you",
    body: "Share links and images contain the reading itself: the star sign, the date, the roast, the song and Sabrina's extras, or Sabrina's answer. They never include your name, birthday, music choices, orientation or the question you asked. Anyone with a share link can open that reading, so only send it to people you're happy to have see it.",
  },
  {
    title: "Facebook and Instagram are their own sites",
    body: "Share to Facebook opens Facebook's own share page with the link. Instagram images are made on your device and handed to your phone's share menu or saved to your downloads. Once you post, that site's privacy policy applies.",
  },
  {
    title: "Song previews and links use Spotify",
    body: "The Song of the Day preview is Spotify's own player. It only loads when you press Listen to a preview, and from then on Spotify's privacy policy applies to it. Song links take you to Spotify's website. AskQueen never sends Spotify your birthday, name or answers.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="text-h1 text-burgundy sm:text-[3.75rem]">Privacy</h1>
      <p className="mt-6 max-w-[60ch] text-lede text-plum/85">
        Sabrina likes to know your business. AskQueen doesn&rsquo;t keep it.
      </p>
      <dl className="mt-12 space-y-8">
        {points.map((p) => (
          <div key={p.title} className="border-t border-plum/15 pt-6">
            <dt className="font-display text-h3 text-plum">{p.title}</dt>
            <dd className="mt-2 max-w-[62ch] text-plum/85">{p.body}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-12 rounded-2xl bg-blush-soft px-5 py-5 text-plum">
        <p className="font-semibold">For entertainment only</p>
        <p className="mt-1 text-plum/85">
          Sabrina is fictional. Her answers and roasts aren&rsquo;t predictions or advice.
        </p>
      </div>
      <Link href="/" className="btn btn-primary mt-10">
        Back to the homepage
      </Link>
    </section>
  );
}
