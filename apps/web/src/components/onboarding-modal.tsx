"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Hammer, Zap, Camera, X } from "lucide-react";
import { AgentBOM } from "./agent-bom";

const CHOICES = [
  {
    id: "build",
    icon: Hammer,
    title: "Bâtir",
    desc: "Crée ton premier projet et commence une nomenclature.",
    href: "/projects",
    accent: "#6366F1",
    glow: "rgba(99,102,241,0.25)",
  },
  {
    id: "source",
    icon: Zap,
    title: "Sourcer",
    desc: "Teste l'agent IA pour trouver des composants en temps réel.",
    href: "/projects",
    accent: "#3B82F6",
    glow: "rgba(59,130,246,0.25)",
  },
  {
    id: "capture",
    icon: Camera,
    title: "Capturer",
    desc: "Capture des produits depuis n'importe quelle page web.",
    href: "https://chrome.google.com/webstore",
    external: true,
    accent: "#10B981",
    glow: "rgba(16,185,129,0.25)",
  },
] as const;

export function OnboardingModal() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("autobom_onboarded")) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("autobom_onboarded", "1");
    setOpen(false);
  }

  function handleChoice(choice: typeof CHOICES[number]) {
    dismiss();
    if ("external" in choice && choice.external) {
      window.open(choice.href, "_blank", "noopener");
    } else {
      router.push(choice.href);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
      <div
        className="relative w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.12)",
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <AgentBOM state="idle" size={64} />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Bienvenue sur AutoBOM</h2>
            <p className="text-sm text-muted-foreground mt-1">Par où veux-tu commencer ?</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {CHOICES.map((choice) => {
            const Icon = choice.icon;
            const isHovered = hovered === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                onMouseEnter={() => setHovered(choice.id)}
                onMouseLeave={() => setHovered(null)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl text-center transition-all duration-200"
                style={{
                  background: isHovered ? `rgba(255,255,255,0.07)` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isHovered ? choice.accent + "60" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isHovered ? `0 0 24px ${choice.glow}` : "none",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                <div
                  className="size-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: isHovered ? choice.glow : "rgba(255,255,255,0.05)",
                    transition: "background 0.2s ease",
                  }}
                >
                  <Icon className="size-5" style={{ color: choice.accent }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{choice.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{choice.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={dismiss}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors text-center"
        >
          Passer l&apos;intro
        </button>
      </div>
    </div>
  );
}
