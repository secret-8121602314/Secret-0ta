import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEOPageLayout } from '../../components/layout/SEOPageLayout';

export const AboutPage = () => {
  return (
    <SEOPageLayout
      title="About Otagon"
      description="Learn about Otagon - your AI-powered gaming companion for spoiler-free hints and real-time assistance. Based in Hyderabad, India, we combine cutting-edge AI with gaming expertise."
      keywords="about otagon, gaming AI, spoiler-free gaming assistant, gaming technology startup, AI gaming companion"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
              About Otagon
            </h1>
            <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
              Your Spoiler-Free Gaming Companion
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Company Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-2 border-neutral-800/60 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-text-primary mb-6">Our Mission</h2>
              <p className="text-text-secondary leading-relaxed mb-4 text-lg">
                Otagon is an AI-powered gaming assistant developed by <strong>Otagon</strong>, a technology startup 
                based in Hyderabad, Telangana, India. We help gamers progress through their favorite games 
                without spoiling the experience. Upload screenshots, ask questions, and get 
                contextual hints that keep you playing.
              </p>
              <p className="text-text-secondary leading-relaxed text-lg">
                Founded with a passion for gaming and technology, Otagon combines cutting-edge artificial 
                intelligence with deep gaming expertise to create a unique companion that understands 
                your gameplay context and provides just the right amount of guidance.
              </p>
            </div>
          </motion.div>

          {/* Key Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Screenshot Analysis',
                  description: 'Instant game context recognition powered by Google Gemini AI',
                  icon: '📸'
                },
                {
                  title: 'Spoiler-Free Hints',
                  description: 'AI-powered assistance that guides without revealing',
                  icon: '🛡️'
                },
                {
                  title: 'Real-Time PC Connection',
                  description: 'Seamless integration with your gaming setup',
                  icon: '🖥️'
                },
                {
                  title: 'Conversation History',
                  description: 'Track your progress across gaming sessions',
                  icon: '💬'
                },
                {
                  title: 'Multi-Platform Support',
                  description: 'Works with any game on PC',
                  icon: '🎮'
                },
                {
                  title: 'Cross-Device Access',
                  description: 'Get hints on your phone while playing on PC',
                  icon: '📱'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-xl p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-text-secondary">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Technology */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-text-primary mb-6">Our Technology</h2>
              <p className="text-text-secondary leading-relaxed text-lg mb-6">
                Otagon leverages advanced AI technology, including Google's Gemini API, to analyze 
                game screenshots and provide intelligent, context-aware assistance. Our systems are 
                designed with privacy and security in mind, ensuring your gaming data is handled 
                responsibly and in compliance with applicable data protection regulations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="text-sm font-semibold text-text-primary">Google Gemini AI</div>
                </div>
                <div className="bg-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="text-sm font-semibold text-text-primary">Privacy-First Design</div>
                </div>
                <div className="bg-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm font-semibold text-text-primary">Real-Time Processing</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  question: 'How does Otagon work?',
                  answer: 'Press a hotkey while gaming, and Otagon instantly captures your screen. Our AI analyzes the context using Google Gemini and sends spoiler-free hints to your phone or second monitor, so you never have to leave your game.'
                },
                {
                  question: 'Is it really spoiler-free?',
                  answer: 'Absolutely! Our AI is trained to understand context and provide hints that guide you without revealing plot points, solutions, or surprises. We give you just enough to get unstuck.'
                },
                {
                  question: 'What games does it support?',
                  answer: 'Otagon works with any game! Our AI can understand visual context from any game genre - RPGs, puzzles, platformers, strategy games, and more. If you can see it on screen, we can help.'
                },
                {
                  question: 'Is my data safe?',
                  answer: 'Yes. We take data security seriously. Your screenshots and conversations are processed securely, and we do not sell your personal data to third parties. Please review our Privacy Policy for complete details.'
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-text-primary mb-3">{faq.question}</h3>
                  <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Company Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-2 border-neutral-800/60 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-text-primary mb-6">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-text-secondary">
                <div>
                  <strong className="text-text-primary">Business Name:</strong> Otagon
                </div>
                <div>
                  <strong className="text-text-primary">Location:</strong> Hyderabad, Telangana, India
                </div>
                <div>
                  <strong className="text-text-primary">Email:</strong>{' '}
                  <a href="mailto:support@otagon.app" className="text-primary hover:underline">
                    support@otagon.app
                  </a>
                </div>
                <div>
                  <strong className="text-text-primary">Website:</strong>{' '}
                  <a href="https://otagon.app" className="text-primary hover:underline">
                    https://otagon.app
                  </a>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-neutral-800">
                <p className="text-sm text-text-muted">
                  <strong>Version:</strong> 1.0.0 | <strong>Platform:</strong> Web Application (PWA) | <strong>Release:</strong> Early Access
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent border border-neutral-800 rounded-2xl p-10">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to Enhance Your Gaming?</h2>
              <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
                Join thousands of gamers who never get stuck anymore. Try Otagon free today.
              </p>
              <Link to="/earlyaccess">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                >
                  <span>Try Otagon Free</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </SEOPageLayout>
  );
};
