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
      },
      animation: {
        spotlight: "spotlight 2s ease .75s 1 forwards"
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: "0",
            transform: "translate(-72%, -62%) scale(0.5)"
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, -40%) scale(1)"
          }
        }
      }
    }
  },
  plugins: []
};

export default config;
