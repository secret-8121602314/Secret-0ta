import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <>
      <p className="text-neutral-400 mb-4 text-base">Last Updated: August 15, 2025</p>

      <p>Welcome to Otakon! This Privacy Policy explains how we collect, use, and protect your information when you use our services. We are based in Hyderabad, India, and serve users across the globe.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
      <p>We collect information to provide and improve our services:</p>
      <ul className="list-disc list-inside space-y-2 mt-4 text-base">
        <li><strong>Account Information:</strong> When you sign up, we collect your email address and may receive your name and profile picture if you sign in using a third-party service like Google or Discord. We store your user tier (Free, Pro, Vanguard Pro).</li>
        <li><strong>User-Generated Content:</strong> We collect and store the screenshots you capture and the text queries you submit through our application.</li>
        <li><strong>Usage Data:</strong> We automatically log information about your interactions with our service, such as the number of queries you make and the features you use.</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
      <p>Your data is used for two primary purposes:</p>
      <ul className="list-disc list-inside space-y-2 mt-4 text-base">
          <li><strong>To Provide the Service:</strong> We use your screenshots and text queries to generate AI-powered hints and insights, which is the core function of Otakon.</li>
          <li><strong>To Improve Our AI Models:</strong> Your screenshots and text queries are essential for refining our product. We use this data to train our AI models to better understand different games, contexts, and user needs. This allows us to provide more accurate, relevant, and spoiler-free hints for the entire community. All data used for training is anonymized and stripped of personal identifiers.</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Data Storage and Security</h2>
      <p>We are committed to protecting your data. All information is stored on secure servers, and we implement industry-standard security measures to prevent unauthorized access.</p>
      
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Data Sharing</h2>
      <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Data used for AI training is anonymized and may be processed by our trusted technology partners (like Google for their Gemini models) under strict confidentiality agreements.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Your Choices</h2>
      <p>You can access and update your account information at any time. You can also delete your account, which will permanently remove your personal data from our active systems.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
      
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@otakon.ai" className="text-[#FFAB40] hover:underline">support@otakon.ai</a></p>
    </>
  );
};

export default PrivacyPolicyPage;
