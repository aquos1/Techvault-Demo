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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'amazon-orange': '#ff9900',
        'amazon-dark': '#131921',
        'amazon-light': '#eaeded',
        'amazon-blue': '#232f3e',
      },
    },
  },
  plugins: [],
};
