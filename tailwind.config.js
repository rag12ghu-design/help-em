/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            deep: "#06391C",
            dark: "#074020",
            forest: "#0D522C",
            emerald: "#1B7340",
            light: "#EAF5EE",
            surface: "#F4F9F5",
            border: "rgba(6, 57, 28, 0.12)",
          },
          gold: {
            DEFAULT: "#FBBF24",
            dark: "#D97706",
            light: "#FEF3C7",
          },
          system: {
            green: "#30D158",
            amber: "#FF9F0A",
            red: "#FF453A",
            blue: "#0A84FF",
          },
        },
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          "Helvetica",
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        apple: "0 10px 30px -10px rgba(6, 57, 28, 0.08), 0 4px 12px -2px rgba(6, 57, 28, 0.04)",
        "apple-lg": "0 20px 40px -15px rgba(6, 57, 28, 0.12), 0 8px 20px -4px rgba(6, 57, 28, 0.06)",
        "apple-pill": "0 8px 24px -6px rgba(6, 57, 28, 0.25)",
      },
    },
  },
  plugins: [],
};
