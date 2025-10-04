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
        // FloristMarket.ro Design System 2026
        primary: "#1C6B5A", // verde smarald
        ink: "#1F2421",      // text principal
        subink: "#333845",   // text secundar
        muted: "#6B6B6B",    // text terțiar
        line: "#ECECEC",     // borders
        bg: "#FFFFFF",       // background principal
        "bg-soft": "#F7F4F1", // background secundar
        
        // Compatibilitate cu shadcn/ui
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      spacing: {
        // Scale consistentă: 4, 8, 12, 16, 24, 32, 48, 64
        "1": "4px",
        "2": "8px", 
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
      },
      borderRadius: {
        sm: "8px",   // raze mici
        lg: "16px",  // raze mari
        full: "9999px",
      },
      boxShadow: {
        card: "0 4px 14px rgba(0,0,0,0.06)",  // umbră card
        elev: "0 8px 24px rgba(0,0,0,0.08)",  // umbră elevată
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Scale tipografică optimizată pentru Inter
        "xs": ["12px", { lineHeight: "16px" }],
        "sm": ["14px", { lineHeight: "20px" }],
        "base": ["16px", { lineHeight: "24px" }],
        "lg": ["18px", { lineHeight: "28px" }],
        "xl": ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
        "5xl": ["48px", { lineHeight: "1" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500", 
        semibold: "600",
        bold: "700",
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
  plugins: [
    function({ addUtilities }: any) {
      addUtilities({
        '.btn': {
          '@apply inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-micro': {},
        },
        '.btn-primary': {
          '@apply btn bg-primary text-white hover:bg-primary/90': {},
        },
        '.btn-ghost': {
          '@apply btn hover:bg-bg-soft text-ink': {},
        },
        '.btn-outline': {
          '@apply btn border border-line hover:bg-bg-soft text-ink': {},
        },
        '.chip': {
          '@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-bg-soft text-ink border border-line': {},
        },
        '.field': {
          '@apply w-full border border-line rounded-lg px-3 py-2 bg-white text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-micro': {},
        },
        '.transition-micro': {
          '@apply transition-all duration-150 ease-in-out': {},
        },
      });
    },
  ],
};
export default config;
