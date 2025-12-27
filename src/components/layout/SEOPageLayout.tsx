import { ReactNode, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GlassNavDropdown } from './GlassNavDropdown';

interface SEOPageLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export const SEOPageLayout = ({
  children,
  title,
  description,
  keywords,
  ogImage = 'https://otagon.app/og-image.jpg',
  canonicalUrl,
}: SEOPageLayoutProps) => {
  const fullTitle = `${title} | Otagon - AI Gaming Companion`;
  const currentUrl = canonicalUrl || `https://otagon.app${window.location.pathname}`;
  const [scrollY, setScrollY] = useState(0);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoize random positions for particles
  const particlePositions = useMemo(() => 
    [...Array(40)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      parallaxFactor: 0.2 + Math.random() * 0.4,
      animationDelay: Math.random() * 3,
      animationDuration: 4 + Math.random() * 4
    })), []
  );

  // Memoize random positions for geometric shapes
  const shapePositions = useMemo(() => 
    [...Array(16)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      parallaxFactor: 0.1 + Math.random() * 0.3,
      animationDelay: Math.random() * 4,
      animationDuration: 6 + Math.random() * 4
    })), []
  );

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        <link rel="canonical" href={currentUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Page Structure */}
      <div 
        className="min-h-screen text-white font-inter relative custom-scrollbar overflow-y-auto h-screen"
        style={{
          backgroundColor: '#0A0A0A',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y pinch-zoom'
        }}
      >
        {/* Enhanced Background Glows - Fixed positioning */}
        <div className="fixed top-0 left-0 w-full h-full -z-15 pointer-events-none hero-glow-texture-top"></div>
        <div className="fixed bottom-0 left-0 w-full h-full -z-15 pointer-events-none hero-glow-texture-bottom"></div>
        
        {/* Animated Floating Particles with Parallax - Fixed positioning */}
        <div className="fixed inset-0 -z-12 pointer-events-none">
          {particlePositions.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full opacity-40 animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                transform: `translateY(${scrollY * particle.parallaxFactor}px)`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating Geometric Shapes with Parallax - Fixed positioning */}
        <div className="fixed inset-0 -z-12 pointer-events-none">
          {shapePositions.map((shape, i) => (
            <div
              key={`shape-${i}`}
              className="absolute opacity-15 animate-drift"
              style={{
                left: `${shape.left}%`,
                top: `${shape.top}%`,
                transform: `translateY(${scrollY * shape.parallaxFactor}px)`,
                animationDelay: `${shape.animationDelay}s`,
                animationDuration: `${shape.animationDuration}s`
              }}
            >
              <div className="w-4 h-4 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] transform rotate-45"></div>
            </div>
          ))}
        </div>

        {/* Full Page Grid Pattern - Fixed positioning */}
        <div 
          className="fixed inset-0 -z-10 opacity-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #FF4D4D10 1px, transparent 1px), linear-gradient(0deg, #FF4D4D10 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        ></div>

        {/* Navigation */}
        <div className="sticky top-0 left-0 right-0 z-50 pt-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <GlassNavDropdown />
          </div>
        </div>

        {/* Main Content */}
        <main className="relative z-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-gradient-to-b from-[#0A0A0A] to-[#111111] border-t border-neutral-800/50 mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
            {/* Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="md:col-span-1">
                <Link to="/" className="inline-flex items-center gap-2 mb-4">
                  <img 
                    src="/images/otagon-logo.png" 
                    alt="Otagon Logo" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
                    Otagon
                  </span>
                </Link>
                <p className="text-sm text-text-muted">
                  AI-powered gaming companion for spoiler-free hints and real-time assistance.
                </p>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/#features" className="text-sm text-text-muted hover:text-primary transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link to="/#pricing" className="text-sm text-text-muted hover:text-primary transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className="text-sm text-text-muted hover:text-primary transition-colors">
                      Gaming Guides
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-sm text-text-muted hover:text-primary transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-sm text-text-muted hover:text-primary transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-sm font-bold text-white mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/privacy" className="text-sm text-text-muted hover:text-primary transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-sm text-text-muted hover:text-primary transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/refund" className="text-sm text-text-muted hover:text-primary transition-colors">
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-neutral-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-text-muted">
                © {new Date().getFullYear()} Otagon. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="https://twitter.com/otagonapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://discord.gg/otagon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors"
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
