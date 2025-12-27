import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { SEOPageLayout } from '../../components/layout/SEOPageLayout';
import { toastService } from '../../services/toastService';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const faqs = [
  {
    question: 'How quickly can I expect a response?',
    answer: 'We aim to respond to all inquiries within 24-48 hours during business days. For urgent technical issues, premium subscribers receive priority support.'
  },
  {
    question: 'What information should I include in my support request?',
    answer: 'Please include your registered email, a detailed description of the issue, any error messages, screenshots if applicable, and steps to reproduce the problem.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Please review our Refund Policy for detailed information about subscription refunds and cancellations. Generally, subscriptions are non-refundable except in specific circumstances.'
  },
  {
    question: 'How can I report a bug or suggest a feature?',
    answer: 'You can report bugs or suggest features through our contact form, or by emailing support@otagon.app. We value your feedback and actively consider user suggestions for future updates.'
  },
  {
    question: 'Is my data secure when I contact you?',
    answer: 'Yes, all communications are handled securely. We never share your information with third parties without your consent. Please review our Privacy Policy for more details.'
  }
];

export const ContactPage = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate submission - In production, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitStatus('success');
      toastService.success('Message sent successfully! We\'ll get back to you soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      // Reset success status after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Contact form error:', error);
      toastService.error('Failed to send message. Please try again or email us directly.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.subject.trim() && formData.message.trim();

  return (
    <SEOPageLayout
      title="Contact Us"
      description="Get in touch with the Otagon team. We're here to help with questions, technical support, feedback, and partnership inquiries."
      keywords="contact otagon, customer support, gaming assistant support, technical help, contact form"
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
              Contact Us
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Form - Takes 2 columns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-2xl p-8 md:p-10">
                <h2 className="text-3xl font-bold text-text-primary mb-2">Send Us a Message</h2>
                <p className="text-text-secondary mb-8">
                  Fill out the form below and our team will get back to you within 24-48 hours.
                </p>

                {submitStatus === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-3">Message Sent!</h3>
                    <p className="text-text-secondary mb-6">
                      Thank you for contacting us. We'll get back to you soon!
                    </p>
                    <button
                      onClick={() => setSubmitStatus('idle')}
                      className="text-primary hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-text-primary mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-[#2E2E2E] border border-[#424242] rounded-lg text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-[#2E2E2E] border border-[#424242] rounded-lg text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-text-primary mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-[#2E2E2E] border border-[#424242] rounded-lg text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder="What is this about?"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-text-primary mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 bg-[#2E2E2E] border border-[#424242] rounded-lg text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm"
                      >
                        An error occurred while sending your message. Please try again or email us directly at{' '}
                        <a href="mailto:support@otagon.app" className="underline">support@otagon.app</a>.
                      </motion.div>
                    )}

                    <div className="flex items-center justify-end pt-4">
                      <motion.button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        whileHover={{ scale: isFormValid && !isSubmitting ? 1.02 : 1 }}
                        whileTap={{ scale: isFormValid && !isSubmitting ? 0.98 : 1 }}
                        className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Sending...</span>
                          </div>
                        ) : (
                          'Send Message'
                        )}
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Contact Information Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Contact Details */}
              <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-6">Get In Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted mb-1">Email</p>
                      <a href="mailto:support@otagon.app" className="text-text-primary hover:text-primary transition-colors">
                        support@otagon.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted mb-1">Phone</p>
                      <a href="tel:+918121602314" className="text-text-primary hover:text-secondary transition-colors">
                        +91 8121602314
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted mb-1">Location</p>
                      <p className="text-text-primary">Hyderabad, Telangana, India</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <a
                    href="https://twitter.com/otagonapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center p-3 bg-[#2E2E2E] hover:bg-[#3E3E3E] border border-neutral-800 rounded-lg transition-colors group"
                    aria-label="Twitter"
                  >
                    <svg className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="https://discord.gg/otagon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center p-3 bg-[#2E2E2E] hover:bg-[#3E3E3E] border border-neutral-800 rounded-lg transition-colors group"
                    aria-label="Discord"
                  >
                    <svg className="w-5 h-5 text-text-muted group-hover:text-secondary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <Link to="/privacy" className="block text-text-secondary hover:text-primary transition-colors">
                    Privacy Policy →
                  </Link>
                  <Link to="/terms" className="block text-text-secondary hover:text-primary transition-colors">
                    Terms of Service →
                  </Link>
                  <Link to="/refund" className="block text-text-secondary hover:text-primary transition-colors">
                    Refund Policy →
                  </Link>
                  <Link to="/about" className="block text-text-secondary hover:text-primary transition-colors">
                    About Us →
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Find quick answers to common questions. Can't find what you're looking for? Send us a message above.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-text-primary mb-3">{faq.question}</h3>
                  <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent border border-neutral-800 rounded-2xl p-10 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to Level Up Your Gaming?</h2>
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
