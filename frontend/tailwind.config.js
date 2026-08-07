/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/tw-elements/dist/js/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    // Centralized container configurations
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
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
        },
        secondary: {
          50: 'var(--secondary-50)',
          100: 'var(--secondary-100)',
          200: 'var(--secondary-200)',
          300: 'var(--secondary-300)',
          400: 'var(--secondary-400)',
          500: 'var(--secondary-500)',
          600: 'var(--secondary-600)',
          700: 'var(--secondary-700)',
          800: 'var(--secondary-800)',
          900: 'var(--secondary-900)',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7', // Purple-500
          600: '#9333ea',
          700: '#7e22ce',
        },

        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--danger)',
        danger: 'var(--danger)',
        dark: 'var(--dark)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        muted: 'var(--text-secondary)',
        border: 'var(--border-color)',
        // Kept for seamless backward compatibility
        brand: {
          DEFAULT: 'var(--brand)',
          light: 'var(--brand-light)',
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          dark: 'var(--secondary-900)',
        }
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(30, 41, 59, 0.03)",
        card: "0 10px 30px rgba(15, 23, 42, 0.08)",
        hover: "0 18px 40px rgba(15, 23, 42, 0.12)",
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
        "primary-gradient": "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'scale-in': 'scaleIn 0.25s ease-out', // Great for chat popups/modals
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require("tw-elements/dist/plugin"),
    function ({ addUtilities }) {
      addUtilities({
        // Safe area utilities
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        },
        '.pt-safe': {
          paddingTop: 'env(safe-area-inset-top, 0px)',
        },
        '.pb-nav': {
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        },
        // Clean scrollbar masking for chat feeds
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-none::-webkit-scrollbar': {
          display: 'none',
        },
      });
    },
  ],
};