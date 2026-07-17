import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6C4AB6",
          50: "#F3EEFB",
          100: "#E7DDF6",
          200: "#CDBBEC",
          300: "#B199E1",
          400: "#8E6ED2",
          500: "#6C4AB6",
          600: "#573A97",
          700: "#432C74",
          800: "#2E4374",
          900: "#231A3D",
        },
        ink: "#1A1726",
        muted: "#6B6880",
        surface: "#FFFFFF",
        canvas: "#F7F6FB",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,23,38,0.04), 0 8px 24px rgba(26,23,38,0.06)",
        lift: "0 12px 40px rgba(67,44,116,0.14)",
        glass: "0 8px 32px rgba(67,44,116,0.10)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
