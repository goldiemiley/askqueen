export type OrbState = "idle" | "thinking" | "revealed";

type Props = {
  className?: string;
  /** Unique prefix for gradient ids when more than one ball is on a page. */
  idPrefix?: string;
  /** idle shows the crown vision; thinking shakes the ball; revealed shows `message`. */
  state?: OrbState;
  /** Short word shown in the ball's answer window when revealed. */
  message?: string;
  /** Change this to replay the reveal animation, even if the message is the same. */
  revealKey?: string | number;
  /** Hide from assistive tech when the same information is given in text nearby. */
  decorative?: boolean;
};

const STARS: Array<[number, number, number, number]> = [
  // x, y, size, delay(ms)
  [52, 64, 9, 200],
  [262, 48, 12, 350],
  [286, 150, 7, 500],
  [34, 190, 6, 650],
  [238, 104, 5, 800],
  [78, 120, 4, 950],
  [292, 226, 5, 1100],
];

function Sparkle({ x, y, s, delay }: { x: number; y: number; s: number; delay: number }) {
  const d = `M${x} ${y - s} C${x + s * 0.12} ${y - s * 0.12} ${x + s * 0.12} ${y - s * 0.12} ${x + s} ${y} C${x + s * 0.12} ${y + s * 0.12} ${x + s * 0.12} ${y + s * 0.12} ${x} ${y + s} C${x - s * 0.12} ${y + s * 0.12} ${x - s * 0.12} ${y + s * 0.12} ${x - s} ${y} C${x - s * 0.12} ${y - s * 0.12} ${x - s * 0.12} ${y - s * 0.12} ${x} ${y - s}Z`;
  return <path d={d} fill="#C9A467" className="star-pop" style={{ animationDelay: `${delay}ms` }} />;
}

/** Original crystal ball illustration for AskQueen. */
export function CrystalBall({ className, idPrefix = "orb", state = "idle", message, revealKey, decorative = false }: Props) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const showMessage = state === "revealed" && Boolean(message);
  const fontSize = message && message.length > 6 ? 26 : 34;
  return (
    <svg
      viewBox="0 0 320 380"
      className={`orb ${className ?? ""}`}
      data-state={state}
      {...(decorative
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": "A glowing crystal ball on an ornate gold stand, surrounded by stars" })}
    >
      <defs>
        <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EAB5C5" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#EAB5C5" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#EAB5C5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("glass")} cx="40%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#FFF4DF" />
          <stop offset="22%" stopColor="#EAB5C5" />
          <stop offset="62%" stopColor="#811D35" />
          <stop offset="100%" stopColor="#302033" />
        </radialGradient>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3CFA6" />
          <stop offset="100%" stopColor="#A9854B" />
        </linearGradient>
        <clipPath id={id("clip")}>
          <circle cx="160" cy="168" r="98" />
        </clipPath>
      </defs>

      {/* Crescent moon */}
      <path
        d="M70 40 a26 26 0 1 0 22 42 a21 21 0 1 1 -22 -42Z"
        fill="#E3CFA6"
        opacity="0.9"
      />

      {STARS.map(([x, y, s, delay]) => (
        <Sparkle key={`${x}-${y}`} x={x} y={y} s={s} delay={delay} />
      ))}

      {/* Halo */}
      <circle cx="160" cy="168" r="140" fill={`url(#${id("halo")})`} className="orb-glow" />

      <g className="orb-body">
      {/* Glass */}
      <circle cx="160" cy="168" r="98" fill={`url(#${id("glass")})`} />
      <g clipPath={`url(#${id("clip")})`}>
        <g className="orb-swirl" opacity="0.55">
          <path
            d="M70 190 C110 120 190 230 250 150"
            stroke="#FFF4DF"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M80 140 C130 200 200 90 248 196"
            stroke="#EAB5C5"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="112" cy="210" r="2.5" fill="#FFF4DF" />
          <circle cx="214" cy="122" r="2" fill="#FFF4DF" />
          <circle cx="196" cy="226" r="1.6" fill="#FFF4DF" />
        </g>
        {/* The vision: a faint crown */}
        <g fill="#FFF4DF" className="orb-crown" opacity={showMessage ? 0 : 0.4}>
          <path d="M130 196 L126 160 L146 178 L160 152 L174 178 L194 160 L190 196 Z" />
          <circle cx="126" cy="157" r="4" />
          <circle cx="160" cy="148" r="4.5" />
          <circle cx="194" cy="157" r="4" />
          <rect x="128" y="200" width="64" height="8" rx="3" />
        </g>
      </g>
      {showMessage && (
        <g key={`${message}-${revealKey ?? ""}`} className="orb-message">
          <circle cx="160" cy="174" r="56" fill="#302033" stroke="#C9A467" strokeWidth="1.5" />
          <text
            x="160"
            y="174"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFF4DF"
            fontFamily="Gloock, Georgia, serif"
            fontSize={fontSize}
          >
            {message}
          </text>
        </g>
      )}
      {/* Highlight */}
      <ellipse cx="116" cy="112" rx="20" ry="10" fill="#FFF4DF" opacity="0.45" transform="rotate(-36 116 112)" />
      <circle cx="160" cy="168" r="98" fill="none" stroke="#E3CFA6" strokeOpacity="0.5" strokeWidth="1.5" />

      {/* Stand */}
      <ellipse cx="160" cy="268" rx="58" ry="10" fill={`url(#${id("gold")})`} />
      <path
        d="M106 270 C112 290 104 306 84 320 L236 320 C216 306 208 290 214 270 Z"
        fill="#811D35"
        stroke="#C9A467"
        strokeWidth="2"
      />
      <path d="M120 280 C140 296 180 296 200 280" stroke="#C9A467" strokeWidth="1.5" fill="none" />
      <path d="M160 292 l6 8 l-6 8 l-6 -8 Z" fill="#C9A467" />
      <circle cx="126" cy="304" r="3" fill="#C9A467" />
      <circle cx="194" cy="304" r="3" fill="#C9A467" />
      <rect x="66" y="320" width="188" height="16" rx="5" fill={`url(#${id("gold")})`} />
      <rect x="84" y="336" width="152" height="8" rx="3" fill="#A9854B" />
      </g>
    </svg>
  );
}
