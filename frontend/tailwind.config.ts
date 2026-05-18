import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg:       "#1C1C22",
        sidebar:  "#21212A",
        surface:  "#28282F",
        card:     "#2E2E38",
        "card-hover": "#333340",
        border:   "#38383F",
        "border-subtle": "#2E2E36",
        ink:      "#EEEEF5",
        "ink-2":  "#8A8AA2",
        "ink-3":  "#555568",
        blue:     "#00C4FF",
        "blue-dim":  "rgba(0,196,255,0.12)",
        "blue-glow": "rgba(0,196,255,0.25)",
        green:    "#4ADE80",
        "green-dim":   "rgba(74,222,128,0.1)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.45)",
        blue: "0 0 0 1px rgba(0,196,255,0.4), 0 4px 16px rgba(0,196,255,0.2)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up":  "fade-up 0.3s ease forwards",
        "fade-in":  "fade-in 0.25s ease forwards",
        "slide-in": "slide-in 0.3s ease forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
