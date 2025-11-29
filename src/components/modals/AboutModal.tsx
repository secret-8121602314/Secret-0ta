import React from 'react';
import Modal from '../ui/Modal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Otagon" maxWidth="2xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Company Introduction */}
        <div className="text-left">
          <h3 className="text-2xl font-bold text-text-primary mb-4">
            Your Spoiler-Free Gaming Companion
          </h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            Otagon is an AI-powered gaming assistant developed by <strong>Otagon</strong>, a technology startup 
            based in Hyderabad, Telangana, India. We help gamers progress through their favorite games 
            without spoiling the experience. Upload screenshots, ask questions, and get 
            contextual hints that keep you playing.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Founded with a passion for gaming and technology, Otagon combines cutting-edge artificial 
            intelligence with deep gaming expertise to create a unique companion that understands 
            your gameplay context and provides just the right amount of guidance.
          </p>
        </div>

        {/* Key Features */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Key Features</h4>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span><strong>Screenshot Analysis:</strong> Instant game context recognition powered by Google Gemini AI</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span><strong>Spoiler-Free Hints:</strong> AI-powered assistance that guides without revealing</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span><strong>Real-Time PC Connection:</strong> Seamless integration with your gaming setup</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span><strong>Conversation History:</strong> Track your progress across gaming sessions</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span><strong>Multi-Platform Support:</strong> Works with any game on PC</span>
            </li>
          </ul>
        </div>

        {/* Technology */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Our Technology</h4>
          <p className="text-text-secondary leading-relaxed">
            Otagon leverages advanced AI technology, including Google's Gemini API, to analyze 
            game screenshots and provide intelligent, context-aware assistance. Our systems are 
            designed with privacy and security in mind, ensuring your gaming data is handled 
            responsibly and in compliance with applicable data protection regulations.
          </p>
        </div>

        {/* Version Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Version Information</h4>
          <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
            <p className="text-text-secondary"><strong>Version:</strong> 1.0.0</p>
            <p className="text-text-secondary"><strong>Release:</strong> Early Access</p>
            <p className="text-text-secondary"><strong>Platform:</strong> Web Application (PWA)</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Frequently Asked Questions</h4>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">How does Otagon work?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">
                Press a hotkey while gaming, and Otagon instantly captures your screen. Our AI analyzes 
                the context using Google Gemini and sends spoiler-free hints to your phone or second monitor, 
                so you never have to leave your game.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">Is it really spoiler-free?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">
                Absolutely! Our AI is trained to understand context and provide hints that guide you 
                without revealing plot points, solutions, or surprises. We give you just enough to get unstuck.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">What games does it support?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">
                Otagon works with any game! Our AI can understand visual context from any game genre - 
                RPGs, puzzles, platformers, strategy games, and more. If you can see it on screen, we can help.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4">
              <h5 className="text-base font-semibold text-text-primary mb-2">Is my data safe?</h5>
              <p className="text-text-secondary text-sm leading-relaxed">
                Yes. We take data security seriously. Your screenshots and conversations are processed 
                securely, and we do not sell your personal data to third parties. Please review our 
                Privacy Policy for complete details.
              </p>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Company Information</h4>
          <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4 space-y-2">
            <p className="text-text-secondary"><strong>Business Name:</strong> Otagon</p>
            <p className="text-text-secondary"><strong>Location:</strong> Hyderabad, Telangana, India</p>
            <p className="text-text-secondary"><strong>Email:</strong> <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a></p>
            <p className="text-text-secondary"><strong>Website:</strong> <a href="https://otagon.app" className="text-primary hover:underline">https://otagon.app</a></p>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-text-primary">Contact Us</h4>
          <p className="text-text-secondary">
            For support, feedback, business inquiries, or any questions, please reach out to us at{' '}
            <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
            We typically respond within 24-48 business hours.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-800 pt-4">
          <p className="text-sm text-text-muted text-center">
            © {new Date().getFullYear()} Otagon. All rights reserved.
          </p>
          <p className="text-xs text-text-muted text-center mt-1">
            Otagon is a registered trademark of Otagon, Hyderabad, India.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;
