interface LogoProps {
  size?: "md" | "lg";
  dark?: boolean;
}

const logoSizes = {
  md: { text: "text-[28px]", compass: 21, radius: 1.82, center: 1.62, offset: "top-[2px]" },
  lg: { text: "text-5xl", compass: 30, radius: 2.6, center: 2.4, offset: "top-[4px]" },
};

export function Logo({ size = "lg", dark = false }: LogoProps) {
  const s = logoSizes[size];
  const c = s.compass;
  const half = c / 2;

  // Paths
  const tipOffset = c * 0.08;
  const bodyStart = half - 1.5;
  const bodyEnd = half + 1.5;
  const needleWidth = c * 0.12;

  const arm = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => 
    `M${x1},${y1} L${x2},${y2} L${x3},${y3} Z`;

  const north = arm(half, tipOffset, half + needleWidth, bodyStart, half - needleWidth, bodyStart);
  const south = arm(half, c - tipOffset, half + needleWidth, bodyEnd, half - needleWidth, bodyEnd);
  const east  = arm(c - tipOffset, half, bodyEnd, half - needleWidth, bodyEnd, half + needleWidth);
  const west  = arm(tipOffset, half, bodyStart, half - needleWidth, bodyStart, half + needleWidth);

  // Colors linked to Tailwind Theme
  const faintColor = dark ? "rgba(253,248,242,0.55)" : "#4b7875";
const ringColor  = dark ? "rgba(253,248,242,0.35)" : "#0B4F4A";
  const textColor  = dark ? "text-cream" : "text-secondary";

  return (
    <div className={`inline-flex items-baseline font-display font-bold tracking-tight leading-none select-none ${s.text} ${textColor}`} >
      <span>n</span>

      {/* The Compass 'o' */}
      <span
        className={`relative inline-flex items-center justify-center self-baseline ${s.offset} mx-[1px]`}
        style={{ width: `${c}px`, height: `${c}px` }}
        aria-hidden="true"
      >
        <svg width={c} height={c} viewBox={`0 0 ${c} ${c}`} fill="none" className="overflow-visible">
          {/* THE MAGNETIC NEEDLE */}
          {/* North path (Primary Orange) */}
          <path d={north} fill="#D97D3E" />
          {/* South path (Faint) */}
          <path d={south} fill="currentColor" opacity="0.3" />
          {/* Center Pivot */}
          <circle cx={c/2} cy={c/2} r={s.center} fill="#D97D3E" />

          {/* Outer Ring */}
          <circle
            cx={half} cy={half} r={half - s.radius}
            stroke={ringColor}
            strokeWidth="1.2"
          />

          {/* South, East, West - Faint Accents */}
          <path d={south} fill={faintColor} />
          <path d={east}  fill={faintColor} />
          <path d={west}  fill={faintColor} />

          {/* North Needle - The Hero (Orange) */}
          <path 
            d={north} 
            className="fill-primary" 
            style={{ filter: 'drop-shadow(0px 0px 2px rgba(255,137,4,0.3))' }}
          />

          {/* Center Pivot */}
          <circle cx={half} cy={half} r={s.center} className="fill-primary" />
        </svg>
      </span>

      <span>vi</span>
      <span className="text-primary">.</span>
    </div>
  );
}
