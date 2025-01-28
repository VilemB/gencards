import type { Config } from "tailwindcss";

export default {
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
    },
  },
  plugins: [],
} satisfies Config;
