/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}" // ✅ Ensure ye line sahi ho
  ],
  presets: [require("nativewind/preset")], // ✅ v4 ke liye zaroori
  theme: {
    extend: {},
  },
  plugins: [],
};