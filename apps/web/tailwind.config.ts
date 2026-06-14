import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        paper: "#f6f3ea",
        signal: {
          blue: "#3a8dff",
          yellow: "#e6b422",
          orange: "#ef7f39",
          red: "#d84f4f",
          mint: "#7ad7bf"
        }
      },
      boxShadow: {
        card: "0 18px 60px rgba(9, 17, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
