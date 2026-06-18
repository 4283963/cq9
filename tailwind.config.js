/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['"Big Shoulders Display"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        slab: {
          950: '#0e1116',
          900: '#14181d',
          800: '#1a1f26',
          700: '#242a33',
          600: '#2f3642',
        },
        ochre: {
          500: '#b07d3b',
          400: '#c99147',
          300: '#e0a757',
        },
        amber: {
          500: '#f5a524',
          400: '#fbbf24',
        },
        teal: {
          400: '#2dd4bf',
          300: '#5eead4',
        },
        cement: {
          300: '#cbd5e1',
          200: '#e2e8f0',
        },
      },
      boxShadow: {
        'inner-glow': 'inset 0 0 20px rgba(0,0,0,0.5)',
        'panel': '0 4px 20px -2px rgba(0,0,0,0.6)',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
