import { defineConfig } from '@tailwindcss/vite'

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Greven Medien brand colors
        greven: {
          orange: '#FF6B00',
          'orange-light': '#FF8533',
          'orange-dark': '#E55A00',
          gray: '#6B7280',
          'gray-light': '#9CA3AF',
          'gray-dark': '#374151',
        },
        // Primary colors based on Greven orange
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B00', // Main Greven orange
          600: '#E55A00',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        // Secondary colors (grays)
        secondary: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'greven': '0 4px 6px -1px rgba(255, 107, 0, 0.1), 0 2px 4px -1px rgba(255, 107, 0, 0.06)',
        'greven-lg': '0 10px 15px -3px rgba(255, 107, 0, 0.1), 0 4px 6px -2px rgba(255, 107, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
})

