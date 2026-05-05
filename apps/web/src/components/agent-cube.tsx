"use client";

import { motion, AnimatePresence } from "framer-motion";

export type AgentState = "idle" | "searching" | "warning" | "success";

const stateConfig: Record<AgentState, {
  glow: string;
  border: string;
  scan: boolean;
  accent: string;
  label: string;
}> = {
  idle: {
    glow: "rgba(99,102,241,0.16)",
    border: "rgba(255,255,255,0.06)",
    scan: false,
    accent: "rgba(129,140,248,0.55)",
    label: "READY",
  },
  searching: {
    glow: "rgba(59,130,246,0.28)",
    border: "rgba(96,165,250,0.15)",
    scan: true,
    accent: "rgba(96,165,250,0.75)",
    label: "SCAN",
  },
  warning: {
    glow: "rgba(251,146,60,0.22)",
    border: "rgba(251,146,60,0.14)",
    scan: false,
    accent: "rgba(251,146,60,0.75)",
    label: "CHECK",
  },
  success: {
    glow: "rgba(34,197,94,0.22)",
    border: "rgba(74,222,128,0.16)",
    scan: false,
    accent: "rgba(74,222,128,0.75)",
    label: "OK",
  },
};

const gridPatterns: Record<AgentState, number[]> = {
  idle:      [1, 3, 4, 5, 7],
  searching: [0, 2, 4, 6, 8],
  warning:   [1, 2, 4, 6, 7],
  success:   [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

function PixelGrid({ state }: { state: AgentState }) {
  const pattern = gridPatterns[state];
  return (
    <div className="grid grid-cols-3 gap-[3px]">
      {Array.from({ length: 9 }).map((_, i) => {
        const active = pattern.includes(i);
        return (
          <motion.div
            key={i}
            className="h-[4px] w-[4px] rounded-full"
            animate={{
              opacity: active ? [0.35, 1, 0.35] : 0.12,
              scale: active ? [1, 1.2, 1] : 1,
              backgroundColor: active
                ? "rgba(255,255,255,0.92)"
                : "rgba(255,255,255,0.15)",
            }}
            transition={{
              duration: active ? 1.4 : 0,
              repeat: active ? Infinity : 0,
              ease: "easeInOut",
              delay: i * 0.07,
            }}
          />
        );
      })}
    </div>
  );
}

type AgentCubeProps = {
  state?: AgentState;
  size?: number;
  layoutId?: string;
  className?: string;
};

export function AgentCube({
  state = "idle",
  size = 96,
  layoutId,
  className,
}: AgentCubeProps) {
  const cfg = stateConfig[state];
  const cubeSize = Math.round(size * 0.67);

  return (
    <motion.div
      layout={!!layoutId}
      layoutId={layoutId}
      className={`relative flex items-center justify-center shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      aria-label={`Agent BOM — ${state}`}
      role="img"
    >
      {/* Glow backdrop */}
      <motion.div
        className="absolute rounded-2xl blur-xl"
        style={{ width: cubeSize, height: cubeSize }}
        animate={{
          boxShadow: `0 0 28px 4px ${cfg.glow}`,
          scale: state === "searching" ? [1, 1.08, 1] : 1,
        }}
        transition={{
          duration: state === "searching" ? 1.2 : 0.35,
          repeat: state === "searching" ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* Main cube */}
      <motion.div
        className="relative flex items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0B1020] to-[#05070F]"
        style={{ width: cubeSize, height: cubeSize }}
        animate={{
          borderColor: cfg.border,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.4)`,
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Inner sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: Math.round(cubeSize * 0.12), height: 1, background: "rgba(255,255,255,0.08)" }}
        />

        {/* Scan line */}
        <AnimatePresence>
          {cfg.scan && (
            <motion.div
              key="scanline"
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{ backgroundColor: cfg.accent }}
              initial={{ y: -cubeSize / 2, opacity: 0 }}
              animate={{ y: cubeSize / 2, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </AnimatePresence>

        {/* Pixel screen */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <PixelGrid state={state} />
          <motion.div
            className="font-mono tracking-[0.2em]"
            style={{ fontSize: Math.max(7, Math.round(size * 0.1)) }}
            animate={{
              opacity: state === "idle" ? 0.45 : 1,
              color:
                state === "success"
                  ? "rgba(74,222,128,0.95)"
                  : state === "warning"
                  ? "rgba(251,146,60,0.95)"
                  : state === "searching"
                  ? "rgba(96,165,250,0.95)"
                  : "rgba(255,255,255,0.72)",
            }}
            transition={{ duration: 0.2 }}
          >
            {cfg.label}
          </motion.div>
        </div>

        {/* Success pulse ring */}
        <AnimatePresence>
          {state === "success" && (
            <motion.div
              key="success-ring"
              className="absolute inset-0 rounded-2xl border pointer-events-none"
              style={{ borderColor: "rgba(74,222,128,0.4)" }}
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* Warning shake overlay */}
        <AnimatePresence>
          {state === "warning" && (
            <motion.div
              key="warning-shake"
              className="absolute inset-0 pointer-events-none"
              animate={{ x: [0, -2, 2, -1.5, 1.5, 0] }}
              transition={{ duration: 0.4, repeat: 2 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
