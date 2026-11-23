/** Card content and share text for each kind of result. No name or birthday goes in. */
import { signProfileById } from "@/data/signs";
import { themeById } from "@/data/themes";
import { stanceLabels } from "@/features/ask/engine";
import { formatLongDate } from "@/features/daily/date";
import { INTENSITY_LABELS } from "@/features/daily/share";
import { roastText } from "@/features/daily/reading";
import type { AskResponse, DailyResult, Intensity, RoastTheme, Song, ZodiacSign } from "@/types/content";
import type { AskCardContent, DailyCardContent } from "./card";

/** Everything a shared Daily reading shows. Built from a live result or a share link. */
export type DailyShareData = {
  sign: ZodiacSign;
  dateKey: string;
  intensity: Intensity;
  roastText: string;
  theme: RoastTheme;
  song: Song;
  songReason: string;
  advice: string;
  lucky: string;
  avoid: string;
};

export function dailyShareDataFrom(result: DailyResult, intensity: Intensity): DailyShareData {
  return {
    sign: result.sign,
    dateKey: result.dateKey,
    intensity,
    roastText: roastText(result, intensity),
    theme: result.theme,
    song: result.song,
    songReason: result.songReason,
    advice: result.advice,
    lucky: result.lucky,
    avoid: result.avoid,
  };
}

export function dailyCard(d: DailyShareData): Omit<DailyCardContent, "site"> {
  return {
    kind: "daily",
    sign: signProfileById[d.sign].displayName,
    dateLabel: formatLongDate(d.dateKey),
    intensityLabel: INTENSITY_LABELS[d.intensity],
    themeLabel: themeById[d.theme].label,
    roast: d.roastText,
    song: { title: d.song.title, artist: d.song.artist, reason: d.songReason },
  };
}

/** Short text sent with the image or link (share menu, WhatsApp). */
export function dailyShareText(d: DailyShareData, url: string): string {
  return [
    `Sabrina's ${INTENSITY_LABELS[d.intensity].toLowerCase()} roast for ${signProfileById[d.sign].displayName}:`,
    `"${d.roastText}"`,
    `Song for it: ${d.song.title} by ${d.song.artist}`,
    url,
  ].join("\n");
}

/** The full reading as text, for "Copy as text". */
export function dailyFullText(d: DailyShareData, url: string): string {
  const sign = signProfileById[d.sign].displayName;
  return [
    `Sabrina's daily roast for ${sign}, ${formatLongDate(d.dateKey)} (${INTENSITY_LABELS[d.intensity]})`,
    `"${d.roastText}"`,
    `Theme: ${themeById[d.theme].label}`,
    `Song of the day: ${d.song.title} by ${d.song.artist}`,
    d.songReason,
    `Sabrina's advice: ${d.advice}`,
    `Lucky today: ${d.lucky}. Avoid today: ${d.avoid}.`,
    `askqueen. Listen and get your own: ${url}`,
  ].join("\n");
}

export function askCard(response: AskResponse, question?: string | null): Omit<AskCardContent, "site"> {
  return {
    kind: "ask",
    ...(question ? { question } : {}),
    verdict: stanceLabels[response.stance],
    answer: response.text,
    nudge: response.nudge,
  };
}

/** Text for the share menu, WhatsApp and "Copy as text". Includes the question only if given. */
export function askShareText(response: AskResponse, question: string | null, url: string): string {
  const lines: string[] = [];
  if (question) lines.push(`I asked Sabrina: "${question}"`);
  lines.push(`${question ? "She said" : "Sabrina says"}: ${stanceLabels[response.stance]} ${response.text}`);
  if (response.nudge) lines.push(response.nudge);
  lines.push(`askqueen. Ask your own: ${url}`);
  return lines.join("\n");
}
