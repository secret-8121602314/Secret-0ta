import React from 'react';
import Modal from '../ui/Modal';

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RefundPolicyModal: React.FC<RefundPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Refund Policy" maxWidth="2xl">
      <div className="space-y-6 text-text-secondary max-h-[70vh] overflow-y-auto pr-2">
        {/* Introduction */}
        <div>
          <p className="text-sm text-text-muted mb-4">Last Updated: November 2025</p>
          <p className="leading-relaxed">
            This Refund Policy outlines the terms and conditions for refunds and cancellations 
            for Otagon's subscription services. Otagon is a technology startup based in Hyderabad, 
            Telangana, India. By subscribing to our services, you agree to the terms of this policy.
          </p>
        </div>

        {/* Subscription Overview */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">1. Subscription Overview</h3>
          <p className="mb-3">Otagon offers the following subscription tiers:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Free Tier:</strong> Basic features with advertisements, no payment required</li>
            <li><strong>Pro (Monthly/Yearly):</strong> Enhanced features and increased usage limits</li>
            <li><strong>Pro Vanguard (Monthly/Yearly):</strong> Premium features with highest usage limits</li>
          </ul>
        </div>

        {/* Subscription Cancellation */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">2. Subscription Cancellation</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">2.1 How to Cancel</h4>
          <p className="mb-3">
            You may cancel your subscription at any time through your account settings or by 
            contacting our support team at{' '}
            <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">2.2 Effect of Cancellation</h4>
          <p className="mb-3">
            When you cancel your subscription:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Your subscription will remain active until the end of your current billing period</li>
            <li>You will not be charged for subsequent billing periods</li>
            <li>After the billing period ends, your account will revert to the Free tier</li>
            <li>Your conversation history and data will be retained</li>
          </ul>
        </div>

        {/* Refund Policy */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">3. Refund Policy</h3>
          
          <h4 className="text-base font-medium text-text-primary mb-2">3.1 General Policy</h4>
          <p className="mb-3">
            <strong>Otagon subscriptions are generally non-refundable.</strong> When you purchase 
            a subscription, you are charged for the entire billing period (monthly or yearly) at 
            the beginning of that period. Once payment is processed, we are unable to provide 
            full or partial refunds for unused portions of the subscription.
          </p>

          <h4 className="text-base font-medium text-text-primary mb-2">3.2 Exceptions</h4>
          <p className="mb-3">
            We may consider refund requests in the following exceptional circumstances:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
            <li><strong>Accidental Purchase:</strong> If you accidentally subscribed and request a 
              refund within 48 hours without significant use of premium features</li>
            <li><strong>Duplicate Charges:</strong> If you were charged multiple times for the same 
              subscription period due to a technical error</li>
            <li><strong>Service Unavailability:</strong> If the Service was substantially unavailable 
              for an extended period during your billing cycle</li>
            <li><strong>Unauthorized Transactions:</strong> If the subscription was purchased without 
              your authorization (subject to verification)</li>
          </ul>
          <p>
            All refund requests are evaluated on a case-by-case basis at our sole discretion.
          </p>
        </div>

        {/* How to Request a Refund */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">4. How to Request a Refund</h3>
          <p className="mb-3">To request a refund, please:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Email us at <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a> with the subject line "Refund Request"</li>
            <li>Include your registered email address and account details</li>
            <li>Provide the date of the transaction and payment method used</li>
            <li>Explain the reason for your refund request</li>
            <li>Include any relevant screenshots or documentation</li>
          </ol>
          <p className="mt-3">
            We aim to respond to all refund requests within 5-7 business days. If approved, 
            refunds will be processed to the original payment method within 7-14 business days.
          </p>
        </div>

        {/* Free Tier */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">5. Free Tier</h3>
          <p>
            The Free tier is provided at no cost and therefore no refunds are applicable. 
            Free tier users have access to basic features with advertisements. We encourage 
            users to fully explore the Free tier before committing to a paid subscription 
            to ensure the Service meets their needs.
          </p>
        </div>

        {/* Trial Periods */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">6. Trial Periods</h3>
          <p>
            If we offer trial periods for premium subscriptions, you will not be charged during 
            the trial period. If you do not cancel before the trial ends, your payment method 
            will be charged for the subscription. It is your responsibility to cancel before 
            the trial period expires if you do not wish to continue.
          </p>
        </div>

        {/* Technical Issues */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">7. Technical Issues</h3>
          <p className="mb-3">
            If you experience technical issues that prevent you from using the Service:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Contact our support team immediately at{' '}
              <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a>
            </li>
            <li>We will work diligently to resolve technical problems</li>
            <li>Technical issues do not automatically qualify for refunds</li>
            <li>Extended service outages may be considered for pro-rated credits or refunds</li>
          </ul>
        </div>

        {/* Payment Disputes */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">8. Payment Disputes</h3>
          <p className="mb-3">
            Before initiating a payment dispute or chargeback with your bank or payment provider, 
            we encourage you to contact us first. We are committed to resolving issues fairly 
            and promptly.
          </p>
          <p>
            Please note that initiating a chargeback or payment dispute may result in the 
            suspension or termination of your account pending resolution.
          </p>
        </div>

        {/* Changes to Pricing */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">9. Changes to Pricing</h3>
          <p>
            We reserve the right to change subscription pricing at any time. Price changes 
            will not affect existing subscriptions until the next renewal period. We will 
            provide advance notice of any pricing changes.
          </p>
        </div>

        {/* Regional Considerations */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">10. Regional Considerations</h3>
          <p>
            Some jurisdictions may have consumer protection laws that provide additional refund 
            rights. Where local laws require, we will comply with applicable refund requirements. 
            If you believe you are entitled to a refund under local consumer protection laws, 
            please contact us with details of your claim.
          </p>
        </div>

        {/* Our Commitment */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">11. Our Commitment</h3>
          <p>
            We believe in the value Otagon provides and are committed to customer satisfaction. 
            While our subscription policy is generally non-refundable, we encourage users to 
            take advantage of the Free tier to evaluate our Service before subscribing. This 
            policy allows us, as a startup team based in Hyderabad, India, to manage our resources 
            effectively while continuing to build the best possible gaming companion for our 
            global community.
          </p>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">12. Contact Us</h3>
          <p className="mb-3">
            If you have any questions about this Refund Policy, please contact us:
          </p>
          <div className="bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border border-neutral-800/60 rounded-lg p-4 space-y-2">
            <p><strong>Otagon</strong></p>
            <p>Hyderabad, Telangana, India</p>
            <p>Email: <a href="mailto:support@otagon.app" className="text-primary hover:underline">support@otagon.app</a></p>
            <p>Website: <a href="https://otagon.app" className="text-primary hover:underline">https://otagon.app</a></p>
          </div>
        </div>

        {/* Policy Updates */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">13. Policy Updates</h3>
          <p>
            We may update this Refund Policy from time to time. Changes will be posted on this 
            page with an updated "Last Updated" date. Your continued use of the Service after 
            changes constitutes acceptance of the updated policy.
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

export default RefundPolicyModal;
