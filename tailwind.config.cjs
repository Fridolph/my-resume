/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,vue}',
  ],
  theme: {
    container: {
      // center: true,
      padding: '1rem'
    },
    screens: {
      sm: '640px',
      md: '1024px',
      lg: '1400px',      
      xl: '1920px',
      xxl: '2560px'
    },
    extend: {},
  },
  plugins: []
}

