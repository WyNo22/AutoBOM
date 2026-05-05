"use client";

import * as React from "react";

export type AiState = "idle" | "searching" | "validating" | "warning" | "success";

type AiStateContextValue = {
  state: AiState;
  setState: (s: AiState) => void;
};

export const AiStateContext = React.createContext<AiStateContextValue>({
  state: "idle",
  setState: () => {},
});

export function AiStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AiState>("idle");

  const set = React.useCallback((s: AiState) => {
    setState(s);
    if (s === "success") {
      const t = setTimeout(() => setState("idle"), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <AiStateContext.Provider value={{ state, setState: set }}>
      {children}
    </AiStateContext.Provider>
  );
}

export function useAiState() {
  return React.useContext(AiStateContext);
}
