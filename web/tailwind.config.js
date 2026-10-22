/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pawlane brand — deep forest green
        brand: {
          50: '#edf5f1',
          100: '#d3e7dd',
          200: '#a7cfbb',
          300: '#71ad92',
          400: '#3f8a6c',
          500: '#1f7a63',
          600: '#176150',
          700: '#124c3f',
          800: '#0f3c32',
          900: '#0c3129',
        },
        // Terracotta accent (shop initials tile, badges)
        clay: {
          50: '#f8efe9',
          100: '#eed7c9',
          200: '#dcae95',
          300: '#c58463',
          400: '#b06d4c',
          500: '#a05c43',
          600: '#8a4d38',
          700: '#6f3d2d',
        },
        // Warm cream surfaces
        cream: {
          50: '#fcfbf8',
          100: '#f6f5f1',
          200: '#efede6',
          300: '#e5e2d9',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
