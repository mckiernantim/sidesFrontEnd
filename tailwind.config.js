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
        'dark-gray': '#1f2937',
        'white': '#ffffff',
        'deep-blue': '#1e3a8a',
        'bright-blue': '#2563eb',
        'soft-red': '#ef4444',
      },
    },
  },
  plugins: [],
};
