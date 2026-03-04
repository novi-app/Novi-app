/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",

  theme: {
    extend: {

      /* ── Typography ── */
      fontFamily: {
        display: ['var(--font-cormorant-garamond)', 'serif'],
        sans:    ['var(--font-dm-sans)',   'sans-serif'],
      },

      /* ── Brand Colors ── */
      colors: {
        primary: {
          DEFAULT: '#D97D3E',
          ink:     '#5C4217',
          smoked:  '#99753D',
          silk:    '#E5C78D',
        },
        secondary: {
          DEFAULT: '#0B4F4A',
          strong:  '#082A2E',
        },
        ink: {
          DEFAULT: '#1A1208',
          60:      'rgba(26,18,8,0.6)',
          30:      'rgba(26,18,8,0.3)',
          10:      'rgba(26,18,8,0.08)',
        },
        cream: {
          DEFAULT: '#FDF8F2',
          dark:    '#F5EDE0',
        },
        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        // Neutral scale
        neutral: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },

      /* ── Border Radius ── */
      borderRadius: {
        pill:   '9999px',
        sm:     '0.5rem',   // 8px
        DEFAULT:'0.75rem',  // 12px
        md:     '1rem',     // 16px
        lg:     '1.5rem',   // 24px
        xl:     '2rem',     // 32px
        sheet:  '2rem',     // bottom sheets
      },

      /* ── Shadows ── */
      boxShadow: {
        xs:    '0 1px 2px 0 rgba(0,0,0,0.05)',
        card:  '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        float: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        'glow-primary': '0 8px 32px rgba(217,125,62,0.45), 0 2px 10px rgba(0,0,0,0.2)',
      },

      /* ── Easing ── */
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      /* ── Animations ──
        All keyframes are defined in globals.css.
        Utilities here map names → keyframe + defaults.
      ── */
      animation: {
        // Landing screen
        'zoom-out':   'zoom-out 7s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'fade-in':    'fade-in 1.4s ease 0.5s both',
        'fade-up':    'fade-up 1.1s cubic-bezier(0.22,1,0.36,1) 1s    both',
        'fade-up-2':  'fade-up 1.1s cubic-bezier(0.22,1,0.36,1) 1.3s  both',
        'fade-up-3':  'fade-up 1.1s cubic-bezier(0.22,1,0.36,1) 1.6s  both',
        'line-grow':  'line-grow 1s cubic-bezier(0.22,1,0.36,1) 0.85s both',
        'shimmer':    'shimmer 1.4s linear infinite',

        // Shared UI
        'in':                    'in 0.2s ease-out',
        'slide-up':              'slide-up 0.3s cubic-bezier(0.22,1,0.36,1)',
        'slide-in-from-bottom':  'slide-in-from-bottom 0.3s ease-out',
        'slide-in-right':        'slide-in-right 0.35s cubic-bezier(0.22,1,0.36,1)',

        // Onboarding
        'fill-bar':    'fill-bar 1.5s ease-out forwards',
        'pop-in':      'pop-in 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
        'seg-fill':    'seg-fill 0.5s ease-out forwards',
        'pulse-dot':   'pulse-dot 2s infinite',
        'float-slow':  'float 6s ease-in-out infinite',
        'float-medium':'float 4s ease-in-out infinite',
        'float-fast':  'float 3s ease-in-out infinite',
      },
    },
  },

  plugins: [animate],
};

export default config;
