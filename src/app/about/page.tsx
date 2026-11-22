import type { Metadata } from "next";
import Link from "next/link";
import { features } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Sabrina",
  description: "Who Sabrina is, what AskQueen does, and why none of it is a real prediction.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="text-h1 text-burgundy sm:text-[3.75rem]">About Sabrina</h1>
      <p className="mt-6 max-w-[60ch] text-lede text-plum/85">
        Sabrina is the fictional host of AskQueen: a cosmic reader with a velvet voice, impeccable timing and
        no filter whatsoever.
      </p>

      <div className="mt-12 space-y-10">
        <div className="border-t border-plum/15 pt-6">
          <h2 className="text-h3 text-plum">What she does</h2>
          <p className="mt-2 max-w-[62ch] text-plum/85">
            She answers your questions like a Magic 8 Ball with opinions, and roasts your star sign once a day
            with a song to match the mood.
            {features.compatibility &&
              " She also gives you and your person a compatibility report that is more receipts than romance."}
          </p>
        </div>
        <div className="border-t border-plum/15 pt-6">
          <h2 className="text-h3 text-plum">How she talks</h2>
          <p className="mt-2 max-w-[62ch] text-plum/85">
            Sabrina jokes about situations and decisions, not about who people are. She never makes fun of
            anyone&rsquo;s identity, sexuality, body, disability, nationality or race. Choosing a savage or
            unhinged roast turns up the sarcasm, not the cruelty.
          </p>
        </div>
        <div className="border-t border-plum/15 pt-6">
          <h2 className="text-h3 text-plum">How her answers work</h2>
          <p className="mt-2 max-w-[62ch] text-plum/85">
            In this beta, Sabrina&rsquo;s answers are written in advance and matched to the kind of question or
            sign you give her. She isn&rsquo;t an AI that understands everything you type, and star signs are
            worked out with a simplified sun-sign table, not a full birth chart.
          </p>
        </div>
        <div className="border-t border-plum/15 pt-6">
          <h2 className="text-h3 text-plum">For entertainment only</h2>
          <p className="mt-2 max-w-[62ch] text-plum/85">
            Nothing on AskQueen is a real prediction, scientific result or professional advice. For anything
            involving your health, safety, money or the law, talk to a real person who knows the subject.
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/ask/" className="btn btn-primary">
          Ask Sabrina
        </Link>
        <Link href="/privacy/" className="btn btn-ghost">
          Read the privacy notes
        </Link>
      </div>
    </section>
  );
}
