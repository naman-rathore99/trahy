/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ IMPORTANT: Humne './src' add kiya hai taaki wo LoginScreen ko dekh sake
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};