"use client";

import { useEffect, useRef, useState } from "react";
import { spotifyEmbedUrl } from "@/data/songs";
import type { Song } from "@/types/content";

/**
 * "Listen to a preview" button that loads Spotify's official player in place.
 * Nothing from Spotify loads until the button is pressed. Give it
 * key={song.id} so it resets when the song changes.
 */
export function SongPreview({ song }: { song: Song }) {
  const [open, setOpen] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (open) playerRef.current?.focus();
  }, [open]);

  return (
    <>
      {song.spotifyTrackId && open && (
        <div className="mt-6">
          <iframe
            ref={playerRef}
            title={`Spotify player: ${song.title} by ${song.artist}`}
            src={spotifyEmbedUrl(song.spotifyTrackId)}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block w-full rounded-xl border-0"
          />
          <p className="mt-2 text-sm text-plum/75">
            This is Spotify&rsquo;s player. Most listeners hear a 30-second preview; Spotify Premium listeners signed
            in on a computer may hear the whole song.
          </p>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {song.spotifyTrackId && !open && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
              <path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.3-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5Z" />
            </svg>
            Listen to a preview
          </button>
        )}
        <a
          href={song.listenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn ${song.spotifyTrackId && !open ? "btn-ghost" : "btn-primary"}`}
        >
          Find it on Spotify
          <span className="sr-only"> (opens Spotify in a new tab)</span>
        </a>
      </div>
      <p className="mt-3 text-sm text-plum/75">
        {song.spotifyTrackId && !open
          ? "The preview uses Spotify's player, which only loads when you choose to listen."
          : "Find it on Spotify opens a search in a new tab. AskQueen doesn't host any music."}
      </p>
    </>
  );
}
