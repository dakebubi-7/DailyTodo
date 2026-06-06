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
        paper: {
          DEFAULT: '#F5F0E8',
          dark: '#1A1A1A'
        },
        forest: {
          DEFAULT: '#2D4A3E',
          light: '#3D5A4E'
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#D9B85C'
        },
        priority: {
          high: '#D35F5F',
          medium: '#E5A84B',
          low: '#5B9A8B'
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 2px 10px rgba(31, 41, 55, 0.06)',
        'card-hover': '0 6px 16px rgba(31, 41, 55, 0.08)'
      },
      borderRadius: {
        card: '10px',
        input: '8px',
        button: '10px'
      }
    },
  },
  plugins: [],
}
