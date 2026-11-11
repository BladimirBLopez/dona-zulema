/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Frial Jurado
        marca: {
          azul: '#0033AA',
          rojo: '#E00000',
          amarillo: '#FFC400',
          naranja: '#FF8000',
        },
        // Alias heredados para conservar las clases existentes.
        vino: { 50: '#EEF4FF', 100: '#DCE9FF', 200: '#BDD4FF', 300: '#8BB5FF', 400: '#568FFF', 500: '#286AF4', 600: '#0D53D6', 700: '#073EBA', 800: '#0033AA', 900: '#072572', 950: '#061943' },
        oro: { 200: '#FFF1A6', 300: '#FFE36A', 400: '#FFC400', 500: '#F2AA00', 600: '#CD7C00' },
        crema: { DEFAULT: '#fbf6ec', 100: '#f5ecd9' },
        panel: { DEFAULT: '#f4f5f7', 100: '#eceef1' },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,35,100,.06), 0 8px 24px -12px rgba(0,35,100,.18)',
        lift: '0 2px 4px rgba(0,35,100,.08), 0 20px 40px -16px rgba(0,35,100,.25)',
      },
    },
  },
  plugins: [],
};
