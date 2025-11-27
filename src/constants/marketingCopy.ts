/**
 * Centralized Marketing Copy
 * All marketing text content for the landing page and modals.
 * Edit this file to update copy without touching component code.
 */

// ============================================================================
// HERO SECTION
// ============================================================================
export const HERO_COPY = {
  appName: 'Otagon',
  headline: 'Never Get Stuck Again',
  subheadline: 'Get instant, spoiler-free hints without leaving your game',
  description:
    'Otagon sees your screen and gives you the perfect nudge to keep you playing—without ruining the surprise. The fastest way to snap a screenshot, share with friends, and get gaming hints in seconds. Stop searching, start playing.',
  waitlistCta: 'Join the Waitlist',
  waitlistPlaceholder: 'Enter your email address',
  waitlistSuccess: "Thanks for joining! We'll email you when access is ready.",
  waitlistAlreadyExists: "You're already on our waitlist! We'll email you when access is ready.",
  waitlistError: 'Failed to join waitlist. Please try again.',
  waitlistNote: 'Join thousands of gamers on the waitlist!',
  trustIndicators: [
    { text: 'No spam, ever' },
    { text: 'Free to join' },
    { text: 'Early access' },
  ],
  socialProof: {
    gamersWaiting: '1000+',
    betaTesters: '50+',
  },
  chatDemo: {
    userPrompt: 'What should I do here?',
    hintLabel: 'Hint:',
    hintResponse:
      "The contraption on the far wall seems to be missing a gear. Perhaps there's one nearby?",
  },
} as const;

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================
export const HOW_IT_WORKS_COPY = {
  sectionTitle: 'How It Works',
  sectionDescription: 'Get unstuck, get smart, get back to gaming—all without leaving your game.',
  steps: [
    {
      id: 'hotkey',
      title: 'Press a Hotkey on Your PC',
      description: 'Instantly capture and analyze PC screenshots',
    },
    {
      id: 'hint',
      title: 'Get an Instant Hint and Gameplay Screenshot on Your Phone',
      description:
        'AI analyzes your situation and delivers spoiler-free hints to your mobile or second monitor',
    },
    {
      id: 'play',
      title: 'Keep Playing',
      description:
        'Get the nudge you need and dive back into action without alt-tabbing or overlays',
    },
  ],
} as const;

// ============================================================================
// FEATURES SECTION
// ============================================================================
export const FEATURES_COPY = {
  sectionTitle: 'Your Journey From First Moment to Victory',
  sectionDescription: 'Features built to match your gaming style, not slow you down',
  features: [
    {
      id: 'gemini',
      title: 'Powered by Google Gemini',
      description:
        "Experience cutting-edge AI assistance powered by Google's advanced Gemini technology for accurate, context-aware gaming help.",
      isGemini: true,
    },
    {
      id: 'screenshot',
      title: 'From First Screenshot to Victory',
      description:
        'Upload a screenshot. Otagon identifies your game and becomes your personal guide—no spoilers, full context.',
    },
    {
      id: 'playstyle',
      title: 'Play Your Way',
      description:
        'Story-driven explorer? Completionist? Speedrunner? Tell us once, and every hint, strategy, and insight matches your playstyle.',
    },
    {
      id: 'focus',
      title: 'Stay Focused, Stay Ahead',
      description:
        'Skip the wiki-hunting. Otagon provides quest tips, secret locations, build optimization—all without spoiling your discovery.',
      isPro: true,
    },
    {
      id: 'anywhere',
      title: 'Play From Anywhere',
      description:
        'Gaming on console? Manually upload screenshots from your phone. Help arrives instantly in the same conversation.',
    },
    {
      id: 'handsfree',
      title: 'Hands-Free & AI Mode Toggle',
      description:
        'Pro users can enable hands-free mode to get hints read aloud, and toggle AI analysis on/off to save screenshots for social sharing without using credits.',
      isPro: true,
    },
    {
      id: 'library',
      title: 'Build Your Game Library',
      description:
        "Track multiple games at once. Each has its own conversation, progress bar, and AI-generated insight tabs tailored to that game's genre.",
    },
  ],
} as const;

// ============================================================================
// INSTALLATION SECTION
// ============================================================================
export const INSTALLATION_COPY = {
  sectionTitle: 'Install Otagon Everywhere',
  sectionDescription: 'Access on mobile, sync with PC for seamless gaming',
} as const;

// ============================================================================
// GAME GENRES SECTION
// ============================================================================
export const GENRES_COPY = {
  sectionTitle: 'For Every Challenge, In Every World',
  genres: [
    {
      id: 'souls',
      title: 'Souls-likes & Action RPGs',
      description:
        "Master tough bosses and find hidden paths without rage-quitting. We'll give you a hint, not the easy way out.",
    },
    {
      id: 'rpg',
      title: 'RPGs',
      description:
        'Uncover deep lore and track complex quests without accidentally reading major story spoilers.',
    },
    {
      id: 'puzzle',
      title: 'Puzzle Games',
      description:
        'Get a clue for that brain-bending puzzle, not the entire solution. Preserve your "aha!" moment.',
    },
    {
      id: 'openworld',
      title: 'Open-World Adventures',
      description:
        'Hunt down every last collectible and conquer secret challenges with a gentle nudge in the right direction.',
    },
    {
      id: 'metroidvania',
      title: 'Metroidvanias',
      description:
        'Lost after finding a new power? Discover which hidden path just opened up without checking a full map.',
    },
    {
      id: 'survival',
      title: 'Survival & Crafting',
      description:
        "Need a specific resource? Learn where to find it or what recipe you're missing to build your ultimate base.",
    },
  ],
} as const;

