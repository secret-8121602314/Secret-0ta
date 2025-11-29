import React from 'react';
import Modal from '../ui/Modal';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" maxWidth="2xl">
      <div className="space-y-6 text-text-secondary max-h-[70vh] overflow-y-auto pr-2">
        {/* Introduction */}
        <div>
          <p className="text-sm text-text-muted mb-4">Last Updated: November 2025</p>
          <p className="leading-relaxed">
            Welcome to Otagon. This Privacy Policy explains how Otagon ("we," "us," or "our"), 
            a technology startup based in Hyderabad, Telangana, India, collects, uses, discloses, 
            and safeguards your information when you use our AI-powered gaming assistant service 
            (the "Service"). Please read this privacy policy carefully. By using the Service, you 
            consent to the practices described in this policy.
          </p>
        </div>

        {/* Information We Collect */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">1. Information We Collect</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">1.1 Personal Information</h4>
          <p className="mb-3">We may collect the following personal information:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
            <li>Email address (for account creation and communication)</li>
            <li>Display name or username</li>
            <li>Profile information you choose to provide</li>
            <li>Payment information (processed securely through third-party payment processors)</li>
          </ul>

          <h4 className="text-base font-medium text-text-primary mb-2">1.2 Usage Data</h4>
          <p className="mb-3">We automatically collect certain information when you use our Service:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
            <li>Device information (browser type, operating system)</li>
            <li>IP address and approximate location</li>
            <li>Usage patterns and feature interactions</li>
            <li>Session duration and frequency</li>
          </ul>

          <h4 className="text-base font-medium text-text-primary mb-2">1.3 Game-Related Data</h4>
          <p className="mb-3">To provide our gaming assistance service, we collect:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Screenshots you upload or capture through our PC companion app</li>
            <li>Conversation history with our AI assistant</li>
            <li>Game titles and progress information you share</li>
          </ul>
        </div>

        {/* How We Use Your Information */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">2. How We Use Your Information</h3>
          <p className="mb-3">We use the collected information for the following purposes:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
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

        {/* Third-Party Services */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">3. Third-Party Services</h3>
          <p className="mb-3">We use the following third-party services:</p>
          
          <h4 className="text-base font-medium text-text-primary mb-2">3.1 Google Gemini API</h4>
          <p className="mb-3">
            We use Google's Gemini API to analyze game screenshots and provide AI-powered assistance. 
            Your screenshots and queries are processed by Google's AI systems in accordance with 
            Google's Privacy Policy and Terms of Service. We do not use your data to train AI models.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">3.2 Google AdSense</h4>
          <p className="mb-3">
            For free-tier users, we display advertisements through Google AdSense. Google may use 
            cookies and similar technologies to serve ads based on your prior visits to our website 
            and other websites. You can opt out of personalized advertising by visiting Google's Ad Settings.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">3.3 Payment Processors</h4>
          <p className="mb-3">
            We use secure third-party payment processors to handle subscription payments. We do not 
            store your complete credit card information on our servers. Payment processing is conducted 
            in compliance with PCI-DSS standards.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">3.4 Supabase</h4>
          <p className="mb-3">
            We use Supabase for authentication, database, and storage services. Your data is stored 
            securely in compliance with industry-standard security practices.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">3.5 Analytics</h4>
          <p>
            We may use analytics services to understand how users interact with our Service to 
            improve user experience and service quality.
          </p>
        </div>

        {/* Data Storage and Security */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">4. Data Storage and Security</h3>
          <p className="mb-3">
            We implement industry-standard security measures to protect your personal information:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
            <li>Encryption of data in transit using TLS/SSL</li>
            <li>Encryption of sensitive data at rest</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Secure cloud infrastructure with reputable providers</li>
          </ul>
          <p>
            While we strive to protect your information, no method of transmission over the Internet 
            or electronic storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </div>

        {/* Data Retention */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">5. Data Retention</h3>
          <p className="mb-3">We retain your data as follows:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period thereafter</li>
            <li><strong>Conversation History:</strong> Retained to provide continuity in your gaming assistance</li>
            <li><strong>Screenshots:</strong> Processed and retained as part of your conversation history</li>
            <li><strong>Payment Records:</strong> Retained as required by applicable tax and financial regulations</li>
          </ul>
          <p className="mt-3">
            You may request deletion of your data by contacting us at support@otagon.app.
          </p>
        </div>

        {/* Your Rights */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">6. Your Rights</h3>
          <p className="mb-3">Depending on your location, you may have the following rights:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Access:</strong> Request access to the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
          </p>
        </div>

        {/* Cookies and Tracking */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">7. Cookies and Tracking Technologies</h3>
          <p className="mb-3">We use cookies and similar technologies to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Maintain your session and authentication state</li>
            <li>Remember your preferences and settings</li>
            <li>Analyze usage patterns to improve our Service</li>
            <li>Serve relevant advertisements (for free-tier users)</li>
          </ul>
          <p className="mt-3">
            You can control cookie preferences through your browser settings. However, disabling 
            certain cookies may affect the functionality of our Service.
          </p>
        </div>

        {/* Children's Privacy */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">8. Children's Privacy</h3>
          <p>
            Our Service is not intended for children under the age of 13 (or the applicable age of 
            digital consent in your jurisdiction). We do not knowingly collect personal information 
            from children. If you believe a child has provided us with personal information, please 
            contact us immediately at{' '}
            <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
          </p>
        </div>

        {/* International Data Transfers */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">9. International Data Transfers</h3>
          <p>
            Your information may be transferred to and processed in countries other than your country 
            of residence. These countries may have different data protection laws. By using our Service, 
            you consent to such transfers. We ensure appropriate safeguards are in place for international 
            data transfers in compliance with applicable laws.
          </p>
        </div>

        {/* Changes to Privacy Policy */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">10. Changes to This Privacy Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. 
            Your continued use of the Service after changes constitutes acceptance of the updated policy.
          </p>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">11. Contact Us</h3>
          <p className="mb-3">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4 space-y-2">
            <p><strong>Otagon</strong></p>
            <p>Hyderabad, Telangana, India</p>
            <p>Email: <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a></p>
            <p>Website: <a href="https://otagon.app" className="text-primary hover:underline">https://otagon.app</a></p>
          </div>
        </div>

        {/* Legal Compliance */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">12. Legal Compliance</h3>
          <p>
            This Privacy Policy is designed to comply with applicable data protection laws including, 
            but not limited to, the Information Technology Act, 2000 (India), the Information Technology 
            (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) 
            Rules, 2011, and general data protection principles recognized internationally.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-800 pt-4">
          <p className="text-sm text-text-muted text-center">
            © {new Date().getFullYear()} Otagon. All rights reserved.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PrivacyModal;
