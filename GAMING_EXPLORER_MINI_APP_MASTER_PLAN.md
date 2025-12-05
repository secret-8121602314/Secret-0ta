# 🎮 Gaming Explorer Mini-App - Master Implementation Plan

**Date:** December 5, 2025  
**Vision:** A comprehensive gaming exploration experience powered by IGDB that captures users' complete gaming journey

---

## 📋 Executive Summary

This document outlines the complete architecture, design, and implementation strategy for the **Gaming Explorer Mini-App** - an immersive overlay application accessible via the Otagon logo in the chat header. This mini-app will serve as a personalized gaming hub, tracking users' gaming history, managing their library, and providing contextual gaming content.

### Core Value Proposition
- **Personalized Gaming Journey**: Timeline from birth to present, tracking consoles, PC builds, favorite games
- **Smart Library Management**: Own, wishlist, favorites, disliked games with IGDB integration
- **Context for AI**: All user selections feed into Game Hub tab for personalized recommendations
- **Content Aggregation**: Gaming news, reviews, Reddit trends, videos, walkthroughs
- **Modern Gaming Design**: Sleek, intuitive interface inspired by modern gaming platforms

---

## 🏗️ Architecture Overview

### Entry Point
**Logo in Chat Header** (MainApp.tsx line 3589)
- Currently displays tier-based logo (Free/Pro/Vanguard)
- Will become clickable to open Gaming Explorer overlay
- Logo will have subtle animation on hover to indicate interactivity

### Overlay System
- **Full-screen modal** overlaying the main chat interface
- **Z-index hierarchy**: Above chat (z-70+), below critical modals
- **Smooth transitions**: Slide-in from right with backdrop blur
- **Back navigation**: Close button + ESC key + backdrop click
- **Mobile-responsive**: Full-screen on mobile, partial overlay on desktop

---

## 🗂️ Information Architecture

### 4 Main Sections

#### 1. **Home** 🏠
**Purpose:** Gaming news, trends, and discovery hub

**Components:**
- **Hero Banner**: Rotating featured games/news
- **Trending Now**: 
  - Reddit r/gaming top posts (daily)
  - Twitter gaming trends
  - Metacritic new reviews
- **Latest Releases**: IGDB recent releases
- **Upcoming Games**: Release calendar (next 30/60/90 days)
- **Video Highlights**: 
  - YouTube gaming trailers
  - IGN video reviews
  - Gameplay clips
- **Quick Actions**:
  - Add game to library
  - Add to wishlist
  - Search IGDB

**Data Sources:**
- IGDB API (games, releases, videos)
- Reddit API (r/gaming, r/Games, r/pcgaming)
- YouTube Data API (gaming channels)
- Steam API (trending games)
- Metacritic (via web scraping or API)

#### 2. **Timeline** 📅
**Purpose:** Visual journey of user's gaming history

**Timeline Events:**
- **Birth Year**: Starting point
- **First Console**: Year + console name + memories
- **Console Collection**: All owned/played consoles chronologically
- **PC Builds**: Multiple builds over time
  - Specs (CPU, GPU, RAM, Storage)
  - Photos of setups
  - Build dates
- **Gaming Setup Photos**: 
  - Battle stations
  - Setup evolution
  - Photo upload with captions
- **Milestone Games**: 
  - Games that defined each era
  - Personal memories/notes
- **Life Events**: Optional gaming-related milestones

**Visualization:**
- **Vertical timeline** (mobile-friendly)
- **Era cards** with images and details
- **Interactive nodes**: Click to expand details
- **Photo gallery** for each era
- **Stats**: Total consoles owned, total games played, years gaming

**User Actions:**
- Add new timeline event
- Edit existing events
- Upload photos (max 5MB, stored in Supabase Storage)
- Add notes/memories
- Mark favorite eras

#### 3. **Library** 📚
**Purpose:** Comprehensive game management system

**Sub-sections:**

##### a) **Own** 
- Games user currently owns
- Platform tags (PC, PS5, Xbox, Switch, etc.)
- Purchase date
- Completion status (Not Started, Playing, Completed, Abandoned)
- Hours played (optional manual entry)
- Personal rating (1-5 stars)
- Notes

##### b) **Wishlist**
- Games user wants to buy
- Priority level (High, Medium, Low)
- Price tracking (if available via Steam/IGDB)
- Expected purchase date
- Reason for wanting

