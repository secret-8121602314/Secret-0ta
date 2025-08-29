import React, { useState } from 'react';
import TypingIndicator from './TypingIndicator';
import Skeleton from './Skeleton';
import CircularProgress from './CircularProgress';
import LottieLoader from './LottieLoader';

const LoadingAnimationDemo: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<'dots' | 'skeleton' | 'wave' | 'circular' | 'lottie'>('lottie');
  const [selectedSkeleton, setSelectedSkeleton] = useState<'text' | 'circular' | 'rectangular' | 'avatar' | 'card'>('text');
  const [selectedProgress, setSelectedProgress] = useState<'indeterminate' | 'determinate'>('indeterminate');
  const [progressValue, setProgressValue] = useState(45);
  const [selectedLottieVariant, setSelectedLottieVariant] = useState<'ai-thinking' | 'loading' | 'success' | 'error' | 'connecting'>('ai-thinking');
  const [selectedLottieSize, setSelectedLottieSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  return (
    <div className="p-6 space-y-8 bg-[#1C1C1C] text-[#F5F5F5]">
      <h2 className="text-2xl font-bold text-center mb-8">🎨 Loading Animation Showcase</h2>
      
      {/* Lottie Loader Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">Lottie Animations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Variant:</label>
            <select 
              value={selectedLottieVariant} 
              onChange={(e) => setSelectedLottieVariant(e.target.value as any)}
              className="w-full p-2 bg-[#2E2E2E] border border-[#424242] rounded-lg text-[#F5F5F5]"
            >
              <option value="ai-thinking">AI Thinking</option>
              <option value="loading">Loading</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="connecting">Connecting</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Size:</label>
            <select 
              value={selectedLottieSize} 
              onChange={(e) => setSelectedLottieSize(e.target.value as any)}
              className="w-full p-2 bg-[#2E2E2E] border border-[#424242] rounded-lg text-[#F5F5F5]"
            >
              <option value="sm">Small (24px)</option>
              <option value="md">Medium (32px)</option>
              <option value="lg">Large (48px)</option>
              <option value="xl">Extra Large (64px)</option>
            </select>
          </div>
        </div>
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          <LottieLoader 
            variant={selectedLottieVariant} 
            size={selectedLottieSize}
            showText={true}
          />
        </div>
      </div>

      {/* TypingIndicator Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">TypingIndicator Variants</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {(['dots', 'skeleton', 'wave', 'circular', 'lottie'] as const).map(variant => (
            <button
              key={variant}
              onClick={() => setSelectedVariant(variant)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedVariant === variant 
                  ? 'bg-[#FF4D4D] text-white' 
                  : 'bg-[#424242] text-[#A3A3A3] hover:bg-[#5A5A5A]'
              }`}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          <TypingIndicator variant={selectedVariant} showText={true} />
        </div>
      </div>

      {/* Skeleton Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">Skeleton Variants</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {(['text', 'circular', 'rectangular', 'avatar', 'card'] as const).map(variant => (
            <button
              key={variant}
              onClick={() => setSelectedSkeleton(variant)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSkeleton === variant 
                  ? 'bg-[#FF4D4D] text-white' 
                  : 'bg-[#424242] text-[#A3A3A3] hover:bg-[#5A5A5A]'
              }`}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          <Skeleton variant={selectedSkeleton} animation="pulse" />
        </div>
      </div>

      {/* Circular Progress Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">Circular Progress Variants</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {(['indeterminate', 'determinate'] as const).map(variant => (
            <button
              key={variant}
              onClick={() => setSelectedProgress(variant)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedProgress === variant 
                  ? 'bg-[#FF4D4D] text-white' 
                  : 'bg-[#424242] text-[#A3A3A3] hover:bg-[#5A5A5A]'
              }`}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          <div className="flex items-center gap-8">
            <CircularProgress 
              variant={selectedProgress} 
              value={selectedProgress === 'determinate' ? progressValue : undefined}
              size="large"
            />
            {selectedProgress === 'determinate' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A3A3A3]">Progress: {progressValue}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(parseInt(e.target.value))}
                  className="w-32"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation Speed Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">Animation Speed Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 text-center">
            <div className="w-4 h-4 bg-[#FF4D4D] rounded-full animate-pulse-fast mx-auto mb-2"></div>
            <span className="text-sm text-[#A3A3A3]">Fast Pulse</span>
          </div>
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 text-center">
            <div className="w-4 h-4 bg-[#FFAB40] rounded-full animate-pulse mx-auto mb-2"></div>
            <span className="text-sm text-[#A3A3A3]">Normal Pulse</span>
          </div>
          <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 text-center">
            <div className="w-4 h-4 bg-[#5CBB7B] rounded-full animate-pulse-slow mx-auto mb-2"></div>
            <span className="text-sm text-[#A3A3A3]">Slow Pulse</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimationDemo;








