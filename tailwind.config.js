/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E1330',
        paper: '#F7F8FC',
        brand: {
          50: '#EEF1FF',
          100: '#DDE3FF',
          500: '#1537F0',
          600: '#1130CC',
          700: '#0D26A3',
        },
        sun: '#FFC83D',
        leaf: '#12805C',
        danger: '#B42318',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
