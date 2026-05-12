/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#9b8a5c',
          light:   '#b3a06e',
          dark:    '#7a6b43',
        },
        military: {
          page:    '#1e1e1e',
          card:    '#2d2d2d',
          dark:    '#111111',
          input:   '#1a1a1a',
          hover:   '#363636',
          stripe:  '#323232',
          border:  '#3a3a3a',
        },
      },
    },
  },
  plugins: [],
}
