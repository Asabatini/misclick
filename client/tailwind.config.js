/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wow-gold': '#ffd100',
        'wow-blue': '#00aeff',
        'wow-purple': '#a335ee',
        'warrior': '#C69B6D',
        'paladin': '#F48CBA',
        'hunter': '#AAD372',
        'rogue': '#FFF468',
        'priest': '#FFFFFF',
        'death-knight': '#C41E3A',
        'shaman': '#0070DD',
        'mage': '#3FC7EB',
        'warlock': '#8788EE',
        'monk': '#00FF98',
        'druid': '#FF7C0A',
        'demon-hunter': '#A330C9',
        'evoker': '#33937F',
      },
    },
  },
  plugins: [],
}
