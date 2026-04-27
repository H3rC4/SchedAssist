import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        shimmer:    { '100%': { transform: 'translateX(100%)' } },
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        shimmer:    'shimmer 2s infinite',
        'fade-in':  'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      colors: {
        /* === Clinical Oasis Tokens === */
        background:                  'var(--background)',
        surface:                     'var(--surface)',
        'surface-muted':             'var(--surface-muted)',
        'surface-container-low':     'var(--surface-container-low)',
        'surface-container-high':    'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'surface-container-lowest':  'var(--surface-container-lowest)',

        primary:           'var(--primary)',
        'primary-dark':    'var(--primary-dark)',
        'primary-light':   'var(--primary-light)',
        'primary-mid':     'var(--primary-mid)',
        'on-primary':      'var(--on-primary)',

        secondary:                  'var(--secondary)',
        'secondary-container':      'var(--secondary-container)',
        'on-secondary-container':   'var(--on-secondary-container)',

        'on-surface':        'var(--on-surface)',
        'on-surface-muted':  'var(--on-surface-muted)',
        'on-surface-subtle': 'var(--on-surface-subtle)',

        success:         'var(--success)',
        'success-light': 'var(--success-light)',
        warning:         'var(--warning)',
        'warning-light': 'var(--warning-light)',
        error:           'var(--error)',
        'error-light':   'var(--error-light)',

        'border-subtle':   'var(--border-subtle)',
        'outline-variant': 'var(--outline-variant)',
      },
      boxShadow: {
        'ambient': 'var(--shadow-ambient)',
        'card':    'var(--shadow-card)',
        'float':   'var(--shadow-float)',
        'modal':   'var(--shadow-modal)',
      },
      borderRadius: {
        'sm':   'var(--radius-sm)',
        'md':   'var(--radius-md)',
        'lg':   'var(--radius-lg)',
        'xl':   'var(--radius-xl)',
        '2xl':  'var(--radius-2xl)',
      },
    },
  },
  plugins: [],
};
export default config;
