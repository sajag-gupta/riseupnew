import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Rise Up Creators brand colors
        'ruc-black': 'hsl(0, 0%, 0%)',
        'ruc-charcoal': 'hsl(0, 0%, 6.7%)',
        'ruc-surface': 'hsl(0, 0%, 10.2%)',
        'ruc-surface-2': 'hsl(0, 0%, 14.1%)',
        'ruc-red': 'hsl(8, 100%, 59%)',
        'ruc-red-dark': 'hsl(8, 88%, 26%)',
        'ruc-orange': 'hsl(11, 100%, 59%)',
        'ruc-text': 'hsl(0, 0%, 100%)',
        'ruc-text-muted': 'hsl(0, 0%, 84%)',
        'ruc-text-low': 'hsl(0, 0%, 60%)',
        'ruc-border': 'hsl(0, 0%, 16.5%)',
        'ruc-success': 'hsl(142, 71%, 45%)',
        'ruc-warning': 'hsl(38, 92%, 50%)',
        'ruc-danger': 'hsl(0, 84%, 60%)',
        'ruc-info': 'hsl(221, 100%, 67%)',

        // Shadcn compatibility colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ["Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(255, 60, 42, 0.25)',
        'red-glow-lg': '0 0 40px rgba(255, 60, 42, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'wave': {
          '0%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
          '100%': { transform: 'scaleY(0.5)' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'float': 'float 6s ease-in-out infinite',
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.5s ease-in-out infinite'
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
