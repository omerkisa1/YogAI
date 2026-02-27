import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f0f4ee",
          100: "#dce5d8",
          200: "#c3d4bc",
          300: "#a6bf9c",
          400: "#889E81",
          500: "#6f8668",
          600: "#586b53",
          700: "#445240",
          800: "#303a2e",
          900: "#1c221b",
        },
        cream: {
          50: "#FDFCFA",
          100: "#F9F7F2",
          200: "#F3EFE7",
          300: "#EAE4D8",
        },
        charcoal: {
          DEFAULT: "#2D2D2D",
          light: "#4A4A4A",
          lighter: "#6B6B6B",
        },
        clay: {
          50: "#faf5f1",
          100: "#f0e0d3",
          200: "#e0c1a7",
          300: "#c9996f",
          400: "#B27A5B",
          500: "#96624a",
          600: "#7a4e3b",
          700: "#5e3c2e",
          800: "#432b21",
          900: "#2a1b15",
        },
        th: {
          bg: "rgb(var(--c-bg) / <alpha-value>)",
          surface: "rgb(var(--c-surface) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
          subtle: "rgb(var(--c-subtle) / <alpha-value>)",
          muted: "rgb(var(--c-muted) / <alpha-value>)",
          border: "rgb(var(--c-border) / <alpha-value>)",
          text: "rgb(var(--c-text) / <alpha-value>)",
          "text-sec": "rgb(var(--c-text-sec) / <alpha-value>)",
          "text-mut": "rgb(var(--c-text-mut) / <alpha-value>)",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
};

export default config;
