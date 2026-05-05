"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Scene = {
  emoji: string;
  text: string;
};

const SCENES: Scene[] = [
  { emoji: "🔍", text: "Je scrute Google Shopping..." },
  { emoji: "📦", text: "J'inspecte les fiches Amazon..." },
  { emoji: "⚡", text: "Je cherche sur AliExpress..." },
  { emoji: "🧠", text: "J'analyse les critères techniques..." },
  { emoji: "💰", text: "Je compare les prix..." },
  { emoji: "🗺️", text: "Je me balade sur le web..." },
  { emoji: "📐", text: "Je vérifie les specs..." },
  { emoji: "🚀", text: "Je finalise les résultats..." },
];

function nextRandom(current: number, max: number): number {
  let next = Math.floor(Math.random() * max);
  if (next === current) next = (next + 1) % max;
  return next;
}

export function AgentCubeScenes({ active }: { active: boolean }) {
  const [sceneIdx, setSceneIdx] = React.useState(() => Math.floor(Math.random() * SCENES.length));
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!active) { setVisible(false); return; }
    setVisible(true);
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSceneIdx((prev) => nextRandom(prev, SCENES.length));
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, [active]);

  const scene = SCENES[sceneIdx];

  return (
    <div className="h-5 flex items-center">
      <AnimatePresence mode="wait">
        {active && visible && (
          <motion.span
            key={sceneIdx}
            className="text-xs text-blue-300/80 font-mono flex items-center gap-1.5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <span>{scene.emoji}</span>
            <span>{scene.text}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
