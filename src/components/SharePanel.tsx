"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import {
  renderCardBlob,
  siteLabel,
  type AskCardContent,
  type CardContent,
  type CardFormat,
  type DailyCardContent,
} from "@/features/share/card";
import { askCard } from "@/features/share/content";
import { facebookShareUrl, shareUrl, whatsappShareUrl } from "@/features/share/links";
import {
  checkShareableQuestion,
  questionProblemMessages,
  SHARED_QUESTION_MAX,
  withQuestion,
} from "@/features/share/question";
import type { AskResponse } from "@/types/content";

type CardInput = Omit<DailyCardContent, "site"> | Omit<AskCardContent, "site">;

type Props = {
  /** Query parameters of the exact-result link (see features/share/links). */
  params: URLSearchParams;
  /** Card content without the footer site. For Ask, without the question. */
  card: CardInput;
  /** File name stem for images, e.g. "askqueen-leo-2026-11-22". */
  fileStem: string;
  /** Title for the phone's share menu. */
  shareTitle: string;
  /** Short message sent with the image or link. */
  text: (url: string, question: string | null) => string;
  /** Longer text for "Copy as text". Defaults to `text`. */
  fullText?: (url: string, question: string | null) => string;
  /** Daily: the song title, for the Instagram Music sticker tip. */
  songTitle?: string;
  /** Ask: lets the user choose to show their question (off by default). */
  ask?: { response: AskResponse; question: string | null };
  /** Shown above the button. */
  intro?: string;
};

type Rendered = { blob: Blob; file: File; url: string };
type Capabilities = { share: boolean; shareFiles: boolean; touch: boolean };

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

/** Line icons, 20px, inherit colour. */
function Icon({ name }: { name: "link" | "download" | "whatsapp" | "facebook" | "instagram" | "text" | "share" | "close" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "link":
      return <svg {...common}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;
    case "download":
      return <svg {...common}><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></svg>;
    case "whatsapp":
      return <svg {...common}><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /><path d="M9 9.5c.3 2 1.8 3.7 4 4.3l1-1.2 2 .9c-.2 1-1 1.7-2 1.6-3.1-.4-5.5-2.9-5.8-6-.1-1 .6-1.8 1.6-2l.9 2z" /></svg>;
    case "facebook":
      return <svg {...common}><path d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v7h3v-7h2.5l.5-3h-3V8.5a1 1 0 0 1 1-1h2z" /></svg>;
    case "instagram":
      return <svg {...common}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></svg>;
    case "text":
      return <svg {...common}><path d="M5 6h14M5 11h14M5 16h9" /></svg>;
    case "share":
      return <svg {...common}><path d="M12 15V4" /><path d="m8 8 4-4 4 4" /><path d="M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" /></svg>;
    case "close":
      return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>;
  }
}

/**
 * "Share my reading": one button that opens a sheet with a live preview of
 * the exact image, the phone's share menu, and fallbacks (copy link,
 * download, Facebook, WhatsApp, Instagram Story).
 *
 * Both images are drawn when the sheet opens, so pressing Share can call
 * navigator.share() straight away. Safari refuses to open the share menu if
 * the tap was followed by slow work.
 */
