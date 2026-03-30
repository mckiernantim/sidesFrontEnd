/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,js}",
    "./src/app/components/**/*.html",
    "./src/app/components/**/*.js",
  ],
  theme: {
    extend: {
      // ─── Brand Colors ────────────────────────────────────────────────────────
      // Sourced from Figma: 00_Home / 01A_Upload / 01B_Uploading
      colors: {
        // Backgrounds
        'sw-bg':         '#060A14',   // page-level deep dark
        'sw-surface':    '#0D1420',   // card / panel surface
        'sw-surface-2':  '#141C2E',   // elevated surface (modals, dropdowns)
        'sw-border':     '#1E2940',   // subtle dark border

        // Brand accent — neon chartreuse / yellow-green
        'sw-accent':     '#C4FF00',   // primary CTA, highlights, logo bolt
        'sw-accent-hover':'#D6FF3D',  // hover state
        'sw-accent-dark':'#9ECC00',   // pressed / icon on dark surface
        'sw-accent-fg':  '#000000',   // text/icon on top of accent

        // Text
        'sw-text':       '#FFFFFF',   // primary text
        'sw-text-muted': '#8B95A8',   // body / secondary text
        'sw-text-subtle':'#545F73',   // tertiary / placeholder text

        // Semantic
        'sw-danger':     '#FF4B4B',   // error / destructive
        'sw-success':    '#22C55E',   // success state
        'sw-warning':    '#F59E0B',   // warning / caution
        'sw-info':       '#38BDF8',   // informational
      },

      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        // Display / hero headlines  (Barlow Condensed Bold/ExtraBold/Black)
        display: ['"Barlow Condensed"', 'Impact', 'ui-sans-serif', 'sans-serif'],
        // Body / UI copy  (Inter)
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ─── Spacing extras ──────────────────────────────────────────────────────
      height: {
        '30rem': '30rem',
        '50vh':  '50vh',
      },
      minHeight: {
        '12rem': '12rem',
        '21rem': '21rem',
        '30rem': '30rem',
      },

      // ─── Background gradients ────────────────────────────────────────────────
      backgroundImage: {
        // Subtle dark-to-surface gradient used on panel edges
        'sw-panel': 'linear-gradient(180deg, #0D1420 0%, #060A14 100%)',
        // Upload drop zone dashed gradient
        'sw-upload-zone': 'linear-gradient(135deg, #0D1420 0%, #141C2E 100%)',
      },
    },
  },
  plugins: [],
  safelist: [
    /^bg-sw-/,
    /^text-sw-/,
    /^border-sw-/,
    /^bg-/,
    /^text-/,
    /^border-/,
  ],
};
