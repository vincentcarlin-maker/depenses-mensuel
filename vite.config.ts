import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  },
  // Définir le chemin de base pour le déploiement sur GitHub Pages.
  // Cela garantit que les chemins vers les ressources (JS, CSS, images) sont corrects.
  base: '/depenses-mensuel/',
})