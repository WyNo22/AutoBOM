"use client";

import * as React from "react";
import type { AiState } from "./ai-state-context";

const GLOW: Record<AiState, string> = {
  idle:       "rgba(99,102,241,0.4)",
  searching:  "rgba(59,130,246,0.7)",
  validating: "rgba(245,158,11,0.6)",
  success:    "rgba(16,185,129,0.65)",
};

const LED_COLOR: Record<AiState, string> = {
  idle:       "#a5b4fc",
  searching:  "#93c5fd",
  validating: "#fcd34d",
  success:    "#6ee7b7",
};

type Props = {
  state?: AiState;
  size?: number;
  className?: string;
};

export function AgentBOM({ state = "idle", size = 72, className = "" }: Props) {
  const glow = GLOW[state];
  const led = LED_COLOR[state];
  const isSearching = state === "searching";
  const ledClass = isSearching ? "animate-led-fast" : "animate-led-blink";

  const dots: { cx: number; cy: number; delay: string }[] = [
    { cx: 20, cy: 28, delay: "0s" },
    { cx: 28, cy: 28, delay: "0.15s" },
    { cx: 36, cy: 28, delay: "0.3s" },
    { cx: 20, cy: 36, delay: "0.45s" },
    { cx: 28, cy: 36, delay: "0s" },
    { cx: 36, cy: 36, delay: "0.2s" },
    { cx: 20, cy: 44, delay: "0.35s" },
    { cx: 28, cy: 44, delay: "0.5s" },
    { cx: 36, cy: 44, delay: "0.1s" },
  ];

  return (
    <div
      className={`relative inline-flex items-end justify-center animate-float ${className}`}
      style={{ width: size, height: size * 1.2 }}
    >
      <div
        className="absolute animate-halo-pulse rounded-full pointer-events-none"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          bottom: -size * 0.1,
          left: "50%",
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse at center, ${glow} 0%, transparent 70%)`,
          transition: "background 0.6s ease",
        }}
      />
      <svg
        width={size}
        height={size * 1.1}
        viewBox="0 0 56 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 0 8px ${glow})`, transition: "filter 0.6s ease" }}
      >
        {/* Antenna */}
        <line x1="28" y1="2" x2="28" y2="10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="28" cy="2" r="2.5" fill={led} className={ledClass} />

        {/* Head / body */}
        <rect x="8" y="10" width="40" height="38" rx="5" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.5" />

        {/* Screen bezel */}
        <rect x="12" y="14" width="32" height="26" rx="3" fill="#0f0e2a" stroke="#312e81" strokeWidth="1" />

        {/* LED dot matrix */}
        {dots.map(({ cx, cy, delay }, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="2.2"
            fill={led}
            className={ledClass}
            style={{ animationDelay: delay }}
          />
        ))}

        {/* Left arm */}
        <rect x="2" y="18" width="6" height="16" rx="3" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.2" />
        <rect x="1" y="32" width="8" height="5" rx="2" fill="#312e81" />

        {/* Right arm */}
        <rect x="48" y="18" width="6" height="16" rx="3" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.2" />
        <rect x="47" y="32" width="8" height="5" rx="2" fill="#312e81" />

        {/* Legs */}
        <rect x="14" y="48" width="10" height="14" rx="3" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.2" />
        <rect x="32" y="48" width="10" height="14" rx="3" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.2" />

        {/* Feet */}
        <rect x="12" y="58" width="14" height="5" rx="2" fill="#312e81" />
        <rect x="30" y="58" width="14" height="5" rx="2" fill="#312e81" />

        {/* Status indicator bottom of body */}
        <circle cx="28" cy="51" r="2" fill={led} className={ledClass} />
      </svg>
    </div>
  );
}
