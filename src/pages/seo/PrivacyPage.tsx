import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { SEOPageLayout } from '../../components/layout/SEOPageLayout';

const tableOfContents = [
  { id: 'section-1', title: '1. Information We Collect' },
  { id: 'section-2', title: '2. How We Use Your Information' },
  { id: 'section-3', title: '3. Third-Party Services' },
  { id: 'section-4', title: '4. Data Storage and Security' },
  { id: 'section-5', title: '5. Data Retention' },
  { id: 'section-6', title: '6. Your Rights' },
  { id: 'section-7', title: '7. Cookies and Tracking' },
  { id: 'section-8', title: '8. Children\'s Privacy' },
  { id: 'section-9', title: '9. International Data Transfers' },
  { id: 'section-10', title: '10. Changes to This Policy' },
  { id: 'section-11', title: '11. Contact Us' },
  { id: 'section-12', title: '12. Legal Compliance' },
];

export const PrivacyPage = () => {
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
      title="Privacy Policy"
      description="Read Otagon's Privacy Policy to understand how we collect, use, and protect your data. Learn about our commitment to data security and user privacy."
      keywords="privacy policy, data protection, user privacy, data security, GDPR compliance, data rights"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
              Privacy Policy
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-4">
              Your privacy matters to us. Learn how we protect your data.
            </p>
            <p className="text-sm text-text-muted">
              Last Updated: November 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
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
                  <nav className="space-y-2">
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
                    Welcome to Otagon. This Privacy Policy explains how Otagon ("we," "us," or "our"), 
                    a technology startup based in Hyderabad, Telangana, India, collects, uses, discloses, 
                    and safeguards your information when you use our AI-powered gaming assistant service 
                    (the "Service"). Please read this privacy policy carefully. By using the Service, you 
                    consent to the practices described in this policy.
                  </p>
                </div>

                {/* Section 1 */}
                <div id="section-1" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    1. Information We Collect
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">1.1 Personal Information</h3>
                      <p className="text-text-secondary mb-3">We may collect the following personal information:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                        <li>Email address (for account creation and communication)</li>
                        <li>Display name or username</li>
                        <li>Profile information you choose to provide</li>
                        <li>Payment information (processed securely through third-party payment processors)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">1.2 Usage Data</h3>
                      <p className="text-text-secondary mb-3">We automatically collect certain information when you use our Service:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                        <li>Device information (browser type, operating system)</li>
                        <li>IP address and approximate location</li>
                        <li>Usage patterns and feature interactions</li>
                        <li>Session duration and frequency</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">1.3 Game-Related Data</h3>
                      <p className="text-text-secondary mb-3">To provide our gaming assistance service, we collect:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                        <li>Screenshots you upload or capture through our PC companion app</li>
                        <li>Conversation history with our AI assistant</li>
                        <li>Game titles and progress information you share</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div id="section-2" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    2. How We Use Your Information
                  </h2>
                  <p className="text-text-secondary mb-4">We use the collected information for the following purposes:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                    <li>To provide, operate, and maintain our Service</li>
                    <li>To process your transactions and manage your subscription</li>
                    <li>To analyze screenshots and provide AI-powered gaming assistance using Google Gemini API</li>
                    <li>To improve and personalize your experience</li>
                    <li>To communicate with you regarding updates, support, and promotional offers</li>
                    <li>To detect and prevent fraud, abuse, and security issues</li>
                    <li>To comply with legal obligations</li>
                    <li>To display relevant advertisements to free-tier users (via Google AdSense)</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div id="section-3" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    3. Third-Party Services
                  </h2>
                  
                  <div className="space-y-6">
                    <p className="text-text-secondary">We use the following third-party services:</p>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.1 Google Gemini API</h3>
                      <p className="text-text-secondary">
                        We use Google's Gemini API to analyze game screenshots and provide AI-powered assistance. 
                        Your screenshots and queries are processed by Google's AI systems in accordance with 
                        Google's Privacy Policy and Terms of Service. We do not use your data to train AI models.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.2 Google AdSense</h3>
                      <p className="text-text-secondary">
                        For free-tier users, we display advertisements through Google AdSense. Google may use 
                        cookies and similar technologies to serve ads based on your prior visits to our website 
                        and other websites. You can opt out of personalized advertising by visiting Google's Ad Settings.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.3 Payment Processors</h3>
                      <p className="text-text-secondary">
                        We use secure third-party payment processors to handle subscription payments. We do not 
                        store your complete credit card information on our servers. Payment processing is conducted 
                        in compliance with PCI-DSS standards.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.4 Supabase</h3>
                      <p className="text-text-secondary">
                        We use Supabase for authentication, database, and storage services. Your data is stored 
                        securely in compliance with industry-standard security practices.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.5 Analytics</h3>
                      <p className="text-text-secondary">
                        We may use analytics services to understand how users interact with our Service to 
                        improve user experience and service quality.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div id="section-4" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    4. Data Storage and Security
                  </h2>
                  <p className="text-text-secondary mb-4">
                    We implement industry-standard security measures to protect your personal information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mb-4 text-text-secondary">
                    <li>Encryption of data in transit using TLS/SSL</li>
                    <li>Encryption of sensitive data at rest</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Secure cloud infrastructure with reputable providers</li>
                  </ul>
                  <p className="text-text-secondary">
                    While we strive to protect your information, no method of transmission over the Internet 
                    or electronic storage is 100% secure. We cannot guarantee absolute security.
                  </p>
                </div>

                {/* Section 5 */}
                <div id="section-5" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    5. Data Retention
                  </h2>
                  <p className="text-text-secondary mb-4">We retain your data as follows:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mb-4 text-text-secondary">
                    <li><strong className="text-text-primary">Account Data:</strong> Retained while your account is active and for a reasonable period thereafter</li>
                    <li><strong className="text-text-primary">Conversation History:</strong> Retained to provide continuity in your gaming assistance</li>
                    <li><strong className="text-text-primary">Screenshots:</strong> Processed and retained as part of your conversation history</li>
                    <li><strong className="text-text-primary">Payment Records:</strong> Retained as required by applicable tax and financial regulations</li>
                  </ul>
                  <p className="text-text-secondary">
                    You may request deletion of your data by contacting us at{' '}
                    <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
                  </p>
                </div>

                {/* Section 6 */}
                <div id="section-6" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    6. Your Rights
                  </h2>
                  <p className="text-text-secondary mb-4">Depending on your location, you may have the following rights:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mb-4 text-text-secondary">
                    <li><strong className="text-text-primary">Access:</strong> Request access to the personal data we hold about you</li>
                    <li><strong className="text-text-primary">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                    <li><strong className="text-text-primary">Deletion:</strong> Request deletion of your personal data</li>
                    <li><strong className="text-text-primary">Portability:</strong> Request a copy of your data in a portable format</li>
                    <li><strong className="text-text-primary">Opt-out:</strong> Opt out of marketing communications</li>
                    <li><strong className="text-text-primary">Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
                  </ul>
                  <p className="text-text-secondary">
                    To exercise these rights, please contact us at{' '}
                    <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
                  </p>
                </div>

                {/* Section 7 */}
                <div id="section-7" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    7. Cookies and Tracking Technologies
                  </h2>
                  <p className="text-text-secondary mb-4">We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mb-4 text-text-secondary">
                    <li>Maintain your session and authentication state</li>
                    <li>Remember your preferences and settings</li>
                    <li>Analyze usage patterns to improve our Service</li>
                    <li>Serve relevant advertisements (for free-tier users)</li>
                  </ul>
                  <p className="text-text-secondary">
                    You can control cookie preferences through your browser settings. However, disabling 
                    certain cookies may affect the functionality of our Service.
                  </p>
                </div>

                {/* Section 8 */}
                <div id="section-8" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    8. Children's Privacy
                  </h2>
                  <p className="text-text-secondary">
                    Our Service is not intended for children under the age of 13 (or the applicable age of 
                    digital consent in your jurisdiction). We do not knowingly collect personal information 
                    from children. If you believe a child has provided us with personal information, please 
                    contact us immediately at{' '}
                    <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
                  </p>
                </div>

                {/* Section 9 */}
                <div id="section-9" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    9. International Data Transfers
                  </h2>
                  <p className="text-text-secondary">
                    Your information may be transferred to and processed in countries other than your country 
                    of residence. These countries may have different data protection laws. By using our Service, 
                    you consent to such transfers. We ensure appropriate safeguards are in place for international 
                    data transfers in compliance with applicable laws.
                  </p>
                </div>

                {/* Section 10 */}
                <div id="section-10" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    10. Changes to This Privacy Policy
                  </h2>
                  <p className="text-text-secondary">
                    We may update this Privacy Policy from time to time. We will notify you of any material 
                    changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. 
                    Your continued use of the Service after changes constitutes acceptance of the updated policy.
                  </p>
                </div>

                {/* Section 11 */}
                <div id="section-11" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    11. Contact Us
                  </h2>
                  <p className="text-text-secondary mb-6">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
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

                {/* Section 12 */}
                <div id="section-12" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    12. Legal Compliance
                  </h2>
                  <p className="text-text-secondary">
                    This Privacy Policy is designed to comply with applicable data protection laws including, 
                    but not limited to, the Information Technology Act, 2000 (India), the Information Technology 
                    (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) 
                    Rules, 2011, and general data protection principles recognized internationally.
                  </p>
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
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Questions About Your Privacy?</h2>
                  <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                    We're here to help. Contact our team for any privacy-related questions or concerns.
                  </p>
                  <Link to="/contact">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                    >
                      <span>Contact Us</span>
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
