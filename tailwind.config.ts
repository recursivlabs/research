import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}', './content/**/*.{md,mdx}'],
  theme: {
    extend: {
      colors: {
        // dark-technical / terminal palette
        bg: '#060709',
        panel: '#0c0e12',
        'panel-2': '#11141a',
        line: '#1b1f27',
        'line-bright': '#2a313d',
        ink: '#e8ecf2',
        muted: '#8a93a3',
        faint: '#5b6472',
        // signature accent (frontier line, Cost-to-Done)
        accent: '#39e0c8',
        'accent-dim': '#1d8377',
        // Recursiv-only / agentic group
        agentic: '#b78bff',
        'agentic-dim': '#6b4fb0',
        good: '#54d98c',
        warn: '#f0b34a',
        bad: '#ef6b73',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(57,224,200,0.25), 0 0 24px -6px rgba(57,224,200,0.35)',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, #11141a 1px, transparent 1px), linear-gradient(to bottom, #11141a 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
