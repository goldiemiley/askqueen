"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SunMoonGlyph } from "@/components/Glyphs";
import { SharePanel } from "@/components/SharePanel";
import { SongPreview } from "@/components/SongPreview";
import { dailyCard } from "@/features/share/content";
import { dailyShareParams, shareUrl } from "@/features/share/links";
import { signProfileById } from "@/data/signs";
import { GENRE_LABELS } from "@/data/songs";
import { themeById } from "@/data/themes";
import { copyToClipboard } from "@/lib/clipboard";
import { INTENSITIES, MUSIC_GENRES, type DailyResult, type Intensity, type MusicGenre } from "@/types/content";
import { formatLongDate, localDateKey } from "./date";
import { fallbackNote, getDailyReading, MAX_GENRES, roastText } from "./reading";
import { formatDailyShareText, INTENSITY_LABELS } from "./share";
import { MONTH_NAMES, signForMonthDay, validateBirthDate, type BirthDateField } from "./zodiac";

const INTENSITY_HINTS: Record<Intensity, string> = {
  gentle: "A loving nudge",
  savage: "Honest, with teeth",
  unhinged: "Chaos, but fun",
};

const NAME_MAX = 30;
const THINK_MS = 900;
const THINK_MS_REDUCED = 200;

function signRange(sign: DailyResult["sign"]): string {
  const p = signProfileById[sign];
  return `${p.start.day} ${MONTH_NAMES[p.start.month - 1]} to ${p.end.day} ${MONTH_NAMES[p.end.month - 1]}`;
}

type Segment<T extends string> = { value: T; label: string; hint?: string };

