/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "Modern Dark (Cinema Mobile)" palette (ui-ux-pro-max), themeable via CSS vars.
        base: 'var(--c-base)',
        elevated: 'var(--c-elevated)',
        surface: 'var(--c-surface)',
        hairline: 'var(--c-hairline)',
        ink: 'var(--c-ink)',
        muted: 'var(--c-muted)',
        accent: {
          DEFAULT: 'var(--c-accent)',
          glow: 'var(--c-accent-glow)',
        },
        // semantic status (theme-independent)
        danger: '#E5484D',
        warn: '#F5A623',
        ok: '#46A758',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      transitionTimingFunction: {
        cinema: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        glow: '0 0 24px 0 rgba(94,106,210,0.35)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.8)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(20px,-30px) scale(1.1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.16,1,0.3,1)',
        blob: 'blob 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
