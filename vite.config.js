import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
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

          if (!path.includes('/node_modules/')) return

          // Keep 3D stack split so first-load cost is lower on mobile.
          if (path.includes('/node_modules/three/')) {
            return 'three-core'
          }

          if (path.includes('/node_modules/@react-three/fiber/')) {
            return 'r3f-vendor'
          }

          if (
            path.includes('/node_modules/@react-three/drei/') ||
            path.includes('/node_modules/three-stdlib/') ||
            path.includes('/node_modules/maath/')
          ) {
            return 'drei-vendor'
          }

          if (path.includes('/node_modules/zustand/')) {
            return 'state-vendor'
          }
        },
      },
    },
  },
})
