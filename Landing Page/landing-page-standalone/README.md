# Otakon AI - Standalone Landing Page

This is a standalone version of the Otakon AI landing page that can run independently from the main application.

## Features

- Professional landing page with feature showcase
- Contact form with database integration
- Waitlist signup functionality
- Responsive design with animations
- Pricing tiers and subscription options
- Testimonials and social proof

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # React components
├── services/           # API and database services
├── styles/            # CSS and Tailwind styles
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Dependencies

- React 19
- TypeScript
- Tailwind CSS
- Heroicons
- Supabase (for database)

## Deployment

This landing page can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## Integration

The landing page is designed to work independently but can easily integrate with the main Otakon application when needed.
