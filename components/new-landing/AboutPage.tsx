import React from 'react';
import FounderImage from './FounderImage';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-white">Our Mission: To Preserve the Magic of Discovery</h2>
      <p className="text-[#A3A3A3] leading-relaxed">Gaming is about discovery. It's the thrill of solving a puzzle on your own, the awe of a surprise plot twist, and the satisfaction of finally beating that one impossible boss. But in today's world of instant information, that magic is fragile. One wrong click on a wiki or a glance at a YouTube thumbnail can spoil hours of a carefully crafted experience.</p>
      <p className="mt-4 text-[#A3A3A3] leading-relaxed">We built Otakon to protect that magic.</p>
      
      <h3 className="text-2xl font-bold text-white">From Passion to Purpose</h3>
      <p className="text-[#A3A3A3] leading-relaxed">I'm Amaan, the founder of Otakon. Like you, I've spent my life passionate about games. From my early days printing out cheat codes at internet cafes in Hyderabad to getting lost in the deep lore of modern RPGs, I've always loved the journey of exploration.</p>
      <p className="text-[#A3A3A3] leading-relaxed">But I've also felt the frustration of needing a small hint and getting a massive spoiler in return. The immersion breaks, and the sense of personal achievement is lost.</p>
      <p className="text-[#A3A3A3] leading-relaxed">During my time studying Service Design at the Royal College of Art (RCA) in London, this frustration grew into a purpose. I wanted to build a tool that respected the player and their experience—a companion that could provide the perfect nudge without giving away the destination.</p>
      
      <h3 className="text-2xl font-bold text-white">A Companion, Not a Walkthrough</h3>
      <p className="text-[#A3A3A3] leading-relaxed">Otakon is the result of that vision. It's not a walkthrough that tells you what to do. It's an AI-powered companion that sees what you see and understands your struggle. It's designed to give you just enough information to get you thinking, so you can get back to the best part of gaming: solving the problem yourself.</p>
      <p className="text-[#A3A3A3] leading-relaxed">We are a small, dedicated team of gamers and builders based in Hyderabad, India, serving a global community of players like you. We believe that technology should enhance our hobbies, not detract from them.</p>
      <p className="text-[#A3A3A3] leading-relaxed">Thank you for joining us on this adventure. Let's get back to the magic of discovery, together.</p>
      
      {/* Founder Profile Section */}
      <div className="text-center">
        <FounderImage size="xl" className="mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-white mb-4">Amaan - Founder & CEO</h3>
        <p className="text-[#A3A3A3] leading-relaxed max-w-2xl mx-auto">
          A passionate gamer and Service Design graduate from the Royal College of Art (RCA) in London. 
          Based in Hyderabad, India, serving gamers worldwide.
        </p>
      </div>
      
      {/* Contact Information */}
      <div className="bg-[#1C1C1C]/40 border border-[#424242] rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-4">Connect With Our Founder</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://www.linkedin.com/in/readmetxt/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0077B5] hover:bg-[#005885] text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span className="text-white">LinkedIn Profile</span>
          </a>
          
          <a
            href="mailto:founder@otakon.ai" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E53A3A] hover:bg-[#D42A2A] text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span className="text-white">Email Founder</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
