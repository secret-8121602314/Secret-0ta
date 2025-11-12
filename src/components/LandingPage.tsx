import React, { useState, useEffect, useRef } from 'react';
import Logo from './ui/Logo';
import CheckIcon from './ui/CheckIcon';
import StarIcon from './ui/StarIcon';
import FounderImage from './FounderImage';
import ContactUsModal from './modals/ContactUsModal';
import { WaitlistService } from '../services/waitlistService';
import { toastService } from '../services/toastService';

const GamepadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
        <path d="M6 12h4"></path>
        <path d="M14 10v4"></path>
        <path d="M18 10v4"></path>
        <path d="M10 10v4"></path>
    </svg>
);


const ProBadge = () => (
    <span className="text-sm font-bold bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-2.5 py-1 rounded-full uppercase tracking-wider ml-3">
        PRO
    </span>
);

const FeatureIcon = ({ icon }: { icon: 'eye' | 'bookmark' | 'network' | 'mic' | 'insights' | 'cpu' }) => {
    const icons = {
        eye: (
            <>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        bookmark: (
            <>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </>
        ),
        network: (
            <>
                <rect x="16" y="16" width="6" height="6" rx="1" />
                <rect x="2" y="16" width="6" height="6" rx="1" />
                <rect x="9" y="2" width="6" height="6" rx="1" />
                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                <path d="M12 12V8" />
            </>
        ),
        mic: (
            <>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
            </>
        ),
        insights: (
            <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
            </>
        ),
        cpu: (
            <>
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="1" x2="9" y2="4"></line>
                <line x1="15" y1="1" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="23"></line>
                <line x1="15" y1="20" x2="15" y2="23"></line>
                <line x1="20" y1="9" x2="23" y2="9"></line>
                <line x1="20" y1="14" x2="23" y2="14"></line>
                <line x1="1" y1="9" x2="4" y2="9"></line>
                <line x1="1" y1="14" x2="4" y2="14"></line>
            </>
        )
    }

    return (
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl p-4 group hover:scale-105 transition-all duration-500" style={{ pointerEvents: 'auto' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ pointerEvents: 'none' }}></div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#feature-gradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60 group-hover:opacity-100 transition-opacity duration-500"
            >
                <defs>
                    <linearGradient id="feature-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E53A3A" />
                        <stop offset="100%" stopColor="#D98C1F" />
                    </linearGradient>
                </defs>
                {icons[icon]}
            </svg>
        </div>
    );
};

const Feature = React.memo(({ title, description, icon }: { title: React.ReactNode, description: string, icon: 'eye' | 'bookmark' | 'network' | 'mic' | 'insights' | 'cpu' }) => (
        <div className="flex flex-col items-center text-center group p-6 rounded-2xl hover:bg-gradient-to-br hover:from-neutral-800/20 hover:to-neutral-900/20 transition-all duration-500">
            <div className="w-20 h-20 mb-6 animate-fade-slide-up group-hover:scale-110 transition-transform duration-500">
                <FeatureIcon icon={icon} />
            </div>
            <div className="animate-fade-slide-up group-hover:translate-y-1 transition-transform duration-500">
                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-4 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#E53A3A] group-hover:to-[#D98C1F] transition-all duration-500">{title}</h3>
                <p className="text-lg text-neutral-300 leading-relaxed group-hover:text-neutral-200 transition-colors duration-500">{description}</p>
            </div>
        </div>
    ));

const FeatureListItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-4">
        <CheckIcon className="w-6 h-6 mt-1 text-green-500 flex-shrink-0" />
        <span className="text-neutral-200 text-base leading-relaxed">{children}</span>
    </li>
);

const VanguardFeatureListItem = ({ children, comingSoon = false }: { children: React.ReactNode, comingSoon?: boolean }) => (
    <li className="flex items-start gap-4">
        <StarIcon className="w-6 h-6 mt-1 text-[#FFAB40] flex-shrink-0" />
        <div className="flex-1">
            <span className="text-neutral-200 font-medium text-base leading-relaxed block">
                {children}
            </span>
            {comingSoon && (
                <span className="inline-block mt-2 text-xs font-semibold bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-300 border-2 border-sky-500/40 px-3 py-1 rounded-full uppercase">Coming Soon</span>
            )}
        </div>
    </li>
);

const QuoteIcon = () => (
    <svg className="w-12 h-12 text-neutral-600 mb-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.5,10c0,2.21-1.79,4-4,4v-2c1.1,0,2-0.9,2-2h-2V4h6V10z M18.5,10c0,2.21-1.79,4-4,4v-2c1.1,0,2-0.9,2-2h-2V4h6V10z"></path>
    </svg>
);

