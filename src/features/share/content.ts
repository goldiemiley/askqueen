/** Builds share-card content for each kind of result. No personal data goes in. */
import { signProfileById } from "@/data/signs";
import { themeById } from "@/data/themes";
import { categoryLabels, stanceLabels } from "@/features/ask/engine";
import { formatLongDate } from "@/features/daily/date";
import { INTENSITY_LABELS } from "@/features/daily/share";
import type { AskCategory, AskResponse, Intensity, RoastTheme, Song, ZodiacSign } from "@/types/content";
import type { CardContent } from "./card";

export function dailyCard(input: {
  sign: ZodiacSign;
  dateKey: string;
  theme: RoastTheme;
  roastText: string;
  intensity: Intensity;
  song: Song;
}): Omit<CardContent, "site"> {
  return {
    label: `Daily roast, ${INTENSITY_LABELS[input.intensity].toLowerCase()}`,
    title: signProfileById[input.sign].displayName,
    subtitle: formatLongDate(input.dateKey),
    body: input.roastText,
    detail: `Theme: ${themeById[input.theme].label}`,
    song: { title: input.song.title, artist: input.song.artist },
  };
}

export function askCard(response: AskResponse, category: AskCategory | null): Omit<CardContent, "site"> {
  return {
    label: "Ask Queen",
    title: stanceLabels[response.stance],
    subtitle: category ? `Read as: ${categoryLabels[category]}` : undefined,
    body: response.text,
    detail: response.nudge,
  };
}