##### c) **Favorites** ⭐
- All-time favorite games
- Ranking (drag-to-reorder)
- "Why it's special" notes
- Replay count

##### d) **Disliked** 👎
- Games that didn't resonate
- Reason for dislike (helps AI understand preferences)
- Optional public review

##### e) **Consoles & Hardware**
- Current consoles owned
- Past consoles (now sold/broken)
- PC specifications (current + historical)
- Controllers, peripherals

**Game Cards Design:**
- IGDB cover art
- Title + platform icons
- Metacritic score
- Personal rating
- Quick actions (Move to another list, Delete, View details)

**Filters & Search:**
- By platform
- By genre
- By status
- By rating
- By date added
- Full-text search

#### 4. **Game Page** 🎮
**Purpose:** Rich, detailed view for each game with AI-powered content

**Sections:**

##### Header
- Full-width banner (IGDB artwork)
- Cover art
- Title + Developer/Publisher
- Release date
- Metacritic score + IGDB rating
- User's personal status (Own/Wishlist/Favorite/Disliked)
- Quick action buttons

##### Core Info Tabs
1. **Overview**
   - Summary
   - Storyline
   - Genres, themes, modes
   - Platforms
   - Age ratings
   - Similar games

2. **Media**
   - Screenshots gallery
   - Artworks
   - Videos (embedded YouTube)
   - Trailer

3. **Community**
   - Reddit discussions (search r/gaming for game name)
   - YouTube walkthroughs
   - Twitch streams (top streamers playing this game)
   - Steam reviews (if available)

4. **Walkthroughs & Guides** (AI-Powered)
   - **Only for games user owns**
   - AI scrapes:
     - IGN walkthroughs
     - GameFAQs guides
     - YouTube walkthrough series
     - Steam community guides
   - Organized by:
     - Main story walkthrough
     - Side quests
     - Collectibles
     - Achievements/Trophies
     - Secrets & Easter eggs
   - Chat integration: "Ask me about this game"

5. **DLC & Expansions**
   - List from IGDB
   - Ownership status
   - Add to library

6. **Collections & Franchises**
   - Part of series
   - Related games

##### AI Integration (Game-Specific Tabs)
**When user owns a game:**
- AI assistant learns everything about that game
- Can answer specific questions:
  - "How do I beat the water temple in Zelda?"
  - "Where's all the hidden loot in Area 3?"
  - "Best build for this character?"
- Contextual help in Game Hub tab
- Remembers user's progress/preferences

**How AI Scraping Works:**
1. User adds game to "Own" library
2. Background job triggered (Supabase Edge Function)
3. Scrapes content from:
   - IGN (structured walkthroughs)
   - GameFAQs (text guides)
   - YouTube (walkthrough playlists - store metadata only)
   - Steam guides
4. Content stored in vector database (Supabase pgvector)
5. AI can retrieve relevant sections on demand
6. Periodic updates (weekly) for new guides

---

## 🎨 Design System

### Modern Gaming Aesthetic

