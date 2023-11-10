/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/components/**/*.html", 
    "./src/app/components/**/*.js", 

  ],
  theme: {
    extend: {
      colors: {
        primary: '#001D3D',     // Dark blue
        secondary:'#003566',   // Darker blue
        accent: '#000814 ',      // Darker than primary blue
        darkGrey: '#FFC300',    // Yellow
        offWhite: '#FFD60A',    // Bright yellow
      },
    },
  },
  plugins: [],
};