/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware (CSS vars en index.css); variantes de opacidad para @apply
        primary: {
          DEFAULT: 'var(--arena-primary)',
          dark: 'var(--arena-primary-dark)',
          5: 'var(--arena-primary-5)',
          10: 'var(--arena-primary-10)',
          15: 'var(--arena-primary-15)',
          20: 'var(--arena-primary-20)',
          30: 'var(--arena-primary-30)',
          40: 'var(--arena-primary-40)',
          50: 'var(--arena-primary-50)',
        },
        secondary: 'var(--arena-secondary)',
        accent: 'var(--arena-accent)',
        background: {
          primary: 'var(--arena-bg-primary)',
          secondary: 'var(--arena-bg-secondary)',
          tertiary: 'var(--arena-bg-tertiary)',
        },
        text: {
          primary: 'var(--arena-text-primary)',
          secondary: 'var(--arena-text-secondary)',
          muted: 'var(--arena-text-muted)',
        },
        success: {
          DEFAULT: 'var(--arena-success)',
          10: 'var(--arena-success-10)',
          30: 'var(--arena-success-30)',
        },
        warning: {
          DEFAULT: 'var(--arena-warning)',
          10: 'var(--arena-warning-10)',
          30: 'var(--arena-warning-30)',
        },
        error: {
          DEFAULT: 'var(--arena-error)',
          10: 'var(--arena-error-10)',
          30: 'var(--arena-error-30)',
        },
        info: {
          DEFAULT: 'var(--arena-info)',
          10: 'var(--arena-info-10)',
          30: 'var(--arena-info-30)',
        },
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