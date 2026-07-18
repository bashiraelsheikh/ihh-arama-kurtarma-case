import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // İHH Arama Kurtarma teması: koyu lacivert taban + turuncu vurgu
        brand: {
          DEFAULT: "#15293a",
          dark: "#0e1c28",
          light: "#1f4056",
        },
        accent: {
          DEFAULT: "#ea5b0c",
          dark: "#c2470a",
          light: "#f97316",
        },
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
