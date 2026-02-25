/**
 * Centralized theme configuration
 * 
 * IMPORTANT: These values MUST match the colors defined in tailwind.config.mjs
 * 
 * Use Tailwind classes (bg-teal, text-accent, etc.) whenever possible.
 * Only use these hex values for inline styles where dynamic values are needed.
 */

export const colors = {
  // Accent (orange) - CTAs, selected states
  accent: {
    DEFAULT: "#FF7A00",
    hover: "#E56D00",
    light: "#FFF8F3",
  },

  // Teal - onboarding theme
  teal: {
    DEFAULT: "#4A9B9B",
    hover: "#3D8585",
    light: "#E8F4F4",
  },

  // Rose - onboarding accent
  rose: {
    DEFAULT: "#C77D8E",
    light: "#FDF2F4",
  },

  // Secondary (blue)
  secondary: {
    DEFAULT: "#2F80ED",
    strong: "#1C60C7",
  },

  // Neutral grays
  neutral: {
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
  },
} as const;
