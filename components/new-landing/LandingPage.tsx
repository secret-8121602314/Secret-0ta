import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import CheckIcon from './CheckIcon';
import StarIcon from './StarIcon';
// Dynamic import to avoid circular dependency
// import { waitlistService } from '../../services/waitlistService';
import FounderImage from './FounderImage';
import ContactUsModal from './ContactUsModal';

const GamepadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
        <path d="M6 12h4"></path>
        <path d="M14 10v4"></path>
        <path d="M18 10v4"></path>
        <path d="M10 10v4"></path>
    </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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
        <div className="relative flex h-48 w-full items-center justify-center rounded-2xl p-6 group hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="80"
                height="80"
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

const Feature = React.memo(({ title, description, icon, reverse = false }: { title: React.ReactNode, description: string, icon: 'eye' | 'bookmark' | 'network' | 'mic' | 'insights' | 'cpu', reverse?: boolean }) => (
    <div className={`flex flex-col md:flex-row items-center gap-12 md:gap-20 ${reverse ? 'md:flex-row-reverse' : ''}`}>
        <div className="md:w-1/2 w-full animate-fade-slide-up">
            <FeatureIcon icon={icon} />
        </div>
        <div className="md:w-1/2 w-full text-center md:text-left animate-fade-slide-up">
            <h3 className="text-4xl font-bold tracking-tight text-white mb-6 flex items-center justify-center md:justify-start leading-tight">{title}</h3>
            <p className="text-xl text-neutral-300 leading-relaxed">{description}</p>
        </div>
    </div>
));

const AppMockup = React.memo(() => (
    <div className="relative mx-auto my-16 w-full max-w-2xl h-auto rounded-3xl bg-black/60 backdrop-blur-xl p-2 shadow-2xl animate-fade-slide-up border-2 border-[#424242]/40 group hover:border-[#E53A3A]/60 transition-all duration-500 hover:shadow-2xl hover:shadow-[#E53A3A]/25">
        <div className="bg-transparent rounded-2xl p-6 space-y-6">
            {/* User Prompt */}
            <div className="flex justify-end">
                <p className="text-base text-rose-300 bg-gradient-to-r from-rose-900/60 to-rose-800/60 py-3 px-6 rounded-2xl rounded-br-none border-2 border-rose-500/40 backdrop-blur-sm shadow-lg">
                    What should I do here?
                </p>
            </div>
            {/* Model Response */}
            <div className="flex justify-start">
                <div className="border-2 border-neutral-700/60 bg-gradient-to-r from-neutral-800/60 to-neutral-700/60 p-6 rounded-2xl rounded-bl-none max-w-[80%] text-left backdrop-blur-sm shadow-lg">
                    <p className="text-base font-bold text-white mb-2">Hint:</p>
                    <p className="text-base text-neutral-200 leading-relaxed">
                    The contraption on the far wall seems to be missing a gear. Perhaps there's one nearby?
                    </p>
                </div>
            </div>
        </div>
    </div>
));

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


