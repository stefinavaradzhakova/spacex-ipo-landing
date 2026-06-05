/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0091D9',
          'blue-light': '#5BBAE6',
          'blue-dark': '#0072B5',
          'blue-deep': '#003D6E',
          dark: '#21272A',
          'dark-2': '#1a1f22',
          light: '#F2F4F8',
          beam: '#F0EBC8',
          'beam-soft': '#E0DCB8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
