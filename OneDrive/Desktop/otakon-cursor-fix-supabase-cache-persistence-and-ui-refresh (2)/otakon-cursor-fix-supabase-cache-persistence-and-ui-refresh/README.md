# Otagon - AI Gaming Assistant

A modern AI-powered gaming assistant built with React, TypeScript, and Supabase.

## Features

- **Multi-tier System**: Free, Pro, and Vanguard Pro tiers with different usage limits
- **14-day Free Trial**: Free users can try Pro features for 14 days
- **Developer Mode**: Switch between tiers for testing and development
- **Authentication**: Google, Discord, Email, and Developer mode login
- **Real-time Chat**: AI-powered conversation interface
- **Conversation Management**: Save and manage chat history
- **Responsive Design**: Modern UI with Tailwind CSS
- **PWA Support**: Progressive Web App capabilities

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Context + Local Storage
- **Icons**: Heroicons
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd otakon-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy the project URL and anon key
   - Create a `.env` file in the root directory:
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Set up the database**
   - Run the SQL schema from `supabase/master-schema.sql` in your Supabase SQL editor
   - This will create all necessary tables and functions

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── developer/      # Developer mode components
│   ├── features/       # Feature components (Chat, etc.)
│   ├── layout/         # Layout components (Sidebar, etc.)
│   ├── modals/         # Modal components
│   ├── splash/         # Splash screen components
│   ├── trial/          # Trial management components
│   └── ui/             # Reusable UI components
├── constants/          # Application constants
├── lib/               # External library configurations
├── services/          # Business logic services
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

## Tier System

### Free Tier
- 55 text queries per month
- 25 image queries per month
- Basic conversation features
- Standard response quality

### Pro Tier
- 1,583 text queries per month
- 328 image queries per month
- Enhanced conversation features
- Improved response quality
- Priority support
- No ads
- Grounding search enabled

### Vanguard Pro Tier
- 1,583 text queries per month
- 328 image queries per month
- All Pro features
- Exclusive Vanguard content
- VIP support
- Early access to new features
- Grounding search enabled

## Developer Mode

Developer mode allows you to:
- Switch between all tiers for testing
- Access all features regardless of tier
- Test tier-specific functionality
- Develop and debug the application

To enable developer mode:
1. Click "Developer Mode" on the login screen
2. Enter the developer password: `dev123` or `otakon-dev`
3. You'll have access to all tiers and features

## Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The application uses the following main tables:
- `users` - User profiles and tier information
- `conversations` - Chat conversation data
- `games` - Game information and metadata
- `usage_tracking` - Usage analytics and limits

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### v1.0.0
- Initial release
- Multi-tier system implementation
- Supabase integration
- Developer mode
- 14-day free trial
- Modern UI with Tailwind CSS