const Testimonial = React.memo(({ quote, author, title }: { quote: string, author: string, title: string }) => (
    <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-2 border-neutral-800/60 rounded-3xl p-10 flex flex-col justify-between h-full animate-fade-slide-up transition-all duration-500 hover:bg-gradient-to-r hover:from-[#1C1C1C]/80 hover:to-[#0A0A0A]/80 hover:border-neutral-700/80 hover:scale-105 hover:shadow-2xl hover:shadow-[#E53A3A]/10">
        <div className="mb-8">
            <QuoteIcon />
            <p className="text-xl text-neutral-200 leading-relaxed">"{quote}"</p>
        </div>
        <div>
            <p className="font-bold text-white text-lg">{author}</p>
            <p className="text-base text-neutral-400">{title}</p>
        </div>
    </div>
));

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAbout: () => void;
  onOpenPrivacy: () => void;
  onOpenRefund: () => void;
  onOpenTerms: () => void;
  onDirectNavigation: (_path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenAbout, onOpenPrivacy, onOpenRefund, onOpenTerms, onDirectNavigation }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const backgroundRef = useRef<HTMLDivElement>(null);

    // Handle direct URL navigation on component mount
    useEffect(() => {
        const path = window.location.pathname;
        if (path !== '/' && path !== '') {
            onDirectNavigation(path);
        }
    }, [onDirectNavigation]);

    // Parallax scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const result = await WaitlistService.addToWaitlist(email, 'landing_page');
      
      if (result.success) {
        if (result.alreadyExists) {
          setSubmitMessage('You\'re already on our waitlist! We\'ll email you when access is ready.');
        } else {
          setSubmitMessage('Thanks for joining! We\'ll email you when access is ready.');
        }
        setEmail('');
      } else {
        setSubmitMessage(result.error || 'Failed to join waitlist. Please try again.');
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      toastService.error('Failed to join waitlist. Please try again.');
      setSubmitMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


    const handleScrollTo = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };


  return (
        <div 
            ref={backgroundRef}
            className="text-white font-inter overflow-x-hidden relative custom-scrollbar animate-fade-in"
            style={{
                backgroundColor: '#111111',
                minHeight: '100vh',
                height: 'auto'
            }}
        >
            {/* Enhanced Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full -z-15 pointer-events-none hero-glow-texture-top"></div>
            <div className="absolute bottom-0 left-0 w-full h-full -z-15 pointer-events-none hero-glow-texture-bottom"></div>
            
            {/* Animated Floating Particles with Parallax */}
            <div className="absolute inset-0 -z-12 pointer-events-none">
                {[...Array(40)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full opacity-40 animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            transform: `translateY(${scrollY * (0.2 + Math.random() * 0.4)}px)`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${4 + Math.random() * 4}s`
                        }}
                    />
                ))}
          </div>
          
            {/* Floating Geometric Shapes with Parallax */}
            <div className="absolute inset-0 -z-12 pointer-events-none">
                {[...Array(16)].map((_, i) => (
                    <div
                        key={`shape-${i}`}
                        className="absolute opacity-15 animate-drift"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            transform: `translateY(${scrollY * (0.1 + Math.random() * 0.3)}px)`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${6 + Math.random() * 4}s`
                        }}
                    >
                        <div className="w-4 h-4 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] transform rotate-45"></div>
          </div>
                ))}
        </div>

            {/* Full Page Grid Pattern */}
            <div 
                className="absolute inset-0 -z-10 opacity-10 pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, #FF4D4D10 1px, transparent 1px), linear-gradient(0deg, #FF4D4D10 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                }}
            ></div>

            {/* Fade out gradients for background pattern */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#111111] via-[#111111]/80 to-transparent -z-5 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent -z-5 pointer-events-none"></div>

            {/* Main Content */}
            <main>
      {/* Hero Section */}
                <section className="relative pt-20 pb-6 md:pb-8 text-center">
                    
                    <div className="container mx-auto px-6 relative overflow-visible">
                        <div className="flex flex-col items-center justify-center gap-4 mb-10 overflow-visible">
                            <Logo className="h-32 w-32" spin={true} bounce={true} />
                            <h1 
                                className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] leading-none py-2"
                                style={{
                                    lineHeight: '1.3',
                                    paddingTop: '1rem',
                                    paddingBottom: '1rem',
                                    display: 'block',
                                    overflow: 'visible',
                                    minHeight: '1.3em',
                                    height: 'auto'
                                }}
                            >
              Otagon
            </h1>
          </div>
          
                        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white leading-tight">
                            Never Get Stuck Again
                        </h2>
                        
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-neutral-300 mb-8 font-medium px-4">
                            Get instant, spoiler-free hints without leaving your game
                        </p>
                        
                        {/* Social Proof */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                            <div className="flex items-center gap-2 text-lg text-neutral-300">
                                <div className="flex -space-x-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full overflow-hidden">
                                            <img 
                                                src={`/images/landing/${i + 1}.png`}
                                                alt={`Gamer ${i + 1}`}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <span className="ml-2">
                                    <span className="font-bold text-white">1000+</span> gamers waiting
                                </span>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-neutral-600"></div>
                            <div className="flex items-center gap-2 text-lg text-neutral-300">
                                <svg className="w-5 h-5 text-[#FFAB40]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                                </svg>
                                <span>Trusted by <span className="font-bold text-white">50+</span> beta testers</span>
                            </div>
                        </div>

                        <div className="relative mx-auto my-16 w-full max-w-2xl h-auto rounded-3xl bg-black/60 backdrop-blur-xl p-2 shadow-2xl border-2 border-[#424242]/40 group hover:border-[#E53A3A]/60 transition-all duration-500 hover:shadow-2xl hover:shadow-[#E53A3A]/25 hover:scale-105" style={{
                            animation: 'glow 2s ease-in-out infinite alternate',
                            boxShadow: '0 0 20px rgba(229, 58, 58, 0.3), 0 0 40px rgba(229, 58, 58, 0.1), 0 0 60px rgba(229, 58, 58, 0.1)'
                        }}>
                            <div className="bg-transparent rounded-2xl p-6 space-y-6">
                                {/* User Prompt */}
                                <div className="flex justify-end">
                                    <p className="text-base text-[#F5F5F5] bg-gradient-to-r from-rose-900/15 to-rose-800/15 py-3 px-6 rounded-2xl rounded-br-none border-2 border-rose-500/40 backdrop-blur-sm shadow-lg">
                                        What should I do here?
                                    </p>
                                </div>
                                {/* Model Response */}
                                <div className="flex justify-start">
                                    <div className="border-2 border-neutral-700/60 bg-gradient-to-r from-neutral-800/15 to-neutral-700/15 p-6 rounded-2xl rounded-bl-none max-w-[80%] text-left backdrop-blur-sm shadow-lg">
                                        <p className="text-base font-bold text-white mb-2">Hint:</p>
                                        <p className="text-base text-[#F5F5F5] leading-relaxed">
                                        The contraption on the far wall seems to be missing a gear. Perhaps there's one nearby?
                                        </p>
                                    </div>
                                </div>
          </div>
        </div>
                        
                        <p className="text-xl md:text-2xl text-neutral-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              Otagon sees your screen and gives you the perfect nudge to keep you playing—without ruining the surprise. Stop searching, start playing.
            </p>

                        {/* Enhanced Waitlist Form */}
                        <div className="max-w-2xl mx-auto px-4">
                            <form id="waitlist-form" onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="flex-grow relative group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-[#1C1C1C] to-[#0A0A0A] border-2 border-neutral-800/60 rounded-xl py-4 sm:py-5 px-4 sm:px-6 text-white placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-[#FFAB40]/30 focus:border-[#FFAB40] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg backdrop-blur-sm hover:border-neutral-700/80"
              aria-label="Email for waitlist"
            />
                                </div>
                                <button
              type="submit"
              disabled={isSubmitting}
                                    className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-4 sm:py-5 px-8 sm:px-12 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E53A3A]/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 text-base sm:text-lg relative overflow-hidden group min-h-[56px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative z-10">
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                                Joining...
                                            </div>
                                        ) : (
                                            'Join the Waitlist'
                                        )}
                                    </span>
                                </button>
          </form>

                            {/* Trust Indicators */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                    <span>No spam, ever</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                    <span>Free to join</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                    <span>Early access</span>
                                </div>
                            </div>
                        </div>

          {submitMessage && (
                            <div className={`mt-6 text-center text-lg ${submitMessage.includes('Thanks') ? 'text-green-400' : 'text-red-400'}`}>
              {submitMessage}
            </div>
          )}

                        <p className="text-sm text-neutral-400 mt-4">
                            Join thousands of gamers on the waitlist!
                        </p>
                    </div>
                </section>


                {/* How It Works Section */}
                <section className="py-10 md:py-14 bg-transparent relative">
                    <div className="container mx-auto px-8 max-w-6xl relative">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">How It Works</h2>
                            <p className="text-xl text-neutral-300 mt-6 leading-relaxed">Get unstuck, get smart, get back to gaming—all without leaving your game.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {/* Step 1 */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-16 h-16" fill="url(#keyboard-gradient)" viewBox="0 0 16 16">
                                        <defs>
                                            <linearGradient id="keyboard-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#E53A3A" />
                                                <stop offset="100%" stopColor="#D98C1F" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6zm13 .25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5a.25.25 0 0 0-.25.25zM2.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 3 8.75v-.5A.25.25 0 0 0 2.75 8h-.5zM4 8.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 5 8.75v-.5A.25.25 0 0 0 4.75 8h-.5a.25.25 0 0 0-.25.25zM6.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 7 8.75v-.5A.25.25 0 0 0 6.75 8h-.5zM8 8.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 9 8.75v-.5A.25.25 0 0 0 8.75 8h-.5a.25.25 0 0 0-.25.25zM13.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zm0 2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zm-3-2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5a.25.25 0 0 0 .25-.25v-.5A.25.25 0 0 0 10.75 8h-1.5zm.75 2.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5a.25.25 0 0 0-.25.25zM11.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zM9 6.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5A.25.25 0 0 0 9.75 6h-.5a.25.25 0 0 0-.25.25zM7.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 8 6.75v-.5A.25.25 0 0 0 7.75 6h-.5zM5 6.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 6 6.75v-.5A.25.25 0 0 0 5.75 6h-.5a.25.25 0 0 0-.25.25zM2.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5A.25.25 0 0 0 4 6.75v-.5A.25.25 0 0 0 3.75 6h-1.5zM2 10.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5a.25.25 0 0 0-.25.25zM4.25 10a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-5.5z"/>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Press a Hotkey on Your PC</h3>
                                <p className="text-lg text-neutral-300 leading-relaxed">
                                    Instantly capture and analyze PC screenshots
                                </p>
                            </div>
                            
                            {/* Step 2 */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-16 h-16" fill="url(#message-gradient)" viewBox="0 0 24 24">
                                        <defs>
                                            <linearGradient id="message-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#E53A3A" />
                                                <stop offset="100%" stopColor="#D98C1F" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M2 8.994A5.99 5.99 0 0 1 8 3h8c3.313 0 6 2.695 6 5.994V21H8c-3.313 0-6-2.695-6-5.994V8.994zM14 11v2h2v-2h-2zm-6 0v2h2v-2H8z"/>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Get an Instant Hint on Your Phone</h3>
                                <p className="text-lg text-neutral-300 leading-relaxed">
                                    AI analyzes your situation and delivers spoiler-free hints to your mobile or second monitor
                                </p>
                            </div>
                            
                            {/* Step 3 */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-16 h-16" fill="url(#joystick-gradient)" viewBox="0 0 24 24">
                                        <defs>
                                            <linearGradient id="joystick-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#E53A3A" />
                                                <stop offset="100%" stopColor="#D98C1F" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M16 6H8a6 6 0 0 0 0 12h8a6 6 0 0 0 0-12zm-5 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm3.5 2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Keep Playing</h3>
                                <p className="text-lg text-neutral-300 leading-relaxed">
                                    Get the nudge you need and dive back into action without alt-tabbing or overlays
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-10 md:py-14 bg-transparent relative">
                    <div className="container mx-auto px-8 max-w-6xl relative">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight" style={{ lineHeight: '1.3', minHeight: '1.3em', height: 'auto', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>Your All-in-One Gaming Assistant</h2>
                            <p className="text-xl text-neutral-300 mt-6 leading-relaxed">Features built to enhance your gameplay, not spoil it</p>
                        </div>
                        {/* Desktop: 2x2 Grid, Mobile: Vertical Stack */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            <Feature
                                title="Instant Contextual Hints"
                                description="Our context-aware AI vision doesn't just see a game—it understands your moment. Get guidance on puzzles, lore, and boss strategies, all without spoilers."
                                icon="eye"
                            />
                            <Feature
                                title="Seamless PC-to-Mobile Sync"
                                description="Connect your desktop and phone for the ultimate uninterrupted experience. A single hotkey is all it takes to get help without ever minimizing your game."
                                icon="network"
                            />
                            <Feature
                                title="Your Personal Gaming Hub"
                                description="Track your entire gaming journey. The Otaku Diary is your private journal, the Wishlist manages your backlog, and Automatic Progress Tracking organizes your game chats and story progress."
                                icon="bookmark"
                            />
                            <Feature
                                title={<>Go Pro for the Ultimate Edge<ProBadge /></>}
                                description="Unlock In-Depth Insight Tabs to auto-generate a wiki for your game, use Hands-Free Voice Responses for ultimate immersion, and capture more details with Batch Screenshot Capture."
                                icon="insights"
                            />
                        </div>
                    </div>
                </section>

                {/* For Every Gamer, For Every Genre Section */}
                <section className="py-10 md:py-14 bg-transparent relative">
                    <div className="container mx-auto px-8 max-w-6xl relative">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">For Every Challenge, In Every World</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Souls-likes & Action RPGs */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-16 h-16" fill="url(#souls-gradient)" viewBox="0 0 800 800">
                                        <defs>
                                            <linearGradient id="souls-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#E53A3A" />
                                                <stop offset="100%" stopColor="#D98C1F" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M750.5,225H576v-75h40c6.6,0,12-5.4,12-12V12c0-6.6-5.4-12-12-12h-89.5h-253H184c-6.6,0-12,5.4-12,12v126c0,6.6,5.4,12,12,12h40v75H49.5C22.2,225,0,247.2,0,274.5v476C0,777.8,22.2,800,49.5,800h701c27.3,0,49.5-22.2,49.5-49.5v-476C800,247.2,777.8,225,750.5,225z M299,150h202v106H299V150z M725,725H75V300h152.6c7.3,18.2,25.1,31,45.9,31h253c20.8,0,38.6-12.8,45.9-31H725V725z"/>
                                        <path d="M383.6,428h-13.5c-0.7,0-1.3,0.1-2,0.2c-2.5,0.3-4.9,1.5-6.8,3.4l-29.9,29.9l-29.9-29.9c-1.9-1.9-4.3-3-6.8-3.4c-0.7-0.1-1.3-0.2-2-0.2h-13.5c-6.6,0-12,5.4-12,12v155c0,6.6,5.4,12,12,12h13.5c6.6,0,12-5.4,12-12V487.8l17.7,17.7c2.5,2.5,5.8,3.6,9.1,3.5c3.3,0.2,6.6-1,9.1-3.5l17.7-17.7V595c0,6.6,5.4,12,12,12h13.5c6.6,0,12-5.4,12-12V440C395.6,433.4,390.2,428,383.6,428z"/>
                                        <path d="M520.9,427h-67c-0.4,0-0.8,0-1.1,0.1c-0.4,0-0.7-0.1-1.1-0.1h-13.5c-6.6,0-12,5.4-12,12v155c0,6.6,5.4,12,12,12h13.5c6.6,0,12-5.4,12-12v-59h57.3c6.6,0,12-5.4,12-12v-6v-7v-58v-2v-11C532.9,432.4,527.5,427,520.9,427z M495.9,498h-32.3v-34h32.3V498z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Souls-likes & Action RPGs</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Master tough bosses and find hidden paths without rage-quitting. We'll give you a hint, not the easy way out.
              </p>
            </div>

                            {/* RPGs */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-16 h-16" viewBox="0 0 64 64">
                                        <path fill="#ea8039" d="M53.5,13.81l2.83-6.13-6.1,2.81a24.35,24.35,0,0,1-6.93,2.2A7.16,7.16,0,0,0,38.18,16a7.13,7.13,0,1,0,13,5.22A34.82,34.82,0,0,1,53.5,13.81Z"/>
                                        <path fill="#ea8039" d="M50.3,23.49a9.21,9.21,0,0,1-4.13-2.4,9.44,9.44,0,0,1-.8-12.41,9.42,9.42,0,0,0-6.18,16.07l.07.06c.1.1.2.18.3.27a7.12,7.12,0,0,0,9.74-.3A7.31,7.31,0,0,0,50.3,23.49Z"/>
                                        <path fill="#ea8039" d="M40.51,13.71a9.43,9.43,0,0,0,14.82,4.92,9.42,9.42,0,0,1-16.07,6.18l-.07-.07-.27-.3a7,7,0,0,1,1.59-10.73Z"/>
                                        <path fill="#e8a63a" d="M37.76,15.2l-.12-6.75-4.27,5.18a24.26,24.26,0,0,1-5.28,5,7.12,7.12,0,1,0,10.65,8.29,7,7,0,0,0,.19-4A34.56,34.56,0,0,1,37.76,15.2Z"/>
                                        <path fill="#ea8039" d="M39.08,25.31a9.36,9.36,0,0,1-10.76-6.86,9.48,9.48,0,0,1-.11-4.34,9.42,9.42,0,0,0,1.42,17.16l.09,0,.39.11a7.12,7.12,0,0,0,8.63-4.5A6.44,6.44,0,0,0,39.08,25.31Z"/>
                                        <path fill="#e8a63a" d="M23.37,25.17l-3.61-4,.17,5.35a19.15,19.15,0,0,1-.55,5.75,5.73,5.73,0,0,0,.84,4.79,5.67,5.67,0,1,0,7.88-7.93A27.66,27.66,0,0,1,23.37,25.17Z"/>
                                        <path fill="#ea8039" d="M29.47,30.52a7.41,7.41,0,0,1-3,2.28,7.5,7.5,0,0,1-7-.74,7.42,7.42,0,0,1-2.34-2.54,7.49,7.49,0,0,0,9.84,9.53L27,39l.3-.13a5.67,5.67,0,0,0,2.8-7.23A5.19,5.19,0,0,0,29.47,30.52Z"/>
                                        <path fill="#e85b23" d="M48.8,26.25l6.76.12-5.19,4.27a24.27,24.27,0,0,0-5,5.28,7.13,7.13,0,0,1-5.22,3.16,7,7,0,0,1-6.77-3.33A7.13,7.13,0,0,1,37.1,25.26a7,7,0,0,1,4-.19A35,35,0,0,0,48.8,26.25Z"/>
                                        <path fill="#ea8039" d="M38.69,24.92a9.26,9.26,0,0,0,.37,4.76A9.45,9.45,0,0,0,49.89,35.8a9.41,9.41,0,0,1-17.15-1.42.29.29,0,0,1,0-.1c-.05-.12-.08-.26-.12-.38a7.13,7.13,0,0,1,4.51-8.64A7.53,7.53,0,0,1,38.69,24.92Z"/>
                                        <path fill="#e85b23" d="M38.84,40.63l4,3.61-5.34-.16a19.54,19.54,0,0,0-5.76.54,5.67,5.67,0,1,1,3.14-8.72A27.79,27.79,0,0,0,38.84,40.63Z"/>
                                        <path fill="#ea8039" d="M33.48,34.53a7.52,7.52,0,0,0,1,12.39A7.49,7.49,0,0,1,25,37.07L25,37c0-.1.09-.19.14-.29a5.66,5.66,0,0,1,7.22-2.81A6.19,6.19,0,0,1,33.48,34.53Z"/>
                                        <path fill="#e5cfb3" d="M46.6,17.16,36.77,20.3a1.51,1.51,0,0,0-.53.32L22,34.91a5.05,5.05,0,0,0,0,7.14h0a5,5,0,0,0,7.14,0L43.38,27.77a1.26,1.26,0,0,0,.32-.53l3.15-9.84A.19.19,0,0,0,46.6,17.16Z"/>
                                        <path fill="#d1baa1" d="M29.09,42.05,43.38,27.77a1.26,1.26,0,0,0,.32-.53l3.15-9.84a.21.21,0,0,0-.05-.2L22,42.05A5,5,0,0,0,29.09,42.05Z"/>
                                        <path fill="#f4e4d3" d="M46.85,17.4a.19.19,0,0,0-.25-.24l-9.45,3-3,9.45a.19.19,0,0,0,.24.25l9.45-3Z"/>
                                        <path fill="#f9f3ed" d="M22,37.48,36.32,23.19a1.26,1.26,0,0,1,.53-.32L46,19.93l.81-2.53a.19.19,0,0,0-.25-.24L36.77,20.3a1.51,1.51,0,0,0-.53.32L22,34.91a5.06,5.06,0,0,0-1.27,5A5,5,0,0,1,22,37.48Z"/>
                                        <path fill="#5df9e6" d="M43.3,27.07l3.14-9.83a.18.18,0,0,0,0-.2L45,18.44l-2.51,7.83a1.26,1.26,0,0,1-.32.53L27.88,41.09a5,5,0,0,1-2.44,1.33,5,5,0,0,1-2.56.42,5,5,0,0,0,5.81-1L43,27.6A1.32,1.32,0,0,0,43.3,27.07Z"/>
                                        <path fill="#041256" d="M25.52,44.53a6,6,0,0,1-4.28-10.32L35.53,19.92a2.3,2.3,0,0,1,.93-.57L46.3,16.2h0a1.21,1.21,0,0,1,1.21.3,1.18,1.18,0,0,1,.29,1.21l-3.15,9.83a2.22,2.22,0,0,1-.56.93L29.8,42.76A6,6,0,0,1,25.52,44.53Zm19.9-25.95-8.35,2.67a.57.57,0,0,0-.13.08L22.66,35.62a4,4,0,0,0,0,5.73,4.07,4.07,0,0,0,5.73,0L42.67,27.06a.35.35,0,0,0,.08-.13Z"/>
                                        <rect fill="#d0e0ef" height="2.61" rx="0.89" transform="translate(36.31 -2.85) rotate(45)" width="15.43" x="13.88" y="41.11"/>
                                        <path fill="#fff" d="M16.5,38.58a.89.89,0,0,1,1.26,0l9.29,9.29.29-.29a.9.9,0,0,0,0-1.27l-9.65-9.65a.91.91,0,0,0-1.26,0l-.58.58a.9.9,0,0,0,0,1.27l.36.36Z"/>
                                        <path fill="#5df9e6" d="M26.9,46.31l-9.65-9.65a.83.83,0,0,0-.51-.23l9.05,9a.9.9,0,0,1,0,1.27l-.58.58a.93.93,0,0,1-.75.24l.6.6a.89.89,0,0,0,1.26,0l.58-.58A.9.9,0,0,0,26.9,46.31Z"/>
                                        <path fill="#385272" d="M18.42,50.73l4.82-4.83L18.1,40.76l-4.87,4.87a2.55,2.55,0,0,1-1.39.69,5,5,0,1,0,5.83,5.9A2.86,2.86,0,0,1,18.42,50.73Z"/>
                                        <rect fill="#577491" height="0.54" transform="translate(37.3 -0.51) rotate(45)" width="5.5" x="16.51" y="44.5"/>
                                        <rect fill="#577491" height="0.54" transform="translate(37.82 0.75) rotate(45)" width="5.5" x="15.26" y="45.75"/>
                                        <rect fill="#577491" height="0.54" transform="translate(38.33 2) rotate(45)" width="5.5" x="14" y="47"/>
                                        <rect fill="#577491" height="0.54" transform="translate(38.85 3.25) rotate(45)" width="5.5" x="12.75" y="48.26"/>
                                        <path fill="#5df9e6" d="M17.41,51.72a2.72,2.72,0,0,1,.75-1.49L23,45.4l-5.15-5.14-.33.33,4.34,4.34L17,49.75a2.79,2.79,0,0,0-.75,1.5,5,5,0,0,1-1.39,2.62A5,5,0,0,1,10,55.15a5,5,0,0,0,7.46-3.43Z"/>
                                        <path fill="#577491" d="M8.91,50a5,5,0,0,1,3.33-2.2,2.55,2.55,0,0,0,1.4-.69l5.42-5.42-1-1-4.87,4.87a2.55,2.55,0,0,1-1.39.69,5,5,0,0,0-3.72,7A4.94,4.94,0,0,1,8.91,50Z"/>
                                        <path fill="#041256" d="M26.13,49.42a1.88,1.88,0,0,1-1.34-.56l-9.65-9.65a1.87,1.87,0,0,1,0-2.67l.58-.58a1.9,1.9,0,0,1,2.68,0l9.65,9.65a1.91,1.91,0,0,1,0,2.68l-.58.57A1.89,1.89,0,0,1,26.13,49.42Zm.07-2h0Zm-9.57-9.57,9.52,9.52.41-.45-9.5-9.5Zm10,9h0Z"/>
                                        <path fill="#041256" d="M12.73,57.33a5.83,5.83,0,0,1-.59,0,6.1,6.1,0,0,1-4.45-2.67,6,6,0,0,1,4-9.29,1.61,1.61,0,0,0,.86-.42l4.87-4.87a1,1,0,1,1,1.42,1.42l-4.87,4.87a3.63,3.63,0,0,1-1.93,1,4.08,4.08,0,0,0-2.68,1.76,4,4,0,0,0,6.25,5.07A4,4,0,0,0,16.69,52a3.82,3.82,0,0,1,1-2l4.83-4.82A1,1,0,0,1,24,46.61l-4.82,4.82a2,2,0,0,0-.48,1A5.91,5.91,0,0,1,17,55.55,6,6,0,0,1,12.73,57.33Z"/>
                                        <path fill="#041256" d="M13.16,52A.83.83,0,0,1,12,52a.85.85,0,0,1,0-1.18A.83.83,0,0,1,13.16,52Z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">RPGs</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Uncover deep lore and track complex quests without accidentally reading major story spoilers.
              </p>
            </div>

                            {/* Puzzle Games */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-16 h-16" viewBox="0 0 500 500">
                                        <path fill="#E53A3A" d="M202.78,371.74a34.27,34.27,0,0,1,36.11-13.5,34,34,0,0,1-8.18,67.09,34.17,34.17,0,0,1-27.93-14.46v76.51h171.7A20.55,20.55,0,0,0,395,466.83V295.23h-76.9a34,34,0,1,0-38.35,0h-77Z"/>
                                        <path fill="#D98C1F" d="M362.63,295.23v171.6a20.55,20.55,0,0,1-20.55,20.55h32.4A20.55,20.55,0,0,0,395,466.83V295.23Z"/>
                                        <path fill="#E53A3A" d="M126.17,295.23a34,34,0,1,1-39.13,0H10.53v171.6a20.55,20.55,0,0,0,20.55,20.55h171.7V410.47a33.83,33.83,0,0,0,32,14.63,34,34,0,0,0-4-67.82,33.82,33.82,0,0,0-28,14.85v-76.9Z"/>
                                        <path fill="#D98C1F" d="M374.46,203.72a33.84,33.84,0,1,1,38.92,0h76.09V34a21.33,21.33,0,0,0-21.33-21.33H298.27V89.1a33.64,33.64,0,0,0-31.84-14.54,33.84,33.84,0,0,0,4,67.45,33.63,33.63,0,0,0,27.85-14.77v76.48Z"/>
                                        <path fill="#E53A3A" d="M468.14,12.62h-32.4A21.33,21.33,0,0,1,457.07,34V203.72h32.4V34A21.33,21.33,0,0,0,468.14,12.62Z"/>
                                        <path fill="#D98C1F" d="M202.78,218.72a34.27,34.27,0,0,1-36.11,13.5,34,34,0,0,1,8.18-67.09,34.17,34.17,0,0,1,27.93,14.46V103.08H31.08a20.55,20.55,0,0,0-20.55,20.54V295.23H87.44a34,34,0,1,0,38.34,0h77Z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Puzzle Games</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Get a clue for that brain-bending puzzle, not the entire solution. Preserve your "aha!" moment.
              </p>
            </div>

                            {/* Open-World Adventures */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-4">
                                    <img src="/icons/openworld.svg" alt="Open World Adventures" className="w-16 h-16" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Open-World Adventures</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Hunt down every last collectible and conquer secret challenges with a gentle nudge in the right direction.
              </p>
            </div>

                            {/* Metroidvanias */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-16 h-16" viewBox="0 0 1367 1562">
                                        <rect fill="#E62129" height="97.6415" width="780.786" x="293"/>
                                        <rect fill="#E62129" height="97.5262" width="976.069" x="195" y="98"/>
                                        <rect fill="#E62129" height="97.6415" width="195.283" x="195" y="195"/>
                                        <rect fill="#E62129" height="97.6415" width="195.168" x="976" y="195"/>
                                        <rect fill="#E62129" height="195.168" width="97.6415" x="293" y="293"/>
                                        <rect fill="#E62129" height="195.168" width="97.5262" x="390" y="390"/>
                                        <rect fill="#E62129" height="195.168" width="97.6415" x="976" y="293"/>
                                        <rect fill="#E62129" height="195.168" width="97.5262" x="879" y="390"/>
                                        <rect fill="#E62129" height="97.6415" width="780.786" x="293" y="586"/>
                                        <rect fill="#E62129" height="97.5262" width="585.503" x="391" y="683"/>
                                        <rect fill="#E62129" height="390.451" width="97.5262" x="98" y="488"/>
                                        <rect fill="#E62129" height="97.1804" width="97.6415" x="195" y="781"/>
                                        <rect fill="#E62129" height="390.335" width="97.6415" y="683"/>
                                        <rect fill="#E62129" height="390.451" width="97.5262" x="1171" y="488"/>
                                        <rect fill="#E62129" height="97.1804" width="97.6415" x="1074" y="781"/>
                                        <rect fill="#E62129" height="390.335" width="97.6415" x="1269" y="683"/>
                                        <rect fill="#F98812" height="292.809" width="97.6415" x="195" y="293"/>
                                        <rect fill="#F98812" height="97.6415" width="97.6415" x="293" y="488"/>
                                        <rect fill="#F98812" height="292.809" width="97.6415" x="1074" y="293"/>
                                        <rect fill="#F98812" height="97.6415" width="97.6415" x="976" y="488"/>
                                        <rect fill="#F98812" height="195.283" width="97.5262" x="390" y="195"/>
                                        <rect fill="#F98812" height="195" width="198" x="583" y="195"/>
                                        <rect fill="#F98812" height="195.283" width="99.1401" x="877" y="195"/>
                                        <rect fill="#F98812" height="195" width="391" x="488" y="390"/>
                                        <rect fill="#1D1819" height="195.283" width="94.9901" x="488" y="195"/>
                                        <rect fill="#1D1819" height="195.283" width="96.1429" x="781" y="195"/>
                                        <rect fill="#990000" height="195.629" width="97.6415" x="195" y="586"/>
                                        <rect fill="#990000" height="292.348" width="97.6415" x="293" y="684"/>
                                        <rect fill="#990000" height="293" width="195" x="390" y="781"/>
                                        <rect fill="#990000" height="195.629" width="97.7568" x="1074" y="586"/>
                                        <rect fill="#990000" height="292.809" width="97.5262" x="976" y="684"/>
                                        <rect fill="#990000" height="293" width="195" x="781" y="781"/>
                                        <rect fill="#990000" height="195" width="195" x="586" y="781"/>
                                        <rect fill="#F98812" height="97.5262" width="195.168" y="1171"/>
                                        <rect fill="#F98812" height="97.6415" width="292.809" y="1074"/>
                                        <rect fill="#F98812" height="97.6415" width="292.809" x="1074" y="1074"/>
                                        <rect fill="#F98812" height="97.5262" width="195.744" x="1171" y="1171"/>
                                        <rect fill="#E62129" height="97.5262" width="195.168" x="586" y="976"/>
                                        <rect fill="#E62129" height="97.6415" width="780.786" x="293" y="1074"/>
                                        <rect fill="#E62129" height="97.5262" width="196.897" x="584" y="1171"/>
                                        <rect fill="#E62129" height="97.6415" width="195.283" x="195" y="1269"/>
                                        <rect fill="#E62129" height="97.6415" width="390.451" x="195" y="1366"/>
                                        <rect fill="#E62129" height="97.5262" width="195.052" x="293" y="1464"/>
                                        <rect fill="#E62129" height="97.5262" width="195.168" x="878" y="1464"/>
                                        <rect fill="#E62129" height="97.6415" width="390.451" x="781" y="1366"/>
                                        <rect fill="#E62129" height="97.6415" width="195.168" x="976" y="1269"/>
                                        <rect fill="#F98812" height="293" width="195" x="98" y="878"/>
                                        <rect fill="#F98812" height="293" width="195" x="1074" y="878"/>
                                        <rect fill="#990000" height="97.5262" width="390.451" x="195" y="1171"/>
                                        <rect fill="#990000" height="97.6415" width="390.451" x="781" y="1171"/>
                                        <rect fill="#990000" height="97.6415" width="585.618" x="390" y="1269"/>
                                        <rect fill="#F98812" height="97.6415" width="97.6415" x="293" y="976"/>
                                        <rect fill="#F98812" height="97.1804" width="97.5262" x="976" y="976"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Metroidvanias</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Lost after finding a new power? Discover which hidden path just opened up without checking a full map.
              </p>
            </div>

                            {/* Survival & Crafting */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-16 h-16" viewBox="0 0 500 500">
                                        <path fill="#faae3b" d="M360.62,93.33c1.11,18.72-33.87,73.85-33.87,73.85C305.59,76.87,192.91,10.68,192.91,10.68s26.67,31.6-30.1,124-31.29,150.15-31.29,150.15h0c12.3,44.84,62.05,78.42,121.64,78.42s104-36.12,121.64-78.42h.05C411.52,203.21,360.62,93.33,360.62,93.33Z"/>
                                        <path fill="#ee3734" d="M201.59,311.38c0-29,51.16-88.94,51.16-88.94s51.15,60,51.15,88.94-22.9,52.48-51.15,52.48S201.59,340.37,201.59,311.38Z"/>
                                        <path fill="rgba(0,0,0,0.15)" d="M168.71,336.69c22.2,16.49,51.85,26.61,84.49,26.61,59.6,0,104-36.12,121.64-78.42h.05c36.63-81.67-14.27-191.55-14.27-191.55,1.11,18.72-33.87,73.85-33.87,73.85C305.59,76.87,192.91,10.68,192.91,10.68S438.82,258.17,168.71,336.69Z"/>
                                        <ellipse fill="#513b2c" cx="55.48" cy="453.93" rx="22.06" ry="36.04" transform="translate(-107.9 26.8) rotate(-13.96)"/>
                                        <path fill="#fff" d="M46,419.29c.27-.08.5-.26.78-.33l-.82.2Z"/>
                                        <path fill="#fff" d="M63.36,489.11l.82-.2c-.28.07-.57,0-.85.07Z"/>
                                        <path fill="#b3814b" d="M466.56,351.71a36,36,0,0,0-43.67-26.28L46.78,419c11.83-2.94,25.31,10.33,30.11,29.65S76,486,64.18,488.91l376.1-93.52A36,36,0,0,0,466.56,351.71Z"/>
                                        <polygon fill="rgba(0,0,0,0.15)" points="64.18 488.91 440.28 395.39 466.56 351.71 76.89 448.61 64.18 488.91"/>
                                        <ellipse fill="#513b2c" cx="444.52" cy="453.93" rx="36.04" ry="22.06" transform="translate(-103.27 775.77) rotate(-76.04)"/>
                                        <path fill="#fff" d="M454,419.29c-.27-.08-.5-.26-.78-.33l.82.2Z"/>
                                        <path fill="#fff" d="M436.64,489.11l-.82-.2c.28.07.57,0,.85.07Z"/>
                                        <path fill="#b3814b" d="M33.44,351.71a36,36,0,0,1,43.67-26.28L453.22,419c-11.83-2.94-25.31,10.33-30.11,29.65s.89,37.36,12.71,40.3L59.72,395.39A36,36,0,0,1,33.44,351.71Z"/>
                                        <polygon fill="rgba(0,0,0,0.15)" points="435.82 488.91 59.72 395.39 33.44 351.71 423.11 448.61 435.82 488.91"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Survival & Crafting</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Need a specific resource? Learn where to find it or what recipe you're missing to build your ultimate base.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Pricing Section */}
                <section id="pricing" className="py-8 md:py-10 bg-transparent">
                    <div className="container mx-auto px-8">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Choose Your Plan</h2>
                            <p className="text-lg text-neutral-300 leading-relaxed">Start for free. Upgrade when you're ready.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                            
                        {/* Free Plan */}
                        <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-2 border-neutral-800/60 rounded-2xl p-6 flex flex-col animate-fade-slide-up hover:border-neutral-700/80 hover:scale-105 hover:shadow-[0_0_30px_rgba(229,58,58,0.3)] hover:shadow-[#E53A3A]/20 transition-all duration-500 group cursor-pointer">
                                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                                <p className="text-neutral-300 mb-6 text-sm">For the Casual Player</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-white">$0</span>
                                    <span className="text-lg text-neutral-300">/month</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <FeatureListItem>55 Text | 25 Image Queries/month</FeatureListItem>
                                    <FeatureListItem>Knowledge till January 2025</FeatureListItem>
                                    <FeatureListItem>Standard AI Model</FeatureListItem>
                                    <FeatureListItem>PC-to-Mobile Sync</FeatureListItem>
                                    <FeatureListItem>Progress Tracking</FeatureListItem>
                                    <FeatureListItem>14 day free trial for Pro</FeatureListItem>
                                </ul>
                                <div className="mt-auto">
                                    <button
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-50"
                                        disabled
                                        title="Coming Soon - Join the waitlist to be notified when pricing goes live!"
                                    >
                                        Coming Soon
                                    </button>
                                </div>
                            </div>

                        {/* Vanguard Plan (center and highlighted) */}
                        <div className="relative border-2 border-[#FFAB40] rounded-2xl p-6 bg-gradient-to-r from-[#111] to-[#0A0A0A] shadow-2xl shadow-[#D98C1F]/30 transform lg:scale-105 flex flex-col animate-fade-slide-up hover:shadow-[#D98C1F]/50 hover:scale-110 transition-all duration-500 group cursor-pointer animate-glow-pulse">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-2xl">
                                    Limited Offer
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] mb-2">Pro Vanguard</h3>
                                <p className="text-neutral-300 mb-6 text-sm">Become a Founding Member</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-white">$20</span>
                                    <span className="text-lg text-neutral-300">/year</span>
                                    <p className="text-green-400 font-medium text-sm mt-1">Lifetime Price Guarantee!</p>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    <FeatureListItem>Everything in Pro, plus:</FeatureListItem>
                                </ul>
                                <ul className="space-y-3 mb-8 border-l-2 border-[#FFAB40]/40 pl-4 ml-2">
                                    <VanguardFeatureListItem>Permanent Price Lock-in</VanguardFeatureListItem>
                                    <VanguardFeatureListItem>Exclusive 'Vanguard' Badge</VanguardFeatureListItem>
                                    <VanguardFeatureListItem>Founder's Council Access</VanguardFeatureListItem>
                                    <VanguardFeatureListItem>Beta Access to Features</VanguardFeatureListItem>
                                    <VanguardFeatureListItem comingSoon={true}>Revenue Sharing</VanguardFeatureListItem>
                                </ul>
                                <div className="mt-auto">
                                    <button 
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-50"
                                        disabled
                                        title="Coming Soon - Join the waitlist to be notified when pricing goes live!"
                                    >
                                        Coming Soon
                                    </button>
            </div>
          </div>

                        {/* Pro (Monthly) Plan */}
                        <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-2 border-neutral-800/60 rounded-2xl p-6 flex flex-col animate-fade-slide-up hover:border-neutral-700/80 hover:scale-105 hover:shadow-[0_0_30px_rgba(229,58,58,0.3)] hover:shadow-[#E53A3A]/20 transition-all duration-500 group cursor-pointer">
                                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                                <p className="text-neutral-300 mb-6 text-sm">For the Serious Gamer</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-white">$3.99</span>
                                    <span className="text-lg text-neutral-300">/month</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <FeatureListItem>Everything in Free, plus:</FeatureListItem>
                                    <FeatureListItem>1,583 Text | 328 Image Queries/month</FeatureListItem>
                                    <FeatureListItem>Up-to-date knowledge using web search</FeatureListItem>
                                    <FeatureListItem>Advanced AI Model</FeatureListItem>
                                    <FeatureListItem>In-Depth Insight Tabs</FeatureListItem>
                                    <FeatureListItem>Hands-Free Voice Response</FeatureListItem>
                                    <FeatureListItem>Batch Screenshot Capture</FeatureListItem>
                                    <FeatureListItem>Priority Support & No Ads</FeatureListItem>
                                </ul>
                                <div className="mt-auto">
                                    <button 
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-50"
                                        disabled
                                        title="Coming Soon - Join the waitlist to be notified when pricing goes live!"
                                    >
                                        Coming Soon
                                    </button>
                                </div>
            </div>
          </div>
        </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-10 md:py-14 bg-transparent relative">
                    <div className="container mx-auto px-8 max-w-6xl relative">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight" style={{ lineHeight: '1.3', minHeight: '1.3em', height: 'auto', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>What Gamers Are Saying</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <Testimonial
                                quote="Finally, a gaming assistant that doesn't spoil the story! I was stuck on a puzzle in Elden Ring for hours, and Otagon gave me just the right hint to figure it out myself."
                                author="Sarah Chen"
                                title="Souls-like Enthusiast"
                            />
                            <Testimonial
                                quote="The PC-to-mobile sync is a game-changer. I can get help without alt-tabbing and losing my immersion. It's like having a gaming buddy who knows exactly when to chime in."
                                author="Marcus Rodriguez"
                                title="RPG Completionist"
                            />
                            <Testimonial
                                quote="I love how it tracks my progress across different games. The Otaku Diary feature helps me remember where I left off in complex RPGs with multiple storylines."
                                author="Alex Kim"
                                title="Open-World Explorer"
                            />
                        </div>
                    </div>
                </section>


                {/* Earn by Playing Section */}
                <section id="earn-by-playing" className="py-10 md:py-14 bg-transparent">
                    <div className="container mx-auto px-6 max-w-4xl">
                        {/* Gradient border wrapper */}
                        <div className="p-[1px] bg-gradient-to-br from-[#E53A3A]/50 to-[#D98C1F]/50 rounded-xl">
                            <div className="bg-[#111111] rounded-[11px] p-8 md:p-12 text-left flex flex-col">
                                <div>
                                    <div className="flex justify-start mb-4">
                                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#E53A3A]/10 to-[#FFAB40]/10 border border-neutral-700/50">
                                            <GamepadIcon className="w-12 h-12 text-[#FFAB40]" />
                                        </div>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                                        Earn by Playing
                                    </h2>
                                    <div className="mb-6">
                                        <span className="text-base font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full uppercase tracking-wider">Coming when we reach 10,000 pro subs</span>
                                    </div>
                                    <p className="text-lg text-[#FFAB40] font-semibold mb-4">Exclusive to Vanguard Users</p>
                                </div>

                                <div className="flex-grow">
                                    <ul className="space-y-4 text-lg max-w-2xl mb-6 leading-relaxed">
                                        <VanguardFeatureListItem>Earn instant rewards for completing in-game challenges.</VanguardFeatureListItem>
                                        <VanguardFeatureListItem>Discover secrets, defeat bosses, find rare loot, or uncover lore.</VanguardFeatureListItem>
                                        <VanguardFeatureListItem>Each achievement helps train our AI and puts money in your pocket, rewarded based on the challenge.</VanguardFeatureListItem>
                                    </ul>
                                </div>

                                <div className="mt-auto">
                                    <button
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="w-full bg-neutral-600 text-neutral-400 font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-50"
                                        disabled
                                        title="Coming when we reach 10,000 pro subs - Join the waitlist to be notified when this feature goes live!"
                                    >
                                        Coming when we reach 10,000 pro subs
                                    </button>
                                    <p className="text-xs text-neutral-500 mt-3 text-center">Join the waitlist to be notified when this feature goes live!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Founder Section */}
                <section id="founder" className="py-10 md:py-14 bg-transparent">
                    <div className="container mx-auto px-8 md:px-10 max-w-5xl">
                        {/* Section Header */}
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
                                Meet Our Founder
                            </h2>
                            <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                                Meet Amaan, a passionate gamer from Hyderabad who spent his early days printing cheat codes at internet cafes.
                                After graduating from Service Design at the Royal College of Art in London in 2021, he's building the future of gaming assistance.
              </p>
            </div>

                        {/* Hero-Style Layout */}
                        <div className="text-center animate-fade-slide-up">
                            {/* Founder Image - Centered */}
                            <div className="flex justify-center mb-8">
                                <FounderImage size="xl" showBadge={false} showStatus={false} />
                            </div>

                            {/* Decorative Gradient Line */}
                            <div className="w-24 h-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] mx-auto mb-8 rounded-full"></div>

                            {/* Name and Title - Centered */}
                            <div className="space-y-3 mb-8">
                                <h3 className="text-4xl md:text-5xl font-bold text-white">
                                    Amaan
                                </h3>
                                <p className="text-xl md:text-2xl text-neutral-300 font-medium">
                                    Service Designer
                                </p>
                            </div>                            {/* Personal Quote - Centered */}
                            <div className="max-w-4xl mx-auto mb-12">
                                <div className="bg-gradient-to-r from-[#0F0F0F]/60 to-[#1A1A1A]/60 border-2 border-neutral-700/60 rounded-2xl p-8 md:p-10 backdrop-blur-sm">
                                    <p className="text-[#CFCFCF] leading-relaxed text-lg md:text-xl italic">
                                        "Like you, I've spent my life passionate about games. From getting lost in the deep lore of modern RPGs
                                        to the frustration of needing a small hint and getting a massive spoiler in return. That's why I built Otagon
                                        - to preserve the magic of discovery while giving you just the nudge you need."
              </p>
            </div>
          </div>

                            {/* Contact Buttons - Centered */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8">
                                <a
                                    href="https://www.linkedin.com/in/readmetxt/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#0077B5] to-[#005885] hover:from-[#005885] hover:to-[#004066] text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-[#0077B5]/25"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect x="2" y="9" width="4" height="12"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                    <span className="hidden sm:inline">Connect on LinkedIn</span>
                                    <span className="sm:hidden">LinkedIn</span>
                                </a>

                                <a
                                    href="mailto:support@otagon.app"
                                    className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-[#E53A3A]/25"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                    <span className="hidden sm:inline">Email Amaan</span>
                                    <span className="sm:hidden">Email</span>
                                </a>
            </div>
          </div>
        </div>
                </section>
      </main>

      {/* Footer */}
            <footer className="bg-transparent border-t border-neutral-800/50">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Footer Links - Above logo on mobile, right side on desktop */}
                        <div className="flex items-center gap-6 text-sm font-medium text-neutral-400 order-1 md:order-2">
                           <a href="#pricing" onClick={handleScrollTo('pricing')} className="hover:text-white transition-colors">Pricing</a>
                           <button type="button" onClick={onOpenAbout} className="hover:text-white transition-colors active:scale-95">About</button>
                           <button type="button" onClick={onOpenTerms} className="hover:text-white transition-colors active:scale-95">Terms</button>
                           <button type="button" onClick={onOpenPrivacy} className="hover:text-white transition-colors active:scale-95">Privacy</button>
                           <button type="button" onClick={onOpenRefund} className="hover:text-white transition-colors active:scale-95">Refund Policy</button>
                           <button type="button" onClick={() => setShowContactModal(true)} className="hover:text-white transition-colors active:scale-95">Contact Us</button>
            </div>
            
                        {/* Logo and Branding - Centered on mobile, left side on desktop */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
                            <button 
                                onClick={onGetStarted}
                                className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-300"
                            >
                                <Logo className="h-8 w-8" bounce={false} />
                                <span className="text-xl font-bold">Otagon</span>
              </button>
                             <p className="text-neutral-400 mt-2 text-sm">&copy; {new Date().getFullYear()} Otagon. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
            
            {/* Contact Us Modal */}
            <ContactUsModal 
                isOpen={showContactModal} 
                onClose={() => setShowContactModal(false)} 
            />
    </div>
  );
};

export default LandingPage;
