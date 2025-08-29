import React, { useState, useEffect } from 'react';
import TypingIndicator from './TypingIndicator';
import Skeleton from './Skeleton';
import CircularProgress from './CircularProgress';

const LoadingUsageExamples: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Simulate loading states
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (showSkeleton) {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSkeleton]);

  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => {
        setProgress(prev => Math.min(prev + 10, 100));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div className="p-6 space-y-8 bg-[#1C1C1C] text-[#F5F5F5]">
      <h2 className="text-2xl font-bold text-center mb-8">🚀 Practical Usage Examples</h2>
      
      {/* AI Response Loading */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">AI Response Loading</h3>
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <TypingIndicator variant="circular" showText={false} />
              <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-[#FFAB40]/20 to-[#5CBB7B]/20 rounded animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <button
                onClick={() => setIsLoading(false)}
                className="text-xs font-semibold px-3 py-1 rounded-full border transition-colors bg-[#424242]/50 border-[#5A5A5A] hover:bg-[#424242] hover:border-[#6E6E6E] text-[#CFCFCF] hover:text-[#F5F5F5]"
              >
                Stop
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[#A3A3A3] mb-3">Click the button below to simulate AI response loading</p>
              <button
                onClick={() => setIsLoading(true)}
                className="px-4 py-2 bg-[#FF4D4D] hover:bg-[#FF3333] text-white rounded-lg transition-colors"
              >
                Start AI Response
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Loading with Skeleton */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FFAB40]">Content Loading with Skeleton</h3>
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          {showSkeleton ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="avatar" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>
              <Skeleton variant="rectangular" height="120px" />
              <div className="space-y-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" lines={2} />
                <Skeleton variant="text" lines={1} />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[#A3A3A3] mb-3">Click the button below to show skeleton loading</p>
              <button
                onClick={() => setShowSkeleton(true)}
                className="px-4 py-2 bg-[#FFAB40] hover:bg-[#FF9900] text-white rounded-lg transition-colors"
              >
                Show Skeleton
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#5CBB7B]">Progress Tracking</h3>
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          <div className="flex items-center gap-4 mb-4">
            <CircularProgress 
              variant="determinate" 
              value={progress} 
              size="medium"
              showLabel={true}
            />
            <div className="flex-1">
              <div className="flex justify-between text-sm text-[#CFCFCF] mb-1">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-[#424242] rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {progress < 100 ? (
            <p className="text-[#A3A3A3] text-sm">Processing your request...</p>
          ) : (
            <div className="text-center">
              <p className="text-[#5CBB7B] font-medium mb-2">✅ Processing complete!</p>
              <button
                onClick={() => setProgress(0)}
                className="px-4 py-2 bg-[#5CBB7B] hover:bg-[#4CAF50] text-white rounded-lg transition-colors"
              >
                Reset Progress
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-variant Loading */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">Multi-variant Loading</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 text-center">
            <h4 className="text-[#FF4D4D] font-medium mb-3">Dots Animation</h4>
            <TypingIndicator variant="dots" showText={false} />
          </div>
          
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 text-center">
            <h4 className="text-[#FFAB40] font-medium mb-3">Wave Animation</h4>
            <TypingIndicator variant="wave" showText={false} />
          </div>
          
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 text-center">
            <h4 className="text-[#5CBB7B] font-medium mb-3">Circular Progress</h4>
            <CircularProgress variant="indeterminate" size="small" />
          </div>
        </div>
      </div>

      {/* Custom Loading States */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">Custom Loading States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
            <h4 className="text-[#FFAB40] font-medium mb-3">Shimmer Effect</h4>
            <div className="space-y-2">
              <div className="h-4 bg-[#424242] rounded animate-shimmer"></div>
              <div className="h-4 bg-[#424242] rounded animate-shimmer" style={{ width: '80%' }}></div>
              <div className="h-4 bg-[#424242] rounded animate-shimmer" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
            <h4 className="text-[#5CBB7B] font-medium mb-3">Pulse Variations</h4>
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-[#FF4D4D] rounded-full animate-pulse-fast"></div>
              <div className="w-4 h-4 bg-[#FFAB40] rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-[#5CBB7B] rounded-full animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingUsageExamples;








