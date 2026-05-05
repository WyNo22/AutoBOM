"use client";

import * as React from "react";
import { useTour } from "./tour-context";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { AgentBOM } from "@/components/agent-bom";

export function TourTooltip() {
  const { steps, current, active, next, prev, stop } = useTour();
  const [pos, setPos] = React.useState<{ top: number; left: number; placement: string } | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const step = steps[current];

  React.useEffect(() => {
    if (!active || !step) { setPos(null); return; }

    function compute() {
      const anchor = document.querySelector(`[data-tour="${step.id}"]`);
      if (!anchor) { setPos(null); return; }
      const rect = anchor.getBoundingClientRect();
      const placement = step.placement ?? "bottom";
      const tw = tooltipRef.current?.offsetWidth ?? 280;
      const th = tooltipRef.current?.offsetHeight ?? 140;
      const gap = 12;

      let top = 0;
      let left = 0;

      if (placement === "bottom") {
        top = rect.bottom + gap + window.scrollY;
        left = rect.left + rect.width / 2 - tw / 2 + window.scrollX;
      } else if (placement === "top") {
        top = rect.top - th - gap + window.scrollY;
        left = rect.left + rect.width / 2 - tw / 2 + window.scrollX;
      } else if (placement === "right") {
        top = rect.top + rect.height / 2 - th / 2 + window.scrollY;
        left = rect.right + gap + window.scrollX;
      } else {
        top = rect.top + rect.height / 2 - th / 2 + window.scrollY;
        left = rect.left - tw - gap + window.scrollX;
      }

      left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
      setPos({ top, left, placement });
    }

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [active, step, current]);

  if (!active || !step || !pos) return null;

  const arrowBase = "absolute w-2.5 h-2.5 rotate-45";
  const arrowStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  function arrowPos() {
    if (pos!.placement === "bottom") return { top: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", borderBottom: "none", borderRight: "none" };
    if (pos!.placement === "top") return { bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", borderTop: "none", borderLeft: "none" };
    if (pos!.placement === "right") return { left: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)", borderRight: "none", borderTop: "none" };
    return { right: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)", borderLeft: "none", borderBottom: "none" };
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: "rgba(0,0,0,0.25)" }}
      />
      <div
        ref={tooltipRef}
        className="fixed z-50 w-72 rounded-xl p-4 flex flex-col gap-3"
        style={{
          top: pos.top,
          left: pos.left,
          background: "rgba(15,14,42,0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(99,102,241,0.15)",
        }}
      >
        <span className={`${arrowBase} absolute`} style={{ ...arrowStyle, ...arrowPos() }} />

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AgentBOM state="idle" size={28} className="shrink-0" />
            <span className="text-sm font-semibold text-foreground">{step.title}</span>
          </div>
          <button
            onClick={stop}
            className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{step.content}</p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            {current + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-1.5">
            {current > 0 && (
              <button
                onClick={prev}
                className="h-7 px-2.5 rounded-lg text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
              >
                <ChevronLeft className="size-3.5" />
                Préc.
              </button>
            )}
            <button
              onClick={next}
              className="h-7 px-3 rounded-lg text-xs flex items-center gap-1 font-medium text-white transition-colors"
              style={{ background: "rgba(99,102,241,0.8)" }}
            >
              {current === steps.length - 1 ? "Terminer" : "Suivant"}
              {current < steps.length - 1 && <ChevronRight className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-1 justify-center">
          {steps.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 16 : 5,
                height: 5,
                background: i === current ? "#6366F1" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