/** Accessible radio group styled as a segmented control. */
function SegmentedRadios<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  tone = "light",
}: {
  name: string;
  legend: string;
  options: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <fieldset>
      <legend className={`text-[0.95rem] font-semibold ${dark ? "text-cream" : "text-plum"}`}>{legend}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl px-2 py-3 text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 ${
              dark
                ? "text-cream shadow-[inset_0_0_0_1px_var(--color-gold)] has-[:checked]:bg-gold has-[:checked]:text-plum has-[:focus-visible]:outline-gold"
                : "text-plum shadow-[inset_0_0_0_1.5px_var(--color-plum)] has-[:checked]:bg-plum has-[:checked]:text-cream has-[:focus-visible]:outline-burgundy"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span className="font-semibold">{o.label}</span>
            {o.hint && <span className="mt-0.5 text-[0.8rem] leading-tight opacity-80">{o.hint}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DailyExperience() {
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [genres, setGenres] = useState<MusicGenre[]>([]);
  const [intensity, setIntensity] = useState<Intensity>("savage");
  const [dobError, setDobError] = useState<{ field: BirthDateField; message: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [view, setView] = useState<"form" | "result">("form");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLSelectElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const copiedTimer = useRef<number | undefined>(undefined);
  const focusAfterRender = useRef<"result" | "form" | null>(null);


  const ids = {
    name: useId(),
    nameHint: useId(),
    dobHint: useId(),
    dobError: useId(),
    genreHint: useId(),
    result: useId(),
  };

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (focusAfterRender.current === "result") resultHeadingRef.current?.focus();
    if (focusAfterRender.current === "form") formHeadingRef.current?.focus();
    focusAfterRender.current = null;
  }, [view, result]);

  function toggleGenre(g: MusicGenre) {
    setGenres((current) =>
      current.includes(g) ? current.filter((x) => x !== g) : current.length >= MAX_GENRES ? current : [...current, g],
    );
  }

  function submit() {
    if (thinking) return;
    const check = validateBirthDate({ day, month, year }, new Date());
    if (!check.ok) {
      setDobError({ field: check.field, message: check.message });
      ({ day: dayRef, month: monthRef, year: yearRef })[check.field].current?.focus();
      return;
    }
    setDobError(null);
    setStatus("");
    setCopied(false);
    setThinking(true);
    // Only the sign leaves this function; the birth date itself isn't kept anywhere.
    const sign = signForMonthDay(check.date.month, check.date.day);
    const dateKey = localDateKey(new Date());
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => {
        // Month and day personalise the reading; the year is only used for validation.
        const birthday = { month: check.date.month, day: check.date.day };
        setResult(getDailyReading({ sign, dateKey, genres, birthday }));
        setThinking(false);
        focusAfterRender.current = "result";
        setView("result");
      },
      reduced ? THINK_MS_REDUCED : THINK_MS,
    );
  }

  function changePreferences() {
    setStatus("");
    focusAfterRender.current = "form";
    setView("form");
  }

  function startAgain() {
    window.clearTimeout(timer.current);
    setName("");
    setDay("");
    setMonth("");
    setYear("");
    setGenres([]);
    setIntensity("savage");
    setDobError(null);
    setResult(null);
    setStatus("");
    setCopied(false);
    focusAfterRender.current = "form";
    setView("form");
  }

  async function onCopy() {
    if (!result) return;
    const link = shareUrl(window.location.origin, dailyShareParams(result, intensity));
    const ok = await copyToClipboard(formatDailyShareText(result, intensity, link));
    if (ok) {
      setCopied(true);
      setStatus("Reading copied to your clipboard.");
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2500);
    } else {
      setStatus("Your browser blocked copying. Select the text and copy it yourself.");
    }
  }

  const dobInvalid = (f: BirthDateField) => (dobError?.field === f ? true : undefined);
  const dobDescribedBy = [ids.dobHint, dobError ? ids.dobError : null].filter(Boolean).join(" ");
  const trimmedName = name.trim();

  const intensityOptions = INTENSITIES.map((i) => ({ value: i, label: INTENSITY_LABELS[i], hint: INTENSITY_HINTS[i] }));

  return (
    <>
      <section className="on-dark bg-burgundy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-5 pb-12 pt-10 sm:px-8 md:pb-16 md:pt-14">
          <div>
            <h1 className="text-h1 text-cream sm:text-[3.75rem]">Daily roast</h1>
            <p className="mt-4 max-w-[46ch] text-lede leading-relaxed text-cream/85">
              Your sign, today&rsquo;s roast and one song that gets it. New every day, at midnight your time.
            </p>
          </div>
          <div className="hidden h-28 w-28 shrink-0 text-gold-soft sm:block md:h-36 md:w-36">
            <SunMoonGlyph />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-16">
        {view === "form" && (
          <form
            noValidate
            aria-labelledby={`${ids.result}-form`}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <h2
              ref={formHeadingRef}
              id={`${ids.result}-form`}
              tabIndex={-1}
              className="text-h2 text-burgundy focus:outline-none"
            >
              Tell Sabrina about you
            </h2>

            <div className="mt-8 space-y-9">
              {/* Nickname */}
              <div>
                <label htmlFor={ids.name} className="block text-[0.95rem] font-semibold text-plum">
                  Name or nickname <span className="font-normal text-plum/70">(optional)</span>
                </label>
                <p id={ids.nameHint} className="mt-1 text-[0.95rem] text-plum/70">
                  Only used to say hello. It isn&rsquo;t saved.
                </p>
                <input
                  id={ids.name}
                  type="text"
                  value={name}
                  maxLength={NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  aria-describedby={ids.nameHint}
                  autoComplete="off"
                  className="mt-2 block w-full max-w-sm rounded-xl bg-white/70 px-4 py-3 text-plum shadow-[inset_0_0_0_1.5px_var(--color-plum)] focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
                />
              </div>

              {/* Date of birth */}
              <fieldset aria-describedby={dobDescribedBy}>
                <legend className="text-[0.95rem] font-semibold text-plum">Date of birth</legend>
                <p id={ids.dobHint} className="mt-1 text-[0.95rem] text-plum/70">
                  Used to find your sign, then forgotten. For example, 27 March 1998.
                </p>
                <p id={ids.dobError} role="alert" className="mt-2 font-medium text-burgundy empty:hidden">
                  {dobError?.message ?? ""}
                </p>
                <div className="mt-3 grid max-w-md grid-cols-[4.5rem_minmax(0,1fr)_6rem] gap-3">
                  <div>
                    <label htmlFor={`${ids.dobHint}-day`} className="block text-sm text-plum/80">
                      Day
                    </label>
                    <input
                      ref={dayRef}
                      id={`${ids.dobHint}-day`}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={day}
                      onChange={(e) => {
                        setDay(e.target.value);
                        if (dobError) setDobError(null);
                      }}
                      aria-invalid={dobInvalid("day")}
                      aria-describedby={dobDescribedBy}
                      autoComplete="off"
                      className="mt-1 block w-full rounded-xl bg-white/70 px-4 py-3 text-plum shadow-[inset_0_0_0_1.5px_var(--color-plum)] focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy aria-[invalid=true]:shadow-[inset_0_0_0_2.5px_var(--color-burgundy)]"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${ids.dobHint}-month`} className="block text-sm text-plum/80">
                      Month
                    </label>
                    <select
                      ref={monthRef}
                      id={`${ids.dobHint}-month`}
                      value={month}
                      onChange={(e) => {
                        setMonth(e.target.value);
                        if (dobError) setDobError(null);
                      }}
                      aria-invalid={dobInvalid("month")}
                      aria-describedby={dobDescribedBy}
                      autoComplete="off"
                      className="mt-1 block w-full rounded-xl bg-white/70 px-4 py-3 text-plum shadow-[inset_0_0_0_1.5px_var(--color-plum)] focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy aria-[invalid=true]:shadow-[inset_0_0_0_2.5px_var(--color-burgundy)]"
                    >
                      <option value="">Choose…</option>
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={String(i + 1)}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`${ids.dobHint}-year`} className="block text-sm text-plum/80">
                      Year
                    </label>
                    <input
                      ref={yearRef}
                      id={`${ids.dobHint}-year`}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={year}
                      onChange={(e) => {
                        setYear(e.target.value);
                        if (dobError) setDobError(null);
                      }}
                      aria-invalid={dobInvalid("year")}
                      aria-describedby={dobDescribedBy}
                      autoComplete="off"
                      className="mt-1 block w-full rounded-xl bg-white/70 px-4 py-3 text-plum shadow-[inset_0_0_0_1.5px_var(--color-plum)] focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy aria-[invalid=true]:shadow-[inset_0_0_0_2.5px_var(--color-burgundy)]"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Genres */}
              <fieldset aria-describedby={ids.genreHint}>
                <legend className="text-[0.95rem] font-semibold text-plum">
                  Music you like <span className="font-normal text-plum/70">(optional)</span>
                </legend>
                <p id={ids.genreHint} className="mt-1 text-[0.95rem] text-plum/70">
                  {genres.length >= MAX_GENRES
                    ? `You've picked ${MAX_GENRES}. Untick one to choose another.`
                    : `Pick up to ${MAX_GENRES}. Sabrina matches the song to your roast first, then to your taste.`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MUSIC_GENRES.map((g) => {
                    const checked = genres.includes(g);
                    const disabled = !checked && genres.length >= MAX_GENRES;
                    return (
                      <label
                        key={g}
                        className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-burgundy ${
                          checked
                            ? "bg-plum text-cream"
                            : "text-plum shadow-[inset_0_0_0_1.5px_var(--color-plum)] hover:bg-blush-soft"
                        } ${disabled ? "cursor-not-allowed opacity-45 hover:bg-transparent" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleGenre(g)}
                        />
                        {checked && (
                          <svg aria-hidden="true" viewBox="0 0 16 16" className="-ml-1 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3.5 8.5l3 3 6-7" />
                          </svg>
                        )}
                        {GENRE_LABELS[g]}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <SegmentedRadios
                name="intensity"
                legend="How hard should Sabrina go?"
                options={intensityOptions}
                value={intensity}
                onChange={setIntensity}
              />
            </div>

            <button type="submit" className="btn btn-primary mt-10 w-full sm:w-auto" aria-disabled={thinking}>
              {thinking ? "Reading your stars…" : "Get my roast"}
            </button>
            <p role="status" className="mt-3 text-[0.95rem] text-plum/80 empty:hidden">
              {thinking ? "Sabrina is finding your sign and today's roast." : ""}
            </p>
            <p className="mt-5 max-w-[56ch] text-sm leading-relaxed text-plum/70">
              Nothing you enter is saved or sent anywhere. Sabrina works it all out in your browser and forgets it
              when you leave.
            </p>
          </form>
        )}

        {view === "result" && result && (
          <article aria-labelledby={ids.result}>
            <p className="text-[0.95rem] text-plum/75">
              <span className="font-semibold text-plum">{formatLongDate(result.dateKey)}</span>
              {trimmedName ? `. Today's roast for ${trimmedName}` : ""}
            </p>
            <h2
              ref={resultHeadingRef}
              id={ids.result}
              tabIndex={-1}
              className="mt-2 text-[3.25rem] leading-none text-burgundy focus:outline-none sm:text-[4rem]"
            >
              {signProfileById[result.sign].displayName}
            </h2>
            <p className="mt-3 text-plum/80">
              {signRange(result.sign)}. {signProfileById[result.sign].vibe}
            </p>

            <div className="on-dark arch relative mt-8 bg-plum px-6 pb-8 pt-20 text-cream sm:px-10 sm:pt-16">
              <span className="arch-inner opacity-70" aria-hidden="true" />
              <p className="relative text-center text-sm font-semibold text-gold">
                Today&rsquo;s theme: {themeById[result.theme].label}
              </p>
              <p className="relative mt-1 text-center text-sm text-cream/75">{themeById[result.theme].description}</p>
              <blockquote className="relative mx-auto mt-6 max-w-[34ch]">
                <p aria-live="polite" className="text-center font-display text-[1.6rem] leading-[1.3] text-cream sm:text-[1.9rem]">
                  {roastText(result, intensity)}
                </p>
              </blockquote>
              <div className="relative mx-auto mt-8 max-w-md">
                <SegmentedRadios
                  name="intensity-result"
                  legend="Change the intensity"
                  options={intensityOptions.map(({ value, label }) => ({ value, label }))}
                  value={intensity}
                  onChange={setIntensity}
                  tone="dark"
                />
              </div>
            </div>

            <section aria-labelledby={`${ids.result}-extras`} className="mt-8">
              <h3 id={`${ids.result}-extras`} className="sr-only">
                Sabrina&rsquo;s extras for today
              </h3>
              <div className="rounded-[1.5rem] border border-plum/15 bg-white/50 px-6 py-5">
                <p className="text-sm font-semibold text-burgundy">Sabrina&rsquo;s advice</p>
                <p className="mt-1 max-w-[56ch] text-[1.05rem] text-plum">{result.advice}</p>
              </div>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-plum/15 bg-white/50 px-6 py-4">
                  <dt className="text-sm font-semibold text-burgundy">Lucky today</dt>
                  <dd className="mt-1 text-plum">{result.lucky}</dd>
                </div>
                <div className="rounded-[1.5rem] border border-plum/15 bg-white/50 px-6 py-4">
                  <dt className="text-sm font-semibold text-burgundy">Avoid today</dt>
                  <dd className="mt-1 text-plum">{result.avoid}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby={`${ids.result}-song`} className="mt-8 rounded-[1.75rem] bg-blush px-6 py-7 text-plum sm:px-8">
              <h3 id={`${ids.result}-song`} className="font-sans text-sm font-semibold text-burgundy">
                Song of the day
              </h3>
              <p className="mt-2 font-display text-[2rem] leading-tight">{result.song.title}</p>
              <p className="mt-1 text-lg">{result.song.artist}</p>
              <p className="mt-4 max-w-[52ch]">{result.songReason}</p>
              {result.genreFallback && (
                <p className="mt-3 max-w-[52ch] text-[0.95rem] text-plum/80">{fallbackNote(result.theme)}</p>
              )}
              <SongPreview key={result.song.id} song={result.song} />
            </section>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary" onClick={onCopy}>
                {copied ? "Copied" : "Copy result"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={changePreferences}>
                Change preferences
              </button>
              <button
                type="button"
                className="btn px-3 font-semibold text-burgundy underline decoration-1 underline-offset-[6px]"
                onClick={startAgain}
              >
                Start again
              </button>
            </div>
            <p role="status" className="mt-3 min-h-[1.5rem] text-[0.95rem] font-medium text-burgundy">
              {status}
            </p>
            <SharePanel
              params={dailyShareParams(result, intensity)}
              card={dailyCard({
                sign: result.sign,
                dateKey: result.dateKey,
                theme: result.theme,
                roastText: roastText(result, intensity),
                intensity,
                song: result.song,
              })}
              fileStem={`askqueen-${result.sign}-${result.dateKey}`}
              shareTitle={`Sabrina's daily roast for ${signProfileById[result.sign].displayName}`}
              songTitle={result.song.title}
            />
            <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-plum/70">
              The copied text and share link include your sign and today&rsquo;s reading, not your name or birthday. Signs use common
              sun-sign dates; if you were born on the edge of two signs, other sources may disagree. For entertainment
              only.
            </p>
          </article>
        )}
      </div>
    </>
  );
}
