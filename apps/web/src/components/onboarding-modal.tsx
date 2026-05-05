"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronRight, X } from "lucide-react";
import { AgentCube } from "./agent-cube";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const CHOICES = [
  {
    id: "build",
    lottie: "/lottie/build.json",
    title: "Bâtir une BOM",
    desc: "Crée ton premier projet, ajoute des lignes et organise ta nomenclature complète.",
    href: "/projects",
    accent: "#6366F1",
    bg: "rgba(99,102,241,0.08)",
  },
  {
    id: "source",
    lottie: "/lottie/source.json",
    title: "Sourcer avec l'IA",
    desc: "Tape un besoin et laisse l'Agent BOM te proposer des composants depuis Amazon, AliExpress et Google.",
    href: "/projects",
    accent: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: "capture",
    lottie: "/lottie/capture.json",
    title: "Capturer des produits",
    desc: "Installe l'extension Chrome pour capturer des produits directement depuis n'importe quelle page web.",
    href: "https://chrome.google.com/webstore",
    external: true,
    accent: "#10B981",
    bg: "rgba(16,185,129,0.08)",
  },
] as const;

type LottieData = Record<string, unknown>;

function LottieCard({ lottie, accent, bg }: { lottie: string; accent: string; bg: string }) {
  const [data, setData] = React.useState<LottieData | null>(null);

  React.useEffect(() => {
    fetch(lottie)
      .then((r) => r.json())
      .then((d: LottieData) => setData(d))
      .catch(() => setData(null));
  }, [lottie]);

  return (
    <div
      className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0"
      style={{ background: bg, border: `1px solid ${accent}30` }}
    >
      {data ? (
        <Lottie animationData={data} loop autoplay style={{ width: 72, height: 72 }} />
      ) : (
        <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: accent + "40" }} />
      )}
    </div>
  );
}

export function OnboardingModal() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("autobom_onboarded")) {
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(10,9,32,0.96)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.1)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <AgentCube state="idle" size={36} />
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Que veux-tu explorer ?
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choisis un point de départ, tu peux tout faire par la suite.
              </p>
            </div>
            <button
              onClick={dismiss}
              className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors shrink-0"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col divide-y divide-white/6">
          {CHOICES.map((choice) => {
            const isHovered = hovered === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                onMouseEnter={() => setHovered(choice.id)}
                onMouseLeave={() => setHovered(null)}
                className="flex items-center gap-4 px-6 py-4 text-left transition-all duration-150"
                style={{
                  background: isHovered ? "rgba(255,255,255,0.04)" : "transparent",
                }}
              >
                <LottieCard lottie={choice.lottie} accent={choice.accent} bg={choice.bg} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{choice.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {choice.desc}
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 transition-transform duration-150"
                  style={{
                    color: isHovered ? choice.accent : "rgba(255,255,255,0.2)",
                    transform: isHovered ? "translateX(2px)" : "translateX(0)",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/8 flex justify-center">
          <button
            onClick={dismiss}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Passer l&apos;intro →
          </button>
        </div>
      </div>
    </div>
  );
}
