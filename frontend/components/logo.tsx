interface LogoProps {
  size?: "md" | "lg";
  dark?: boolean;
}

export function Logo({ size = "lg", dark = false }: LogoProps) {
  const color = dark ? "#FFFFFF" : "#0B4F4A";
  const fontSize = size === "lg" ? "clamp(28px, 7vw, 48px)" : "clamp(20px, 4.5vw, 28px)";

  return (
    <div
      className="inline-flex items-center font-display font-bold tracking-tight leading-none select-none"
      style={{ color, fontSize }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        fill="none"
        style={{
          width: "0.85em",
          height: "0.85em",
          marginRight: "0.2em",
          transform: "translateY(0.04em)",
          overflow: "visible",
          flexShrink: 0,
        }}
      >
        <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="9" />

        <polygon
          points="50,20 65,50 50,80 38,50"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="rotate(30 50 50)"
        />
      </svg>

      <span>NOVI</span>
    </div>
  );
}