**Color Palette:**
- **Background**: Deep blacks (#0A0A0A, #111111)
- **Surface**: Dark grays (#1C1C1C, #242424)
- **Accents**: 
  - Primary: Electric blue (#00BFFF)
  - Secondary: Neon purple (#8B00FF)
  - Success: Neon green (#00FF88)
  - Warning: Amber (#FFAB40)
  - Error: Red (#FF4444)
- **Text**: 
  - Primary: Off-white (#F5F5F5)
  - Secondary: Light gray (#CFCFCF)
  - Muted: Medium gray (#8F8F8F)

**Typography:**
- **Headings**: Inter Bold, 24-40px
- **Body**: Inter Regular, 14-16px
- **Captions**: Inter Medium, 12-14px

**Components:**
- **Glass morphism**: Backdrop blur + semi-transparent backgrounds
- **Neumorphism**: Subtle shadows for depth
- **Animated gradients**: On hover states
- **Smooth transitions**: 200-300ms ease-in-out
- **Micro-interactions**: Button clicks, card hovers, page transitions

**Layout:**
- **Desktop**: 
  - Left sidebar navigation (Home/Timeline/Library/Game Page)
  - Main content area (80% width)
  - Right sidebar (optional quick info)
- **Mobile**: 
  - Bottom tab bar
  - Full-width content
  - Swipe gestures

**Inspiration:**
- Xbox Dashboard (modern, clean)
- PlayStation Store (immersive media)
- Steam (library organization)
- Notion (timeline structure)
- Discord (sleek dark theme)

---

## 💾 Data Model & Supabase Schema

### New Tables

#### 1. `gaming_timeline_events`
```sql
CREATE TABLE gaming_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'birth', 'console', 'pc_build', 'milestone_game', 'setup_photo', 'custom'
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB, -- Flexible data storage (console specs, PC build, etc.)
  photos TEXT[], -- Array of Supabase Storage URLs
  display_order INTEGER, -- For custom sorting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_user_date ON gaming_timeline_events(user_id, event_date DESC);
```

**JSONB Data Examples:**
```json
// Console event
{
  "console_name": "PlayStation 5",
  "manufacturer": "Sony",
  "purchase_location": "Best Buy",
  "memories": "First game was Spider-Man Miles Morales",
  "still_owned": true
}

// PC Build event
{
  "build_name": "Gaming Rig 2024",
  "specs": {
    "cpu": "AMD Ryzen 9 7950X",
    "gpu": "NVIDIA RTX 4090",
    "ram": "64GB DDR5",
    "storage": "2TB NVMe SSD",
    "case": "Lian Li O11 Dynamic"
  },
  "budget": 3500,
  "build_date": "2024-03-15"
}
```

#### 2. `game_library`
```sql
CREATE TABLE game_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  igdb_game_id INTEGER NOT NULL, -- Links to IGDB
  game_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'own', 'wishlist', 'favorite', 'disliked'
  platform TEXT, -- 'PC', 'PS5', 'Xbox Series X', etc.
  purchase_date DATE,
  completion_status TEXT, -- 'not_started', 'playing', 'completed', 'abandoned'
  hours_played INTEGER,
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5),
  notes TEXT,
  wishlist_priority TEXT, -- 'high', 'medium', 'low'
  favorite_rank INTEGER, -- For ordering favorites
  dislike_reason TEXT,
  igdb_cached_data JSONB, -- Cache of IGDB data for offline access
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_library_user_category ON game_library(user_id, category);
CREATE INDEX idx_library_igdb ON game_library(igdb_game_id);
CREATE UNIQUE INDEX idx_library_user_game_category ON game_library(user_id, igdb_game_id, category);
```

#### 3. `user_consoles`
```sql
CREATE TABLE user_consoles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  console_name TEXT NOT NULL,
  manufacturer TEXT, -- 'Sony', 'Microsoft', 'Nintendo'
  generation INTEGER, -- Console generation (5, 6, 7, 8, 9)
  purchase_year INTEGER,
  currently_owned BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consoles_user ON user_consoles(user_id);
```

#### 4. `pc_builds`
```sql
CREATE TABLE pc_builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  build_name TEXT NOT NULL,
  build_date DATE,
  cpu TEXT,
  gpu TEXT,
  ram TEXT,
  storage TEXT,
  motherboard TEXT,
  case_model TEXT,
  psu TEXT,
  cooling TEXT,
  peripherals JSONB, -- { "mouse": "...", "keyboard": "...", "monitor": "..." }
  total_cost DECIMAL(10, 2),
  photos TEXT[], -- Array of Supabase Storage URLs
  is_current BOOLEAN DEFAULT false, -- Mark current active build
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pc_builds_user ON pc_builds(user_id);
```

#### 5. `game_content_cache` (AI Scraping)
```sql
CREATE TABLE game_content_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  igdb_game_id INTEGER NOT NULL,
  content_type TEXT NOT NULL, -- 'walkthrough', 'guide', 'video', 'reddit_thread'
  source TEXT NOT NULL, -- 'ign', 'gamefaqs', 'youtube', 'reddit'
  title TEXT,
  url TEXT NOT NULL,
  content TEXT, -- Full text content (for walkthroughs/guides)
  metadata JSONB, -- Additional data (author, date, upvotes, etc.)
  embedding vector(1536), -- OpenAI embeddings for semantic search
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_content_game ON game_content_cache(igdb_game_id);
CREATE INDEX idx_game_content_type ON game_content_cache(content_type);
-- Vector similarity search index (requires pgvector extension)
CREATE INDEX idx_game_content_embedding ON game_content_cache USING ivfflat (embedding vector_cosine_ops);
```

#### 6. `gaming_news_cache`
```sql
CREATE TABLE gaming_news_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL, -- 'reddit', 'youtube', 'steam', 'metacritic'
  source_id TEXT NOT NULL, -- Original post/video ID
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  engagement_score INTEGER, -- Upvotes, likes, views
  category TEXT, -- 'news', 'review', 'gameplay', 'discussion'
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_news_cache_source ON gaming_news_cache(source);
CREATE INDEX idx_news_cache_published ON gaming_news_cache(published_at DESC);
CREATE INDEX idx_news_cache_expires ON gaming_news_cache(expires_at);
```

### Updates to Existing Tables

#### `users` table additions:
```sql
ALTER TABLE users ADD COLUMN gaming_birth_year INTEGER;
ALTER TABLE users ADD COLUMN first_console TEXT;
ALTER TABLE users ADD COLUMN gaming_bio TEXT; -- Short bio about their gaming journey
```

### RLS Policies

All new tables require Row Level Security:

```sql
-- gaming_timeline_events
ALTER TABLE gaming_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own timeline" ON gaming_timeline_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timeline" ON gaming_timeline_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timeline" ON gaming_timeline_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timeline" ON gaming_timeline_events FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for all other tables...
-- game_library, user_consoles, pc_builds all follow same pattern

-- game_content_cache and gaming_news_cache: Public read-only
ALTER TABLE game_content_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read game content" ON game_content_cache FOR SELECT USING (true);

ALTER TABLE gaming_news_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news" ON gaming_news_cache FOR SELECT USING (true);
```

---

## 🔧 Technical Implementation

### Component Structure

```
src/
└── components/
    └── gaming-explorer/
        ├── GamingExplorerModal.tsx        # Main modal container
        ├── GamingExplorerNav.tsx          # Left sidebar navigation
        ├── home/
        │   ├── HomeView.tsx
        │   ├── HeroBanner.tsx
        │   ├── TrendingSection.tsx
        │   ├── NewsCard.tsx
        │   ├── VideoCard.tsx
        │   └── UpcomingReleases.tsx
        ├── timeline/
        │   ├── TimelineView.tsx
        │   ├── TimelineNode.tsx
        │   ├── TimelineEventModal.tsx     # Add/edit events
        │   ├── ConsoleEventCard.tsx
        │   ├── PCBuildCard.tsx
        │   ├── PhotoGallery.tsx
        │   └── TimelineStats.tsx
        ├── library/
        │   ├── LibraryView.tsx
        │   ├── LibraryTabs.tsx            # Own/Wishlist/Favorites/Disliked
        │   ├── GameCard.tsx
        │   ├── GameGrid.tsx
        │   ├── LibraryFilters.tsx
        │   ├── AddGameModal.tsx
        │   ├── ConsolesView.tsx
        │   └── PCBuildsView.tsx
        ├── game-page/
        │   ├── GamePageView.tsx
        │   ├── GameHeader.tsx
        │   ├── GameTabs.tsx
        │   ├── OverviewTab.tsx
        │   ├── MediaTab.tsx
        │   ├── CommunityTab.tsx
        │   ├── WalkthroughsTab.tsx        # AI-powered
        │   ├── DLCTab.tsx
        │   └── SimilarGamesSection.tsx
        └── shared/
            ├── PlatformIcon.tsx
            ├── RatingStars.tsx
            ├── LoadingSkeletons.tsx
            └── EmptyState.tsx
```

### Services

```typescript
// src/services/gamingExplorerService.ts
export class GamingExplorerService {
  // Timeline management
  async getTimeline(userId: string): Promise<TimelineEvent[]>
  async addTimelineEvent(event: TimelineEventInput): Promise<void>
  async updateTimelineEvent(id: string, updates: Partial<TimelineEvent>): Promise<void>
  async deleteTimelineEvent(id: string): Promise<void>
  
  // Library management
  async getLibrary(userId: string, category: LibraryCategory): Promise<GameLibraryItem[]>
  async addGameToLibrary(game: GameLibraryInput): Promise<void>
  async updateGameInLibrary(id: string, updates: Partial<GameLibraryItem>): Promise<void>
  async removeGameFromLibrary(id: string): Promise<void>
  async moveGame(id: string, newCategory: LibraryCategory): Promise<void>
  
  // Console & PC management
  async getConsoles(userId: string): Promise<Console[]>
  async getPCBuilds(userId: string): Promise<PCBuild[]>
  
  // News aggregation
  async getTrendingNews(): Promise<NewsItem[]>
  async getUpcomingReleases(days: number): Promise<IGDBGameData[]>
}

// src/services/gameContentService.ts
export class GameContentService {
  // AI scraping & caching
  async scrapeGameContent(igdbGameId: number): Promise<void>
  async getGameWalkthroughs(igdbGameId: number): Promise<Walkthrough[]>
  async getGameGuides(igdbGameId: number): Promise<Guide[]>
  async searchGameContent(igdbGameId: number, query: string): Promise<ContentSearchResult[]>
  
  // Reddit integration
  async getRedditDiscussions(gameName: string): Promise<RedditPost[]>
  
  // YouTube integration
  async getGameVideos(gameName: string): Promise<YouTubeVideo[]>
}

// src/services/newsAggregatorService.ts
export class NewsAggregatorService {
  async fetchRedditTrending(): Promise<NewsItem[]>
  async fetchYouTubeTrending(): Promise<VideoItem[]>
  async fetchMetacriticNew(): Promise<ReviewItem[]>
  async refreshNewsCache(): Promise<void> // Background job
}
```

### Supabase Edge Functions

#### 1. `scrape-game-content`
```typescript
// Triggered when user adds game to "Own" library
// Scrapes walkthroughs, guides, videos
// Stores in game_content_cache with embeddings
```

#### 2. `refresh-gaming-news`
```typescript
// Scheduled function (runs every hour)
// Fetches latest Reddit posts, YouTube videos, news
// Updates gaming_news_cache
```

#### 3. `igdb-proxy-enhanced`
```typescript
// Enhanced version of existing igdb-proxy
// Additional endpoints:
// - Similar games recommendations
// - Upcoming releases
// - Search with filters
```

### State Management

```typescript
// src/stores/gamingExplorerStore.ts
interface GamingExplorerState {
  isOpen: boolean;
  activeView: 'home' | 'timeline' | 'library' | 'game-page';
  selectedGame: IGDBGameData | null;
  library: {
    own: GameLibraryItem[];
    wishlist: GameLibraryItem[];
    favorites: GameLibraryItem[];
    disliked: GameLibraryItem[];
  };
  timeline: TimelineEvent[];
  consoles: Console[];
  pcBuilds: PCBuild[];
  news: NewsItem[];
  isLoading: boolean;
}

// Actions
const gamingExplorerStore = create<GamingExplorerState>((set, get) => ({
  // State
  isOpen: false,
  activeView: 'home',
  // ... other state
  
  // Actions
  openExplorer: () => set({ isOpen: true }),
  closeExplorer: () => set({ isOpen: false, selectedGame: null }),
  setActiveView: (view) => set({ activeView: view }),
  selectGame: (game) => set({ selectedGame: game, activeView: 'game-page' }),
  loadLibrary: async (userId) => { /* ... */ },
  // ... other actions
}));
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Basic structure and navigation

**Tasks:**
1. ✅ Create data model and Supabase schema
2. ✅ Add database migration scripts
3. ✅ Make logo clickable (MainApp.tsx)
4. ✅ Create GamingExplorerModal component
5. ✅ Implement overlay system with animations
6. ✅ Build navigation sidebar
7. ✅ Create routing between 4 main sections
8. ✅ Set up state management (Zustand store)
9. ✅ Create base services (GamingExplorerService)

**Deliverable:** Clickable logo opening empty modal with navigation

---

### Phase 2: Library Management (Week 3-4)
**Goal:** Full game library functionality

**Tasks:**
1. ✅ Build LibraryView component with tabs
2. ✅ Implement GameCard component with IGDB data
3. ✅ Create AddGameModal (search IGDB, add to category)
4. ✅ Build filters and search
5. ✅ Implement drag-and-drop for favorites ranking
6. ✅ Add consoles management view
7. ✅ Add PC builds management view
8. ✅ Connect to Supabase (CRUD operations)
9. ✅ Add offline caching

**Deliverable:** Fully functional library management system

---

### Phase 3: Game Page (Week 5-6)
**Goal:** Rich game detail pages

**Tasks:**
1. ✅ Build GamePageView with tabs
2. ✅ Implement Overview tab (IGDB data)
3. ✅ Create Media tab (screenshots, videos)
4. ✅ Build Community tab (Reddit, YouTube)
5. ✅ Add Similar Games section
6. ✅ Implement quick actions (Add to library, etc.)
7. ✅ Connect to existing IGDB service
8. ✅ Add loading states and error handling

**Deliverable:** Complete game detail pages with all info

---

### Phase 4: AI Content Scraping (Week 7-8)
**Goal:** Walkthroughs and guides integration

**Tasks:**
1. ✅ Create game_content_cache table with pgvector
2. ✅ Build scrape-game-content Edge Function
3. ✅ Implement content scrapers:
   - IGN walkthroughs
   - GameFAQs guides
   - YouTube walkthrough metadata
4. ✅ Set up OpenAI embeddings generation
5. ✅ Build WalkthroughsTab component
6. ✅ Implement semantic search for game content
7. ✅ Connect to Game Hub AI (context injection)
8. ✅ Add background job system (scrape when added to "Own")

**Deliverable:** AI-powered walkthroughs for owned games

---

### Phase 5: Timeline (Week 9-10)
**Goal:** Visual gaming journey

**Tasks:**
1. ✅ Build TimelineView component
2. ✅ Create timeline node components (Console, PC Build, etc.)
3. ✅ Implement TimelineEventModal (add/edit)
4. ✅ Add photo upload to Supabase Storage
5. ✅ Create photo gallery component
6. ✅ Build timeline stats section
7. ✅ Add animations for timeline scroll
8. ✅ Connect to Supabase backend

**Deliverable:** Interactive timeline of gaming journey

---

### Phase 6: Home & News (Week 11-12)
**Goal:** Gaming news aggregation

**Tasks:**
1. ✅ Build HomeView component
2. ✅ Create HeroBanner with rotating featured content
3. ✅ Implement TrendingSection (Reddit, etc.)
4. ✅ Build NewsCard and VideoCard components
5. ✅ Create refresh-gaming-news Edge Function
6. ✅ Integrate Reddit API
7. ✅ Integrate YouTube Data API
8. ✅ Add Metacritic scraper (or API)
9. ✅ Implement upcoming releases calendar
10. ✅ Add news caching system

**Deliverable:** Complete home page with live gaming news

---

### Phase 7: Polish & Optimization (Week 13-14)
**Goal:** Production-ready quality

**Tasks:**
1. ✅ Responsive design for all screen sizes
2. ✅ Add loading skeletons for all views
3. ✅ Implement error boundaries
4. ✅ Add empty states
5. ✅ Optimize image loading (lazy load, blur placeholders)
6. ✅ Add keyboard shortcuts
7. ✅ Implement search across all sections
8. ✅ Add onboarding tour for first-time users
9. ✅ Performance optimization (code splitting, memoization)
10. ✅ Accessibility audit (ARIA labels, keyboard nav)

**Deliverable:** Polished, production-ready mini-app

---

### Phase 8: Game Hub Integration (Week 15)
**Goal:** Connect to main app AI

**Tasks:**
1. ✅ Export user preferences to Game Hub context
2. ✅ Feed library data to AI recommendations
3. ✅ Add "Ask about this game" in Game Hub
4. ✅ Create game-specific chat contexts
5. ✅ Add quick actions from chat to library
6. ✅ Implement "Add to wishlist" from AI suggestions

**Deliverable:** Seamless integration with main Otagon app

---

## 🔐 Security & Privacy

### Data Protection
- All user data protected by RLS policies
- Photos stored in private Supabase Storage buckets
- API keys for Reddit/YouTube stored in Edge Function secrets
- No sensitive data in client-side cache

### Rate Limiting
- IGDB API: Use existing caching (24hr)
- Reddit API: 60 requests/minute
- YouTube API: 10,000 quota units/day
- Implement client-side rate limiting

### User Controls
- Delete timeline events
- Remove games from library
- Clear photo uploads
- Export data (GDPR compliance)
- Privacy settings for public profiles (future)

---

## 📊 Success Metrics

### User Engagement
- % of users who open Gaming Explorer
- Average time spent in mini-app
- Number of games added to library
- Timeline events created
- Photos uploaded

### AI Context Enhancement
- Improvement in recommendation accuracy
- Reduction in irrelevant AI suggestions
- Increase in Game Hub usage

### Data Quality
- Completeness of user libraries
- Timeline event density
- Photo upload rates

---

## 🚀 Future Enhancements (Post-MVP)

### Social Features
- Public profiles (opt-in)
- Share timeline with friends
- Compare libraries
- Friend recommendations

### Advanced Analytics
- Gaming stats dashboard
- Most played genres
- Spending analysis
- Time investment per game

### Integrations
- Steam library import
- PlayStation Network sync
- Xbox Live connection
- GOG integration

### Gamification
- Achievements for library milestones
- Badges for timeline completion
- Leaderboards (optional)

### Community
- User reviews
- Custom lists (public/private)
- Follow other gamers
- Gaming journals

---

## 💡 Design Inspirations

### Visual References
1. **Xbox Dashboard**: Clean navigation, game tiles
2. **PlayStation Store**: Immersive media, parallax effects
3. **Steam Library**: Grid/list views, filters, tags
4. **Notion**: Timeline structure, database views
5. **Razer Cortex**: Gaming-focused dark theme
6. **GOG Galaxy**: Universal library management
7. **Backloggd**: Social gaming library
8. **HowLongToBeat**: Game completion tracking

### UI Patterns
- **Card-based layouts** for games and news
- **Masonry grids** for photo galleries
- **Infinite scroll** with pagination
- **Skeleton loaders** for perceived performance
- **Toast notifications** for actions
- **Modal overlays** for forms
- **Drawer navigation** for mobile

---

## 🛠️ Development Resources

### APIs & Services
- **IGDB**: Already integrated (via Supabase Edge Function)
- **Reddit API**: https://www.reddit.com/dev/api/
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **Steam Web API**: https://steamcommunity.com/dev
- **Metacritic**: Web scraping (no official API)
- **OpenAI Embeddings**: For vector search
- **Supabase Storage**: Photo uploads
- **Supabase pgvector**: Semantic search

### Libraries
- **React**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **Zustand**: State management
- **React Query**: Data fetching & caching
- **React Virtualized**: Performance for large lists
- **React Beautiful DnD**: Drag-and-drop
- **Date-fns**: Date manipulation
- **Embla Carousel**: Carousels/sliders

---

## 📝 Technical Considerations

### Performance
- **Code splitting**: Load each section on-demand
- **Image optimization**: WebP format, lazy loading
- **Virtual scrolling**: For large game lists
- **Debounced search**: Avoid excessive API calls
- **Memoization**: React.memo for expensive components

### Offline Support
- **Cache library data** in IndexedDB
- **Queue uploads** when offline
- **Sync when back online**
- **Show offline indicator**

### Accessibility
- **ARIA labels** on all interactive elements
- **Keyboard navigation**: Tab order, shortcuts
- **Screen reader support**: Semantic HTML
- **Color contrast**: WCAG AA compliance
- **Focus indicators**: Clear visual feedback

### Mobile Experience
- **Touch gestures**: Swipe, pinch-to-zoom
- **Bottom tab bar**: Easier one-handed use
- **Safe area handling**: iOS notch, Android nav
- **Haptic feedback**: On important actions
- **Photo capture**: Use device camera

---

## 🎮 Context for AI (Game Hub Integration)

### How This Powers Game Hub

**Current State:**
- User asks generic gaming questions
- AI has limited context about user preferences

**With Gaming Explorer:**
- AI knows user's **entire library** (owned, wishlist, favorites)
- AI knows user's **gaming history** (consoles, eras, favorite games)
- AI knows **disliked games** (what to avoid)
- AI has **game-specific knowledge** (walkthroughs for owned games)

**Example Interactions:**

**Before Gaming Explorer:**
```
User: "What should I play next?"
AI: "What genre do you like?"
```

**After Gaming Explorer:**
```
User: "What should I play next?"
AI: "Based on your favorites (God of War, The Last of Us, Horizon), 
     and knowing you own a PS5, I recommend Returnal. It's in your 
     wishlist and just went on sale. You also seem to enjoy 
     narrative-driven action games from your timeline."
```

**Game-Specific Help:**
```
User: "I'm stuck in Elden Ring"
AI: *Knows user owns Elden Ring from library*
    *Retrieves relevant walkthrough section*
    "Which area are you in? I have detailed guides for every boss 
     and location. Just tell me where you're stuck."
```

### Context Injection

**When user opens Game Hub:**
```typescript
const userContext = {
  library: {
    owned: ['Elden Ring', 'God of War Ragnarok', ...],
    wishlist: ['Final Fantasy XVI', ...],
    favorites: ['The Witcher 3', ...],
    disliked: ['FIFA 23', ...], // AI won't suggest sports games
  },
  preferences: {
    platforms: ['PS5', 'PC'],
    genres: ['Action', 'RPG', 'Adventure'], // Derived from library
    avoidGenres: ['Sports', 'Racing'], // Derived from dislikes
  },
  recentlyPlayed: ['Elden Ring', ...], // From library status
  gamingHistory: {
    yearsGaming: 20, // Calculated from birth year
    consolesOwned: ['PS5', 'PS4', 'Xbox 360', ...],
    favoriteEra: '2010s', // Most timeline events
  }
};
```

This context is **automatically included** in every Game Hub AI request, making recommendations deeply personalized.

---

## ✅ Success Criteria

### Must-Have (MVP)
- ✅ Clickable logo opens Gaming Explorer
- ✅ 4 main sections functional (Home, Timeline, Library, Game Page)
- ✅ Library management (add/remove/categorize games)
- ✅ IGDB integration for game data
- ✅ Timeline with console/PC build tracking
- ✅ Photo uploads for timeline
- ✅ Game page with details and media
- ✅ Mobile responsive design

### Should-Have (v1.1)
- ✅ AI-powered walkthroughs for owned games
- ✅ Reddit/YouTube integration for news
- ✅ Upcoming releases calendar
- ✅ Search across all sections
- ✅ Drag-and-drop favorites ranking

### Nice-to-Have (v2.0)
- ⏳ Social features (public profiles)
- ⏳ Steam library import
- ⏳ Advanced analytics dashboard
- ⏳ Community reviews

---

## 📅 Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Foundation | 2 weeks | Clickable logo + navigation |
| Phase 2: Library | 2 weeks | Full library management |
| Phase 3: Game Page | 2 weeks | Rich game details |
| Phase 4: AI Scraping | 2 weeks | Walkthroughs & guides |
| Phase 5: Timeline | 2 weeks | Visual gaming journey |
| Phase 6: Home & News | 2 weeks | News aggregation |
| Phase 7: Polish | 2 weeks | Production-ready |
| Phase 8: Integration | 1 week | Game Hub connection |

**Total: ~15 weeks (3.5 months)**

---

## 🎯 Next Steps

1. **Review this plan** - Validate scope and priorities
2. **Create database migration** - Set up Supabase tables
3. **Start Phase 1** - Make logo clickable, build modal shell
4. **Set up API accounts** - Reddit, YouTube credentials
5. **Design mockups** - Visual designs for each section
6. **Begin implementation** - Follow phase order

---

## 📞 Questions to Consider

Before starting implementation:

1. **Priority Order**: Should we build Library first (user-facing) or Home (content aggregation)?
2. **API Limits**: Do we have budget for YouTube API quota? (10K/day free, then $0.50/1K)
3. **Photo Storage**: What's max photos per user? (Storage costs)
4. **Public Features**: Should timelines/libraries be shareable from v1?
5. **Mobile App**: Will this exist in mobile app or PWA only?
6. **Social Login**: Allow sharing to Twitter/Discord?
7. **Monetization**: Any premium features for Vanguard tier?

---

## 🏆 Why This is Powerful

### For Users:
- **One place** for entire gaming identity
- **Context-aware AI** that understands their taste
- **Discover** new games based on real preferences
- **Remember** gaming memories and milestones
- **Track** what to play next

### For Otagon:
- **Deeper engagement** - Users spend more time in app
- **Better AI** - Personalized recommendations drive value
- **Unique feature** - No other gaming AI has this depth
- **Retention** - Users invested in building library/timeline
- **Virality** - Shareable timelines/libraries (future)

### For Game Hub:
- **Rich context** - AI understands user deeply
- **Specific help** - Game walkthroughs on demand
- **Smart suggestions** - Recommendations that hit
- **Reduced friction** - AI already knows what user owns

---

**This mini-app transforms Otagon from a gaming chatbot into a complete gaming companion.** 🎮✨
