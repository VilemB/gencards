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
        primary: "#2563EB",
        accent: "#F59E0B",
        background: "#F9FAFB",
        text: {
          primary: "#374151",
          secondary: "#6B7280",
        },
      },
      perspective: {
        "1000": "1000px",
      },
      rotate: {
        "y-180": "rotateY(180deg)",
      },
      transformStyle: {
        "3d": "preserve-3d",
      },
      backfaceVisibility: {
        hidden: "hidden",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-in",
      },
    },
  },
  plugins: [],
};

export default config;
