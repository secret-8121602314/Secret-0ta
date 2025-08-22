import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      }
    },
    build: {
      // Optimize chunk sizes
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            vendor: ['react', 'react-dom']
          }
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable source maps for production debugging
      sourcemap: false,
      // Optimize dependencies
      commonjsOptions: {
        include: [/node_modules/]
      }
    },
    // Optimize development server
    server: {
      hmr: {
        overlay: false,
        // Prevent excessive hot reloads
        timeout: 5000,
        // Only reload on actual file changes
        reloadOnFailure: false
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  }
})