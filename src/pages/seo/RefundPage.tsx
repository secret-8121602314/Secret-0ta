import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { SEOPageLayout } from '../../components/layout/SEOPageLayout';

const tableOfContents = [
  { id: 'section-1', title: '1. Subscription Overview' },
  { id: 'section-2', title: '2. Subscription Cancellation' },
  { id: 'section-3', title: '3. Refund Policy' },
  { id: 'section-4', title: '4. How to Request a Refund' },
  { id: 'section-5', title: '5. Free Tier' },
  { id: 'section-6', title: '6. Trial Periods' },
  { id: 'section-7', title: '7. Technical Issues' },
  { id: 'section-8', title: '8. Payment Disputes' },
  { id: 'section-9', title: '9. Changes to Pricing' },
  { id: 'section-10', title: '10. Regional Considerations' },
  { id: 'section-11', title: '11. Our Commitment' },
  { id: 'section-12', title: '12. Contact Us' },
  { id: 'section-13', title: '13. Policy Updates' },
];

export const RefundPage = () => {
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
      title="Refund Policy"
      description="Understand Otagon's refund policy for subscription services. Learn about cancellations, refund eligibility, and how to request refunds."
      keywords="refund policy, subscription refund, cancellation policy, money back guarantee, refund request"
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
              Refund Policy
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-4">
              Transparent policies for subscriptions and refunds
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
                    This Refund Policy outlines the terms and conditions for refunds and cancellations 
                    for Otagon's subscription services. Otagon is a technology startup based in Hyderabad, 
                    Telangana, India. By subscribing to our services, you agree to the terms of this policy.
                  </p>
                </div>

                {/* Section 1 */}
                <div id="section-1" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    1. Subscription Overview
                  </h2>
                  <p className="text-text-secondary mb-4">Otagon offers the following subscription tiers:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                    <li><strong className="text-text-primary">Free Tier:</strong> Basic features with advertisements, no payment required</li>
                    <li><strong className="text-text-primary">Pro (Monthly/Yearly):</strong> Enhanced features and increased usage limits</li>
                    <li><strong className="text-text-primary">Pro Vanguard (Monthly/Yearly):</strong> Premium features with highest usage limits</li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div id="section-2" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    2. Subscription Cancellation
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">2.1 How to Cancel</h3>
                      <p className="text-text-secondary">
                        You may cancel your subscription at any time through your account settings or by 
                        contacting our support team at{' '}
                        <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">2.2 Effect of Cancellation</h3>
                      <p className="text-text-secondary mb-3">When you cancel your subscription:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                        <li>Your subscription will remain active until the end of your current billing period</li>
                        <li>You will not be charged for subsequent billing periods</li>
                        <li>After the billing period ends, your account will revert to the Free tier</li>
                        <li>Your conversation history and data will be retained</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 3 */}
                <div id="section-3" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    3. Refund Policy
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.1 General Policy</h3>
                      <p className="text-text-secondary mb-4">
                        <strong className="text-text-primary">Otagon subscriptions are generally non-refundable.</strong> When you purchase 
                        a subscription, you are charged for the entire billing period (monthly or yearly) at 
                        the beginning of that period. Once payment is processed, we are unable to provide 
                        full or partial refunds for unused portions of the subscription.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-3">3.2 Exceptions</h3>
                      <p className="text-text-secondary mb-3">
                        We may consider refund requests in the following exceptional circumstances:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4 mb-4 text-text-secondary">
                        <li><strong className="text-text-primary">Accidental Purchase:</strong> If you accidentally subscribed and request a 
                          refund within 48 hours without significant use of premium features</li>
                        <li><strong className="text-text-primary">Duplicate Charges:</strong> If you were charged multiple times for the same 
                          subscription period due to a technical error</li>
                        <li><strong className="text-text-primary">Service Unavailability:</strong> If the Service was substantially unavailable 
                          for an extended period during your billing cycle</li>
                        <li><strong className="text-text-primary">Unauthorized Transactions:</strong> If the subscription was purchased without 
                          your authorization (subject to verification)</li>
                      </ul>
                      <p className="text-text-secondary">
                        All refund requests are evaluated on a case-by-case basis at our sole discretion.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div id="section-4" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    4. How to Request a Refund
                  </h2>
                  <p className="text-text-secondary mb-4">To request a refund, please:</p>
                  <ol className="list-decimal list-inside space-y-3 ml-4 mb-4 text-text-secondary">
                    <li>Email us at <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a> with the subject line "Refund Request"</li>
                    <li>Include your registered email address and account details</li>
                    <li>Provide the date of the transaction and payment method used</li>
                    <li>Explain the reason for your refund request</li>
                    <li>Include any relevant screenshots or documentation</li>
                  </ol>
                  <p className="text-text-secondary">
                    We aim to respond to all refund requests within 5-7 business days. If approved, 
                    refunds will be processed to the original payment method within 7-14 business days.
                  </p>
                </div>

                {/* Section 5 */}
                <div id="section-5" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    5. Free Tier
                  </h2>
                  <p className="text-text-secondary">
                    The Free tier is provided at no cost and therefore no refunds are applicable. 
                    Free tier users have access to basic features with advertisements. We encourage 
                    users to fully explore the Free tier before committing to a paid subscription 
                    to ensure the Service meets their needs.
                  </p>
                </div>

                {/* Section 6 */}
                <div id="section-6" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    6. Trial Periods
                  </h2>
                  <p className="text-text-secondary">
                    If we offer trial periods for premium subscriptions, you will not be charged during 
                    the trial period. If you do not cancel before the trial ends, your payment method 
                    will be charged for the subscription. It is your responsibility to cancel before 
                    the trial period expires if you do not wish to continue.
                  </p>
                </div>

                {/* Section 7 */}
                <div id="section-7" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    7. Technical Issues
                  </h2>
                  <p className="text-text-secondary mb-4">
                    If you experience technical issues that prevent you from using the Service:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-text-secondary">
                    <li>Contact our support team immediately at{' '}
                      <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>
                    </li>
                    <li>We will work diligently to resolve technical problems</li>
                    <li>Technical issues do not automatically qualify for refunds</li>
                    <li>Extended service outages may be considered for pro-rated credits or refunds</li>
                  </ul>
                </div>

                {/* Section 8 */}
                <div id="section-8" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    8. Payment Disputes
                  </h2>
                  <p className="text-text-secondary mb-4">
                    Before initiating a payment dispute or chargeback with your bank or payment provider, 
                    we encourage you to contact us first. We are committed to resolving issues fairly 
                    and promptly.
                  </p>
                  <p className="text-text-secondary">
                    Please note that initiating a chargeback or payment dispute may result in the 
                    suspension or termination of your account pending resolution.
                  </p>
                </div>

                {/* Section 9 */}
                <div id="section-9" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    9. Changes to Pricing
                  </h2>
                  <p className="text-text-secondary">
                    We reserve the right to change subscription pricing at any time. Price changes 
                    will not affect existing subscriptions until the next renewal period. We will 
                    provide advance notice of any pricing changes.
                  </p>
                </div>

                {/* Section 10 */}
                <div id="section-10" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    10. Regional Considerations
                  </h2>
                  <p className="text-text-secondary">
                    Some jurisdictions may have consumer protection laws that provide additional refund 
                    rights. Where local laws require, we will comply with applicable refund requirements. 
                    If you believe you are entitled to a refund under local consumer protection laws, 
                    please contact us with details of your claim.
                  </p>
                </div>

                {/* Section 11 */}
                <div id="section-11" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    11. Our Commitment
                  </h2>
                  <p className="text-text-secondary">
                    We believe in the value Otagon provides and are committed to customer satisfaction. 
                    While our subscription policy is generally non-refundable, we encourage users to 
                    take advantage of the Free tier to evaluate our Service before subscribing. This 
                    policy allows us, as a startup team based in Hyderabad, India, to manage our resources 
                    effectively while continuing to build the best possible gaming companion for our 
                    global community.
                  </p>
                </div>

                {/* Section 12 */}
                <div id="section-12" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    12. Contact Us
                  </h2>
                  <p className="text-text-secondary mb-6">
                    If you have any questions about this Refund Policy, please contact us:
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

                {/* Section 13 */}
                <div id="section-13" className="scroll-mt-24">
                  <h2 className="text-3xl font-bold text-text-primary mb-6 pb-3 border-b border-neutral-800">
                    13. Policy Updates
                  </h2>
                  <p className="text-text-secondary">
                    We may update this Refund Policy from time to time. Changes will be posted on this 
                    page with an updated "Last Updated" date. Your continued use of the Service after 
                    changes constitutes acceptance of the updated policy.
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
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Try Otagon Risk-Free</h2>
                  <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                    Start with our Free tier - no credit card required. Upgrade anytime to unlock premium features.
                  </p>
                  <Link to="/earlyaccess">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                    >
                      <span>Start Free Today</span>
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
