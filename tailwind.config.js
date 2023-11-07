/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/components/**/*.html", // Include HTML files
    "./src/app/components/**/*.js", // Include JavaScript files
    // Add more file types or paths as needed
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2196f3",
        secondary: "#f0f0f0",
        accent: "#fc120f",
        darkGrey:'#d6d2d2',
        offWhite:'#fafafa',
      },
    },
  },
  plugins: [],
};
