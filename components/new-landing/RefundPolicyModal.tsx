import React from 'react';
import Modal from './Modal';
import RefundPolicyPage from './RefundPolicyPage';

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RefundPolicyModal: React.FC<RefundPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Refund Policy">
      <div className="text-[#CFCFCF] leading-relaxed">
        <RefundPolicyPage />
      </div>
    </Modal>
  );
};

export default RefundPolicyModal;
