/**
 * Song of the Day catalogue (AQ-008). The songs live in songs.json, the single
 * source of truth, edited with the local Music Library (`npm run library`).
 * Metadata only: title, artist, genres, themes, energy and an optional Spotify
 * track ID for the official embedded player. No audio, artwork or lyrics.
 */
import type { Song } from "@/types/content";
import { GENRE_LABELS, validateCatalogue, type CatalogueFile, type SongRecord } from "./catalogue";
import catalogue from "./songs.json";

export { GENRE_LABELS };

export function spotifySearchUrl(title: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

/** Spotify's official embedded player for one track (plays a preview for most listeners). */
export function spotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
}

const records = (catalogue as CatalogueFile).songs as SongRecord[];

// A broken catalogue fails the build rather than shipping.
const report = validateCatalogue(records);
if (report.errors > 0) {
  const first = report.issues.filter((i) => i.level === "error").slice(0, 5).map((i) => i.message);
  throw new Error(`songs.json has ${report.errors} error(s). Fix them in the Music Library:\n${first.join("\n")}`);
}

function toSong(r: SongRecord): Song {
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    genres: r.genres,
    themes: r.themes,
    energy: r.energy,
    listenUrl: spotifySearchUrl(r.title, r.artist),
    ...(r.spotifyTrackId ? { spotifyTrackId: r.spotifyTrackId } : {}),
  };
}

const ALL_SONGS: Song[] = records.map(toSong);

/** Songs that can be recommended (retired songs are left out). */
export const SONGS: Song[] = ALL_SONGS.filter((_, i) => !records[i].retired);

/** Every song, retired ones included, so old share links still resolve. */
export const songById: Record<string, Song> = Object.fromEntries(ALL_SONGS.map((song) => [song.id, song]));
