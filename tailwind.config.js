/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'minecraft': ['Press Start 2P', 'cursive'],
      },
      colors: {
        minecraft: {
          grass: '#7CBD56',
          dirt: '#8B6914',
          stone: '#7F7F7F',
          wood: '#9C6B3F',
          diamond: '#5DDBFF',
          gold: '#FCEE4B',
          iron: '#D8D8D8',
          redstone: '#DC143C',
          emerald: '#50C878',
          obsidian: '#0F0F23',
          netherBrick: '#441818',
          lapis: '#1E3A8A',
          darkoak: '#654321',
        },
      },
    },
  },
  plugins: [],
};
