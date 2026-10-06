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
          orange: '#f97316',
          'orange-dark': '#ea580c',
          'orange-light': '#ffedd5',
          green: '#15803d',
          'green-dark': '#166534',
          'green-light': '#dcfce7',
        }
      }
    },
  },
  plugins: [],
}
