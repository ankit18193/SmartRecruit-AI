/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#2563eb",
        "brand-light": "#f8fafc",
      },
    },
  },
  plugins: [],
}
