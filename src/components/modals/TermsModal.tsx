import React from 'react';
import Modal from '../ui/Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" maxWidth="2xl">
      <div className="space-y-6 text-text-secondary max-h-[70vh] overflow-y-auto pr-2">
        {/* Introduction */}
        <div>
          <p className="text-sm text-text-muted mb-4">Last Updated: November 2025</p>
          <p className="leading-relaxed">
            Welcome to Otagon. These Terms of Service ("Terms") govern your access to and use of 
            the Otagon AI-powered gaming assistant service (the "Service") provided by Otagon, 
            a technology startup based in Hyderabad, Telangana, India ("we," "us," or "our"). 
            Please read these Terms carefully before using our Service.
          </p>
        </div>

        {/* Acceptance of Terms */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">1. Acceptance of Terms</h3>
          <p className="mb-3">
            By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. 
            If you disagree with any part of these Terms, you may not access or use our Service.
          </p>
          <p>
            You must be at least 13 years old (or the age of digital consent in your jurisdiction) to use 
            this Service. By using our Service, you represent that you meet this age requirement.
          </p>
        </div>

        {/* Description of Service */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">2. Description of Service</h3>
          <p className="mb-3">
            Otagon is an AI-powered gaming assistant that provides spoiler-free hints and assistance 
            to gamers. The Service includes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Screenshot analysis and game context recognition</li>
            <li>AI-powered gaming assistance powered by Google Gemini API</li>
            <li>PC companion application for screen capture</li>
            <li>Conversation history and game progress tracking</li>
            <li>Subscription-based premium features</li>
          </ul>
        </div>

        {/* User Accounts */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">3. User Accounts</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">3.1 Account Registration</h4>
          <p className="mb-3">
            To access certain features, you must create an account. You agree to provide accurate, 
            current, and complete information during registration and to update such information to 
            keep it accurate, current, and complete.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">3.2 Account Security</h4>
          <p className="mb-3">
            You are responsible for maintaining the confidentiality of your account credentials and 
            for all activities that occur under your account. You agree to notify us immediately of 
            any unauthorized use of your account.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">3.3 Account Termination</h4>
          <p>
            We reserve the right to suspend or terminate your account at any time for violation of 
            these Terms or for any other reason at our sole discretion.
          </p>
        </div>

        {/* Subscription and Payments */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">4. Subscription and Payments</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">4.1 Subscription Tiers</h4>
          <p className="mb-3">
            We offer different subscription tiers (Free, Pro, Pro Vanguard) with varying features 
            and limitations. Features and pricing may change from time to time.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">4.2 Payment Terms</h4>
          <p className="mb-3">
            Paid subscriptions are billed in advance on a monthly or yearly basis. Payments are 
            processed through secure third-party payment processors. By subscribing, you authorize 
            us to charge your payment method for the subscription fee.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">4.3 Automatic Renewal</h4>
          <p className="mb-3">
            Subscriptions automatically renew unless cancelled before the renewal date. You may 
            cancel your subscription at any time through your account settings.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">4.4 Refunds</h4>
          <p>
            Please refer to our separate Refund Policy for information about refunds and cancellations.
          </p>
        </div>

        {/* Acceptable Use */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">5. Acceptable Use Policy</h3>
          <p className="mb-3">You agree not to use our Service to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
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

        {/* Intellectual Property */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">6. Intellectual Property</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">6.1 Our Intellectual Property</h4>
          <p className="mb-3">
            The Service, including its original content, features, functionality, and design, is 
            owned by Otagon and is protected by international copyright, trademark, patent, trade 
            secret, and other intellectual property laws.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">6.2 Your Content</h4>
          <p className="mb-3">
            You retain ownership of content you upload (such as screenshots). By uploading content, 
            you grant us a limited license to use, process, and store such content solely for the 
            purpose of providing the Service.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">6.3 Third-Party Content</h4>
          <p>
            Game content, screenshots, and related materials are the property of their respective 
            owners. Otagon does not claim ownership of third-party game content.
          </p>
        </div>

        {/* AI-Powered Features */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">7. AI-Powered Features</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">7.1 Google Gemini API</h4>
          <p className="mb-3">
            Our Service uses Google's Gemini API to power AI features. By using the Service, you 
            acknowledge that your content may be processed by Google's systems in accordance with 
            Google's terms of service and privacy policy.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">7.2 AI Limitations</h4>
          <p className="mb-3">
            AI-generated responses are provided for informational and entertainment purposes only. 
            The AI may occasionally provide inaccurate or incomplete information. We do not guarantee 
            the accuracy, completeness, or reliability of AI-generated content.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">7.3 No Spoiler Guarantee</h4>
          <p>
            While we strive to provide spoiler-free assistance, we cannot guarantee that all AI 
            responses will be completely spoiler-free. Use the Service at your own discretion.
          </p>
        </div>

        {/* Advertisements */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">8. Advertisements</h3>
          <p>
            Free-tier users may see advertisements through Google AdSense. These advertisements 
            are served by Google and are subject to Google's advertising policies. You may opt out 
            of personalized advertising through Google's Ad Settings or by upgrading to a paid subscription.
          </p>
        </div>

        {/* Disclaimers */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">9. Disclaimers</h3>
          <p className="mb-3">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, error-free, or completely 
            secure. We are not responsible for any damage or loss resulting from your use of the Service.
          </p>
        </div>

        {/* Limitation of Liability */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">10. Limitation of Liability</h3>
          <p className="mb-3">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OTAGON SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
            REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, 
            OR OTHER INTANGIBLE LOSSES.
          </p>
          <p>
            Our total liability for any claims under these Terms shall not exceed the amount you 
            paid us in the twelve (12) months preceding the claim.
          </p>
        </div>

        {/* Indemnification */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">11. Indemnification</h3>
          <p>
            You agree to indemnify, defend, and hold harmless Otagon and its officers, directors, 
            employees, and agents from any claims, damages, losses, liabilities, and expenses 
            (including legal fees) arising from your use of the Service or violation of these Terms.
          </p>
        </div>

        {/* Modifications to Service and Terms */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">12. Modifications</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">12.1 Service Modifications</h4>
          <p className="mb-3">
            We reserve the right to modify, suspend, or discontinue any aspect of the Service at 
            any time without prior notice. We will not be liable for any modification, suspension, 
            or discontinuance of the Service.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">12.2 Terms Modifications</h4>
          <p>
            We may update these Terms from time to time. We will notify you of material changes by 
            posting the updated Terms on our website. Your continued use of the Service after changes 
            constitutes acceptance of the modified Terms.
          </p>
        </div>

        {/* Governing Law */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">13. Governing Law and Disputes</h3>
          <p className="mb-3">
            These Terms shall be governed by and construed in accordance with the laws of India, 
            without regard to its conflict of law provisions.
          </p>
          <p>
            Any disputes arising from these Terms or your use of the Service shall be subject to 
            the exclusive jurisdiction of the courts located in Hyderabad, Telangana, India.
          </p>
        </div>

        {/* Severability */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">14. Severability</h3>
          <p>
            If any provision of these Terms is held to be unenforceable or invalid, such provision 
            will be modified to the minimum extent necessary to make it enforceable, and the remaining 
            provisions will continue in full force and effect.
          </p>
        </div>

        {/* Entire Agreement */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">15. Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy and Refund Policy, constitute the entire 
            agreement between you and Otagon regarding the Service and supersede any prior agreements.
          </p>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">16. Contact Us</h3>
          <p className="mb-3">
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4 space-y-2">
            <p><strong>Otagon</strong></p>
            <p>Hyderabad, Telangana, India</p>
            <p>Email: <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a></p>
            <p>Website: <a href="https://otagon.app" className="text-primary hover:underline">https://otagon.app</a></p>
          </div>
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

export default TermsModal;
