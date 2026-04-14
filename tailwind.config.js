/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        cream: {
          50:  '#FDFBF7',
          100: '#F9F5EC',
          200: '#F0E9D8',
          300: '#E4D5BA',
        },
        ink: {
          900: '#1A1714',
          800: '#2D2926',
          700: '#423D39',
          500: '#6B635C',
          300: '#A09890',
          200: '#C4BBB3',
          100: '#E2DDD8',
        },
        sage: {
          700: '#2D4A3E',
          600: '#3D6357',
          500: '#4F7A6A',
          400: '#6B9B8A',
          200: '#B8D4CC',
          100: '#DDF0EA',
          50:  '#F0FAF7',
        },
        amber: {
          600: '#B45309',
          500: '#D97706',
          400: '#F59E0B',
          100: '#FEF3C7',
          50:  '#FFFBEB',
        },
        rose: {
          600: '#9F1239',
          500: '#E11D48',
          100: '#FFE4E6',
          50:  '#FFF1F2',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 12px 0 rgba(26,23,20,0.06)',
        'card': '0 4px 24px 0 rgba(26,23,20,0.08)',
        'lifted': '0 8px 40px 0 rgba(26,23,20,0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
