import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0f172a",
        neonPurple: "#a855f7",
        neonCyan: "#22d3ee",
        neonGreen: "#22c55e"
      },
      boxShadow: {
        neon: "0 0 22px rgba(34, 211, 238, 0.35)",
        purple: "0 0 28px rgba(168, 85, 247, 0.35)",
        green: "0 0 26px rgba(34, 197, 94, 0.3)"
      },
      backgroundImage: {
        "casino-radial":
          "radial-gradient(circle at 20% 10%, rgba(168,85,247,.22), transparent 28%), radial-gradient(circle at 80% 0%, rgba(34,211,238,.18), transparent 30%), linear-gradient(135deg, #0f172a 0%, #111827 55%, #050816 100%)"
      }
    }
  },
  plugins: []
};

export default config;
