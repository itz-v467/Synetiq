import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fdfdfc",
        foreground: "#111827",
        muted: "#6b7280",
        border: "#e5e7eb",
        canvas: "#f3f4f6",
        surface: {
          DEFAULT: "#ffffff",
          dim: "#f9fafb",
          bright: "#ffffff",
          container: {
            lowest: "#ffffff",
            low: "#fdfdfc",
            DEFAULT: "#f9fafb",
            high: "#f3f4f6",
            highest: "#e5e7eb",
          },
        },
        primary: { DEFAULT: "#0f172a", foreground: "#ffffff" },
        secondary: {
          DEFAULT: "#4a6700",
          foreground: "#ffffff",
          container: "#bcf543",
          "on-container": "#4f6e00",
        },
        lime: "#84cc16",
        line: { DEFAULT: "#9ca3af", subtle: "#e5e7eb" },
        "on-surface": "#111827",
        "on-surface-variant": "#4b5563",
        error: { DEFAULT: "#ef4444", foreground: "#ffffff" },
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        pill: "100px",
      },
      spacing: {
        gutter: "24px",
        margin: "32px",
        unit: "4px",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        label: ["var(--font-label)", "ui-monospace", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["48px", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      boxShadow: {
        glass: "0 40px 80px -20px rgba(0, 0, 0, 0.04), 0 24px 48px -24px rgba(0, 0, 0, 0.06)",
        nav: "0 25px 50px -12px rgba(0, 0, 0, 0.2)",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
