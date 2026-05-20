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
        bg:           "var(--color-bg)",
        sidebar:      "var(--color-sidebar)",
        surface:      "var(--color-surface)",
        card:         "var(--color-card)",
        "card-hover": "var(--color-card-hover)",
        border:       "var(--color-border)",
        "border-subtle": "var(--color-border-subtle)",
        ink:          "var(--color-ink)",
        "ink-2":      "var(--color-ink-2)",
        "ink-3":      "var(--color-ink-3)",
        blue:         "var(--color-blue)",
        "blue-dim":   "var(--color-blue-dim)",
        "blue-glow":  "var(--color-blue-glow)",
        green:        "var(--color-green)",
        "green-dim":  "var(--color-green-dim)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        blue: "var(--shadow-blue)",
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
