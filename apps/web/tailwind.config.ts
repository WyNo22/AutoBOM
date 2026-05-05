import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        electric: {
          DEFAULT: "#6366F1",
          dim: "#4F46E5",
          glow: "rgba(99,102,241,0.35)",
        },
        "ai-amber": {
          DEFAULT: "#F59E0B",
          glow: "rgba(245,158,11,0.35)",
        },
        "ai-emerald": {
          DEFAULT: "#10B981",
          glow: "rgba(16,185,129,0.35)",
        },
        "ai-blue": {
          DEFAULT: "#3B82F6",
          glow: "rgba(59,130,246,0.35)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "halo-pulse": "halo-pulse 2s ease-in-out infinite",
        "led-blink": "led-blink 2.4s ease-in-out infinite",
        "led-fast": "led-fast 0.8s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
