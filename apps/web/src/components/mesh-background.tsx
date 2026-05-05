"use client";

import * as React from "react";
import { useAiState } from "./ai-state-context";

const STATE_COLORS: Record<string, { a: string; b: string; c: string }> = {
  idle:       { a: "rgba(79,70,229,0.22)",  b: "rgba(109,40,217,0.15)", c: "rgba(15,10,50,0)" },
  searching:  { a: "rgba(59,130,246,0.30)", b: "rgba(99,102,241,0.22)", c: "rgba(37,99,235,0.14)" },
  validating: { a: "rgba(245,158,11,0.25)", b: "rgba(79,70,229,0.15)",  c: "rgba(180,83,9,0.12)" },
  success:    { a: "rgba(16,185,129,0.25)", b: "rgba(79,70,229,0.14)",  c: "rgba(5,150,105,0.12)" },
};

export function MeshBackground() {
  const { state } = useAiState();
  const colors = STATE_COLORS[state] ?? STATE_COLORS.idle;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none transition-all duration-1000"
      style={{ background: "hsl(240 47% 4%)" }}
    >
      <div
        className="absolute"
        style={{
          width: "80vw",
          height: "80vw",
          top: "-30vw",
          left: "-10vw",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${colors.a} 0%, transparent 70%)`,
          animation: "mesh-shift-a 18s ease-in-out infinite",
          transition: "background 1s ease",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "70vw",
          height: "70vw",
          bottom: "-20vw",
          right: "-10vw",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${colors.b} 0%, transparent 70%)`,
          animation: "mesh-shift-b 22s ease-in-out infinite",
          transition: "background 1s ease",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "50vw",
          height: "50vw",
          top: "40%",
          left: "30%",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${colors.c} 0%, transparent 70%)`,
          animation: "mesh-shift-c 26s ease-in-out infinite",
          transition: "background 1s ease",
        }}
      />
    </div>
  );
}
