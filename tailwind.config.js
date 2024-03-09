/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/components/**/*.html", 
    "./src/app/components/**/*.js", 

  ],
  theme: {
    extend: {
      minHeight: {
        '21rem': '21rem',
        "12rem" : "12rem"
      },
      fontSize: {
        'lg-custom':'1rem'
      },
      colors: {
        primary: '#001D3D',    
        secondary:'#003566',   
        accent: '#000814 ',    
        darkGrey: '#FFC300',   
        offWhite: '#E0E0E0',    
      },
    },
  },
  plugins: [],
};
