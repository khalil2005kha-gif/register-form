/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          text: '#FFFFFF',
          textSecondary: '#94A3B8',
          accent: '#00C2FF',
          buy: '#22C55E',
          border: '#334155',
        },
        light: {
          bg: '#FFFFFF',
          card: '#F1F5F9',
          text: '#0F172A',
          textSecondary: '#64748B',
          accent: '#00C2FF',
          buy: '#22C55E',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
