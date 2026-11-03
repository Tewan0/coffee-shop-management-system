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
        coffee: {
          50: "#fdf8f4",
          100: "#f8ede2",
          200: "#eddac7",
          300: "#debe9e",
          400: "#c8996b",
          500: "#a87444",
          600: "#875630",
          700: "#6c4225",
          800: "#4f2e1a",
          900: "#381f10",
          950: "#221209",
        },
        cream: {
          50: "#fffdf9",
          100: "#fbf6ec",
          200: "#f5ebdb",
          300: "#ecdac0",
        },
      },
      fontFamily: {
        prompt: ["var(--font-prompt)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
