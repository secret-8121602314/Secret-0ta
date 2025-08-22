import React from 'react';
import Modal from './Modal';
import AboutPage from './AboutPage';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Otakon">
      <div className="text-[#CFCFCF] leading-relaxed">
        <AboutPage />
      </div>
    </Modal>
  );
};

export default AboutModal;
