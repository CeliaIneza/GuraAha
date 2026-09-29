/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#007A66',
          'green-dark': '#00614F',
          ink: '#0F2C26',
          'ink-soft': '#43584C',
          earth: '#9C7C3C',
          gold: '#D3B42B',
          'bg-soft': '#F2F7F5',
          line: '#DCE7E1',
          amber: '#b45309',
          'amber-bg': '#fef3c7',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
      }
    },
  },
  plugins: [],
}
