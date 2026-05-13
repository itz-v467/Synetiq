import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#faf9f9",
        foreground: "#1b1c1c",
        muted: "#8c8c8c",
        border: "#e8e8e8",
        canvas: "#f6f6f4",
        surface: {
          DEFAULT: "#faf9f9",
          dim: "#dbdad9",
          bright: "#faf9f9",
          container: {
            lowest: "#ffffff",
            low: "#f4f3f3",
            DEFAULT: "#efeded",
            high: "#e9e8e8",
            highest: "#e3e2e2",
          },
        },
        primary: { DEFAULT: "#000000", foreground: "#ffffff" },
        secondary: {
          DEFAULT: "#4a6700",
          foreground: "#ffffff",
          container: "#bcf543",
          "on-container": "#4f6e00",
        },
        lime: "#c6ff4d",
        line: { DEFAULT: "#747878", subtle: "#c4c7c7" },
        "on-surface": "#1b1c1c",
        "on-surface-variant": "#444748",
        error: { DEFAULT: "#ba1a1a", foreground: "#ffffff" },
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
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
