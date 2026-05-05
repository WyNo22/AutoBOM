"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { useTour, type TourStep } from "./tour-context";

export function TourTrigger({ steps, storageKey, userId }: { steps: TourStep[]; storageKey: string; userId?: string }) {
  const { start } = useTour();
  const scopedKey = userId ? `${storageKey}_${userId}` : storageKey;

  React.useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(scopedKey)) {
      const t = setTimeout(() => {
        start(steps);
        localStorage.setItem(scopedKey, "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [scopedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      onClick={() => start(steps)}
      aria-label="Aide guidée"
      className="fixed bottom-5 right-5 z-30 size-9 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
      style={{
        background: "rgba(99,102,241,0.85)",
        boxShadow: "0 0 20px rgba(99,102,241,0.4)",
      }}
    >
      <HelpCircle className="size-4 text-white" />
    </button>
  );
}
