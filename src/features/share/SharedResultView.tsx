"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SharePanel } from "@/components/SharePanel";
import { SongPreview } from "@/components/SongPreview";
import { signProfileById } from "@/data/signs";
import { themeById } from "@/data/themes";
import { readAsLabel, renderAnswer, stanceLabels } from "@/features/ask/engine";
import { formatLongDate } from "@/features/daily/date";
import { INTENSITY_LABELS } from "@/features/daily/share";
import { askCard, askShareText, dailyCard, dailyFullText, dailyShareText, type DailyShareData } from "./content";
import { parseShare, type SharedResult } from "./links";
import { questionFromHash } from "./question";

export function SharedResultView() {
  const [shared, setShared] = useState<SharedResult | null>(null);
  const [query, setQuery] = useState("");
  const [hash, setHash] = useState("");

  useEffect(() => {
    // The reading lives in the link, so it's only readable in the browser.
    // Re-read it if only the #question part changes on an open page.
    const read = () => {
      setQuery(window.location.search);
      setHash(window.location.hash);
      setShared(parseShare(window.location.search));
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, []);

  if (!shared) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
        <p role="status" className="text-lede text-plum/80">
          Opening the reading&hellip;
        </p>
      </section>
    );
  }

  if (shared.kind === "invalid") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="text-h1 text-burgundy sm:text-[3.5rem]">This reading has vanished</h1>
        <p className="mt-6 max-w-[56ch] text-lede text-plum/85">
          The link looks incomplete or comes from an older version of AskQueen. Sabrina is happy to do a fresh one.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/daily/" className="btn btn-primary">
            Get my daily roast
          </Link>
          <Link href="/ask/" className="btn btn-ghost">
            Ask Sabrina a question
          </Link>
        </div>
      </section>
    );
  }

  const params = new URLSearchParams(query);

  if (shared.kind === "ask") {
    const { response, category, place } = shared;
    // The question (if any) is in the #fragment and is re-checked here.
    const { question, rejected } = questionFromHash(hash, response);
    return (
      <section className="on-dark bg-plum text-cream">
        <div className="mx-auto max-w-3xl px-5 pb-16 pt-10 sm:px-8 md:pb-24 md:pt-16">
          <p className="text-[0.95rem] text-gold">Someone shared {question ? "a question and" : "an"} answer from Sabrina</p>
          <h1 className="mt-2 text-h1 text-cream sm:text-[3.5rem]">Sabrina has spoken</h1>
          {question && (
            <figure className="mt-8">
              <figcaption className="text-sm font-semibold text-blush">Asked Sabrina</figcaption>
              <blockquote className="relative mt-2 max-w-[36rem] rounded-[1.5rem] rounded-bl-md bg-blush-soft px-5 py-4 text-[1.15rem] leading-relaxed text-plum">
                <p>&ldquo;{question}&rdquo;</p>
              </blockquote>
              <p className="mt-2 text-sm text-cream/70">Written by the person who shared this link.</p>
            </figure>
          )}
          <div className="relative mt-8 rounded-[1.75rem] bg-cream px-6 pb-7 pt-6 text-plum sm:px-8">
            <span className="pointer-events-none absolute inset-2 rounded-[1.35rem] border border-gold" aria-hidden="true" />
            <p className="relative text-sm font-semibold text-burgundy">Sabrina&rsquo;s answer</p>
            {category && !question && (
              <p className="relative mt-2 inline-block rounded-full bg-blush-soft px-3 py-1 text-sm text-plum">
                Read as: {readAsLabel(response, place, category)}
              </p>
            )}
            <p className="relative mt-3 font-display text-[2.5rem] leading-none text-burgundy sm:text-[3rem]">
              {stanceLabels[response.stance]}
            </p>
            <p className="relative mt-4 max-w-[52ch] text-[1.125rem] leading-relaxed">{renderAnswer(response, place)}</p>
            {response.nudge && <p className="relative mt-3 max-w-[52ch] text-plum/75">{response.nudge}</p>}
            {!question && (
              <p className="relative mt-5 text-sm text-plum/70">
                {rejected
                  ? "This link included a question that can't be shown, so only the answer appears."
                  : "The question was kept private. Only the answer is shared."}
              </p>
            )}
            <div className="relative mt-6 flex flex-wrap gap-3">
              <Link href="/ask/" className="btn btn-primary">
                Ask your own question
              </Link>
              <Link href="/daily/" className="btn btn-ghost">
                Get a daily roast
              </Link>
            </div>
            <div className="relative">
              <SharePanel
                params={params}
                card={askCard(response, null, place)}
                ask={{ response, question, place }}
                fileStem="askqueen-answer"
                shareTitle="Sabrina has spoken"
                text={(url, q) => askShareText(response, q, url, place)}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const d = shared;
  const sign = signProfileById[d.sign];
  const roastText = d.roast.variants[d.intensity];
  const data: DailyShareData = {
    sign: d.sign,
    dateKey: d.dateKey,
    intensity: d.intensity,
    roastText,
    theme: d.theme,
    song: d.song,
    songReason: d.songReason,
    advice: d.advice,
    lucky: d.lucky,
    avoid: d.avoid,
  };
  return (
    <>
      <section className="on-dark bg-burgundy text-cream">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-10 sm:px-8 md:pt-14">
          <p className="text-[0.95rem] text-cream/85">Someone shared their daily roast and its song</p>
          <h1 className="mt-2 text-[3.25rem] leading-none text-cream sm:text-[4rem]">{sign.displayName}</h1>
          <p className="mt-3 text-cream/85">
            {formatLongDate(d.dateKey)}. A {INTENSITY_LABELS[d.intensity].toLowerCase()} roast from Sabrina.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-16">
        <div className="on-dark arch relative bg-plum px-6 pb-10 pt-20 text-cream sm:px-10 sm:pt-16">
          <span className="arch-inner opacity-70" aria-hidden="true" />
          <p className="relative text-center text-sm font-semibold text-gold">
            Theme: {themeById[d.theme].label}
          </p>
          <p className="relative mt-1 text-center text-sm text-cream/75">{themeById[d.theme].description}</p>
          <blockquote className="relative mx-auto mt-6 max-w-[34ch]">
            <p className="text-center font-display text-[1.6rem] leading-[1.3] text-cream sm:text-[1.9rem]">{roastText}</p>
          </blockquote>
        </div>

        {/* The song sits directly under the roast it belongs to. */}
        <section
          aria-labelledby="shared-song"
          className="relative -mt-3 rounded-b-[1.75rem] rounded-t-[0.75rem] bg-blush px-6 pb-7 pt-8 text-plum sm:px-8"
        >
          <h2 id="shared-song" className="font-sans text-sm font-semibold text-burgundy">
            Sabrina&rsquo;s song for this roast
          </h2>
          <p className="mt-2 font-display text-[2rem] leading-tight">{d.song.title}</p>
          <p className="mt-1 text-lg">{d.song.artist}</p>
          <p className="mt-4 max-w-[52ch]">{d.songReason}</p>
          <SongPreview key={d.song.id} song={d.song} />
        </section>

        <SharePanel
          params={params}
          card={dailyCard(data)}
          fileStem={`askqueen-${d.sign}-${d.dateKey}`}
          shareTitle={`Sabrina's daily roast for ${sign.displayName}`}
          text={(url) => dailyShareText(data, url)}
          fullText={(url) => dailyFullText(data, url)}
          songTitle={d.song.title}
        />

        <div className="mt-10 rounded-[1.5rem] border border-plum/15 bg-white/50 px-6 py-5">
          <p className="text-sm font-semibold text-burgundy">Sabrina&rsquo;s advice</p>
          <p className="mt-1 max-w-[56ch] text-[1.05rem] text-plum">{d.advice}</p>
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-plum/15 bg-white/50 px-6 py-4">
            <dt className="text-sm font-semibold text-burgundy">Lucky</dt>
            <dd className="mt-1 text-plum">{d.lucky}</dd>
          </div>
          <div className="rounded-[1.5rem] border border-plum/15 bg-white/50 px-6 py-4">
            <dt className="text-sm font-semibold text-burgundy">Avoid</dt>
            <dd className="mt-1 text-plum">{d.avoid}</dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/daily/" className="btn btn-primary">
            Get your own roast
          </Link>
          <Link href="/ask/" className="btn btn-ghost">
            Ask Sabrina a question
          </Link>
        </div>
      </div>
    </>
  );
}
