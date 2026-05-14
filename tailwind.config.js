/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdfaf3',
          100: '#f7f0dc',
          200: '#eddfa8',
          300: '#dfc97a',
          400: '#cfa943',
          500: '#b8922e',
          600: '#9a7824',
          700: '#7a5e1b',
          800: '#5c4514',
          900: '#3d2e0d',
        },
        accent: {
          50:  '#f9f5f0',
          100: '#efe4d6',
          200: '#ddc9ae',
          300: '#c9aa86',
          400: '#b58d64',
          500: '#9e7248',
          600: '#825c38',
          700: '#65462a',
          800: '#4a301d',
          900: '#2e1d10',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
