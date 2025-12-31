/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: '#FFF7ED',
                peach: {
                    DEFAULT: '#FDBA74',
                    light: '#FED7AA',
                    dark: '#FB923C', // darker shade for hover states
                },
                charcoal: '#3F3F46',
                stone: {
                    200: '#E7E5E4',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
