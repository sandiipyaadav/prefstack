/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080a0f',
          900: '#0c0f16',
          850: '#10141d',
          800: '#141923',
          700: '#202735',
          600: '#30394a',
        },
        accent: '#8b9cff',
        positive: '#51d6a9',
      },
      fontFamily: {
        sans: ['Inter', '"SF Pro Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"SFMono-Regular"', '"Cascadia Code"', '"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,.03) inset, 0 18px 50px rgba(0,0,0,.18)',
        glow: '0 0 0 1px rgba(139,156,255,.18), 0 12px 32px rgba(40,54,130,.16)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'fade-up': 'fade-up .28s cubic-bezier(.22,1,.36,1) both' },
    },
  },
  plugins: [],
};
