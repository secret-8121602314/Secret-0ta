# Vite Documentation

Vite is a lightning-fast frontend build tool providing instant server start, fast HMR, and optimized production builds.

## Version: 6.0.1

## Quick Start

### Development Server
```bash
# Start dev server
npm run dev

# Start with specific port
vite --port 3000

# Start with open browser
vite --open
```

### Production Build
```bash
# Build for production
npm run build

# Build with source maps
vite build --sourcemap

# Preview production build
npm run preview
```

## Configuration

Vite is configured in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: mode === 'development' ? '/' : '/Otagon/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 300,
  },
  server: {
    port: 5173,
    hmr: {
      overlay: true,
    },
  }
})
```

## Key Features

### Hot Module Replacement (HMR)
- Sub-second updates during development
- Preserves component state
- No full page reload needed

### Code Splitting
- Automatic chunk creation for better caching
- Manual chunk configuration available
- Tree-shaking for unused code removal

### Asset Handling
- Import images, fonts, videos as modules
- Automatic optimization
- Base path support for deployments

### CSS Support
- CSS Modules
- CSS Preprocessors (Sass, Less, Stylus)
- PostCSS integration
- CSS in JS with supported libraries

### TypeScript Support
- Built-in TypeScript support
- JSX transformation
- Type checking with `npm run type-check`

## Environment Variables

Access environment variables prefixed with `VITE_`:

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App
```

```typescript
// Usage in code
const apiUrl = import.meta.env.VITE_API_URL
const appTitle = import.meta.env.VITE_APP_TITLE
```

## Build Optimization

### Code Splitting
The project implements automatic code splitting for:
- React vendor bundle
- Router bundle
- Supabase bundle
- AI service bundle
- Component bundles

### Image Optimization
- Static imports analyzed at build time
- Automatic format conversion
- Lazy loading support

### CSS Optimization
- PurgeCSS via Tailwind
- CSS minification
- Duplicate removal

## Development Workflow

### File Watching
```bash
# Build in watch mode
vite build --watch
```

### Debugging
- Use Chrome DevTools with source maps
- Vue DevTools extension (if using Vue)
- React DevTools extension (for React)

### Performance Profiling
```bash
# Profile build
vite build --profile
```

## Common Issues

### Port Already in Use
```bash
# Use different port
vite --port 3000
```

### Source Maps Not Generated
```bash
# Enable source maps in dev
vite --sourcemap
```

### Module Not Found
- Check path aliases in `tsconfig.json`
- Verify file exists
- Use correct import syntax

## Integration with Build Process

The Otagon build process:
1. TypeScript compilation
2. Code minification
3. Asset optimization
4. Base path adjustment
5. Public assets copying

## Resources

- [Vite Docs](https://vitejs.dev)
- [Vite Config Reference](https://vitejs.dev/config/)
- [Vite Guide](https://vitejs.dev/guide/)

## Related Documentation

- [React Integration](./REACT.md)
- [TypeScript Setup](./TYPESCRIPT.md)
- [Tailwind CSS](./TAILWIND_CSS.md)
