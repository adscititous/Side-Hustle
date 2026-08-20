import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fbf1f2",
          100: "#f6dee1",
          200: "#eebac2",
          300: "#e0919e",
          400: "#c85f72",
          500: "#a83c52",
          600: "#7f2739",
          700: "#661d2d",
          800: "#4f1624",
          900: "#39101a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
