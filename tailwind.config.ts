import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}', './content/**/*.{md,mdx}'],
  theme: {
    extend: {
      colors: {
        // light theme, Recursiv green (matches Verify / recursiv.io)
        bg: '#ffffff',
        panel: '#f7f9fb',
        'panel-2': '#eef2f6',
        line: '#e5e9ef',
        'line-bright': '#d3dae3',
        ink: '#0e1726',
        muted: '#586273',
        faint: '#8a95a4',
        // signature accent (frontier line, Cost-to-Done)
        accent: '#0b9d76',
        'accent-dim': '#5fcfb0',
        // Recursiv-only / agentic group
        agentic: '#7c5cff',
        'agentic-dim': '#b9a8ff',
        // per-metric accents (deepened for white bg)
        completion: '#15a34a',
        quality: '#2563eb',
        good: '#15a34a',
        warn: '#c2790f',
        bad: '#dd2d3b',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 6px 24px -12px rgba(13,23,38,0.18), 0 0 0 1px rgba(11,157,118,0.16)',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, #eef2f6 1px, transparent 1px), linear-gradient(to bottom, #eef2f6 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
