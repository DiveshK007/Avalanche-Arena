/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#0a0a0f",
          card: "#12121a",
          border: "#1e1e2e",
          accent: "#e84142",    // Avalanche red
          blue: "#4a9eff",
          green: "#50c878",
          orange: "#ff6b35",
          purple: "#9b59b6",
          gold: "#f1c40f",
          red: "#e74c3c",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(232, 65, 66, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(232, 65, 66, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
