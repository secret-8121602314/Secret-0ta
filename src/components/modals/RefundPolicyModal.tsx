import React from 'react';
import Modal from '../ui/Modal';

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RefundPolicyModal: React.FC<RefundPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Refund Policy">
      <div className="max-h-96 overflow-y-auto">
        <p className="text-neutral-400 mb-4 text-base">Last Updated: August 15, 2025</p>

        <p className="text-neutral-300 mb-6">
          At Otagon, we want you to be completely satisfied with your gaming companion experience. This Refund Policy outlines our approach to refunds and cancellations for our subscription services.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Subscription Cancellation</h2>
        <p className="text-neutral-300 mb-4">
          You can cancel your Otagon Pro or Pro Vanguard subscription at any time. Your subscription will remain active until the end of your current billing period (monthly or yearly), and you will not be charged again. You can manage your subscription through your account settings.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Refund Eligibility</h2>
        <p className="text-neutral-300 mb-4">Otagon subscriptions are non-refundable.</p>
        <p className="text-neutral-300 mb-4">
          When you purchase a subscription, you are charged for the entire billing period (one month or one year) at the beginning of that period. Once a charge has been processed, we are unable to provide any full or partial refunds, even if you cancel your subscription before the end of the billing period.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Free Tier</h2>
        <p className="text-neutral-300 mb-4">
          Our Free tier provides access to basic Otagon features without any charges. There are no refunds applicable to the Free tier as it is provided at no cost.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Technical Issues</h2>
        <p className="text-neutral-300 mb-4">
          If you experience technical issues that prevent you from using Otagon as intended, please contact our support team immediately. We will work to resolve any technical problems promptly. However, technical issues do not automatically qualify for refunds.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Our Commitment</h2>
        <p className="text-neutral-300 mb-4">
          We believe in the value Otagon provides and encourage users to make the most of our Free tier to decide if a Pro subscription is right for them. This policy allows us, a small team based in Hyderabad, India, to manage our resources effectively and continue building the best possible spoiler-free gaming companion for our global community.
        </p>

        <h2 className="text-2xl font-bold text-white mt-8 mb-4">Contact Us</h2>
        <p className="text-neutral-300 mb-4">
          If you have any questions about this policy, please contact us at <a href="mailto:support@otagon.app" className="text-[#FFAB40] hover:underline">support@otagon.app</a>.
        </p>
      </div>
    </Modal>
  );
};

export default RefundPolicyModal;
