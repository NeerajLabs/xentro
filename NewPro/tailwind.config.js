/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sora: ['Sora', 'system-ui', 'sans-serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        xentro: {
          DEFAULT: "#D9FF3F",
          primary: {
            DEFAULT: "#D9FF3F",
            hover: "#C7F020",
            active: "#9EBE12",
          },
          "primary-hover": "#C7F020",
          "primary-active": "#9EBE12",
          "dark-hover": "#E1FF61",
          "dark-active": "#C8ED29",
          "text-primary": "#101212",
          "text-secondary": "#565B59",
          "primary-tint": "rgba(217, 255, 63, 0.15)",
          "primary-glow": "rgba(217, 255, 63, 0.20)",
          bg: {
            DEFAULT: "#F7F8F6",
            light: "#F7F8F6",
            dark: "#0D0F0F",
          },
          card: "#FFFFFF",
          surface: {
            DEFAULT: "#FFFFFF",
            light: "#FFFFFF",
            dark: "#181B1A",
          },
          border: {
            DEFAULT: "#E5E7EB",
            light: "#E3E5E3",
            dark: "#262928",
            focus: "#D9FF3F",
          },
          "border-subtle": "#F1F5F9",
          text: {
            DEFAULT: "#101212",
            primary: "#101212",
            secondary: "#565B59",
            dark: {
              DEFAULT: "#FFFFFF",
              primary: "#FFFFFF",
              secondary: "#B6B8B7",
            },
          },
          muted: "#565B59",
          darkBg: "#0D0F0F",
          darkCard: "#181B1A",
          darkSurface: "#181B1A",
          darkBorder: "#262A29",
          darkText: "#FFFFFF",
          darkMuted: "#B6B8B7",
        },
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        card: "0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)",
        floating: "0 12px 36px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)",
        dropdown: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        "xentro-card": "0 20px 40px -15px rgba(16, 18, 18, 0.05)",
        "xentro-glow": "0 0 40px -10px rgba(217, 255, 63, 0.25)",
      },
      animation: {
        "pulse-subtle": "pulseSubtle 6s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        indeterminate: "indeterminate 1.5s ease-in-out infinite",
        progress: "progressBar 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        indeterminate: {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(30%)" },
          "100%": { transform: "translateX(110%)" },
        },
        progressBar: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      transitionTimingFunction: {
        "sidebar-ease": "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};
