"use client";

import { useEffect, useRef, useState } from "react";

interface LogoProps {
  size?: "md" | "lg";
  dark?: boolean;
}

const logoSizes = {
  md: { text: 28, compass: 21, radius: 1.82, center: 1.62 },
  lg: { text: 48, compass: 30, radius: 2.6, center: 2.4 },
};

export function Logo({ size = "lg", dark = false }: LogoProps) {
  const s = logoSizes[size];
  const c = s.compass;
  const half = c / 2;

  const tipOffset = c * 0.08;
  const bodyStart = half - 1.5;
  const bodyEnd = half + 1.5;
  const needleWidth = c * 0.12;

  const arm = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
    `M${x1},${y1} L${x2},${y2} L${x3},${y3} Z`;

  const north = arm(half, tipOffset, half + needleWidth, bodyStart, half - needleWidth, bodyStart);
  const south = arm(half, c - tipOffset, half + needleWidth, bodyEnd, half - needleWidth, bodyEnd);
  const east = arm(c - tipOffset, half, bodyEnd, half - needleWidth, bodyEnd, half + needleWidth);
  const west = arm(tipOffset, half, bodyStart, half - needleWidth, bodyStart, half + needleWidth);

  const faintColor = dark ? "rgba(253,248,242,0.55)" : "#4b7875";
  const ringColor = dark ? "rgba(253,248,242,0.35)" : "#0B4F4A";
  const textColor = dark ? "#fdf8f2" : "#0B4F4A";
  const primaryColor = "#D97D3E";

  const [phase, setPhase] = useState(0);
  const [needleAngle, setNeedleAngle] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 1000);
    const t3 = setTimeout(() => setPhase(3), 1900);
    const t4 = setTimeout(() => setPhase(4), 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  useEffect(() => {
    if (phase < 4) return;

    let running = true;
    startTimeRef.current = null;

    const spin = (ts: number) => {
      if (!running) return;
      if (!startTimeRef.current) startTimeRef.current = ts;

      const elapsed = ts - startTimeRef.current;
      setNeedleAngle((elapsed / 4000) * 360);
      rafRef.current = requestAnimationFrame(spin);
    };

    rafRef.current = requestAnimationFrame(spin);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  const ringR = half - s.radius;
  const ringCirc = 2 * Math.PI * ringR;

  const nOpacity = phase >= 2 ? 1 : 0;
  const nTranslateX = phase >= 3 ? 0 : phase >= 2 ? 5 : 16;

  const viOpacity = phase >= 2 ? 1 : 0;
  const viTranslateX = phase >= 3 ? 0 : phase >= 2 ? -5 : -16;

  const compassOpacity = phase >= 1 ? 1 : 0;
  const compassTranslateX = phase >= 3 ? 0 : phase >= 2 ? 3 : 12;
  const compassScale = phase >= 3 ? 1.13 : phase >= 1 ? 0.88 : 0.5;

  const displayAngle =
    phase >= 4 ? needleAngle : phase >= 3 ? 0 : phase >= 2 ? 720 : phase >= 1 ? 360 : 0;

  const needleTransition =
    phase === 1
      ? "transform 0.8s cubic-bezier(0.4,0,0.2,1)"
      : phase === 2
        ? "transform 0.9s cubic-bezier(0.23,1,0.32,1)"
        : phase === 3
          ? "transform 0.7s cubic-bezier(0.23,1,0.32,1)"
          : "none";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: "var(--font-display), sans-serif",
        fontWeight: 700,
        lineHeight: 1,
        userSelect: "none",
        letterSpacing: "-0.02em",
        fontSize: `${s.text}px`,
        color: textColor,
        position: "relative",
        gap: 0,
      }}
    >
      <span
        style={{
          display: "inline-block",
          opacity: nOpacity,
          transform: `translateX(${nTranslateX}px)`,
          transition:
            phase === 0
              ? "none"
              : "opacity 0.55s ease, transform 0.75s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        n
      </span>

      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: `${c}px`,
          height: `${c}px`,
          marginBottom: size === "lg" ? "4px" : "2px",
          marginLeft: "1px",
          marginRight: "1px",
          verticalAlign: "baseline",
          opacity: compassOpacity,
          transform: `translateX(${compassTranslateX}px) scale(${compassScale})`,
          transition:
            phase === 0
              ? "none"
              : "opacity 0.4s ease, transform 0.75s cubic-bezier(0.23,1,0.32,1)",
          transformOrigin: "center bottom",
        }}
        aria-hidden="true"
      >
        <svg
          width={c}
          height={c}
          viewBox={`0 0 ${c} ${c}`}
          fill="none"
          style={{ overflow: "visible" }}
        >
          <circle
            cx={half}
            cy={half}
            r={ringR}
            stroke={ringColor}
            strokeWidth="1.2"
            fill="none"
            strokeDasharray={ringCirc}
            strokeDashoffset={phase >= 1 ? 0 : ringCirc}
            strokeLinecap="round"
            style={{
              transition:
                phase === 0 ? "none" : "stroke-dashoffset 0.65s cubic-bezier(0.4,0,0.2,1)",
              transformOrigin: `${half}px ${half}px`,
              transform: "rotate(-90deg)",
            }}
          />

          <g
            style={{
              transformOrigin: `${half}px ${half}px`,
              transform: `rotate(${displayAngle}deg)`,
              transition: needleTransition,
            }}
          >
            <path
              d={south}
              fill={faintColor}
              opacity={phase >= 1 ? 0.85 : 0}
              style={{ transition: "opacity 0.3s ease 0.25s" }}
            />
            <path
              d={east}
              fill={faintColor}
              opacity={phase >= 1 ? 0.85 : 0}
              style={{ transition: "opacity 0.3s ease 0.35s" }}
            />
            <path
              d={west}
              fill={faintColor}
              opacity={phase >= 1 ? 0.85 : 0}
              style={{ transition: "opacity 0.3s ease 0.45s" }}
            />

            <path
              d={north}
              fill={primaryColor}
              opacity={phase >= 1 ? 1 : 0}
              style={{
                filter: "drop-shadow(0px 0px 3px rgba(255,137,4,0.5))",
                transition: "opacity 0.25s ease 0.15s",
              }}
            />

            <circle
              cx={half}
              cy={half}
              r={s.center}
              fill={primaryColor}
              opacity={phase >= 1 ? 1 : 0}
              style={{ transition: "opacity 0.25s ease 0.15s" }}
            />
          </g>
        </svg>
      </span>

      <span
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          opacity: viOpacity,
          transform: `translateX(${viTranslateX}px)`,
          transition:
            phase === 0
              ? "none"
              : "opacity 0.55s ease 0.1s, transform 0.75s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        <span>vi</span>
        <span style={{ color: primaryColor }}>.</span>
      </span>
    </div>
  );
}
