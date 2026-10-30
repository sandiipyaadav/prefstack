/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: { 950: '#07080a', 900: '#0d0f12', 800: '#15181d', 700: '#1f242b', 600: '#2c333c' }, accent: '#c6ff3d' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] },
    },
  },
  plugins: [],
};
