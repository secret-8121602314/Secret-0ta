import React, { useState } from 'react';

interface InstallationTabsProps {
  pcAppImage: string;
}

type TabType = 'windows' | 'ios' | 'android';

const InstallationTabs: React.FC<InstallationTabsProps> = ({ pcAppImage }) => {
  const [activeTab, setActiveTab] = useState<TabType>('windows');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'windows',
      label: 'Windows',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
        </svg>
      ),
    },
    {
      id: 'ios',
      label: 'iOS',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
    },
    {
      id: 'android',
      label: 'Android',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.81 10.81 0 0 0 1 18h22a10.81 10.81 0 0 0-5.4-8.52M7 15.25a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0m7.5 0a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8 md:mb-10">
        <div className="inline-flex bg-gradient-to-r from-neutral-900/80 to-neutral-800/80 backdrop-blur-xl border border-neutral-700/60 rounded-2xl p-1.5 shadow-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300
                ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-lg scale-105'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {/* Windows PC Tab */}
        {activeTab === 'windows' && (
          <div className="animate-fade-slide-up">
            <div className="bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 backdrop-blur-xl border border-neutral-700/60 rounded-3xl p-8 md:p-10 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left: PC App Image */}
                <div className="order-2 md:order-1">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img
                      src={pcAppImage}
                      alt="Otagon Connector for Windows"
                      className="relative w-full h-auto rounded-2xl shadow-2xl border border-neutral-700/40"
                    />
                  </div>
                </div>

                {/* Right: Instructions */}
                <div className="order-1 md:order-2">
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      Otagon Connector for Windows
                    </h3>
                    <p className="text-lg text-neutral-300 leading-relaxed">
                      Get help while gaming! This handy PC tool captures your game screen and sends it to Otagon so you can get hints without leaving your game.
                    </p>
                  </div>

                  <div className="space-y-6 mb-8">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">
                          Download & Install
                        </h4>
                        <p className="text-neutral-400 leading-relaxed">
                          Download the Otagon Connector app and install it on your PC (just like any other program)
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex items-center">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">
                          Connect to Otagon
                        </h4>
                        <p className="text-neutral-400 leading-relaxed">
                          Open the Connector app to see your 6-digit code, then type that code into Otagon (on your web browser or phone)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="flex justify-center md:justify-start">
                    <button
                      disabled
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold text-lg rounded-xl shadow-2xl transition-all duration-300 cursor-not-allowed opacity-50"
                    >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Coming Soon</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* iOS Tab */}
        {activeTab === 'ios' && (
          <div className="animate-fade-slide-up">
            <div className="bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 backdrop-blur-xl border border-neutral-700/60 rounded-3xl p-8 md:p-10 shadow-2xl max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 mb-4">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Get Otagon on iPhone/iPad
                </h3>
                <p className="text-lg text-neutral-300 leading-relaxed">
                  Save Otagon to your home screen for easy access anytime
                </p>
              </div>

              <div className="space-y-5">
                {/* Step 1 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Open <span className="font-semibold text-white">Safari</span> on your iPhone or iPad and visit Otagon
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Go to the <span className="font-semibold text-white">login page</span>
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Tap the <span className="font-semibold text-white">Share button</span> at the bottom (the square with an arrow pointing up)
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Choose <span className="font-semibold text-white">Add to Home Screen</span>, then tap <span className="font-semibold text-white">Add</span>. That's it!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Tab */}
        {activeTab === 'android' && (
          <div className="animate-fade-slide-up">
            <div className="bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 backdrop-blur-xl border border-neutral-700/60 rounded-3xl p-8 md:p-10 shadow-2xl max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 mb-4">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.81 10.81 0 0 0 1 18h22a10.81 10.81 0 0 0-5.4-8.52M7 15.25a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0m7.5 0a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Get Otagon on Android
                </h3>
                <p className="text-lg text-neutral-300 leading-relaxed">
                  Save Otagon to your home screen for easy access anytime
                </p>
              </div>

              <div className="space-y-5">
                {/* Step 1 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Open <span className="font-semibold text-white">Chrome</span> on your Android phone or tablet and visit Otagon
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Go to the <span className="font-semibold text-white">login page</span>
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Tap the <span className="font-semibold text-white">three dots menu (⋮)</span> in the top right corner
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] shadow-lg">
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-200 leading-relaxed text-lg">
                      Choose <span className="font-semibold text-white">Add to Home screen</span> or <span className="font-semibold text-white">Install app</span>. Done!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallationTabs;
