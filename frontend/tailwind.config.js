/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fefbeb',
          100: '#fdf6c7',
          200: '#fbe88a',
          300: '#fad34d',
          400: '#f9be1a',
          500: '#e2a309', // Cinema Gold
          600: '#c48006',
          700: '#9e5d07',
          800: '#81490b',
          900: '#6a3c0f',
          950: '#3e1f04',
        },
        slate: {
          850: '#151e2e',
          950: '#0b0f19', // Deep dark cinematic theme background
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
