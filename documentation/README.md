# Otagon Project Documentation

Welcome to the Otagon project comprehensive documentation repository. This folder contains up-to-date documentation for all libraries, frameworks, and tools used in this project.

## Project Tech Stack

### Frontend Framework & Build
- **React 18.3.1** - UI library with hooks and components
- **Vite 6.0.1** - Lightning-fast build tool
- **React Router 6.23.1** - Client-side routing
- **TypeScript 5.6.2** - Type-safe JavaScript

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS transformations
- **Tailwind Merge 3.3.1** - Utility conflict resolution

### Backend & Database
- **Supabase 2.58.0** - PostgreSQL backend platform
- **Firebase** - Authentication and hosting
- **Google Generative AI 0.24.1** - Gemini API integration

### UI Components & Icons
- **Heroicons React 2.2.0** - SVG icons
- **Embla Carousel React 8.6.0** - Carousel component
- **React Markdown 9.1.0** - Markdown rendering
- **Remark GFM 4.0.1** - GitHub-flavored markdown

### Development Tools
- **ESLint** - Code linting
- **Autoprefixer 10.4.21** - CSS vendor prefixes
- **Postgres 3.4.7** - Database library

## Documentation Structure

```
documentation/
├── README.md (this file)
├── ARCHITECTURE.md (Project architecture overview)
├── SETUP_GUIDE.md (Getting started guide)
└── libraries/
    ├── REACT.md
    ├── VITE.md
    ├── TYPESCRIPT.md
    ├── REACT_ROUTER.md
    ├── TAILWIND_CSS.md
    ├── SUPABASE.md
    ├── FIREBASE.md
    └── GEMINI_API.md
```

## Quick Navigation

### Core Frontend Libraries
- [React Documentation](./libraries/REACT.md) - Component-based UI
- [TypeScript Documentation](./libraries/TYPESCRIPT.md) - Type safety
- [React Router Documentation](./libraries/REACT_ROUTER.md) - Navigation

### Build & Styling
- [Vite Documentation](./libraries/VITE.md) - Build tool
- [Tailwind CSS Documentation](./libraries/TAILWIND_CSS.md) - Utility-first CSS

### Backend Services
- [Supabase Documentation](./libraries/SUPABASE.md) - PostgreSQL platform
- [Firebase Documentation](./libraries/FIREBASE.md) - Backend services
- [Gemini API Documentation](./libraries/GEMINI_API.md) - AI/LLM integration

## Common Tasks

### Getting Started
1. Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for project setup
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure
3. Check specific library docs in `libraries/` folder

### Development
- **Building**: `npm run build`
- **Development**: `npm run dev`
- **Type Checking**: `npm run type-check`
- **Linting**: `npm run lint`

### Deployment
- **Firebase**: `npm run firebase:deploy`
- **GitHub Pages**: `npm run deploy:gh-pages`

## Key Features

### Authentication
- Email/password via Firebase/Supabase
- OAuth integration (Google, GitHub, etc.)
- JWT token management

### Real-time Features
- WebSocket subscriptions via Supabase
- Real-time database synchronization
- Broadcast messaging for collaboration

### AI Integration
- Google Gemini API for text generation
- Image understanding capabilities
- Multi-modal content support

### File Storage
- S3-compatible storage via Supabase
- Firebase Storage integration
- CDN distribution

## Version Information

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **React**: 18.3.1
- **Vite**: 6.0.1
- **TypeScript**: 5.6.2

## Important Notes

### API Keys & Secrets
All sensitive API keys should be stored in environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_API_KEY`
- Firebase config in `firebase.json`

### Building for Production
The build process includes:
1. TypeScript compilation
2. Code minification
3. Asset optimization
4. Base path adjustment for GitHub Pages
5. Public assets copying

### Performance Considerations
- Code splitting by feature
- Lazy loading of routes
- Image optimization
- CSS optimization via Tailwind
- HMR support during development

## Troubleshooting

### Common Issues

**Module not found errors:**
- Check path aliases in `tsconfig.json` (uses `@/` for `src/`)
- Ensure imports use correct relative paths

**Build failures:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`

**Styling issues:**
- Ensure Tailwind CSS is properly configured in `vite.config.ts`
- Check for conflicting CSS utilities
- Review `tailwind.config.js` for theme overrides

## Contributing

When adding new libraries or tools:
1. Document in this README.md
2. Create library-specific documentation in `libraries/`
3. Update ARCHITECTURE.md if structure changes
4. Include usage examples

## Resources

- [Official React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Supabase Docs](https://supabase.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Gemini API Guide](https://ai.google.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Last Updated

This documentation was generated from official sources on November 15, 2025.

For the latest information, always refer to official library documentation URLs listed in the resources section.
