import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '.dark'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sora)', 'sans-serif'],
      },
      colors: {
        nova: {
          bg:          '#080B12',
          'bg-elev':   '#0E1421',
          'bg-elev-2': '#1A2B40',
          border:      '#22304A',
          navy:        '#1A2B40',
          'navy-light':'#2C4366',
          red:         '#CF190F',
          blue:        '#3D7BFF',
          text:        '#EEF2F8',
          muted:       '#9AA6BA',
          dim:         '#5D6880',
        },
      },
      borderRadius: {
        sm:  '8px',
        md:  '12px',
        lg:  '18px',
        xl:  '20px',
      },
      backdropBlur: {
        glass: '18px',
      },
    },
  },
  plugins: [],
}

export default config
