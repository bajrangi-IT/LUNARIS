/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#05070A',
          900: '#090D14',
          850: '#0E1420',
          800: '#141C2B',
          750: '#1A2438',
          700: '#23304A',
          600: '#34476E',
          500: '#4C6496',
        },
        cyber: {
          cyan: '#00F0FF',
          sky: '#38BDF8',
          blue: '#0284C7',
          amber: '#F59E0B',
          gold: '#FBBF24',
          emerald: '#10B981',
          crimson: '#EF4444',
          purple: '#A855F7',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(0, 240, 255, 0.25)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.25)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
}
