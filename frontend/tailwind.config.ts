import type { Config } from 'tailwindcss';

/**
 * Дизайн-система лендинга: тёмная база, один акцентный градиент, стеклянные панели.
 * Брейкпоинты подобраны под реальные устройства, а не под круглые числа:
 * 400 — крупные телефоны, 744/834 — iPad mini и iPad Air, 1800 — широкие мониторы.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      tab: '834px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1800px',
    },
    extend: {
      // Стандартная шкала Tailwind идёт шагом в 5%, а тонким границам и подложкам
      // нужны более мелкие ступени. Держим их здесь, а не в произвольных скобках,
      // чтобы прозрачности во всём проекте оставались из одного набора.
      opacity: {
        8: '0.08',
        12: '0.12',
        15: '0.15',
      },
      colors: {
        ink: {
          950: '#05060A',
          900: '#0A0B12',
          850: '#0F111A',
          800: '#151827',
          700: '#1E2233',
        },
        accent: {
          indigo: '#6366F1',
          cyan: '#22D3EE',
          fuchsia: '#E879F9',
        },
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Типографика на clamp: один набор размеров работает от 360 до 1920 без брейкпоинтов.
        'display-xl': ['clamp(2.6rem, 7vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2rem, 4.6vw, 3.6rem)', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'body-lg': ['clamp(1rem, 1.4vw, 1.25rem)', { lineHeight: '1.6' }],
      },
      maxWidth: {
        content: '1240px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'accent-line': 'linear-gradient(90deg, #6366F1 0%, #22D3EE 50%, #E879F9 100%)',
        'accent-soft': 'linear-gradient(135deg, rgba(99,102,241,.22) 0%, rgba(34,211,238,.14) 50%, rgba(232,121,249,.2) 100%)',
      },
      boxShadow: {
        glow: '0 0 60px -12px rgba(99,102,241,.55)',
        panel: '0 24px 80px -32px rgba(0,0,0,.9)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '.5' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
