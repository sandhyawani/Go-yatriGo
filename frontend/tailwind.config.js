/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/tw-elements/dist/js/**/*.js",
  ],

  darkMode: "class",

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2rem",
      },
    },

    extend: {
      colors: {
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
        },

        secondary: {
          50: "var(--secondary-50)",
          100: "var(--secondary-100)",
          200: "var(--secondary-200)",
          300: "var(--secondary-300)",
          400: "var(--secondary-400)",
          500: "var(--secondary-500)",
          600: "var(--secondary-600)",
          700: "var(--secondary-700)",
          800: "var(--secondary-800)",
          900: "var(--secondary-900)",
        },

        brand: {
          DEFAULT: "var(--brand)",
          light: "var(--brand-light)",
          dark: "var(--brand-dark)",
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },

        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        error: "var(--error)",
        info: "var(--info)",

        background: "var(--background)",
        surface: "var(--surface)",
        muted: "var(--text-secondary)",
        border: "var(--border)",
      },

      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        inter: ["Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },

      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        pill: "999px",
      },

      boxShadow: {
        soft: "0 2px 8px rgba(15, 23, 42, 0.04)",
        card: "0 8px 30px rgba(15, 23, 42, 0.05)",
        hover: "0 12px 40px rgba(15, 23, 42, 0.08)",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },

      zIndex: {
        navbar: "40",
        drawer: "50",
        modal: "100",
        toast: "110",
        tooltip: "120",
      },

      backgroundImage: {
        "primary-gradient":
          "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
      },

      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.25s ease-out",
        shimmer: "shimmer 1.5s infinite",
        float: "float 3s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },

        slideUp: {
          "0%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        scaleIn: {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },

        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },

        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
      },

      backdropBlur: {
        xs: "2px",
      },
    },
  },

  plugins: [
    require("tw-elements/dist/plugin"),

    function ({ addUtilities }) {
      addUtilities({
        /* Safe area */

        ".pb-safe": {
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        },

        ".pt-safe": {
          paddingTop: "env(safe-area-inset-top, 0px)",
        },

        ".pb-nav": {
          paddingBottom:
            "calc(64px + env(safe-area-inset-bottom, 0px))",
        },

        /* Hidden scrollbar */

        ".scrollbar-none": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },

        ".scrollbar-none::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};