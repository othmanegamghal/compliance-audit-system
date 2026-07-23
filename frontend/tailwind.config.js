/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        success: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#15803D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#B91C1C',
        },
        darkbg: {
          DEFAULT: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

