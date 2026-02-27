/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';

const config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      colors: {
        // Primary brand color (Yellow)
        primary: {
          DEFAULT: '#D97D3E', // Antique Gold
          ink: '#5C4217',     // Deep Bronze-Wood
          smoked: '#99753D',  // Muted Ochre
          silk: '#E5C78D',    // Soft Champagne
        },
        // Secondary brand color (Deep teal)
        secondary: {
          DEFAULT: "#0B4F4A",
          subtle: "rgba(13, 61, 67, 0.05)",
          soft: "rgba(13, 61, 67, 0.15)",
          strong: "#082A2E",
        },
        ink: {
          DEFAULT: '#1A1208',
          60: 'rgba(26,18,8,0.6)',
          30: 'rgba(26,18,8,0.3)',
          10: 'rgba(26,18,8,0.08)',
        },
        cream: {
          DEFAULT: '#FDF8F2',
          dark: '#F5EDE0',
        },
        // Semantic colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        // Neutral grays
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
      },
      borderRadius: {
        pill: "9999px",
        sm: "0.5rem",      // 8px
        DEFAULT: "0.75rem", // 12px
        md: "1rem",        // 16px
        lg: "1.5rem",      // 24px
        xl: "2rem",        // 32px
        sheet: "2rem",     // For bottom sheets
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        float: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "in": "in 0.2s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        'fill-bar': 'fill-bar 1.5s ease-out forwards',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'seg-fill': 'seg-fill 0.5s ease-out forwards',
        'pulse-dot': 'pulse 2s infinite',
        "slide-up": "slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        "in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        'fill-bar': {
          '0%': { width: '0%' },
          '100%': { width: '92%' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'seg-fill': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.85)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        }
      },
    },
  },
  plugins: [
    animate,
  ],
};

export default config;
