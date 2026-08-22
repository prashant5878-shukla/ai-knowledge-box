/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["\"Source Serif 4\"", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50: "#f2f1ff",
          100: "#e7e5ff",
          200: "#d1cbff",
          300: "#b0a5ff",
          400: "#8b78ff",
          500: "#6d4dfd",
          600: "#5a2ff0",
          700: "#4b23d0",
          800: "#3d1ea8",
          900: "#341c86",
        },
      },
    },
  },
  plugins: [],
};
