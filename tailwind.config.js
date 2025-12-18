/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E53A3A',
          light: '#FF6B6B',
        },
        secondary: {
          DEFAULT: '#D98C1F',
          light: '#FFB366',
        },
        accent: {
          DEFAULT: '#5CBB7B',
          light: '#7DD3A3',
        },
        background: '#0A0A0A',
        surface: '#1C1C1C',
        'surface-light': '#2E2E2E',
        'text-primary': '#F5F5F5',
        'text-secondary': '#CFCFCF',
        'text-muted': '#A3A3A3',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'modal-enter': 'modal-enter 0.3s ease-out',
        'fade-slide-up': 'fade-slide-up 0.8s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.2s ease-in',
        'screenshot-flash': 'screenshot-flash 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'modal-enter': {
          from: { opacity: '0', transform: 'scale(0.9) translateY(-20px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'fade-slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        'slide-out': {
          from: { opacity: '1', transform: 'translateX(0) scale(1)' },
          to: { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(229, 61, 61, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(229, 61, 61, 0.6)' },
        },
        'screenshot-flash': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '30%': { opacity: '1', transform: 'scale(1)' },
          '70%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
