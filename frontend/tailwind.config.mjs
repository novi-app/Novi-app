/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';

const config = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF7A45",   
          soft: "#FFB199",      
          subtle: "#FFE3D6",    
          strong: "#E85F2A",    
          contrast: "#FFFFFF",
        },

        secondary: {
          DEFAULT: "#2F80ED",
          soft: "#AFCBFF",
          subtle: "#E8F1FF",
          strong: "#1C60C7",
          contrast: "#FFFFFF",
        },

        neutral: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
        },

        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
      },

      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.75rem",
        md: "1rem",
        lg: "1.25rem",
        xl: "1.75rem",
        "2xl": "2.25rem",
        pill: "999px",
        sheet: "2rem",
      },

      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.05)",
        sm: "0 4px 12px rgba(0,0,0,0.06)",
        md: "0 8px 24px rgba(0,0,0,0.08)",
        lg: "0 16px 40px rgba(0,0,0,0.12)",
        xl: "0 24px 60px rgba(0,0,0,0.16)",

        card: "0 10px 30px rgba(0,0,0,0.08)",
        float: "0 20px 50px rgba(0,0,0,0.12)",
        glow: "0 0 0 4px rgba(255,122,69,0.15)",
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.2" }],
        sm: ["0.875rem", { lineHeight: "1.4" }],
        base: ["1rem", { lineHeight: "1.5" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.6" }],
        "2xl": ["1.5rem", { lineHeight: "1.3" }],
        "3xl": ["1.875rem", { lineHeight: "1.2" }],
      },

      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    animate,
  ],
};

export default config;
