/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FF5A1F', // Shubhyatra Orange
        dark: {
          900: '#0B0F19', // Deepest background (Main)
          800: '#111827', // Card background
          700: '#1F2937', // Lighter inputs/borders
        }
      }
    },
  },
  plugins: [],
}