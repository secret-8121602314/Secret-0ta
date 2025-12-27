import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { SEOPageLayout } from '../../components/layout/SEOPageLayout';

const tableOfContents = [
  { id: 'section-1', title: '1. Acceptance of Terms' },
  { id: 'section-2', title: '2. Description of Service' },
  { id: 'section-3', title: '3. User Accounts' },
  { id: 'section-4', title: '4. Subscription and Payments' },
  { id: 'section-5', title: '5. Acceptable Use Policy' },
  { id: 'section-6', title: '6. Intellectual Property' },
  { id: 'section-7', title: '7. AI-Powered Features' },
  { id: 'section-8', title: '8. Advertisements' },
  { id: 'section-9', title: '9. Disclaimers' },
  { id: 'section-10', title: '10. Limitation of Liability' },
  { id: 'section-11', title: '11. Indemnification' },
  { id: 'section-12', title: '12. Modifications' },
  { id: 'section-13', title: '13. Governing Law' },
  { id: 'section-14', title: '14. Severability' },
  { id: 'section-15', title: '15. Entire Agreement' },
  { id: 'section-16', title: '16. Contact Us' },
];

export const TermsPage = () => {
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    const handleScroll = () => {
      const sections = tableOfContents.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(tableOfContents[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <SEOPageLayout
      title="Terms of Service"
      description="Read Otagon's Terms of Service to understand the rules and regulations governing the use of our AI-powered gaming assistant service."
      keywords="terms of service, user agreement, terms and conditions, legal agreement, service terms"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
              Terms of Service
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-4">
              Understanding the rules that govern our service
            </p>
            <p className="text-sm text-text-muted">
              Last Updated: November 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="py-16 px-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:block w-64 flex-shrink-0"
            >
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">
                    Table of Contents
                  </h3>
                  <nav className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-all duration-200 ${
                          activeSection === item.id
                            ? 'bg-primary/20 text-primary font-medium'
                            : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </motion.aside>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 max-w-4xl"
            >
              <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-2xl p-8 md:p-12 space-y-12">
                
                {/* Introduction */}
                <div>
                  <p className="text-text-secondary leading-relaxed text-lg">
                    Welcome to Otagon. These Terms of Service ("Terms") govern your access to and use of 
                    the Otagon AI-powered gaming assistant service (the "Service") provided by Otagon, 
                    a technology startup based in Hyderabad, Telangana, India ("we," "us," or "our"). 
                    Please read these Terms carefully before using our Service.
                  </p>
                </div>

                {/* Section 1 */}
                <div id="section-1" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-text-secondary mb-4">
                    By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. 
                    If you disagree with any part of these Terms, you may not access or use our Service.
                  </p>
                  <p className="text-text-secondary">
                    You must be at least 13 years old (or the age of digital consent in your jurisdiction) to use 
                    this Service. By using our Service, you represent that you meet this age requirement.
                  </p>
                </div>

                {/* Section 2 */}
                <div id="section-2" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    2. Description of Service
                  </h2>
                  <p className="text-text-secondary mb-4">
                    Otagon is an AI-powered gaming assistant that provides spoiler-free hints and assistance 
                    to gamers. The Service includes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                    <li>Screenshot analysis and game context recognition</li>
                    <li>AI-powered gaming assistance powered by Google Gemini API</li>
                    <li>PC companion application for screen capture</li>
                    <li>Conversation history and game progress tracking</li>
                    <li>Subscription-based premium features</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div id="section-3" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    3. User Accounts
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.1 Account Registration</h3>
                      <p className="text-text-secondary">
                        To access certain features, you must create an account. You agree to provide accurate, 
                        current, and complete information during registration and to update such information to 
                        keep it accurate, current, and complete.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.2 Account Security</h3>
                      <p className="text-text-secondary">
                        You are responsible for maintaining the confidentiality of your account credentials and 
                        for all activities that occur under your account. You agree to notify us immediately of 
                        any unauthorized use of your account.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.3 Account Termination</h3>
                      <p className="text-text-secondary">
                        We reserve the right to suspend or terminate your account at any time for violation of 
                        these Terms or for any other reason at our sole discretion.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div id="section-4" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    4. Subscription and Payments
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">4.1 Subscription Tiers</h3>
                      <p className="text-text-secondary">
                        We offer different subscription tiers (Free, Pro, Pro Vanguard) with varying features 
                        and limitations. Features and pricing may change from time to time.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">4.2 Payment Terms</h3>
                      <p className="text-text-secondary">
                        Paid subscriptions are billed in advance on a monthly or yearly basis. Payments are 
                        processed through secure third-party payment processors. By subscribing, you authorize 
                        us to charge your payment method for the subscription fee.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">4.3 Automatic Renewal</h3>
                      <p className="text-text-secondary">
                        Subscriptions automatically renew unless cancelled before the renewal date. You may 
                        cancel your subscription at any time through your account settings.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">4.4 Refunds</h3>
                      <p className="text-text-secondary">
                        Please refer to our separate{' '}
                        <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link>
                        {' '}for information about refunds and cancellations.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5 */}
                <div id="section-5" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    5. Acceptable Use Policy
                  </h2>
                  <p className="text-text-secondary mb-4">You agree not to use our Service to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                    <li>Violate any applicable laws, regulations, or third-party rights</li>
                    <li>Upload or transmit illegal, harmful, threatening, abusive, or objectionable content</li>
                    <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                    <li>Interfere with or disrupt the integrity or performance of the Service</li>
                    <li>Use the Service for any commercial purpose without our prior written consent</li>
                    <li>Reverse engineer, decompile, or disassemble any aspect of the Service</li>
                    <li>Use automated means (bots, scrapers) to access the Service without permission</li>
                    <li>Circumvent any access controls or usage limits</li>
                    <li>Upload content that infringes intellectual property rights</li>
                    <li>Engage in any activity that could harm minors</li>
                  </ul>
                </div>

                {/* Section 6 */}
                <div id="section-6" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    6. Intellectual Property
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">6.1 Our Intellectual Property</h3>
                      <p className="text-text-secondary">
                        The Service, including its original content, features, functionality, and design, is 
                        owned by Otagon and is protected by international copyright, trademark, patent, trade 
                        secret, and other intellectual property laws.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">6.2 Your Content</h3>
                      <p className="text-text-secondary">
                        You retain ownership of content you upload (such as screenshots). By uploading content, 
                        you grant us a limited license to use, process, and store such content solely for the 
                        purpose of providing the Service.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">6.3 Third-Party Content</h3>
                      <p className="text-text-secondary">
                        Game content, screenshots, and related materials are the property of their respective 
                        owners. Otagon does not claim ownership of third-party game content.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 7 */}
                <div id="section-7" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    7. AI-Powered Features
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">7.1 Google Gemini API</h3>
                      <p className="text-text-secondary">
                        Our Service uses Google's Gemini API to power AI features. By using the Service, you 
                        acknowledge that your content may be processed by Google's systems in accordance with 
                        Google's terms of service and privacy policy.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">7.2 AI Limitations</h3>
                      <p className="text-text-secondary">
                        AI-generated responses are provided for informational and entertainment purposes only. 
                        The AI may occasionally provide inaccurate or incomplete information. We do not guarantee 
                        the accuracy, completeness, or reliability of AI-generated content.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">7.3 No Spoiler Guarantee</h3>
                      <p className="text-text-secondary">
                        While we strive to provide spoiler-free assistance, we cannot guarantee that all AI 
                        responses will be completely spoiler-free. Use the Service at your own discretion.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 8 */}
                <div id="section-8" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    8. Advertisements
                  </h2>
                  <p className="text-text-secondary">
                    Free-tier users may see advertisements through Google AdSense. These advertisements 
                    are served by Google and are subject to Google's advertising policies. You may opt out 
                    of personalized advertising through Google's Ad Settings or by upgrading to a paid subscription.
                  </p>
                </div>

                {/* Section 9 */}
                <div id="section-9" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    9. Disclaimers
                  </h2>
                  <p className="text-text-secondary mb-4">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                    EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p className="text-text-secondary">
                    We do not warrant that the Service will be uninterrupted, error-free, or completely 
                    secure. We are not responsible for any damage or loss resulting from your use of the Service.
                  </p>
                </div>

                {/* Section 10 */}
                <div id="section-10" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    10. Limitation of Liability
                  </h2>
                  <p className="text-text-secondary mb-4">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, OTAGON SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
                    REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, 
                    OR OTHER INTANGIBLE LOSSES.
                  </p>
                  <p className="text-text-secondary">
                    Our total liability for any claims under these Terms shall not exceed the amount you 
                    paid us in the twelve (12) months preceding the claim.
                  </p>
                </div>

                {/* Section 11 */}
                <div id="section-11" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    11. Indemnification
                  </h2>
                  <p className="text-text-secondary">
                    You agree to indemnify, defend, and hold harmless Otagon and its officers, directors, 
                    employees, and agents from any claims, damages, losses, liabilities, and expenses 
                    (including legal fees) arising from your use of the Service or violation of these Terms.
                  </p>
                </div>

                {/* Section 12 */}
                <div id="section-12" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    12. Modifications
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">12.1 Service Modifications</h3>
                      <p className="text-text-secondary">
                        We reserve the right to modify, suspend, or discontinue any aspect of the Service at 
                        any time without prior notice. We will not be liable for any modification, suspension, 
                        or discontinuance of the Service.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">12.2 Terms Modifications</h3>
                      <p className="text-text-secondary">
                        We may update these Terms from time to time. We will notify you of material changes by 
                        posting the updated Terms on our website. Your continued use of the Service after changes 
                        constitutes acceptance of the modified Terms.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 13 */}
                <div id="section-13" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    13. Governing Law and Disputes
                  </h2>
                  <p className="text-text-secondary mb-4">
                    These Terms shall be governed by and construed in accordance with the laws of India, 
                    without regard to its conflict of law provisions.
                  </p>
                  <p className="text-text-secondary">
                    Any disputes arising from these Terms or your use of the Service shall be subject to 
                    the exclusive jurisdiction of the courts located in Hyderabad, Telangana, India.
                  </p>
                </div>

                {/* Section 14 */}
                <div id="section-14" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    14. Severability
                  </h2>
                  <p className="text-text-secondary">
                    If any provision of these Terms is held to be unenforceable or invalid, such provision 
                    will be modified to the minimum extent necessary to make it enforceable, and the remaining 
                    provisions will continue in full force and effect.
                  </p>
                </div>

                {/* Section 15 */}
                <div id="section-15" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    15. Entire Agreement
                  </h2>
                  <p className="text-text-secondary">
                    These Terms, together with our{' '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    {' '}and{' '}
                    <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link>
                    , constitute the entire agreement between you and Otagon regarding the Service and supersede any prior agreements.
                  </p>
                </div>

                {/* Section 16 */}
                <div id="section-16" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    16. Contact Us
                  </h2>
                  <p className="text-text-secondary mb-6">
                    If you have any questions about these Terms, please contact us:
                  </p>
                  <div className="bg-gradient-to-r from-[#2E2E2E]/60 to-[#1A1A1A]/60 backdrop-blur-xl border border-neutral-700/60 rounded-xl p-6 space-y-3">
                    <p className="text-text-primary"><strong>Otagon</strong></p>
                    <p className="text-text-secondary">Hyderabad, Telangana, India</p>
                    <p className="text-text-secondary">
                      Email: <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>
                    </p>
                    <p className="text-text-secondary">
                      Website: <a href="https://otagon.app" className="text-primary hover:underline">https://otagon.app</a>
                    </p>
                  </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-neutral-800 pt-8 mt-12">
                  <p className="text-sm text-text-muted text-center">
                    © {new Date().getFullYear()} Otagon. All rights reserved.
                  </p>
                </div>
              </div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <div className="bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent border border-neutral-800 rounded-2xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Ready to Get Started?</h2>
                  <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                    Join thousands of gamers using Otagon. Try it free today.
                  </p>
                  <Link to="/earlyaccess">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                    >
                      <span>Try Otagon Free</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </SEOPageLayout>
  );
};
