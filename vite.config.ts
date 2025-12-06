import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/', // Root path for custom domain
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production to reduce console noise
    chunkSizeWarningLimit: 500, // Raise limit - our chunks are optimized and lazy loaded
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - Core libraries
          if (id.includes('node_modules')) {
            // React DOM - separate chunk (largest React piece ~130KB)
            if (id.includes('react-dom')) {
              return 'react-dom-vendor';
            }
            // React core (without router/markdown)
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-markdown')) {
              return 'react-vendor';
            }
            // Framer Motion - separate chunk (~100KB, lazy loadable)
            if (id.includes('framer-motion')) {
              return 'framer-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // Supabase - split by subpackage
            if (id.includes('@supabase/realtime')) {
              return 'supabase-realtime';
            }
            if (id.includes('@supabase') || id.includes('postgres')) {
              return 'supabase-vendor';
            }
            // Google AI
            if (id.includes('@google/generative-ai')) {
              return 'ai-vendor';
            }
            // Markdown - split react-markdown from remark plugins
            if (id.includes('react-markdown')) {
              return 'markdown-vendor';
            }
            if (id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('mdast') || id.includes('hast') || id.includes('micromark')) {
              return 'markdown-utils';
            }
            // Embla carousel
            if (id.includes('embla')) {
              return 'carousel-vendor';
            }
            // Icons
            if (id.includes('@heroicons')) {
              return 'icons-vendor';
            }
            // Other vendor code
            return 'vendor';
          }
          
          // Application code splitting
          // Services - granular splitting for better lazy loading
          if (id.includes('/src/services/')) {
            // Critical auth services - load first
            if (id.includes('authService') || id.includes('supabaseService')) {
              return 'core-services';
            }
            // Chat/AI services - load when chat opens
            if (id.includes('aiService') || id.includes('conversationService') || id.includes('messageService') || id.includes('chatMemoryService')) {
              return 'chat-services';
            }
            // Gaming/IGDB services - lazy load for explorer
            if (id.includes('gaming') || id.includes('igdb') || id.includes('gallery') || id.includes('gameTab') || id.includes('gameHub') || id.includes('gameKnowledge')) {
              return 'gaming-services';
            }
            // Session/Storage services
            if (id.includes('session') || id.includes('storage') || id.includes('cache') || id.includes('indexedDB')) {
              return 'storage-services';
            }
            // Other services
            return 'services';
          }
          
          // Components
          if (id.includes('/src/components/')) {
            // Modals - lazy loaded
            if (id.includes('/modals/')) {
              return 'modals';
            }
            // Auth components
            if (id.includes('/auth/')) {
              return 'auth';
            }
            // Gaming explorer - lazy load
            if (id.includes('gaming-explorer') || id.includes('GamingExplorer')) {
              return 'gaming-explorer';
            }
            // Feature components
            if (id.includes('/features/')) {
              return 'features';
            }
            // Layout components
            if (id.includes('/layout/')) {
              return 'layout';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true,
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: false, // Only force when needed
  },
}))
