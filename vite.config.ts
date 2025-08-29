import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Custom plugin to handle SPA routing
const spaFallbackPlugin = () => {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      // Handle SPA routing - serve index.html for all routes except assets
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        
        // Skip for asset requests
        if (url.startsWith('/assets/') || 
            url.startsWith('/@') || 
            url.includes('.') || 
            url.startsWith('/api/')) {
          return next()
        }
        
        // For all other routes, serve index.html
        req.url = '/'
        next()
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  
  return {
    plugins: [
      react(),
      spaFallbackPlugin()
    ],
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
      cssCodeSplit: true,
      // Optimize chunk sizes with better splitting
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('@google') || id.includes('genai')) {
                return 'vendor-ai';
              }
              if (id.includes('@heroicons') || id.includes('lottie')) {
                return 'vendor-ui';
              }
              // Group other node_modules
              return 'vendor-other';
            }
            // Group services by functionality
            if (id.includes('/services/')) {
              if (id.includes('supabase') || id.includes('database')) {
                return 'services-data';
              }
              if (id.includes('gemini') || id.includes('ai')) {
                return 'services-ai';
              }
              if (id.includes('pwa') || id.includes('analytics')) {
                return 'services-pwa';
              }
              return 'services-core';
            }
            // Group components by feature
            if (id.includes('/components/')) {
              if (id.includes('Chat') || id.includes('Message')) {
                return 'components-chat';
              }
              if (id.includes('Settings') || id.includes('Modal')) {
                return 'components-settings';
              }
              if (id.includes('Landing') || id.includes('Splash')) {
                return 'components-landing';
              }
              return 'components-other';
            }
          },
          // Optimize chunk naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/${facadeModuleId}-[hash].js`;
          },
          // Optimize asset naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return `assets/css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          }
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1500,
      // Enable source maps for production debugging
      sourcemap: false,
      // Optimize dependencies
      commonjsOptions: {
        include: [/node_modules/]
      },
      // Enable minification (using esbuild for better performance)
      minify: 'esbuild',
      esbuild: {
        drop: ['console', 'debugger'],
        pure: ['console.log', 'console.info']
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
      include: ['react', 'react-dom', 'react-markdown', 'remark-gfm']
    }
  }
})