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
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#c7dbff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#0f2c59', // Deep DoCA Navy
        },
        metrix: {
          slate: '#0f172a',
          surface: '#f8fafc',
          border: '#e2e8f0',
          pass: '#16a34a',
          fail: '#dc2626',
          warn: '#ea580c'
        }
      }
    },
  },
  plugins: [],
}