// ============================================================================
// PRICING SECTION
// ============================================================================
export const PRICING_COPY = {
  sectionTitle: 'Choose Your Plan',
  sectionDescription: "Start for free. Upgrade when you're ready.",
  comingSoonCta: 'Coming Soon',
  comingSoonTooltip: 'Coming Soon - Join the waitlist to be notified when pricing goes live!',
  plans: {
    free: {
      name: 'Free',
      tagline: 'For the Casual Player',
      price: '$0',
      period: '/month',
      features: [
        '55 Text | 25 Image Queries/month',
        'Knowledge till January 2025',
        'Standard AI Model',
        'PC-to-Mobile Sync',
        'Progress Tracking',
        '7 day free trial for Pro',
      ],
    },
    vanguard: {
      name: 'Pro Vanguard',
      tagline: 'Become a Founding Member',
      price: '$20',
      period: '/year',
      badge: 'Limited Offer',
      guarantee: 'Lifetime Price Guarantee!',
      features: [
        'Everything in Free, plus:',
        '1,583 Text | 328 Image Queries/month',
        'Up-to-date knowledge using web search',
        'Advanced AI Model',
        'Build Your Game Library',
        'Hands-Free & AI Mode Toggle',
        'Batch Screenshot Capture',
        'Priority Support & No Ads',
      ],
    },
    pro: {
      name: 'Pro',
      tagline: 'For the Serious Gamer',
      price: '$3.99',
      period: '/month',
      features: [
        'Everything in Free, plus:',
        '1,583 Text + 328 Image Queries per month',
        'Real-time web search for latest info',
        'Advanced AI model for deeper insights',
        'Build Your Game Library with insight tabs',
        'Hands-Free mode & AI toggle for screenshots',
        'Batch screenshot capture (F2 hotkey)',
        'Priority support & ad-free experience',
      ],
    },
  },
} as const;

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================
export const TESTIMONIALS_COPY = {
  sectionTitle: 'What Gamers Are Saying',
  testimonials: [
    {
      quote:
        "Finally, a gaming assistant that doesn't spoil the story! I was stuck on a puzzle in Elden Ring for hours, and Otagon gave me just the right hint to figure it out myself.",
      author: 'Sarah Chen',
      title: 'Souls-like Enthusiast',
    },
    {
      quote:
        "The PC-to-mobile sync is a game-changer. I can get help without alt-tabbing and losing my immersion. It's like having a gaming buddy who knows exactly when to chime in.",
      author: 'Marcus Rodriguez',
      title: 'RPG Completionist',
    },
    {
      quote:
        "Pro's hands-free mode is incredible! During intense boss fights, I get AI hints spoken aloud without pausing. The AI toggle lets me save screenshots for later too.",
      author: 'Safi Rahman',
      title: 'Pro Subscriber',
    },
  ],
} as const;

// ============================================================================
// EARN BY PLAYING SECTION (Hidden)
// ============================================================================
export const EARN_BY_PLAYING_COPY = {
  sectionTitle: 'Earn by Playing',
  comingSoonBadge: 'Coming when we reach 10,000 pro subs',
  exclusiveTag: 'Exclusive to Vanguard Users',
  features: [
    'Earn instant rewards for completing in-game challenges.',
    'Discover secrets, defeat bosses, find rare loot, or uncover lore.',
    'Each achievement helps train our AI and puts money in your pocket, rewarded based on the challenge.',
  ],
  cta: 'Coming when we reach 10,000 pro subs',
  ctaNote: 'Join the waitlist to be notified when this feature goes live!',
} as const;

// ============================================================================
// FOUNDER SECTION
// ============================================================================
export const FOUNDER_COPY = {
  sectionTitle: 'Meet the Founder',
  sectionDescription:
    "Hey, I'm Amaan—a passionate gamer from Hyderabad who spent my early days printing cheat codes at internet cafes. After years of thinking about how people interact with technology, I'm building the future of gaming assistance.",
  name: 'Amaan',
  title: 'Service Designer',
  quote:
    "Like you, I've spent my life passionate about games. From getting lost in the deep lore of modern RPGs to the frustration of needing a small hint and getting a massive spoiler in return. That's why I built Otagon - to preserve the magic of discovery while giving you just the nudge you need.",
  linkedInUrl: 'https://www.linkedin.com/in/readmetxt/',
  email: 'support@otagon.app',
} as const;

// ============================================================================
// FOOTER
// ============================================================================
export const FOOTER_COPY = {
  copyright: (year: number) => `© ${year} Otagon. All rights reserved.`,
  links: [
    { label: 'Pricing', href: '#pricing', type: 'scroll' },
    { label: 'About', type: 'modal', modal: 'about' },
    { label: 'Terms', type: 'modal', modal: 'terms' },
    { label: 'Privacy', type: 'modal', modal: 'privacy' },
    { label: 'Refund Policy', type: 'modal', modal: 'refund' },
    { label: 'Contact Us', type: 'modal', modal: 'contact' },
  ],
} as const;

// ============================================================================
// META / SEO (for reference - actual meta tags are in index.html)
// ============================================================================
export const META_COPY = {
  title: 'Otagon - AI-Powered Gaming Companion | Spoiler-Free Hints & Guides',
  description:
    'Get spoiler-free gaming hints and AI-powered assistance with Google Gemini. Track progress, discover secrets, and enhance your gaming experience.',
  keywords: [
    'gaming assistant',
    'AI gaming companion',
    'game hints',
    'spoiler-free walkthrough',
    'game guide',
    'gaming AI',
    'video game help',
    'game progress tracker',
    'gaming tips',
  ],
} as const;
