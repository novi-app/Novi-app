/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';
import typography from "@tailwindcss/typography";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-sora)', 'serif'],
        sans:    ['var(--font-sora)', 'sans-serif'],
      },

      colors: {
        primary: {
          DEFAULT: '#E8700A',
          ink:     '#5C4217',
          smoked:  '#99753D',
          silk:    '#E5C78D',
        },
        secondary: {
          DEFAULT: '#0D4A4A',
          border:  '#0D4A4A1F',
        },
        cream: {
          DEFAULT: '#F5F1E8',
          text:    '#FAF8F3',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        neutral: {
          300: '#99A1AF',
          400: '#6A7282',
          500: '#364153',
        },
      },
    },
  },

  plugins: [animate, typography],
};

export default config;
