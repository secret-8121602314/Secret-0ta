import React from 'react';
import Modal from '../ui/Modal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Otagon">
      <div className="space-y-6">
        <div className="text-left">
          <h3 className="text-2xl font-bold text-text-primary mb-4">
            Your Spoiler-Free Gaming Companion
          </h3>
          <p className="text-text-secondary leading-relaxed">
            Otagon is an AI-powered gaming assistant that helps you progress through games 
            without spoiling the experience. Upload screenshots, ask questions, and get 
            contextual hints that keep you playing.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Key Features</h4>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Screenshot analysis for instant game context</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>AI-powered hints without spoilers</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Real-time PC connection for seamless assistance</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Conversation history and game tracking</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Version</h4>
          <p className="text-text-secondary">1.0.0 - Initial Release</p>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Frequently Asked Questions</h4>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">How does Otagon work?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">Press a hotkey while gaming, and Otagon instantly captures your screen. Our AI analyzes the context and sends spoiler-free hints to your phone or second monitor, so you never have to leave your game.</p>
            </div>
            
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">Is it really spoiler-free?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">Absolutely! Our AI is trained to understand context and provide hints that guide you without revealing plot points, solutions, or surprises. We give you just enough to get unstuck.</p>
            </div>
            
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">What games does it support?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">Otagon works with any game! Our AI can understand visual context from any game genre - RPGs, puzzles, platformers, strategy games, and more. If you can see it on screen, we can help.</p>
            </div>
            
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">When will it be available?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">We're currently in closed beta with select testers. Join our waitlist to get early access when we launch! We expect to open up to more users in the coming months.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Contact</h4>
          <p className="text-text-secondary">
            For support, feedback, or questions, please contact us through our support channels.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;
