import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replace(/\\/g, '/')

          if (
            path.includes('/src/components/UI/ArcadeGame.jsx') ||
            path.includes('/src/arcade/')
          ) {
            return 'arcade-mode'
          }

          if (
            path.includes('/src/components/GameScene.jsx') ||
            path.includes('/src/components/Car.jsx') ||
            path.includes('/src/components/Track.jsx') ||
            path.includes('/src/components/Terrain.jsx') ||
            path.includes('/src/components/Lighting.jsx') ||
            path.includes('/src/components/UI/HUDPhoto.jsx') ||
            path.includes('/src/components/UI/RaceFinish.jsx') ||
            path.includes('/src/raceProgress.js')
          ) {
            return 'race-mode'
          }

          if (!id.includes('node_modules')) return

          if (
            id.includes('three') ||
            id.includes('@react-three/fiber') ||
            id.includes('@react-three/drei')
          ) {
            return 'three-vendor'
          }

          if (id.includes('zustand')) {
            return 'state-vendor'
          }
        },
      },
    },
  },
})
