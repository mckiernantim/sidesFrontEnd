/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,js}",
    "./src/app/components/**/*.html", 
    "./src/app/components/**/*.js",
  ],
  theme: {
    extend: {
      height: {
        '30rem': '30rem',
        '50vh' :'50vh'
      },
      minHeight: {
        '21rem': '21rem',
        "12rem" : "12rem",
        "30rem": "30rem"
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
        sw: {
          text: 'var(--sw-text)',
          'text-muted': 'var(--sw-text-muted)',
          surface: 'var(--sw-surface)',
          'surface-2': 'var(--sw-surface-2)',
          border: 'var(--sw-border)',
          bg: 'var(--sw-bg)',
          accent: 'var(--sw-accent)',
          success: 'var(--sw-success)',
          warning: 'var(--sw-warning)',
        },
      },
      backgroundImage: {
        'my-blue': 'linear-gradient(45deg, #0c69d7 20%, #3500ff)',
      },
    },
  },
  plugins: [],
  safelist: [
    /^bg-/,
    /^text-/,
    /^border-/,
  ]
};
