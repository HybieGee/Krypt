/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'terminal-green': '#00ff00',
        'terminal-dark-green': '#00cc00',
        'terminal-bg': '#0a0a0a',
        'terminal-gray': '#1a1a1a',
        'terminal-border': '#00ff00',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 2s steps(40, end)',
        'blink': 'blink .7s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        blink: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        glow: {
          from: { textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00' },
          to: { textShadow: '0 0 20px #00ff00, 0 0 30px #00ff00' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}