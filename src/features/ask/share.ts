import type { AskResponse } from "@/types/content";
import { stanceLabels } from "./engine";

/**
 * Text for "Copy answer" / "Share answer". The question is left out unless
 * the user explicitly ticks "Include my question" (PRD F4 privacy default).
 */
export function formatShareText(
  response: AskResponse,
  options: { question?: string; url: string },
): string {
  const lines: string[] = [];
  if (options.question) lines.push(`I asked: ${options.question}`);
  lines.push(`Sabrina says: ${stanceLabels[response.stance]} ${response.text}`);
  if (response.nudge) lines.push(response.nudge);
  lines.push(`askqueen. The universe has spoken, babe. ${options.url}`);
  return lines.join("\n");
}

/** Public URL of the Ask page, respecting the GitHub Pages base path. */
export function askPageUrl(origin: string, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  return `${origin}${basePath}/ask/`;
}
