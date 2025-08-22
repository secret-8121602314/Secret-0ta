import React from 'react';
import Modal from './Modal';
import PrivacyPolicyPage from './PrivacyPolicyPage';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy">
      <div className="text-[#CFCFCF] leading-relaxed">
        <PrivacyPolicyPage />
      </div>
    </Modal>
  );
};

export default PrivacyPolicyModal;
