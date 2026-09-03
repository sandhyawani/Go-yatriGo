/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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

        ruby: {
          50: "var(--ruby-50)",
          100: "var(--ruby-100)",
          200: "var(--ruby-200)",
          300: "var(--ruby-300)",
          400: "var(--ruby-400)",
          500: "var(--ruby-500)",
          600: "var(--ruby-600)",
          700: "var(--ruby-700)",
          800: "var(--ruby-800)",
          900: "var(--ruby-900)",
          DEFAULT: "var(--ruby-500)",
        },

        emerald: {
          50: "var(--emerald-50)",
          100: "var(--emerald-100)",
          200: "var(--emerald-200)",
          300: "var(--emerald-300)",
          400: "var(--emerald-400)",
          500: "var(--emerald-500)",
          600: "var(--emerald-600)",
          700: "var(--emerald-700)",
          800: "var(--emerald-800)",
          900: "var(--emerald-900)",
          DEFAULT: "var(--emerald-500)",
        },

        amber: {
          50: "var(--amber-50)",
          100: "var(--amber-100)",
          200: "var(--amber-200)",
          300: "var(--amber-300)",
          400: "var(--amber-400)",
          500: "var(--amber-500)",
          600: "var(--amber-600)",
          700: "var(--amber-700)",
          800: "var(--amber-800)",
          900: "var(--amber-900)",
          DEFAULT: "var(--amber-500)",
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

        pop: {
          DEFAULT: "var(--pop-primary, #0ea5e9)",
          primary: "var(--pop-primary, #0ea5e9)",
          accent: "var(--pop-accent, #f43f5e)",
          warning: "var(--pop-warning, #f59e0b)",
          success: "var(--pop-success, #10b981)",
          indigo: "var(--pop-indigo, #6366f1)",
          coral: "var(--pop-accent, #f43f5e)",
          sky: "var(--pop-primary, #0ea5e9)",
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },

        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        error: "var(--error)",
        info: "var(--info)",

        background: "var(--background)",
        surface: "var(--surface)",
        
        text: {
          DEFAULT: "var(--text)",
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        
        border: {
          DEFAULT: "var(--border)",
          default: "var(--border-default)",
        },
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
        pop: "0 4px 20px -2px rgba(14, 165, 233, 0.35)",
        "pop-accent": "0 4px 20px -2px rgba(244, 63, 94, 0.35)",
        "pop-lg": "0 10px 30px -4px rgba(14, 165, 233, 0.45)",
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
          "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
        "sunset-gradient":
          "linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)",
        "tropical-gradient":
          "linear-gradient(135deg, #f59e0b 0%, #10b981 100%)",
        "emerald-gradient":
          "linear-gradient(135deg, #059669 0%, #34d399 100%)",
        "ruby-gradient":
          "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
        "amber-gradient":
          "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
        "pop-gradient":
          "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #6366f1 100%)",
        "pop-sunset":
          "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)",
        "pop-emerald":
          "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
        "pop-amber":
          "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        "pop-coral":
          "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
      },

      animation: {
        "fade-in": "fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-bounce": "scaleBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 1.8s infinite",
        "shimmer-fast": "shimmer 1.2s infinite",
        float: "float 3s ease-in-out infinite",
        "float-slow": "floatSlow 5s ease-in-out infinite",
        "float-subtle": "floatSubtle 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "radar-ping": "radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        wave: "wave 1.8s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "gradient-x": "gradientX 4s ease infinite",
        "heart-burst": "heartBurst 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        slideUp: {
          "0%": {
            transform: "translateY(16px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        slideDown: {
          "0%": {
            transform: "translateY(-16px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        scaleIn: {
          "0%": {
            transform: "scale(0.96)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },

        scaleBounce: {
          "0%": {
            transform: "scale(0.9)",
            opacity: "0",
          },
          "70%": {
            transform: "scale(1.04)",
            opacity: "1",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },

        shimmer: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },

        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-8px)",
          },
        },

        floatSlow: {
          "0%, 100%": {
            transform: "translateY(0) rotate(0deg)",
          },
          "50%": {
            transform: "translateY(-12px) rotate(1.5deg)",
          },
        },

        floatSubtle: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-4px)",
          },
        },

        pulseGlow: {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 0 0 rgba(2, 132, 199, 0.4)",
          },
          "50%": {
            opacity: "0.85",
            boxShadow: "0 0 16px 4px rgba(2, 132, 199, 0.25)",
          },
        },

        radarPing: {
          "75%, 100%": {
            transform: "scale(2.2)",
            opacity: "0",
          },
        },

        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(14deg)" },
          "40%": { transform: "rotate(-8deg)" },
          "60%": { transform: "rotate(14deg)" },
          "80%": { transform: "rotate(-4deg)" },
        },

        gradientX: {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },

        heartBurst: {
          "0%": { transform: "scale(0) rotate(-15deg)", opacity: "0" },
          "50%": { transform: "scale(1.25) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },

      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      backdropBlur: {
        xs: "2px",
      },
    },
  },

  plugins: [
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