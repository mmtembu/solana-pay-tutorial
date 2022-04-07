module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // backgroundImage:{
      //   'kota-lg': "url('https://eskort.com/wp-content/uploads/2020/11/Eskort-Garlic-Polony-Kota.jpg')"
      // }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
