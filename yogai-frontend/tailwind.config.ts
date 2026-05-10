import type { Config } from "tailwindcss";
import { colors } from "./src/lib/colors";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sage: {
          50: colors.primarySoft,
          100: "#D4ECD9",
          200: "#B8DFC8",
          300: "#7CB89A",
          400: colors.primary,
          500: colors.primaryDark,
          600: colors.primaryGradientEnd,
          700: "#154A32",
          800: "#0F3524",
          900: "#0A2418",
        },
        cream: {
          50: colors.surfaceWarm,
          100: colors.background,
          200: colors.backgroundElevated,
          300: colors.surfaceElevated,
        },
        charcoal: {
          DEFAULT: colors.text,
          light: colors.textSecondary,
          lighter: colors.textMuted,
        },
        clay: {
          50: colors.secondarySoft,
          100: "#F5E8DA",
          200: "#E8D4BC",
          300: colors.secondaryLight,
          400: colors.secondary,
          500: "#A67B52",
          600: "#8B6344",
          700: "#704D38",
          800: "#56392C",
          900: "#3D2820",
        },
        primary: {
          DEFAULT: colors.primary,
          light: colors.primaryLight,
          dark: colors.primaryDark,
          soft: colors.primarySoft,
        },
        secondary: {
          DEFAULT: colors.secondary,
          light: colors.secondaryLight,
          soft: colors.secondarySoft,
        },
        accent: {
          DEFAULT: colors.accent,
          soft: colors.accentSoft,
        },
        brand: {
          success: colors.success,
          "success-soft": colors.successSoft,
          warning: colors.warning,
          "warning-soft": colors.warningSoft,
          "warning-dark": colors.warningDark,
          error: colors.error,
          "error-soft": colors.errorSoft,
          info: colors.info,
        },
        stat: {
          green: colors.statGreen,
          blue: colors.statBlue,
          orange: colors.statOrange,
          purple: colors.statPurple,
        },
        difficulty: {
          1: colors.difficulty1,
          2: colors.difficulty2,
          3: colors.difficulty3,
          4: colors.difficulty4,
          5: colors.difficulty5,
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
