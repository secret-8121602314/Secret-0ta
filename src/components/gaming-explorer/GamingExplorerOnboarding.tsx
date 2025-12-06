/**
 * Gaming Explorer Onboarding
 * 
 * First-time user onboarding to capture gaming start year.
 * This data is used to create the timeline starting point.
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface GamingExplorerOnboardingProps {
  onComplete: (startYear: number) => void;
}

const GamingExplorerOnboarding: React.FC<GamingExplorerOnboardingProps> = ({
  onComplete,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear - 10);
  const [selectedDecade, setSelectedDecade] = useState<number>(
    Math.floor((currentYear - 10) / 10) * 10
  );

  // Generate decades from 1970 to current decade
  const decades = [];
  for (let decade = 1970; decade <= Math.floor(currentYear / 10) * 10; decade += 10) {
    decades.push(decade);
  }

  // Generate years for selected decade
  const yearsInDecade = [];
  for (let year = selectedDecade; year < selectedDecade + 10 && year <= currentYear; year++) {
    yearsInDecade.push(year);
  }

  const handleSubmit = useCallback(() => {
    onComplete(selectedYear);
  }, [selectedYear, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="max-w-md w-full text-center py-4 sm:py-0">
        {/* Icon */}
        <div className="mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#E53A3A] to-[#D98C1F] flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] mb-1 sm:mb-2">
          Start Your Gaming Journey
        </h2>
        <p className="text-sm sm:text-base text-[#8F8F8F] mb-5 sm:mb-8 px-2">
          When did you start gaming? This will be the beginning of your timeline.
        </p>

        {/* Decade Selector */}
        <div className="mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-[#CFCFCF] mb-2 sm:mb-3">Select a decade</p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 px-1">
            {decades.map((decade) => (
              <button
                key={decade}
                onClick={() => {
                  setSelectedDecade(decade);
                  setSelectedYear(decade);
                }}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  selectedDecade === decade
                    ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white'
                    : 'bg-[#1C1C1C] text-[#CFCFCF] hover:bg-[#2A2A2A]'
                }`}
              >
                {decade}s
              </button>
            ))}
          </div>
        </div>

        {/* Year Selector */}
        <div className="mb-5 sm:mb-8">
          <p className="text-xs sm:text-sm text-[#CFCFCF] mb-2 sm:mb-3">Select the year</p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 px-1">
            {yearsInDecade.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`w-12 sm:w-16 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  selectedYear === year
                    ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white ring-2 ring-[#E53A3A]/50'
                    : 'bg-[#1C1C1C] text-[#CFCFCF] hover:bg-[#2A2A2A]'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Year Display */}
        <div className="mb-5 sm:mb-8 p-3 sm:p-4 bg-[#1C1C1C] rounded-xl border border-[#424242]/40">
          <p className="text-[#8F8F8F] text-xs sm:text-sm">Your gaming journey starts in</p>
          <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] bg-clip-text text-transparent">
            {selectedYear}
          </p>
          <p className="text-[#8F8F8F] text-xs sm:text-sm">
            That's {currentYear - selectedYear} years of gaming!
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 sm:py-3 px-6 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm sm:text-base"
        >
          Start Exploring
        </button>

        {/* Skip Option */}
        <button
          onClick={() => onComplete(currentYear - 5)}
          className="mt-3 sm:mt-4 text-[#8F8F8F] text-xs sm:text-sm hover:text-[#CFCFCF] transition-colors"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
};

export default GamingExplorerOnboarding;
