/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0C1226",
        panel: "#141B34",
        raised: "#1B2444",
        edge: "#27315A",
        brand: "#27488F",
        "brand-soft": "#8FAAF2",
        accent: "#F46A2E",
        fg: "#E8ECF8",
        muted: "#8D97BC",
      },
    },
  },
  plugins: [],
};
