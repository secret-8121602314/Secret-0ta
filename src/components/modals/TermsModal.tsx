import React from 'react';
import Modal from '../ui/Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" maxWidth="2xl">
      <div className="space-y-6 text-text-secondary">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Acceptance of Terms</h3>
          <p>
            By accessing and using Otagon, you accept and agree to be bound by the terms and 
            provision of this agreement. If you do not agree to abide by the above, please 
            do not use this service.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Use License</h3>
          <p>
            Permission is granted to temporarily download one copy of Otagon for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a 
            transfer of title, and under this license you may not modify or copy the materials.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">User Responsibilities</h3>
          <p>
            Users are responsible for maintaining the confidentiality of their account and 
            password. Users agree to accept responsibility for all activities that occur 
            under their account or password.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Prohibited Uses</h3>
          <p>
            You may not use our service for any unlawful purpose or to solicit others to 
            perform unlawful acts. You may not violate any international, federal, provincial, 
            or state regulations, rules, laws, or local ordinances.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Service Availability</h3>
          <p>
            We reserve the right to withdraw or amend our service without notice. We will not 
            be liable if for any reason all or any part of the service is unavailable at any 
            time or for any period.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Contact Information</h3>
          <p>
            If you have any questions about these Terms of Service, please contact us through 
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

export default TermsModal;
