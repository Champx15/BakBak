export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Clash Display", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        abyss: "#0b0d10",
        acid: "#d0ff00",
        neon: "#00ffc8",
        bruise: "#311a44"
      },
      animation: {
        reveal: "reveal 0.8s ease forwards"
      },
      keyframes: {
        reveal: {
          "0%": {opacity:0, transform:"translateY(20px)"},
          "100%": {opacity:1, transform:"translateY(0)"}
        }
      }
    }
  },
  plugins: []
}