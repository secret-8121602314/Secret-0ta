import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Custom plugin to handle SPA routing
const spaFallbackPlugin = () => {
  return {
    name: 'spa-fallback',
    configureServer(server: any) {
      // Handle SPA routing - serve index.html for all routes except assets
      server.middlewares.use((req: any, res: any, next: any) => {
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
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
      'process.env.API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true, // Enable source maps for debugging minified errors
      // Raise only the warning threshold; does not affect runtime
      chunkSizeWarningLimit: 1200,
      minify: 'terser', // Use terser for better minification control
      terserOptions: {
        compress: {
          // Preserve function names for better debugging
          keep_fnames: true
        },
        mangle: {
          // Don't mangle certain variable names that cause reference errors
          reserved: ['ae', 've', 'je', 'supabase', 'authService']
        }
      },
      cssCodeSplit: false, // Keep CSS in single file for better HMR
      rollupOptions: {
        input: {
          main: './index.html'
        },
        external: [],
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // Split react core vs react-dom to avoid a single big vendor chunk
              if (id.includes('react-dom')) return 'vendor-react-dom';
              if (id.includes('/react/')) return 'vendor-react';
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-ai';
              }
              if (id.includes('@heroicons') || id.includes('lottie')) {
                return 'vendor-ui';
              }
              if (id.includes('react-markdown') || id.includes('remark-gfm')) {
                return 'vendor-markdown';
              }
              return 'vendor-misc';
            }
            
            // Service chunks
            if (id.includes('/services/') && !id.includes('/services/types')) {
              if (id.includes('geminiService') || id.includes('aiContextService') || id.includes('unifiedAIService')) {
                return 'app-ai-services';
              }
              if (id.includes('supabase') || id.includes('profileService') || id.includes('authService')) {
                return 'app-data-services';
              }
              return 'app-services';
            }
            
            // Component chunks
            if (id.includes('/components/')) {
              if (id.includes('Modal') || id.includes('Screen')) {
                return 'app-modals';
              }
              if (id.includes('/new-landing/')) {
                return 'app-landing';
              }
              return 'app-components';
            }
          }
        }
      }
    },
    css: {
      devSourcemap: true, // Enable CSS source maps in development
    },
    publicDir: 'public',
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