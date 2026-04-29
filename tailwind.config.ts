import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // --- Oasis Precision (Stitch Project 3429793674685852019) ---
        primary: {
          DEFAULT: "#005c55", // Deep Teal
          container: "#ecf5fb", // Light Tonal Container
          on: "#ffffff",
          "on-container": "#00201e",
          950: "#00201e",
        },
        secondary: {
          DEFAULT: "#4a6360",
          container: "#cde9e2",
          on: "#ffffff",
          "on-container": "#07201e",
        },
        surface: {
          DEFAULT: "#f4faff", // Low Depth
          bright: "#ffffff",
          variant: "#dbe4ea",
          container: {
            lowest: "#ffffff", // Pure White
            low: "#f0f4f8",
            DEFAULT: "#e6eff5",
            high: "#e0e9ef",
            highest: "#dbe4ea",
          },
        },
        "on-surface": {
          DEFAULT: "#191c1c",
          variant: "#3f4948",
          muted: "#6e7977",
        },
        accent: {
          DEFAULT: "#f59e0b",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          gold: "#f59e0b",
          teal: "#0d9488",
          rose: "#e11d48",
        },
      },
      spacing: {
        'editorial-tight': '2rem',
        'editorial': '4rem',
        'editorial-wide': '8rem',
        'editorial-huge': '12rem',
      },
      borderRadius: {
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
      },
      boxShadow: {
        'spatial': '0 25px 50px -12px rgba(0, 92, 85, 0.08)',
        'ambient': '0 10px 30px -5px rgba(0, 0, 0, 0.03)',
        card: "0px 2px 4px rgba(20, 29, 33, 0.04)",
        float: "0px 20px 40px rgba(20, 29, 33, 0.06)",
        modal: "0px 24px 48px rgba(20, 29, 33, 0.1)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "primary-gradient": "linear-gradient(135deg, #0f766e 0%, #005c55 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
