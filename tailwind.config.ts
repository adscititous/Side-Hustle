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
          50: "#fef7ee",
          100: "#fdedd3",
          200: "#f9d7a5",
          300: "#f5ba6d",
          400: "#f09333",
          500: "#ec7a12",
          600: "#dd5f08",
          700: "#b74609",
          800: "#92380f",
          900: "#763010",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
