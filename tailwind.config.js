/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        destiny: {
          primary: '#7C3AED',
          'primary-dark': '#5B21B6',
          'primary-light': '#A78BFA',
          bg: '#0F0F1A',
          surface: '#1A1A2E',
          'surface-light': '#252540',
          gold: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
      animation: {
        'orbit-slow': 'spin 60s linear infinite',
        'orbit-mid': 'spin 45s linear infinite reverse',
        'orbit-fast': 'spin 30s linear infinite',
        'pulse-slow': 'pulse 8s ease-in-out infinite',
        'pulse-slower': 'pulse 10s ease-in-out infinite',
        'glow-pulse': 'glow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'star-twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
