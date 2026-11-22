import { signProfileById } from "@/data/signs";
import { themeById } from "@/data/themes";
import type { DailyResult, Intensity } from "@/types/content";
import { formatLongDate } from "./date";
import { roastText } from "./reading";

export const INTENSITY_LABELS: Record<Intensity, string> = {
  gentle: "Gentle",
  savage: "Savage",
  unhinged: "Unhinged",
};

/**
 * Text for "Copy result". It never includes the user's name, birth date or
 * genres, only the sign, date and reading.
 */
export function formatDailyShareText(result: DailyResult, intensity: Intensity, pageUrl: string): string {
  const sign = signProfileById[result.sign].displayName;
  return [
    `Sabrina's daily roast for ${sign}, ${formatLongDate(result.dateKey)} (${INTENSITY_LABELS[intensity]})`,
    `"${roastText(result, intensity)}"`,
    `Theme: ${themeById[result.theme].label}`,
    `Song of the day: ${result.song.title} by ${result.song.artist}`,
    result.songReason,
    `Listen: ${result.song.listenUrl}`,
    `Sabrina's advice: ${result.advice}`,
    `Lucky today: ${result.lucky}. Avoid today: ${result.avoid}.`,
    `askqueen. The universe has spoken, babe. ${pageUrl}`,
  ].join("\n");
}

export function dailyPageUrl(origin: string, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  return `${origin}${basePath}/daily/`;
}
