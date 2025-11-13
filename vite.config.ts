import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'development' ? '/' : '/Otagon/', // Root path in dev, /Otagon/ in production
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 300, // Lower threshold for warnings
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - Core libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // Supabase
            if (id.includes('@supabase') || id.includes('postgres')) {
              return 'supabase-vendor';
            }
            // Google AI
            if (id.includes('@google/generative-ai')) {
              return 'ai-vendor';
            }
            // Markdown (heavy library)
            if (id.includes('react-markdown') || id.includes('remark')) {
              return 'markdown-vendor';
            }
            // Icons
            if (id.includes('@heroicons')) {
              return 'icons-vendor';
            }
            // Other vendor code
            return 'vendor';
          }
          
          // Application code splitting
          // Services - lazy load non-critical services
          if (id.includes('/src/services/')) {
            if (id.includes('authService') || id.includes('supabaseService')) {
              return 'core-services'; // Critical services
            }
            if (id.includes('aiService') || id.includes('conversationService')) {
              return 'chat-services';
            }
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
            // Feature components
            if (id.includes('/features/')) {
              return 'features';
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
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  optimizeDeps: {
    force: true, // Force re-optimization
  },
}))
