import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0EA5E9", // albastru brand
          dark: "#0369A1",
          light: "#7DD3FC",
        },
        ink: "#0f172a",      // text principal
        mist: "#f8fafc",     // background deschis
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      ringOffsetWidth: {
        DEFAULT: "2px",
      },
      ringOffsetColor: {
        DEFAULT: "white",
        dark: "#0b1220",
      },
    },
  },
  plugins: [],
};
export default config;
