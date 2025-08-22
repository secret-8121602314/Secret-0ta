import React from 'react';

const RefundPolicyPage: React.FC = () => {
  return (
    <>
      <p className="text-neutral-400 mb-4 text-base">Last Updated: August 15, 2025</p>

      <p>Thank you for being a part of the Otakon community. Our goal is to provide a simple and fair experience for all our users.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Subscription Cancellation</h2>
      <p>You can cancel your Otakon Pro or Pro Vanguard subscription at any time. Your subscription will remain active until the end of your current billing period (monthly or yearly), and you will not be charged again. You can manage your subscription through your account settings.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Refund Eligibility</h2>
      <p>Otakon subscriptions are non-refundable.</p>
      <p className="mt-4">When you purchase a subscription, you are charged for the entire billing period (one month or one year) at the beginning of that period. Once a charge has been processed, we are unable to provide any full or partial refunds, even if you cancel your subscription before the end of the billing period.</p>
      
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Our Commitment</h2>
      <p>We believe in the value Otakon provides and encourage users to make the most of our Free tier to decide if a Pro subscription is right for them. This policy allows us, a small team based in Hyderabad, India, to manage our resources effectively and continue building the best possible spoiler-free gaming companion for our global community.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Contact Us</h2>
      <p>If you have any questions about this policy, please contact us at <a href="mailto:support@otakon.ai" className="text-[#FFAB40] hover:underline">support@otakon.ai</a>.</p>
    </>
  );
};

export default RefundPolicyPage;