const PricingSection = ({ onCtaClick }: { onCtaClick: () => void }) => {
    const proFeatures = [
        '1,583 Text Queries/month',
        '328 Image Queries/month',
        'Access to Latest Advanced AI Models',
        'Batch Screenshot Capture',
        'Hands-Free Voice Response',
        'In-depth Insight Tabs',
        'Priority Support',
        'No ads'
    ];
    const vanguardFeatures = [
        { text: 'Permanent Price Lock-in' },
        { text: 'Exclusive "Vanguard" In-App Badge' },
        { text: "Access to Founder's Council (Discord)" },
        { text: 'Beta Access to All Future Features' },
        { text: 'Earn money completing latest games to help us train our ai model', comingSoon: true },
    ];

    return (
        <section id="pricing" className="py-10 md:py-14 bg-transparent">
            <div className="container mx-auto px-8">
                <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                    <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">Choose Your Plan</h2>
                    <p className="text-xl text-neutral-300 mt-6 leading-relaxed">Start for free. Upgrade when you're ready.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
                    
                    {/* Free Plan */}
                    <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-2 border-neutral-800/60 rounded-3xl p-10 flex flex-col animate-fade-slide-up hover:border-neutral-700/80 hover:scale-105 hover:shadow-[0_0_30px_rgba(229,58,58,0.3)] hover:shadow-[#E53A3A]/20 transition-all duration-500">
                        <h3 className="text-3xl font-bold text-white mb-3">Free</h3>
                        <p className="text-neutral-300 mt-3 mb-8 text-lg">For the Casual Player</p>
                        <div className="mb-8">
                            <span className="text-6xl font-bold text-white">$0</span>
                            <span className="text-xl text-neutral-300">/month</span>
                        </div>
                        <ul className="space-y-4 mb-10">
                            <FeatureListItem>25 Image Queries/month</FeatureListItem>
                            <FeatureListItem>55 Text Queries/month</FeatureListItem>
                            <FeatureListItem>Standard AI Model (Gemini 2.5 Flash)</FeatureListItem>
                            <FeatureListItem>PC-to-Mobile Sync (Single Screenshot)</FeatureListItem>
                            <FeatureListItem>Automatic Progress Tracking</FeatureListItem>
                            <FeatureListItem>Otaku Diary & Wishlist</FeatureListItem>
                        </ul>
                        <div className="mt-auto">
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-4 px-8 rounded-xl cursor-not-allowed opacity-50"
                                disabled
                                title="Coming Soon - Join the waitlist to be notified when pricing goes live!"
                            >
                                Start for Free
                            </button>
                        </div>
                    </div>

                    {/* Vanguard Plan (center and highlighted) */}
                    <div className="relative border-2 border-[#FFAB40] rounded-3xl p-10 bg-gradient-to-r from-[#111] to-[#0A0A0A] shadow-2xl shadow-[#D98C1F]/30 transform lg:scale-110 flex flex-col animate-fade-slide-up hover:shadow-[#D98C1F]/50 transition-all duration-500">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white text-sm font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-2xl">
                            Limited Offer
                        </div>
                        <h3 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] mb-3">Pro Vanguard</h3>
                        <p className="text-neutral-300 mt-3 mb-8 text-lg">Become a Founding Member</p>
                        <div className="mb-8">
                            <span className="text-6xl font-bold text-white">$20</span>
                            <span className="text-xl text-neutral-300">/month</span>
                            <p className="text-green-400 font-medium text-lg mt-2">Lifetime Price Guarantee!</p>
                        </div>
                        <ul className="space-y-4 mb-6">
                            <FeatureListItem>Everything in Pro, plus:</FeatureListItem>
                        </ul>
                        <ul className="space-y-4 mb-10 border-l-2 border-[#FFAB40]/40 pl-6 ml-2">
                            <VanguardFeatureListItem>Permanent Price Lock-in</VanguardFeatureListItem>
                            <VanguardFeatureListItem>Exclusive 'Vanguard' In-App Badge</VanguardFeatureListItem>
                            <VanguardFeatureListItem>Access to Founder's Council on Discord</VanguardFeatureListItem>
                            <VanguardFeatureListItem>Beta Access to All Future Features</VanguardFeatureListItem>
                            <VanguardFeatureListItem comingSoon={true}>Revenue Sharing Opportunities</VanguardFeatureListItem>
                        </ul>
                        <div className="mt-auto">
                            <button 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-4 px-8 rounded-xl cursor-not-allowed opacity-50"
                                disabled
                                title="Coming Soon - Join the waitlist to be notified when pricing goes live!"
                            >
                                Become a Vanguard
                            </button>
                        </div>
                    </div>

                    {/* Pro (Monthly) Plan */}
                    <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-2 border-neutral-800/60 rounded-3xl p-10 flex flex-col animate-fade-slide-up hover:border-neutral-700/80 hover:scale-105 hover:shadow-[0_0_30px_rgba(229,58,58,0.3)] hover:shadow-[#E53A3A]/20 transition-all duration-500">
                        <h3 className="text-3xl font-bold text-white mb-3">Pro</h3>
                        <p className="text-neutral-300 mt-3 mb-8 text-lg">For the Serious Gamer</p>
                        <div className="mb-8">
                            <span className="text-6xl font-bold text-white">$3.99</span>
                            <span className="text-xl text-neutral-300">/month</span>
                        </div>
                        <ul className="space-y-4 mb-10">
                            <FeatureListItem>Everything in Free, plus:</FeatureListItem>
                            <FeatureListItem>328 Image Queries/month</FeatureListItem>
                            <FeatureListItem>1,583 Text Queries/month</FeatureListItem>
                            <FeatureListItem>Advanced AI Model (Gemini 2.5 Pro)</FeatureListItem>
                            <FeatureListItem>In-Depth Insight Tabs (Auto-Wiki)</FeatureListItem>
                            <FeatureListItem>Hands-Free Voice Response</FeatureListItem>
                            <FeatureListItem>Batch Screenshot Capture</FeatureListItem>
                            <FeatureListItem>Enhanced Response Quality</FeatureListItem>
                            <FeatureListItem>Priority Support & No Ads</FeatureListItem>
                        </ul>
                        <div className="mt-auto">
                            <button 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-4 px-8 rounded-xl cursor-not-allowed opacity-50"
                                disabled
                                title="Coming Soon - Join the waitlist to be notified when pricing goes live!"
                            >
                                Go Pro
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CommunityChallengeSection = ({ onShareClick }: { onShareClick: () => void }) => {
    const proUserGoal = 5000;
    const currentProUsers = 137; // This is a static value for now.
    const progressPercentage = (currentProUsers / proUserGoal) * 100;

    return (
        <section id="community-challenge" className="py-8 md:py-10 bg-transparent">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-6 md:mb-8 animate-fade-slide-up">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Help Us Go Ad-Free for Everyone!</h2>
                    
                </div>

                <div className="bg-[#1C1C1C]/40 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 md:p-12 animate-fade-slide-up">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2 text-white">
                            <span className="font-bold text-lg">{currentProUsers.toLocaleString()} Supporters</span>
                            <span className="text-lg text-neutral-400">{proUserGoal.toLocaleString()} Goal</span>
                        </div>
                        <div className="w-full h-4 bg-neutral-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(progressPercentage, 0.5)}%` }}
                            ></div>
                        </div>
                        <p className="text-right text-sm text-neutral-400 mt-2">
                            {progressPercentage.toFixed(1)}% complete
                        </p>
                    </div>

                    {/* Explanation */}
                    <p className="text-lg text-center text-neutral-300 mb-10 leading-relaxed">
                        When we hit our goal of 5,000 Pro subscribers, we will <span className="font-bold text-white">permanently remove all ads for Free users.</span> Let's build a better platform, together.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10 text-center md:text-left">
                        {/* Free Users */}
                        <div className="flex flex-col items-center md:items-start">
                             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500/10 mb-4 border border-sky-500/20">
                                <ShareIcon className="w-6 h-6 text-sky-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Free Users: Spread the Word!</h3>
                            <p className="text-neutral-400">
                                You have the power to make Otagon ad-free. Share the app with friends, post about it, and help us reach our goal faster!
                            </p>
                        </div>

                        {/* Pro Users */}
                        <div className="flex flex-col items-center md:items-start">
                             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-4 border border-amber-500/20">
                                <StarIcon className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro Users: You're the Heroes!</h3>
                            <p className="text-neutral-400">
                                Your subscription doesn't just unlock features—it funds an ad-free experience for the community. Ads are nobody's choice, not even ours. Thank you.
                            </p>
                        </div>
                    </div>
                    
                    {/* Centered Share Button */}
                    <div className="text-center">
                        <button 
                            onClick={onShareClick}
                            className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 inline-flex items-center gap-2"
                        >
                            <ShareIcon className="w-5 h-5" />
                            Share the Challenge
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const EarnByPlayingSection = ({ onApplyClick }: { onApplyClick: () => void }) => (
    <section id="earn-by-playing" className="py-8 md:py-10 bg-transparent">
        <div className="container mx-auto px-6 max-w-4xl">
            {/* Gradient border wrapper */}
            <div className="p-[1px] bg-gradient-to-br from-[#E53A3A]/50 to-[#D98C1F]/50 rounded-xl animate-fade-slide-up">
                <div className="bg-black rounded-[11px] p-8 md:p-12 text-left flex flex-col">
                    <div>
                        <div className="flex justify-start mb-6">
                            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#E53A3A]/10 to-[#FFAB40]/10 border border-neutral-700/50">
                                <GamepadIcon className="w-12 h-12 text-[#FFAB40]" />
                            </div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                            Earn by Playing
                        </h2>
                        <div className="mb-4">
                            <span className="text-base font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full uppercase tracking-wider">Coming Soon</span>
                        </div>
                        <p className="text-lg text-[#FFAB40] font-semibold mb-8">Exclusive to Vanguard Users</p>
                    </div>

                    <div className="flex-grow">
                        <ul className="space-y-4 text-lg max-w-2xl mb-8 leading-relaxed">
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
                            title="Coming Soon - Join the waitlist to be notified when this feature goes live!"
                        >
                            Coming Soon
                        </button>
                        <p className="text-xs text-neutral-500 mt-4 text-center">Join the waitlist to be notified when this feature goes live!</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);


const FounderSection = () => (
    <section id="founder" className="py-10 md:py-14 bg-transparent">
        <div className="container mx-auto px-8 md:px-10 max-w-5xl">
            {/* Section Header */}
            <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
                    Meet Our Founder
                </h2>
                <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                    Meet Amaan, a passionate gamer from Hyderabad who spent his early days printing cheat codes at internet cafes. 
                    Now studying Service Design at the Royal College of Art in London, he's building the future of gaming assistance.
                </p>
            </div>
            
            {/* Hero-Style Layout */}
            <div className="text-center animate-fade-slide-up">
                {/* Founder Image - Centered */}
                <div className="flex justify-center mb-8">
                    <FounderImage size="xl" />
                </div>
                
                {/* Decorative Gradient Line */}
                <div className="w-24 h-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] mx-auto mb-8 rounded-full"></div>
                
                {/* Name and Title - Centered */}
                <div className="space-y-3 mb-8">
                    <h3 className="text-4xl md:text-5xl font-bold text-white">
                        Amaan
                    </h3>
                    <p className="text-xl md:text-2xl text-neutral-300 font-medium">
                        Founder & CEO
                    </p>
                </div>
                
                {/* Personal Quote - Centered */}
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
                        className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#0077B5] to-[#005885] hover:from-[#005885] hover:to-[#004066] text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-[#0077B5]/25"
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
                        href="mailto:support@otakon.app"
                        className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-[#E53A3A]/25"
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
);


interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAbout: () => void;
  onOpenPrivacy: () => void;
  onOpenRefund: () => void;
  onOpenContact: () => void;
  onDirectNavigation: (path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenAbout, onOpenPrivacy, onOpenRefund, onOpenContact, onDirectNavigation }) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    // Handle direct URL navigation on component mount
    useEffect(() => {
        const path = window.location.pathname;
        if (path !== '/' && path !== '') {
            onDirectNavigation(path);
        }
    }, [onDirectNavigation]);



    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            const { waitlistService } = await import('../../services/waitlistService');
            const result = await waitlistService.addToWaitlist(email, 'landing_page');
            
            if (result.success) {
                setSubmitMessage('Thanks for joining! We\'ll email you when access is ready.');
                setEmail('');
            } else {
                setSubmitMessage(result.error || 'Failed to join waitlist. Please try again.');
            }
        } catch (error) {
            console.error('Waitlist submission error:', error);
            setSubmitMessage('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShareClick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Otagon - Your Spoiler-Free Gaming Companion',
                    text: 'Stuck in-game? Get instant, spoiler-free hints with Otagon! Help us go ad-free for everyone.',
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            alert("To share, please copy the link from your browser's address bar. Thanks for helping us grow!");
        }
    };

    const handleScrollTo = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScrollToTop = (e: React.MouseEvent) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div 
            className="text-white font-inter animate-fade-in overflow-x-hidden relative min-h-screen"
            style={{
                backgroundImage: `
                    radial-gradient(rgba(255, 77, 77, 0.25) 2px, transparent 2px),
                    radial-gradient(rgba(255, 77, 77, 0.25) 2px, #111111 2px)
                `,
                backgroundSize: '80px 80px',
                backgroundPosition: '0 0, 40px 40px',
                backgroundColor: '#111111'
            }}
        >

            

            
            {/* Background Glows */}
            <div
              className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none hero-glow-texture-top"
            ></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 -z-10 pointer-events-none hero-glow-texture-bottom"></div>
            


            {/* Main Content */}
            <main>
                {/* Hero Section */}
                <section className="relative pt-20 pb-6 md:pb-8 text-center">
                    <div 
                      className="absolute inset-0 -z-10 opacity-10"
                      style={{
                        background: 'linear-gradient(90deg, #FF4D4D10 1px, transparent 1px), linear-gradient(0deg, #FF4D4D10 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                      }}
                    ></div>
                    

                    
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="flex flex-col items-center justify-center gap-4 mb-10 animate-fade-slide-down">
                            <Logo className="h-32 w-32" />
                            <h1 className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] py-2">
                                Otagon
                            </h1>
                        </div>

                        <h2 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 text-white animate-fade-slide-up leading-tight">
                            Stuck In-Game? Get Hints, Not Spoilers.
                        </h2>

                        <AppMockup />
                        
                        <p className="text-xl md:text-2xl text-neutral-300 max-w-4xl mx-auto mb-8 leading-relaxed animate-fade-slide-up">
                            Otagon sees your screen and gives you the perfect nudge to keep you playing—without ruining the surprise. Stop searching, start playing.
                        </p>
                        
                        <form id="waitlist-form" onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto animate-fade-slide-up">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                                disabled={isSubmitting}
                                className="flex-grow bg-gradient-to-r from-[#1C1C1C] to-[#0A0A0A] border-2 border-neutral-800/60 rounded-xl py-4 px-6 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg backdrop-blur-sm"
                                aria-label="Email for waitlist"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Joining...
                                    </div>
                                ) : (
                                    'Join the Waitlist'
                                )}
                            </button>
                        </form>
                        
                        {submitMessage && (
                            <div className={`mt-6 text-center animate-fade-slide-up text-lg ${submitMessage.includes('Thanks') ? 'text-green-400' : 'text-red-400'}`}>
                                {submitMessage}
                            </div>
                        )}
                        
                        <p className="text-sm text-neutral-400 mt-4 animate-fade-slide-up">
                            Join thousands of gamers on the waitlist!
                        </p>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-10 md:py-14 bg-transparent relative">
                    <div className="container mx-auto px-8 max-w-6xl relative z-10">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">From Stuck to Unstoppable in 3 Steps</h2>
                            <p className="text-xl text-neutral-300 mt-6 leading-relaxed">Get unstuck, get smart, get back to gaming—all without leaving your game.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {/* Step 1 */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-6">
                                    <span className="text-3xl font-bold text-white">1</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Press a Hotkey</h3>
                                <p className="text-lg text-neutral-300 leading-relaxed">
                                    Press a hotkey to instantly send your PC screenshot to your phone. No alt-tabbing, no interruptions.
                                </p>
                            </div>
                            
                            {/* Step 2 */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-6">
                                    <span className="text-3xl font-bold text-white">2</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Get an Instant Hint</h3>
                                <p className="text-lg text-neutral-300 leading-relaxed">
                                    Our AI analyzes your situation and delivers a perfect, spoiler-free hint in seconds.
                                </p>
                            </div>
                            
                            {/* Step 3 */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-6">
                                    <span className="text-3xl font-bold text-white">3</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Keep Playing</h3>
                                <p className="text-lg text-neutral-300 leading-relaxed">
                                    Get the nudge you need and dive right back into the action. No spoilers, just the perfect hint.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-10 md:py-14 bg-transparent relative">

                    <div className="container mx-auto px-8 max-w-6xl relative z-10">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">Your All-in-One Gaming Assistant</h2>
                            <p className="text-xl text-neutral-300 mt-6 leading-relaxed">Features built to enhance your gameplay, not spoil it</p>
                        </div>
                        <div className="space-y-20 md:space-y-28">
                           <Feature
                                title="Instant Contextual Hints"
                                description="Our context-aware AI vision doesn't just see a game; it understands your moment. Get guidance on puzzles, lore, and boss strategies, all without spoilers."
                                icon="eye"
                            />
                            <Feature
                                title="Seamless PC-to-Mobile Sync"
                                description="Link your desktop and phone for the ultimate uninterrupted experience. A single hotkey is all it takes to get help without ever minimizing your game."
                                icon="network"
                                reverse={true}
                            />
                           <Feature
                                title="Your Personal Gaming Hub"
                                description="Track your entire gaming life. The Otaku Diary is your private journal, the Wishlist manages your backlog, and Automatic Progress Tracking organizes your game chats and story progress."
                                icon="bookmark"
                            />

                            <Feature
                                title={<>Go Pro for the Ultimate Edge<ProBadge /></>}
                                description="Unlock In-Depth Insight Tabs to auto-generate a wiki for your game, use Hands-Free Voice Responses for ultimate immersion, and capture more detail with Batch Screenshot Capture."
                                icon="insights"
                                reverse={true}
                            />
                        </div>
                    </div>
                </section>

                {/* For Every Gamer, For Every Genre Section */}
                <section className="py-10 md:py-14 bg-transparent relative">
                    <div className="container mx-auto px-8 max-w-6xl relative z-10">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">For Every Challenge, In Every World</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Souls-likes & Action RPGs */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Souls-likes & Action RPGs</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Master tough bosses and find hidden paths without rage-quitting. We'll give you a hint, not the easy way out.
                                </p>
                            </div>
                            
                            {/* RPGs */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 9.246 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 19 16.5 19c-1.746 0-3.332-.523-4.5-1.253"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">RPGs</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Uncover deep lore and track complex quests without accidentally reading a major story spoiler.
                                </p>
                            </div>
                            
                            {/* Puzzle Games */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Puzzle Games</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Get a clue for that brain-bending puzzle, not the entire solution. Preserve your "aha!" moment.
                                </p>
                            </div>
                            
                            {/* Open-World Adventures */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Open-World Adventures</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Hunt down every last collectible and conquer secret challenges with a gentle nudge in the right direction.
                                </p>
                            </div>
                            
                            {/* Strategy Games */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Metroidvanias</h3>
                                <p className="text-neutral-300 leading-relaxed">
                                    Lost after finding a new power? Discover which hidden path just opened up without checking a full map.
                                </p>
                            </div>
                            
                            {/* Survival & Crafting */}
                            <div className="text-center animate-fade-slide-up">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-2 border-[#E53A3A]/40 mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
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

                {/* Community Challenge Section */}
                <CommunityChallengeSection onShareClick={handleShareClick} />

                {/* Pricing Section */}
                <PricingSection onCtaClick={onGetStarted} />

                {/* Earn by Playing Section */}
                <EarnByPlayingSection onApplyClick={onGetStarted} />

                {/* Testimonials Section */}
                <section className="py-10 md:py-14 bg-transparent relative">

                    <div className="container mx-auto px-8 max-w-6xl relative z-10">
                        <div className="text-center mb-8 md:mb-10 animate-fade-slide-up">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">Don't Just Take Our Word For It</h2>
                            <p className="text-xl text-neutral-300 mt-6 leading-relaxed">See what early adopters are saying about Otagon.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Testimonial
                                quote="Finally, a way to get hints without wading through spoiler-filled wikis! Otagon is a game-changer for finishing my backlog."
                                author="Safi"
                                title="RPG Enthusiast"
                            />
                            <Testimonial
                                quote="The PC-to-mobile sync is just magic. Press a key, get a hint on my phone, and I'm back in the action. No more alt-tabbing to a browser."
                                author="Ash"
                                title="PC Gamer"
                            />
                        </div>
                    </div>
                </section>

                <FounderSection />
                
                {/* CTA Section */}
                <section className="py-16 md:py-20 bg-transparent relative">
                     <div className="container mx-auto px-6 text-center relative">
                          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Stop Searching. Start Playing.</h2>
                          <p className="text-xl text-neutral-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Join the waitlist and be the first to experience the future of gaming assistance. Your next adventure awaits, unspoiled.
                          </p>
                          <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-4 px-10 rounded-lg transition-transform transform hover:scale-105 text-lg"
                            >
                            Get Early Access
                          </button>
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
                           <a href="/about" onClick={(e) => { e.preventDefault(); onDirectNavigation('/about'); }} className="hover:text-white transition-colors">About</a>
                           <a href="/privacy" onClick={(e) => { e.preventDefault(); onDirectNavigation('/privacy'); }} className="hover:text-white transition-colors">Privacy</a>
                           <a href="/refund" onClick={(e) => { e.preventDefault(); onDirectNavigation('/refund'); }} className="hover:text-white transition-colors">Refund Policy</a>
                           <a href="/contact" onClick={(e) => { e.preventDefault(); onDirectNavigation('/contact'); }} className="hover:text-white transition-colors">Contact Us</a>
                        </div>
                        
                        {/* Logo and Branding - Centered on mobile, left side on desktop */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
                            <div className="flex items-center gap-0">
                                <button 
                                    onClick={onGetStarted}
                                    className="cursor-pointer hover:scale-105 transition-transform duration-300"
                                >
                                    <Logo className="h-8 w-8" />
                                </button>
                                <span className="text-xl font-bold">Otagon</span>
                            </div>
                             <p className="text-neutral-400 mt-2 text-sm">&copy; {new Date().getFullYear()} Otagon. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default React.memo(LandingPage);
