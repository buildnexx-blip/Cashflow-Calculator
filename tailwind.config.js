/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],

    theme: {
        extend: {
            colors: {
                'homez-bg': '#FFFCED',
                'homez-primary': '#064E2C',
                'homez-accent': '#FD9B63',
                'homez-gold': '#C6A672',
                'homez-dark': '#0B090A',
            },
            fontFamily: {
                serif: ['Playfair Display', 'Georgia', 'serif'],
                sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