export function SharePanel({ params, card, fileStem, shareTitle, text, fullText, songTitle, ask, intro }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [caps, setCaps] = useState<Capabilities>({ share: false, shareFiles: false, touch: false });
  const [format, setFormat] = useState<CardFormat>("story");
  // Images remember which card they were drawn from, so a stale image is never shared.
  const [images, setImages] = useState<{ key: string } & Partial<Record<CardFormat, Rendered>>>({ key: "" });
  const [renderError, setRenderError] = useState(false);
  const [status, setStatus] = useState("");
  const [includeQuestion, setIncludeQuestion] = useState(false);
  const [draft, setDraft] = useState(ask?.question ?? "");
  const ids = { title: useId(), toggle: useId(), question: useId(), qHelp: useId(), qError: useId() };
  const query = params.toString();

  useEffect(() => {
    // Feature detection and the site address are only known in the browser.
    /* eslint-disable react-hooks/set-state-in-effect */
    setOrigin(window.location.origin);
    setCaps((c) => ({
      ...c,
      share: typeof navigator.share === "function",
      touch: window.matchMedia("(pointer: coarse)").matches,
    }));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // The question is only shared when switched on and it passes every check.
  const questionCheck = ask && includeQuestion ? checkShareableQuestion(draft, ask.response) : null;
  const question = questionCheck?.ok ? questionCheck.question : null;
  const blocked = questionCheck !== null && !questionCheck.ok;

  const link = origin ? withQuestion(shareUrl(origin, new URLSearchParams(query)), question) : "";
  const site = origin ? siteLabel(origin) : "";
  const fullCard: CardContent | null = !origin
    ? null
    : ask
      ? { ...askCard(ask.response, question), site }
      : ({ ...card, site } as CardContent);
  const cardKey = JSON.stringify(fullCard);

  // Draw both formats while the sheet is open, again (debounced) after edits.
  useEffect(() => {
    if (!open || !fullCard) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const next: { key: string } & Partial<Record<CardFormat, Rendered>> = { key: cardKey };
        for (const f of ["story", "square"] as const) {
          const blob = await renderCardBlob(f, fullCard);
          const file = new File([blob], `${fileStem}-${f}.png`, { type: "image/png" });
          next[f] = { blob, file, url: URL.createObjectURL(blob) };
        }
        if (cancelled) {
          [next.story, next.square].forEach((r) => r && URL.revokeObjectURL(r.url));
          return;
        }
        setImages((prev) => {
          // Release the previous preview images once the new ones are showing.
          setTimeout(() => [prev.story, prev.square].forEach((r) => r && URL.revokeObjectURL(r.url)), 1000);
          return next;
        });
        setRenderError(false);
        setCaps((c) => ({ ...c, shareFiles: Boolean(navigator.canShare?.({ files: [next.story!.file] })) }));
      } catch {
        if (!cancelled) setRenderError(true);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // cardKey stands in for fullCard's contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cardKey, fileStem]);

  const openSheet = () => {
    setStatus("");
    setOpen(true);
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  };
  const closeSheet = useCallback(() => {
    dialogRef.current?.close();
  }, []);
  const onDialogClose = () => {
    setOpen(false);
    document.documentElement.style.overflow = "";
  };

  const fresh = images.key === cardKey;
  const shown = images[format];
  const current = fresh ? shown : undefined;
  const ready = Boolean(current) && !blocked && Boolean(link);
  const message = link ? text(link, question) : "";

  async function shareImage(f: CardFormat) {
    const img = fresh ? images[f] : undefined;
    if (!img || blocked) return;
    setStatus("");
    try {
      await navigator.share({ files: [img.file], title: shareTitle, text: message });
      // The share menu doesn't tell us whether anything was posted, so no "Shared!" here.
    } catch (err) {
      if (isAbort(err)) return;
      setStatus("Your phone didn’t open the share menu. Download the image or copy the link instead.");
    }
  }

  async function shareLink() {
    if (!link || blocked) return;
    setStatus("");
    try {
      await navigator.share({ title: shareTitle, text: message, url: link });
    } catch (err) {
      if (isAbort(err)) return;
      setStatus("Sharing didn’t work here. Copy the link instead.");
    }
  }

  async function onCopyLink() {
    if (!link || blocked) return;
    const ok = await copyToClipboard(link);
    setStatus(ok ? "Link copied. Anyone who opens it sees this exact reading." : "Your browser blocked copying. Press and hold the link below to copy it.");
  }

  async function onCopyText() {
    if (!link || blocked) return;
    const ok = await copyToClipboard((fullText ?? text)(link, question));
    setStatus(ok ? "Text copied, with the link." : "Your browser blocked copying. Use Copy link instead.");
  }

  function onDownload(f: CardFormat) {
    const img = fresh ? images[f] : undefined;
    if (!img || blocked) return;
    download(img.blob, img.file.name);
    setStatus(
      f === "story"
        ? "Downloading the Story image. In Instagram, tap +, choose Story and pick it from your photos."
        : "Downloading the square image.",
    );
  }

  function onInstagram() {
    if (caps.shareFiles) {
      setFormat("story");
      void shareImage("story");
    } else onDownload("story");
  }

  const mobile = caps.shareFiles || (caps.share && caps.touch);
  const disabled = !ready;

  const secondary: Array<{ key: string; label: string; icon: Parameters<typeof Icon>[0]["name"]; onClick?: () => void; href?: string }> = [
    ...(mobile ? [{ key: "copy", label: "Copy link", icon: "link" as const, onClick: onCopyLink }] : []),
    { key: "download", label: "Download", icon: "download", onClick: () => onDownload(format) },
    { key: "instagram", label: "Instagram Story", icon: "instagram", onClick: onInstagram },
    { key: "whatsapp", label: "WhatsApp", icon: "whatsapp", href: link ? `${whatsappShareUrl(message)}` : undefined },
    { key: "facebook", label: "Facebook", icon: "facebook", href: link ? facebookShareUrl(link) : undefined },
    { key: "text", label: "Copy as text", icon: "text", onClick: onCopyText },
    ...(!mobile && caps.share ? [{ key: "more", label: "More", icon: "share" as const, onClick: shareLink }] : []),
  ];

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className="btn btn-primary" onClick={openSheet} aria-haspopup="dialog">
          <Icon name="share" />
          Share my reading
        </button>
        {intro && <p className="max-w-[40ch] text-sm text-plum/75">{intro}</p>}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={ids.title}
        className="share-sheet text-plum"
        onClose={onDialogClose}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSheet();
        }}
      >
        <div className="share-sheet-body">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-plum/20 sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4">
            <h2 id={ids.title} className="font-display text-[1.75rem] leading-tight text-burgundy">
              Share your reading
            </h2>
            <button type="button" onClick={closeSheet} className="-mr-2 -mt-1 grid h-11 w-11 place-items-center rounded-full text-plum hover:bg-plum/10" aria-label="Close">
              <Icon name="close" />
            </button>
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-start">
            {/* On phones the question choice comes first, before the preview. */}
            {ask && (
              <div className="min-w-0 sm:col-start-2 sm:row-start-1">
                <fieldset className="rounded-2xl border border-plum/15 bg-white/60 p-4">
                  <legend className="sr-only">Your question</legend>
                  <label htmlFor={ids.toggle} className="flex cursor-pointer items-start justify-between gap-4">
                    <span>
                      <span className="block font-semibold text-plum">Show my question</span>
                      <span className="block text-sm text-plum/75">
                        {includeQuestion ? "Recipients will see the question below." : "Off: only Sabrina’s answer is shared."}
                      </span>
                    </span>
                    <input
                      id={ids.toggle}
                      type="checkbox"
                      role="switch"
                      className="share-switch mt-1"
                      checked={includeQuestion}
                      onChange={(e) => setIncludeQuestion(e.target.checked)}
                    />
                  </label>
                  {includeQuestion && (
                    <div className="mt-3">
                      <p id={ids.qHelp} className="rounded-xl bg-blush-soft px-3 py-2 text-sm text-plum">
                        Anyone who sees the image or opens the link will see this question, and links can be forwarded.
                        Edit out names or anything private.
                      </p>
                      <label htmlFor={ids.question} className="mt-3 block text-sm font-semibold text-plum">
                        Question to show
                      </label>
                      <textarea
                        id={ids.question}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={SHARED_QUESTION_MAX}
                        rows={3}
                        autoComplete="off"
                        aria-describedby={`${ids.qHelp} ${ids.qError}`}
                        aria-invalid={blocked}
                        className="mt-1 w-full resize-none rounded-xl border border-plum/25 bg-white px-3 py-2 text-[1rem] text-plum focus-visible:outline-2 focus-visible:outline-burgundy"
                      />
                      <div className="mt-1 flex justify-between gap-3 text-sm">
                        <p id={ids.qError} className="font-medium text-burgundy" aria-live="polite">
                          {questionCheck && !questionCheck.ok ? questionProblemMessages[questionCheck.problem] : ""}
                        </p>
                        <span className="shrink-0 text-plum/60">
                          {draft.length}/{SHARED_QUESTION_MAX}
                        </span>
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>
            )}
            {/* Preview of the exact image */}
            <div className="sm:col-start-1 sm:row-span-2 sm:row-start-1">
              <div role="radiogroup" aria-label="Image shape" className="inline-flex rounded-full bg-plum/8 p-1 text-sm font-semibold">
                {(["story", "square"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={format === f}
                    onClick={() => setFormat(f)}
                    className={`min-h-9 rounded-full px-4 ${format === f ? "bg-plum text-cream" : "text-plum/80 hover:text-plum"}`}
                  >
                    {f === "story" ? "Story" : "Square"}
                  </button>
                ))}
              </div>
              <div className={`mt-3 overflow-hidden rounded-2xl bg-plum ${format === "story" ? "aspect-[9/16] max-h-[38vh] sm:max-h-none" : "aspect-square max-h-[30vh] sm:max-h-none"} mx-auto sm:mx-0`}>
                {shown ? (
                  <div className="relative h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shown.url}
                      alt={format === "story" ? "Preview of the Story image you'll share" : "Preview of the square image you'll share"}
                      className={`h-full w-full object-contain transition-opacity ${fresh ? "" : "opacity-40"}`}
                    />
                    {!fresh && (
                      <p role="status" className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold text-cream">
                        Updating preview…
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid h-full place-items-center p-4 text-center text-sm text-cream/80" role="status">
                    {renderError ? "Your browser couldn’t make the image. You can still copy the link." : "Making your image…"}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 sm:col-start-2">
              <div>
                {mobile ? (
                  <button
                    type="button"
                    className="btn btn-primary w-full justify-center"
                    disabled={disabled}
                    aria-disabled={disabled}
                    onClick={() => (caps.shareFiles ? shareImage(format) : shareLink())}
                  >
                    <Icon name="share" />
                    {caps.shareFiles ? "Share image" : "Share link"}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary w-full justify-center" disabled={disabled} aria-disabled={disabled} onClick={onCopyLink}>
                    <Icon name="link" />
                    Copy link
                  </button>
                )}
                {mobile && (
                  <p className="mt-2 text-center text-sm text-plum/70">Opens your phone’s share menu: Instagram, WhatsApp, Messages and more.</p>
                )}
              </div>

              <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3" aria-label="More ways to share">
                {secondary.map((a) => {
                  const inner = (
                    <>
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-plum text-cream">
                        <Icon name={a.icon} />
                      </span>
                      <span className="text-center text-[0.8rem] font-medium leading-tight">{a.label}</span>
                    </>
                  );
                  const cls = "flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-plum hover:bg-plum/6 aria-disabled:pointer-events-none aria-disabled:opacity-40";
                  return (
                    <li key={a.key}>
                      {a.href !== undefined || a.key === "whatsapp" || a.key === "facebook" ? (
                        <a
                          className={cls}
                          href={disabled ? undefined : a.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-disabled={disabled}
                          onClick={() => setStatus("")}
                        >
                          {inner}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <button type="button" className={cls} onClick={a.onClick} aria-disabled={disabled} disabled={disabled}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              {link && (
                <p className="mt-3 break-all rounded-xl bg-plum/5 px-3 py-2 text-[0.8rem] text-plum/70">
                  <span className="sr-only">Share link: </span>
                  {link}
                </p>
              )}

              <div className="mt-3 space-y-1.5 text-sm text-plum/75">
                {songTitle && (
                  <p>
                    Instagram doesn’t let websites add music. After posting your Story, add the Music sticker and search
                    for “{songTitle}”. The song plays on the AskQueen link.
                  </p>
                )}
                {question && (
                  <p>Facebook and some apps shorten links and may drop the question. The image always shows it.</p>
                )}
              </div>
              <p role="status" className="mt-2 min-h-[1.25rem] text-[0.95rem] font-medium text-burgundy">
                {status}
              </p>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
