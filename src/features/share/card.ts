/**
 * Branded share images drawn on a <canvas> in the browser (no server).
 * Two formats: Instagram Story (1080×1920) and square (1080×1080).
 *
 * Daily cards show the roast with a music-player block for the song.
 * Ask cards show Sabrina's answer, and the question above it only when the
 * user chose to share it. Cards never show a name or birthday.
 * Text is drawn with fillText, so untrusted text can't run as HTML.
 */

export type CardFormat = "story" | "square";

export type DailyCardContent = {
  kind: "daily";
  /** e.g. "Leo" */
  sign: string;
  /** e.g. "Sunday 22 November 2026" */
  dateLabel: string;
  /** e.g. "Savage" */
  intensityLabel: string;
  /** e.g. "Burnout" */
  themeLabel: string;
  roast: string;
  song: { title: string; artist: string; reason: string };
  /** Footer, e.g. "you.github.io/askqueen" */
  site: string;
};

export type AskCardContent = {
  kind: "ask";
  /** Only present when the user chose to share it. */
  question?: string;
  /** e.g. "Yes, babe." */
  verdict: string;
  answer: string;
  nudge?: string;
  site: string;
};

export type CardContent = DailyCardContent | AskCardContent;

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
  plumSoft: "rgba(48,32,51,0.72)",
  creamSoft: "rgba(255,244,223,0.75)",
};

const DISPLAY = "Gloock, Georgia, serif";
const SANS = '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif';

const display = (size: number) => `${size}px ${DISPLAY}`;
const sans = (size: number, weight = 400) => `${weight} ${size}px ${SANS}`;

type Measure = (s: string) => number;

/** Splits a word that is wider than the line into pieces that fit. */
function breakWord(measure: Measure, word: string, maxWidth: number): string[] {
  const parts: string[] = [];
  let part = "";
  for (const ch of Array.from(word)) {
    if (part && measure(part + ch) > maxWidth) {
      parts.push(part);
      part = ch;
    } else part += ch;
  }
  if (part) parts.push(part);
  return parts;
}

/** Splits text into lines no wider than `maxWidth`. Words that are too long are broken. */
export function wrapText(measure: Measure, text: string, maxWidth: number): string[] {
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (measure(w) > maxWidth ? breakWord(measure, w, maxWidth) : [w]));
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

/** Shortens a line with an ellipsis until it fits. */
function ellipsize(measure: Measure, line: string, maxWidth: number): string {
  let s = line.replace(/[\s.,;:!?]+$/, "");
  while (s.length > 1 && measure(`${s}…`) > maxWidth) s = s.slice(0, -1).trimEnd();
  return `${s}…`;
}

export type Fitted = { size: number; lines: string[]; lineHeight: number };

/**
 * Finds the largest size at which `text` fits in maxLines and maxHeight.
 * At the smallest size, extra lines are dropped and the last line ends with "…".
 */
