/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        wine: {
          50: '#faf1f3', 100: '#f3e2e7', 200: '#e7c7d1', 300: '#d5a0b1',
          400: '#b9748c', 500: '#99516b', 600: '#7b3c54', 700: '#653046',
          800: '#542b3c', 900: '#482735', 950: '#29131d',
        },
        forest: {
          50: '#eff5f1', 100: '#deebe2', 200: '#c1d7c8', 300: '#99bba5',
          400: '#6e9a80', 500: '#4e7c62', 600: '#3b634e', 700: '#31513f',
          800: '#294234', 900: '#23372c', 950: '#111f18',
        },
        parchment: {
          50: '#fcf9f1', 100: '#f6eed9', 200: '#eaddb9', 300: '#d9c38e',
          400: '#c6a66a', 500: '#ae884a', 600: '#8d6938', 700: '#725231',
          800: '#5e442c', 900: '#503a29', 950: '#2d1f14',
        },
        stone: {
          50: '#faf8f3', 100: '#f1ede4', 200: '#e3ddd1', 300: '#ccc3b4',
          400: '#a79b8b', 500: '#7b7061', 600: '#63594e', 700: '#4e463e',
          800: '#39352e', 900: '#292923', 950: '#181b16',
        },
      },
      boxShadow: {
        sm: '0 2px 8px rgb(66 45 29 / 4%)',
        md: '0 6px 20px rgb(66 45 29 / 6%)',
        lg: '0 12px 30px rgb(66 45 29 / 9%)',
        xl: '0 16px 48px rgb(66 45 29 / 10%)',
      },
    },
  },
  plugins: [],
}
