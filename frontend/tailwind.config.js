/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#00D9FF',
          dark: '#0095B3',
        },
        secondary: '#B24BF3',
        accent: '#00FFA3',
        
        // Background colors
        background: {
          primary: '#0A0E27',
          secondary: '#131829',
          tertiary: '#1E2439',
        },
        
        // Text colors
        text: {
          primary: '#E8EDF4',
          secondary: '#8B95AD',
          muted: '#535D73',
        },
        
        // Status colors
        success: '#00FFA3',
        warning: '#FFB800',
        error: '#FF3366',
        info: '#00D9FF',
      },
      
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      
      boxShadow: {
        'glow': '0 0 20px rgba(0, 217, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 217, 255, 0.4)',
        'glow-success': '0 0 20px rgba(0, 255, 163, 0.3)',
      },
      
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 217, 255, 0.8)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}