export function fitText(
  ctx: Pick<CanvasRenderingContext2D, "font" | "measureText">,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  sizes: number[],
  limits: { maxLines?: number; maxHeight?: number; lineHeight?: number } = {},
): Fitted {
  const lh = limits.lineHeight ?? 1.28;
  const measure: Measure = (s) => ctx.measureText(s).width;
  const allowed = (size: number) =>
    Math.max(1, Math.min(limits.maxLines ?? Infinity, Math.floor((limits.maxHeight ?? Infinity) / (size * lh))));
  for (const size of sizes) {
    ctx.font = font(size);
    const lines = wrapText(measure, text, maxWidth);
    if (lines.length <= allowed(size)) return { size, lines, lineHeight: size * lh };
  }
  const size = sizes[sizes.length - 1];
  ctx.font = font(size);
  const lines = wrapText(measure, text, maxWidth).slice(0, allowed(size));
  lines[lines.length - 1] = ellipsize(measure, lines[lines.length - 1], maxWidth);
  return { size, lines, lineHeight: size * lh };
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  f: Fitted,
  font: (size: number) => string,
  x: number,
  firstBaseline: number,
  align: CanvasTextAlign,
): number {
  ctx.font = font(f.size);
  ctx.textAlign = align;
  let y = firstBaseline;
  for (const line of f.lines) {
    ctx.fillText(line, x, y);
    y += f.lineHeight;
  }
  return y - f.lineHeight;
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

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

/** The arch frame, or a rounded panel when the content needs the full width at the top. */
function frame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  story: boolean,
  shape: "arch" | "panel" = "arch",
  stars: "all" | "top" = "all",
) {
  ctx.fillStyle = C.plum;
  ctx.fillRect(0, 0, W, H);
  const inset = story ? 56 : 40;
  const path = (i: number, r: number) =>
    shape === "arch" ? archPath(ctx, i, i, W - i * 2, H - i * 2, r) : roundRect(ctx, i, i, W - i * 2, H - i * 2, r * 2);
  ctx.fillStyle = C.plumInk;
  path(inset, 28);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  path(inset + 16, 20);
  ctx.stroke();
  ctx.fillStyle = C.gold;
  const starList = story
    ? [[190, 330, 16], [890, 300, 22], [960, 520, 12], [130, 560, 10]]
    : [[200, 200, 13], [880, 190, 17], [945, 320, 9]];
  for (const [x, y, s] of starList.slice(0, stars === "top" ? 2 : undefined)) sparkle(ctx, x, y, s);
}

function header(ctx: CanvasRenderingContext2D, cx: number, story: boolean, label: string): number {
  const y = story ? 250 : 150;
  ctx.textAlign = "center";
  ctx.fillStyle = C.blush;
  ctx.font = display(story ? 62 : 46);
  ctx.fillText("askqueen.", cx, y);
  ctx.fillStyle = C.gold;
  ctx.font = sans(story ? 32 : 25, 600);
  ctx.fillText(label, cx, y + (story ? 62 : 44));
  return y + (story ? 62 : 44);
}

function footer(ctx: CanvasRenderingContext2D, W: number, H: number, story: boolean, site: string, line: string) {
  const cx = W / 2;
  ctx.textAlign = "center";
  if (story) {
    ctx.fillStyle = C.creamSoft;
    ctx.font = sans(30);
    ctx.fillText(line, cx, H - 150);
  }
  ctx.fillStyle = C.gold;
  ctx.font = sans(story ? 32 : 25, 600);
  const s = fitText(ctx, site, (n) => sans(n, 600), W - 260, story ? [32, 28, 24] : [25, 22, 19], { maxLines: 1 });
  drawLines(ctx, s, (n) => sans(n, 600), cx, story ? H - 100 : H - 78, "center");
}

/** A record-style artwork square: drawn shapes, never real album art. */
function artwork(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, C.burgundy);
  g.addColorStop(1, C.plum);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, s, s, s * 0.16);
  ctx.fill();
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.strokeStyle = "rgba(201,164,103,0.55)";
  ctx.lineWidth = Math.max(2, s * 0.012);
  for (const r of [0.38, 0.3, 0.22]) {
    circle(ctx, cx, cy, s * r);
    ctx.stroke();
  }
  ctx.fillStyle = C.blush;
  circle(ctx, cx, cy, s * 0.11);
  ctx.fill();
  ctx.fillStyle = C.plum;
  circle(ctx, cx, cy, s * 0.025);
  ctx.fill();
}

function playButton(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = C.burgundy;
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.fillStyle = C.cream;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.3, y - r * 0.42);
  ctx.lineTo(x + r * 0.45, y);
  ctx.lineTo(x - r * 0.3, y + r * 0.42);
  ctx.closePath();
  ctx.fill();
}

function skipGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, dir: 1 | -1) {
  ctx.fillStyle = C.plumSoft;
  for (const off of [0, s * 0.55]) {
    ctx.beginPath();
    ctx.moveTo(x + dir * (off - s * 0.5), y - s * 0.4);
    ctx.lineTo(x + dir * (off + s * 0.05), y);
    ctx.lineTo(x + dir * (off - s * 0.5), y + s * 0.4);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDaily(ctx: CanvasRenderingContext2D, format: CardFormat, card: DailyCardContent) {
  const story = format === "story";
  const { width: W, height: H } = CARD_SIZES[format];
  const cx = W / 2;
  frame(ctx, W, H, story);
  let y = header(ctx, cx, story, `${card.intensityLabel} daily roast`);

  // Sign and date
  ctx.fillStyle = C.cream;
  y += story ? 150 : 104;
  const sign = fitText(ctx, card.sign, display, W - 260, story ? [140, 120, 100] : [92, 80, 68], { maxLines: 1 });
  drawLines(ctx, sign, display, cx, y, "center");
  ctx.fillStyle = C.creamSoft;
  y += story ? 60 : 42;
  ctx.font = sans(story ? 34 : 26);
  ctx.fillText(story ? card.dateLabel : `${card.dateLabel}. Theme: ${card.themeLabel}`, cx, y);
  if (story) {
    y += 62;
    ctx.fillStyle = C.gold;
    ctx.font = sans(32, 600);
    ctx.fillText(`Theme: ${card.themeLabel}`, cx, y);
  }

  // Player block position, then the roast fills the space above it
  const px = story ? 110 : 100;
  const pw = W - px * 2;
  const ph = story ? 560 : 196;
  const pTop = story ? H - 250 - ph : H - 128 - ph;
  const roastTop = y + (story ? 50 : 34);
  const roastBottom = pTop - (story ? 60 : 34);
  ctx.fillStyle = C.cream;
  const roast = fitText(ctx, `“${card.roast}”`, display, W - (story ? 230 : 210), story ? [66, 60, 54, 48, 44, 40] : [46, 42, 38, 34, 30, 27], {
    maxHeight: roastBottom - roastTop,
  });
  const blockH = roast.lines.length * roast.lineHeight;
  drawLines(ctx, roast, display, cx, roastTop + Math.max(0, (roastBottom - roastTop - blockH) / 2) + roast.size * 0.9, "center");

  // Music player block
  ctx.fillStyle = C.cream;
  roundRect(ctx, px, pTop, pw, ph, story ? 44 : 32);
  ctx.fill();

  if (story) {
    const pad = 52;
    const ix = px + pad;
    ctx.fillStyle = C.burgundy;
    ctx.textAlign = "left";
    ctx.font = sans(28, 600);
    ctx.fillText("Sabrina’s song for this roast", ix, pTop + 70);
    const art = 168;
    const artTop = pTop + 100;
    artwork(ctx, ix, artTop, art);
    const tx = ix + art + 36;
    const tw = px + pw - pad - tx;
    ctx.fillStyle = C.plum;
    // One line if it fits at a good size, otherwise two smaller lines.
    const oneLine = fitText(ctx, card.song.title, display, tw, [58, 52, 46], { maxLines: 1, lineHeight: 1.12 });
    const title = oneLine.lines[0].endsWith("…")
      ? fitText(ctx, card.song.title, display, tw, [46, 42, 38, 34], { maxLines: 2, lineHeight: 1.12 })
      : oneLine;
    const titleEnd = drawLines(ctx, title, display, tx, artTop + title.size * 0.95, "left");
    ctx.fillStyle = C.plumSoft;
    const artist = fitText(ctx, card.song.artist, (n) => sans(n, 500), tw, [34, 30, 26], { maxLines: 1 });
    drawLines(ctx, artist, (n) => sans(n, 500), tx, Math.max(titleEnd + 52, artTop + 120), "left");

    // Progress bar and controls (decorative)
    const barY = artTop + art + 50;
    ctx.fillStyle = "rgba(48,32,51,0.14)";
    roundRect(ctx, ix, barY, pw - pad * 2, 10, 5);
    ctx.fill();
    ctx.fillStyle = C.burgundy;
    roundRect(ctx, ix, barY, (pw - pad * 2) * 0.34, 10, 5);
    ctx.fill();
    circle(ctx, ix + (pw - pad * 2) * 0.34, barY + 5, 12);
    ctx.fill();
    const ctrlY = barY + 76;
    playButton(ctx, cx, ctrlY, 42);
    skipGlyph(ctx, cx - 120, ctrlY, 34, -1);
    skipGlyph(ctx, cx + 120, ctrlY, 34, 1);

    ctx.fillStyle = C.plumSoft;
    const reason = fitText(ctx, card.song.reason, sans, pw - pad * 2, [30, 28, 26, 24], { maxLines: 2, lineHeight: 1.3 });
    drawLines(ctx, reason, sans, cx, ctrlY + 92, "center");
  } else {
    const pad = 30;
    const art = ph - pad * 2;
    artwork(ctx, px + pad, pTop + pad, art);
    const tx = px + pad + art + 30;
    const playX = px + pw - pad - 44;
    const tw = playX - 44 - 26 - tx;
    ctx.textAlign = "left";
    ctx.fillStyle = C.burgundy;
    ctx.font = sans(22, 600);
    ctx.fillText("Song for this roast", tx, pTop + 56);
    ctx.fillStyle = C.plum;
    const title = fitText(ctx, card.song.title, display, tw, [44, 40, 36, 32, 28], { maxLines: 1 });
    drawLines(ctx, title, display, tx, pTop + 108, "left");
    ctx.fillStyle = C.plumSoft;
    const artist = fitText(ctx, card.song.artist, (n) => sans(n, 500), tw, [28, 25, 22], { maxLines: 1 });
    drawLines(ctx, artist, (n) => sans(n, 500), tx, pTop + 150, "left");
    playButton(ctx, playX, pTop + ph / 2, 44);
  }

  footer(ctx, W, H, story, card.site, "Hear the song and get your own roast at");
}

function drawAsk(ctx: CanvasRenderingContext2D, format: CardFormat, card: AskCardContent) {
  const story = format === "story";
  const { width: W, height: H } = CARD_SIZES[format];
  const cx = W / 2;
  // The square Q&A needs the full width near the top, where the arch curves in.
  frame(ctx, W, H, story, card.question && !story ? "panel" : "arch", card.question ? "top" : "all");
  let y = header(ctx, cx, story, "Ask Queen");
  const bottom = H - (story ? 230 : 120);
  const textW = W - (story ? 260 : 230);

  if (card.question) {
    // Measure everything first, then centre the Q&A between header and footer.
    const bx = story ? 120 : 110;
    const bw = W - bx * 2;
    const pad = story ? 48 : 34;
    const areaTop = y + (story ? 80 : 50);
    const avail = bottom - areaTop;
    const labelH = story ? 46 : 34;
    const tail = story ? 36 : 26;
    const qFont = (n: number) => sans(n, 500);
    const q = fitText(ctx, `“${card.question}”`, qFont, bw - pad * 2, story ? [60, 54, 48, 44, 40, 36, 32] : [40, 36, 32, 28, 25, 22], {
      maxHeight: avail * 0.42,
      lineHeight: 1.3,
    });
    const bh = q.lines.length * q.lineHeight + pad * 2 - (q.lineHeight - q.size);
    const gap = story ? 90 : 56;
    const verdict = fitText(ctx, card.verdict, display, bw, story ? [120, 104, 90] : [72, 62, 54], { maxLines: 1 });
    const verdictH = verdict.size + (story ? 30 : 16);
    const nudge = card.nudge && story ? fitText(ctx, card.nudge, sans, bw, [36, 32, 28], { maxLines: 2, lineHeight: 1.3 }) : null;
    const nudgeH = nudge ? nudge.lines.length * nudge.lineHeight + 30 : 0;
    const fixed = labelH + bh + tail + gap + labelH + verdictH + nudgeH;
    const answer = fitText(ctx, card.answer, display, bw, story ? [76, 68, 60, 54, 48, 44, 40, 36] : [52, 46, 40, 36, 32, 28, 24], {
      maxHeight: avail - fixed,
    });
    const answerH = answer.lines.length * answer.lineHeight;
    let top = areaTop + Math.max(0, (avail - fixed - answerH) / 2);

    // Question: cream speech bubble, sans serif.
    ctx.textAlign = "left";
    ctx.fillStyle = C.blush;
    ctx.font = sans(story ? 30 : 23, 600);
    ctx.fillText("Asked Sabrina", bx, top + (story ? 30 : 23));
    top += labelH;
    ctx.fillStyle = C.cream;
    roundRect(ctx, bx, top, bw, bh, story ? 40 : 28);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + 70, top + bh - 2);
    ctx.lineTo(bx + 70, top + bh + tail);
    ctx.lineTo(bx + 120, top + bh - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.plum;
    drawLines(ctx, q, qFont, bx + pad, top + pad + q.size * 0.85, "left");
    top += bh + tail + gap;

    // Answer: display serif.
    ctx.fillStyle = C.gold;
    ctx.textAlign = "left";
    ctx.font = sans(story ? 30 : 23, 600);
    ctx.fillText("Sabrina’s answer", bx, top + (story ? 30 : 23));
    top += labelH;
    ctx.fillStyle = C.blush;
    drawLines(ctx, verdict, display, bx, top + verdict.size * 0.85, "left");
    top += verdictH;
    ctx.fillStyle = C.cream;
    const end = drawLines(ctx, answer, display, bx, top + answer.size * 0.9, "left");
    if (nudge) {
      ctx.fillStyle = C.creamSoft;
      drawLines(ctx, nudge, sans, bx, end + 30 + nudge.size, "left");
    }
  } else {
    // Answer only: centred, as before.
    y += story ? 230 : 140;
    ctx.fillStyle = C.blush;
    const verdict = fitText(ctx, card.verdict, display, textW, story ? [140, 120, 100] : [92, 80, 68], { maxLines: 1 });
    drawLines(ctx, verdict, display, cx, y, "center");
    const top = y + (story ? 70 : 44);
    const nudgeSpace = card.nudge ? (story ? 140 : 70) : 0;
    ctx.fillStyle = C.cream;
    const answer = fitText(ctx, card.answer, display, textW, story ? [68, 62, 56, 50, 46] : [48, 44, 40, 36, 32], {
      maxHeight: bottom - top - nudgeSpace,
    });
    const blockH = answer.lines.length * answer.lineHeight;
    const start = top + Math.max(0, (bottom - nudgeSpace - top - blockH) / 2) + answer.size * 0.9;
    const end = drawLines(ctx, answer, display, cx, start, "center");
    if (card.nudge) {
      ctx.fillStyle = C.gold;
      const n = fitText(ctx, card.nudge, (s) => sans(s, 600), textW, story ? [34, 30] : [26, 23], { maxLines: 2, lineHeight: 1.3 });
      drawLines(ctx, n, (s) => sans(s, 600), cx, end + (story ? 90 : 56), "center");
    }
  }

  footer(ctx, W, H, story, card.site, "Ask Sabrina your own question at");
}

/** Draws the card. Fonts should already be loaded (see loadCardFonts). */
export function drawCard(ctx: CanvasRenderingContext2D, format: CardFormat, card: CardContent) {
  ctx.textBaseline = "alphabetic";
  if (card.kind === "daily") drawDaily(ctx, format, card);
  else drawAsk(ctx, format, card);
}

/** Makes sure the brand fonts are ready before drawing on the canvas. */
export async function loadCardFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load(`64px ${DISPLAY}`),
    document.fonts.load(sans(32)),
    document.fonts.load(sans(32, 500)),
    document.fonts.load(sans(32, 600)),
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
