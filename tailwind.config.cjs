/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    container: {
      // center: true,
      padding: '1rem',
    },
    screens: {
      sm: '640px',
      md: '1024px',
      lg: '1376px',
      xl: '1920px',
      xxl: '2560px',
    },
    extend: {
      animation: {
        'singerShake': 'singerShake linear infinite',
      },
      keyframes: {
        circleLoadRight: {
          '0%': { transform: 'rotate(-135deg)' },
          '50%, 100%': { transform: 'rotate(45deg)' },
        },
        circleLoadLeft: {
          '50%': { transform: 'rotate(-135deg)' },
          '100%': { transform: 'rotate(45deg)' },
        },
        singerShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: `translateX(-2px) scale(1.05)` },
          '20%, 40%, 60%, 80%': { transform: `translateY(2px) scale(1)` },
        },
      },
    },
  },
  plugins: [],
}
