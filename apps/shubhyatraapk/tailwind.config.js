/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: This points to your app folder
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FF5A1F', // Shubhyatra Orange
        dark: { 
          900: '#0B0F19', // Main Background
          800: '#111827', // Card Background
          700: '#1F2937'  // Borders
        }
      }
    },
  },
  plugins: [],
}