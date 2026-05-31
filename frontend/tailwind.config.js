/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        void: '#050508',
        'void-2': '#0a0a12',
        'void-3': '#0f0f1a',
        ember: '#ff6b35',
        'ember-dim': '#7a3318',
        frost: '#7eb8f7',
        'frost-dim': '#2a4a70',
        ghost: '#c8c8d4',
        'ghost-dim': '#50505e',
        pulse: '#b088ff',
        'pulse-dim': '#3a2260',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'drift': 'drift 20s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease forwards',
        'glow': 'glow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(8px, -12px) rotate(1deg)' },
          '66%': { transform: 'translate(-6px, 8px) rotate(-1deg)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(176, 136, 255, 0.3)' },
          '50%': { boxShadow: '0 0 24px 8px rgba(176, 136, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
