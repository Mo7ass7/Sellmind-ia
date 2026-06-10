import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { arabic: ["Cairo", "sans-serif"] },
      colors: {
        surface: "#0d0d14",
        card: "#13131f",
        border: "#1e1e30",
      },
    },
  },
  plugins: [],
};

export default config;
