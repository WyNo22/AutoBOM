"use client";

import * as React from "react";

export type TourStep = {
  id: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
};

type TourContextValue = {
  steps: TourStep[];
  current: number;
  active: boolean;
  start: (steps: TourStep[]) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
};

export const TourContext = React.createContext<TourContextValue>({
  steps: [],
  current: 0,
  active: false,
  start: () => {},
  next: () => {},
  prev: () => {},
  stop: () => {},
});

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = React.useState<TourStep[]>([]);
  const [current, setCurrent] = React.useState(0);
  const [active, setActive] = React.useState(false);

  function start(s: TourStep[]) {
    setSteps(s);
    setCurrent(0);
    setActive(true);
  }

  function next() {
    setCurrent((c) => {
      if (c >= steps.length - 1) { setActive(false); return 0; }
      return c + 1;
    });
  }

  function prev() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  function stop() {
    setActive(false);
    setCurrent(0);
  }

  return (
    <TourContext.Provider value={{ steps, current, active, start, next, prev, stop }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return React.useContext(TourContext);
}
