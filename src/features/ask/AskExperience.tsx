"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CrystalBall, type OrbState } from "@/components/CrystalBall";
import { SharePanel } from "@/components/SharePanel";
import { askCard, askShareText } from "@/features/share/content";
import { askShareParams } from "@/features/share/links";
import { askSabrina, categoryLabels, stanceLabels, stanceOrbWords, type AskReading } from "./engine";
import { QUESTION_MAX, questionErrorMessages, validateQuestion, type QuestionError } from "./question";

const EXAMPLES = [
  "Will they text me back?",
  "Should I ask for a raise?",
  "Should I go out tonight?",
];

const THINK_MS = 1400;
const THINK_MS_REDUCED = 350;

export function AskExperience() {
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [error, setError] = useState<QuestionError | null>(null);
  const [phase, setPhase] = useState<OrbState>("idle");
  const [reading, setReading] = useState<AskReading | null>(null);
  const [revision, setRevision] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const ids = {
    input: useId(),
    help: useId(),
    error: useId(),
    count: useId(),
    result: useId(),
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current);
    };
  }, []);

  // Move focus to the answer once it's revealed so screen readers announce it.
  useEffect(() => {
    if (revision > 0) resultHeadingRef.current?.focus();
  }, [revision]);

  const thinking = phase === "thinking";

  function ask(source: "form" | "again") {
    if (thinking) return;
    const check = validateQuestion(source === "again" ? askedQuestion : question);
    if (!check.ok) {
      setError(check.error);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setPhase("thinking");

    const previousId = reading && reading.kind !== "crisis" ? reading.response.id : undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => {
        setReading(askSabrina(check.value, { previousId: source === "again" ? previousId : undefined }));
        setAskedQuestion(check.value);
        setPhase("revealed");
        setRevision((n) => n + 1);
      },
      reduced ? THINK_MS_REDUCED : THINK_MS,
    );
  }

  function startOver() {
    window.clearTimeout(timer.current);
    setQuestion("");
    setAskedQuestion("");
    setReading(null);
    setPhase("idle");
    inputRef.current?.focus();
  }

  function rephrase() {
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  const orbWord = reading && reading.kind !== "crisis" ? stanceOrbWords[reading.response.stance] : undefined;
  const describedBy = [ids.help, ids.count, error ? ids.error : null].filter(Boolean).join(" ");

  return (
    <section className="on-dark bg-plum text-cream">
      <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-8 px-5 pb-16 pt-10 sm:px-8 md:grid-cols-[0.85fr_1.15fr] md:pb-24 md:pt-16">
        <div className="md:col-start-2 md:row-start-1">
          <h1 className="text-h1 text-cream sm:text-[3.75rem]">Ask Queen</h1>
          <p className="mt-4 max-w-[48ch] text-lede leading-relaxed text-cream/80">
            One question, one answer, zero patience for nonsense.
          </p>
        </div>

        <div className="md:col-start-1 md:row-span-2 md:row-start-1">
          <div className="arch relative mx-auto max-w-[15rem] bg-plum-ink px-4 pb-4 pt-7 shadow-[0_0_0_1px_var(--color-gold)] sm:max-w-[18rem] md:sticky md:top-8 md:max-w-none md:px-6 md:pb-6 md:pt-10">
            <span className="arch-inner opacity-60" aria-hidden="true" />
            <CrystalBall
              className="relative mx-auto block h-auto w-full max-w-[19rem]"
              idPrefix="ask-orb"
              state={phase}
              message={orbWord}
              revealKey={revision}
              decorative
            />
          </div>
        </div>

        <div className="md:col-start-2 md:row-start-2">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              ask("form");
            }}
          >
            <label htmlFor={ids.input} className="block font-display text-h3 text-cream">
              Your question
            </label>
            <p id={ids.help} className="mt-1 text-[0.95rem] text-cream/70">
              Love, work, friends, plans or money. Press Enter to ask.
            </p>
            <textarea
              ref={inputRef}
              id={ids.input}
              name="question"
              rows={3}
              maxLength={QUESTION_MAX}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  ask("form");
                }
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              placeholder="Will they text me back?"
              autoComplete="off"
              spellCheck
              className={`mt-3 block w-full resize-none rounded-2xl bg-cream px-5 py-4 text-[1.125rem] leading-snug text-plum placeholder:text-plum/45 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-gold ${
                error ? "shadow-[inset_0_0_0_2px_var(--color-blush)]" : "shadow-[inset_0_0_0_1px_var(--color-gold)]"
              }`}
            />
            <div className="mt-2 flex items-start justify-between gap-4">
              <p id={ids.error} role="alert" className="min-h-[1.5rem] text-[0.95rem] font-medium text-blush">
                {error ? questionErrorMessages[error] : ""}
              </p>
              <p id={ids.count} className="shrink-0 text-sm tabular-nums text-cream/60">
                <span className="sr-only">Characters used: </span>
                {question.length}/{QUESTION_MAX}
              </p>
            </div>
            <button type="submit" className="btn btn-primary mt-3 w-full sm:w-auto" aria-disabled={thinking}>
              {thinking ? "Sabrina is reading…" : "Ask Sabrina"}
            </button>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-cream/65">
              Sabrina matches your question to a topic and picks from answers she&rsquo;s written in advance. She
              isn&rsquo;t an AI, and your question never leaves this device.
            </p>
          </form>

          <div className="mt-10" aria-live="polite" aria-busy={thinking}>
            {thinking && (
              <p className="rounded-[1.75rem] border border-dashed border-gold/60 px-6 py-8 text-center text-cream/80">
                Sabrina is consulting the stars&hellip;
              </p>
            )}

            {!thinking && !reading && (
              <div className="rounded-[1.75rem] border border-dashed border-gold/50 px-6 py-7">
                <p className="text-cream/80">Your answer appears here. Need a starter? Try one of these:</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <li key={ex}>
                      <button
                        type="button"
                        className="rounded-full px-4 py-2 text-[0.95rem] text-cream shadow-[inset_0_0_0_1px_var(--color-gold)] hover:bg-cream/10"
                        onClick={() => {
                          setQuestion(ex);
                          setError(null);
                          inputRef.current?.focus();
                        }}
                      >
                        {ex}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!thinking && reading?.kind === "crisis" && (
              <div
                role="region"
                aria-labelledby={ids.result}
                className="rounded-[1.75rem] bg-cream px-6 py-7 text-plum"
              >
                <h2 ref={resultHeadingRef} id={ids.result} tabIndex={-1} className="text-h3 text-plum focus:outline-none">
                  Let&rsquo;s pause the reading
                </h2>
                <p className="mt-3 max-w-[56ch]">
                  Sabrina is a fictional character, and this sounds more important than a joke. If you&rsquo;re in
                  danger or thinking about hurting yourself, please contact your local emergency number now.
                </p>
                <p className="mt-3 max-w-[56ch]">
                  You can find a free, confidential helpline in your country at{" "}
                  <a
                    href="https://findahelpline.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-burgundy underline underline-offset-4"
                  >
                    findahelpline.com
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  , or talk to someone you trust.
                </p>
                <button type="button" className="btn btn-ghost mt-6" onClick={startOver}>
                  Ask something else
                </button>
              </div>
            )}

            {!thinking && reading && reading.kind !== "crisis" && (
              <div
                role="region"
                aria-labelledby={ids.result}
                className="relative rounded-[1.75rem] bg-cream px-6 pb-7 pt-6 text-plum sm:px-8"
              >
                <span
                  className="pointer-events-none absolute inset-2 rounded-[1.35rem] border border-gold"
                  aria-hidden="true"
                />
                {reading.kind === "answer" && reading.category && (
                  <p className="relative inline-block rounded-full bg-blush-soft px-3 py-1 text-sm text-plum">
                    Read as: {categoryLabels[reading.category]}
                  </p>
                )}
                {reading.kind === "serious" && (
                  <p className="relative inline-block rounded-full bg-blush-soft px-3 py-1 text-sm text-plum">
                    Sabrina is stepping out of character
                  </p>
                )}
                <h2
                  ref={resultHeadingRef}
                  id={ids.result}
                  tabIndex={-1}
                  className="relative mt-3 text-[2.5rem] leading-none text-burgundy focus:outline-none sm:text-[3rem]"
                >
                  {stanceLabels[reading.response.stance]}
                </h2>
                <p className="relative mt-4 max-w-[52ch] text-[1.125rem] leading-relaxed">{reading.response.text}</p>
                {reading.response.nudge && (
                  <p className="relative mt-3 max-w-[52ch] text-plum/75">{reading.response.nudge}</p>
                )}

                {reading.kind !== "unclear" && (
                  <div className="relative">
                    <SharePanel
                      key={revision}
                      params={askShareParams(reading.response, reading.category)}
                      card={askCard(reading.response)}
                      ask={{ response: reading.response, question: askedQuestion }}
                      fileStem="askqueen-answer"
                      shareTitle="Sabrina has spoken"
                      text={(url, q) => askShareText(reading.response, q, url)}
                      intro="Your question stays private unless you choose to show it."
                    />
                  </div>
                )}

                <div className="relative mt-6 flex flex-wrap gap-3">
                  {reading.kind === "unclear" ? (
                    <button type="button" className="btn btn-primary" onClick={rephrase}>
                      Rephrase my question
                    </button>
                  ) : (
                    <button type="button" className="btn btn-ghost" onClick={() => ask("again")}>
                      Get another answer
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn px-3 font-semibold text-burgundy underline decoration-1 underline-offset-[6px]"
                    onClick={startOver}
                  >
                    Ask a new question
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
