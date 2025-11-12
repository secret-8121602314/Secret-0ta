import React from 'react';
import Modal from '../ui/Modal';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" maxWidth="2xl">
      <div className="space-y-6 text-text-secondary">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Information We Collect</h3>
          <p>
            We collect information you provide directly to us, such as when you create an account, 
            use our services, or contact us for support. This may include your email address, 
            game screenshots, and conversation data.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">How We Use Your Information</h3>
          <p>
            We use the information we collect to provide, maintain, and improve our services, 
            process transactions, send you technical notices and support messages, and respond 
            to your comments and questions.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Data Storage and Security</h3>
          <p>
            We implement appropriate security measures to protect your personal information. 
            Your data is stored securely and is not shared with third parties without your consent.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Your Rights</h3>
          <p>
            You have the right to access, update, or delete your personal information. 
            You can also opt out of certain communications from us.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us through 
            our support channels.
          </p>
        </div>

        <div className="text-sm text-text-muted">
          <p>Last updated: January 2025</p>
        </div>
      </div>
    </Modal>
  );
};

export default PrivacyModal;
