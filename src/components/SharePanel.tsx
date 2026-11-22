"use client";

import { useEffect, useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { renderCardBlob, siteLabel, type CardContent, type CardFormat } from "@/features/share/card";
import { facebookShareUrl, shareUrl } from "@/features/share/links";

type Props = {
  /** Query parameters for the share link (see features/share/links). */
  params: URLSearchParams;
  /** Card content without the footer site, which is filled in here. */
  card: Omit<CardContent, "site">;
  /** File name stem for downloaded images, e.g. "askqueen-leo-daily". */
  fileStem: string;
  /** Title for the phone's share sheet. */
  shareTitle: string;
  /** Song title, to suggest adding it with Instagram's Music sticker. */
  songTitle?: string;
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Share options for a result: copy link, Facebook, an Instagram Story image,
 * a square image, and the phone's own share sheet where available.
 * Links and images never include a name, birthday or question.
 */
export function SharePanel({ params, card, fileStem, shareTitle, songTitle }: Props) {
  const [url, setUrl] = useState("");
  const [site, setSite] = useState("askqueen");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [busy, setBusy] = useState<CardFormat | null>(null);
  const [status, setStatus] = useState("");
  const query = params.toString();

  useEffect(() => {
    // Built after mount because the link needs this site's address.
    /* eslint-disable react-hooks/set-state-in-effect */
    setUrl(shareUrl(window.location.origin, new URLSearchParams(query)));
    setSite(siteLabel(window.location.origin));
    setCanNativeShare(typeof navigator.share === "function");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [query]);

  async function onCopyLink() {
    const ok = await copyToClipboard(url);
    setStatus(ok ? "Link copied. Anyone who opens it sees this exact reading." : "Your browser blocked copying. Copy the address from the Facebook button instead.");
  }

  async function onImage(format: CardFormat) {
    if (busy) return;
    setBusy(format);
    setStatus("");
    try {
      const blob = await renderCardBlob(format, { ...card, site });
      const filename = `${fileStem}-${format}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      if (format === "story" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: shareTitle });
          setStatus("Pick Instagram, then Story, in your share menu.");
        } catch (err) {
          if (!(err instanceof DOMException && err.name === "AbortError")) {
            download(blob, filename);
            setStatus("Image saved. Open Instagram and add it to your Story.");
          }
        }
      } else {
        download(blob, filename);
        setStatus(
          format === "story"
            ? "Story image saved. Open Instagram, tap +, choose Story and pick the image."
            : "Square image saved. Post it anywhere you like.",
        );
      }
    } catch {
      setStatus("Your browser couldn't create the image. Try Copy link instead.");
    } finally {
      setBusy(null);
    }
  }

  async function onNativeShare() {
    try {
      await navigator.share({ title: shareTitle, text: shareTitle, url });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) setStatus("Sharing didn't work here. Use Copy link instead.");
    }
  }

  return (
    <section aria-label="Share this reading" className="mt-8 rounded-[1.5rem] border border-plum/15 bg-white/50 px-6 py-6 text-plum">
      <h3 className="font-display text-[1.6rem] leading-tight text-plum">Share this reading</h3>
      <p className="mt-1 max-w-[54ch] text-[0.95rem] text-plum/75">
        The link and images show this reading only, never your name, birthday or question.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={onCopyLink} disabled={!url}>
          Copy link
        </button>
        <a
          className="btn btn-ghost"
          href={url ? facebookShareUrl(url) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!url}
        >
          Facebook
          <span className="sr-only"> (opens Facebook in a new tab)</span>
        </a>
        <button type="button" className="btn btn-ghost" onClick={() => onImage("story")} aria-disabled={busy !== null}>
          {busy === "story" ? "Making image…" : "Instagram Story"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onImage("square")} aria-disabled={busy !== null}>
          {busy === "square" ? "Making image…" : "Square image"}
        </button>
        {canNativeShare && (
          <button type="button" className="btn btn-ghost" onClick={onNativeShare}>
            More options
          </button>
        )}
      </div>
      {songTitle && (
        <p className="mt-4 max-w-[58ch] text-sm text-plum/75">
          Instagram doesn&rsquo;t let websites add music to Stories. After posting, tap the sticker icon, choose Music
          and search for &ldquo;{songTitle}&rdquo;.
        </p>
      )}
      <p role="status" className="mt-3 min-h-[1.25rem] text-[0.95rem] font-medium text-burgundy">
        {status}
      </p>
    </section>
  );
}
