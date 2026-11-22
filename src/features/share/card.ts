/**
 * Branded share images drawn on a <canvas> in the browser (no server).
 * Two formats: Instagram Story (1080×1920) and square (1080×1080).
 * Cards show only the reading: never a name, birthday or question.
 */

export type CardFormat = "story" | "square";

export type CardContent = {
  /** Small line at the top, e.g. "Daily roast" or "Ask Queen". */
  label: string;
  /** Big heading, e.g. "Leo" or "Yes." */
  title: string;
  /** Line under the title, e.g. "Saturday 22 November 2026". */
  subtitle?: string;
  /** The main text: the roast or Sabrina's answer. */
  body: string;
  /** Short gold line under the body, e.g. "Theme: Burnout". */
  detail?: string;
  /** Song of the day, if any. */
  song?: { title: string; artist: string };
  /** Shown at the bottom, e.g. "you.github.io/askqueen". */
  site: string;
};

export const CARD_SIZES: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

const C = {
  plum: "#302033",
  plumInk: "#241826",
  cream: "#FFF4DF",
  blush: "#EAB5C5",
  gold: "#C9A467",
  burgundy: "#811D35",
};

const DISPLAY = "Gloock, Georgia, serif";
const SANS = '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif';

/** Splits text into lines that fit `maxWidth` with the context's current font. */
export function wrapText(
  measure: (s: string) => number,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  maxWidth: number,
  maxLines: number,
  sizes: number[],
): { size: number; lines: string[] } {
  for (const size of sizes) {
    ctx.font = `${size}px ${family}`;
    const lines = wrapText((s) => ctx.measureText(s).width, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  ctx.font = `${size}px ${family}`;
  const lines = wrapText((s) => ctx.measureText(s).width, text, maxWidth);
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:!?]?$/, "")}…`;
  return { size, lines: kept };
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.12, x + s, y);
  ctx.quadraticCurveTo(x + s * 0.12, y + s * 0.12, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.12, y + s * 0.12, x - s, y);
  ctx.quadraticCurveTo(x - s * 0.12, y - s * 0.12, x, y - s);
  ctx.fill();
}

function archPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bottomRadius: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h - bottomRadius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - bottomRadius, y + h);
  ctx.lineTo(x + bottomRadius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bottomRadius);
  ctx.closePath();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function centered(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

/** Draws the card. Fonts should already be loaded (see loadCardFonts). */
export function drawCard(ctx: CanvasRenderingContext2D, format: CardFormat, card: CardContent) {
  const { width: W, height: H } = CARD_SIZES[format];
  const story = format === "story";
  const cx = W / 2;
  ctx.textBaseline = "alphabetic";

  // Background and arched gold frame
  ctx.fillStyle = C.plum;
  ctx.fillRect(0, 0, W, H);
  const inset = story ? 56 : 44;
  ctx.fillStyle = C.plumInk;
  archPath(ctx, inset, inset, W - inset * 2, H - inset * 2, 28);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  archPath(ctx, inset + 16, inset + 16, W - (inset + 16) * 2, H - (inset + 16) * 2, 20);
  ctx.stroke();

  // Stars
  ctx.fillStyle = C.gold;
  for (const [x, y, s] of story
    ? [[180, 330, 16], [900, 300, 22], [960, 520, 12], [130, 560, 10]]
    : [[190, 210, 14], [890, 200, 18], [950, 340, 10]]) {
    sparkle(ctx, x, y, s);
  }

  const maxText = W - (story ? 220 : 200);
  let y = story ? 300 : 200;

  // Wordmark and label
  ctx.fillStyle = C.blush;
  ctx.font = `${story ? 64 : 52}px ${DISPLAY}`;
  centered(ctx, "askqueen.", cx, y);
  y += story ? 70 : 52;
  ctx.fillStyle = C.gold;
  ctx.font = `600 ${story ? 34 : 28}px ${SANS}`;
  centered(ctx, card.label, cx, y);

  // Title
  y += story ? 150 : 110;
  ctx.fillStyle = C.cream;
  const title = fitText(ctx, card.title, DISPLAY, maxText, 1, story ? [150, 120, 96] : [112, 92, 76]);
  ctx.font = `${title.size}px ${DISPLAY}`;
  centered(ctx, title.lines[0], cx, y);
  if (card.subtitle) {
    y += story ? 64 : 50;
    ctx.fillStyle = "rgba(255,244,223,0.75)";
    ctx.font = `${story ? 36 : 30}px ${SANS}`;
    centered(ctx, card.subtitle, cx, y);
  }

  // Body
  const songBlock = card.song ? (story ? 300 : 0) : 0;
  const footerTop = H - (story ? 200 : 150);
  const bodyTop = y + (story ? 110 : 80);
  const bodyBottom = footerTop - songBlock - (card.detail ? (story ? 90 : 60) : 30) - (story ? 40 : 0);
  const sizes = story ? [68, 62, 56, 50, 46] : [50, 46, 42, 38, 34];
  const available = bodyBottom - bodyTop;
  let fitted: { size: number; lines: string[] } | null = null;
  for (const size of sizes) {
    ctx.font = `${size}px ${DISPLAY}`;
    const lines = wrapText((s) => ctx.measureText(s).width, card.body, maxText);
    if (lines.length * size * 1.28 <= available) {
      fitted = { size, lines };
      break;
    }
  }
  if (!fitted) {
    const smallest = sizes[sizes.length - 1];
    fitted = fitText(ctx, card.body, DISPLAY, maxText, Math.max(1, Math.floor(available / (smallest * 1.28))), [smallest]);
  }
  ctx.fillStyle = C.cream;
  ctx.font = `${fitted.size}px ${DISPLAY}`;
  const lineH = fitted.size * 1.28;
  const blockH = fitted.lines.length * lineH;
  let by = bodyTop + Math.max(0, (bodyBottom - bodyTop - blockH) / 2) + fitted.size;
  for (const line of fitted.lines) {
    centered(ctx, line, cx, by);
    by += lineH;
  }

  if (card.detail) {
    ctx.fillStyle = C.gold;
    ctx.font = `600 ${story ? 36 : 30}px ${SANS}`;
    centered(ctx, card.detail, cx, by + (story ? 30 : 16));
  }

  // Song
  if (card.song) {
    if (story) {
      const bx = 130;
      const bw = W - 260;
      const bh = 240;
      const bTop = footerTop - bh - 40;
      ctx.fillStyle = C.blush;
      roundRect(ctx, bx, bTop, bw, bh, 36);
      ctx.fill();
      ctx.fillStyle = C.burgundy;
      ctx.font = `600 30px ${SANS}`;
      centered(ctx, "Song of the day", cx, bTop + 62);
      ctx.fillStyle = C.plum;
      const st = fitText(ctx, card.song.title, DISPLAY, bw - 80, 1, [58, 50, 44, 38]);
      ctx.font = `${st.size}px ${DISPLAY}`;
      centered(ctx, st.lines[0], cx, bTop + 140);
      const sa = fitText(ctx, card.song.artist, SANS, bw - 80, 1, [34, 30, 26]);
      ctx.font = `${sa.size}px ${SANS}`;
      centered(ctx, sa.lines[0], cx, bTop + 196);
    } else {
      ctx.fillStyle = C.blush;
      const line = fitText(ctx, `Song of the day: ${card.song.title}, ${card.song.artist}`, SANS, maxText, 1, [30, 26, 22]);
      ctx.font = `${line.size}px ${SANS}`;
      centered(ctx, line.lines[0], cx, footerTop - 10);
    }
  }

  // Footer
  ctx.fillStyle = "rgba(255,244,223,0.7)";
  ctx.font = `${story ? 32 : 26}px ${SANS}`;
  centered(ctx, "The universe has spoken, babe.", cx, H - (story ? 150 : 110));
  ctx.fillStyle = C.gold;
  ctx.font = `600 ${story ? 32 : 26}px ${SANS}`;
  centered(ctx, card.site, cx, H - (story ? 100 : 72));
}

/** Makes sure the brand fonts are ready before drawing on the canvas. */
export async function loadCardFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load(`64px ${DISPLAY}`),
    document.fonts.load(`400 32px ${SANS}`),
    document.fonts.load(`600 32px ${SANS}`),
  ]).catch(() => undefined);
}

export async function renderCardBlob(format: CardFormat, card: CardContent): Promise<Blob> {
  await loadCardFonts();
  const { width, height } = CARD_SIZES[format];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  drawCard(ctx, format, card);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create image"))), "image/png"),
  );
}

/** "you.github.io/askqueen" from the current page, for the card footer. */
export function siteLabel(origin: string, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  return `${origin.replace(/^https?:\/\//, "")}${basePath}`;
}
