import React, { useState, useEffect } from 'react';
import { useResponsive } from '../utils/responsive';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveFlex, ResponsiveText, ResponsiveModal } from './layout/ResponsiveComponents';

interface ResponsiveTestProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResponsiveTest: React.FC<ResponsiveTestProps> = ({ isOpen, onClose }) => {
  const { 
    deviceType, 
    isMobile, 
    isTablet, 
    isLaptop, 
    isDesktop, 
    isUltrawide,
    currentBreakpoint,
    isTouch,
    isPortrait 
  } = useResponsive();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  const testCards = [
    { id: 1, title: 'Mobile Test', color: 'bg-blue-500' },
    { id: 2, title: 'Tablet Test', color: 'bg-green-500' },
    { id: 3, title: 'Laptop Test', color: 'bg-yellow-500' },
    { id: 4, title: 'Desktop Test', color: 'bg-red-500' },
    { id: 5, title: 'Ultrawide Test', color: 'bg-purple-500' },
    { id: 6, title: 'Touch Test', color: 'bg-pink-500' },
    { id: 7, title: 'Portrait Test', color: 'bg-indigo-500' },
    { id: 8, title: 'Landscape Test', color: 'bg-orange-500' },
  ];

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <ResponsiveText size="2xl" weight="bold" className="mb-6 text-center">
          Responsive Design Test
        </ResponsiveText>

        {/* Device Information */}
        <ResponsiveContainer className="mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              Current Device Information
            </ResponsiveText>
            
            <ResponsiveGrid 
              cols={{ mobile: 1, tablet: 2, laptop: 3, desktop: 4, ultrawide: 5 }}
              gap="md"
            >
              <div className="bg-gray-700 rounded p-3">
                <ResponsiveText size="sm" weight="medium" className="text-gray-300">Device Type</ResponsiveText>
                <ResponsiveText size="base" className="text-white">{deviceType}</ResponsiveText>
              </div>
              
              <div className="bg-gray-700 rounded p-3">
                <ResponsiveText size="sm" weight="medium" className="text-gray-300">Breakpoint</ResponsiveText>
                <ResponsiveText size="base" className="text-white">{currentBreakpoint}</ResponsiveText>
              </div>
              
              <div className="bg-gray-700 rounded p-3">
                <ResponsiveText size="sm" weight="medium" className="text-gray-300">Screen Size</ResponsiveText>
                <ResponsiveText size="base" className="text-white">{windowSize.width} × {windowSize.height}</ResponsiveText>
              </div>
              
              <div className="bg-gray-700 rounded p-3">
                <ResponsiveText size="sm" weight="medium" className="text-gray-300">Orientation</ResponsiveText>
                <ResponsiveText size="base" className="text-white">{isPortrait ? 'Portrait' : 'Landscape'}</ResponsiveText>
              </div>
              
              <div className="bg-gray-700 rounded p-3">
                <ResponsiveText size="sm" weight="medium" className="text-gray-300">Touch Device</ResponsiveText>
                <ResponsiveText size="base" className="text-white">{isTouch ? 'Yes' : 'No'}</ResponsiveText>
              </div>
            </ResponsiveGrid>
          </div>
        </ResponsiveContainer>

        {/* Device Flags */}
        <ResponsiveContainer className="mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              Device Flags
            </ResponsiveText>
            
            <ResponsiveFlex direction={{ mobile: 'col', tablet: 'row' }} gap="md" wrap>
              <div className={`px-3 py-2 rounded ${isMobile ? 'bg-green-600' : 'bg-gray-600'}`}>
                <ResponsiveText size="sm">Mobile: {isMobile ? '✓' : '✗'}</ResponsiveText>
              </div>
              <div className={`px-3 py-2 rounded ${isTablet ? 'bg-green-600' : 'bg-gray-600'}`}>
                <ResponsiveText size="sm">Tablet: {isTablet ? '✓' : '✗'}</ResponsiveText>
              </div>
              <div className={`px-3 py-2 rounded ${isLaptop ? 'bg-green-600' : 'bg-gray-600'}`}>
                <ResponsiveText size="sm">Laptop: {isLaptop ? '✓' : '✗'}</ResponsiveText>
              </div>
              <div className={`px-3 py-2 rounded ${isDesktop ? 'bg-green-600' : 'bg-gray-600'}`}>
                <ResponsiveText size="sm">Desktop: {isDesktop ? '✓' : '✗'}</ResponsiveText>
              </div>
              <div className={`px-3 py-2 rounded ${isUltrawide ? 'bg-green-600' : 'bg-gray-600'}`}>
                <ResponsiveText size="sm">Ultrawide: {isUltrawide ? '✓' : '✗'}</ResponsiveText>
              </div>
            </ResponsiveFlex>
          </div>
        </ResponsiveContainer>

        {/* Test Grid */}
        <ResponsiveContainer className="mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              Responsive Grid Test
            </ResponsiveText>
            
            <ResponsiveGrid 
              cols={{ mobile: 1, tablet: 2, laptop: 3, desktop: 4, ultrawide: 5 }}
              gap="md"
            >
              {testCards.map((card) => (
                <div key={card.id} className={`${card.color} rounded-lg p-4 text-white`}>
                  <ResponsiveText size="base" weight="semibold">{card.title}</ResponsiveText>
                  <ResponsiveText size="sm">Card {card.id}</ResponsiveText>
                </div>
              ))}
            </ResponsiveGrid>
          </div>
        </ResponsiveContainer>

        {/* Responsive Text Test */}
        <ResponsiveContainer className="mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              Responsive Text Test
            </ResponsiveText>
            
            <div className="space-y-4">
              <ResponsiveText size="xs" className="text-gray-300">Extra Small Text (xs)</ResponsiveText>
              <ResponsiveText size="sm" className="text-gray-300">Small Text (sm)</ResponsiveText>
              <ResponsiveText size="base" className="text-gray-300">Base Text (base)</ResponsiveText>
              <ResponsiveText size="lg" className="text-gray-300">Large Text (lg)</ResponsiveText>
              <ResponsiveText size="xl" className="text-gray-300">Extra Large Text (xl)</ResponsiveText>
              <ResponsiveText size="2xl" className="text-gray-300">2X Large Text (2xl)</ResponsiveText>
              <ResponsiveText size="3xl" className="text-gray-300">3X Large Text (3xl)</ResponsiveText>
            </div>
          </div>
        </ResponsiveContainer>

        {/* Responsive Flex Test */}
        <ResponsiveContainer className="mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              Responsive Flex Test
            </ResponsiveText>
            
            <ResponsiveFlex 
              direction={{ mobile: 'col', tablet: 'row' }}
              align="center"
              justify="between"
              gap="md"
            >
              <div className="bg-blue-600 rounded p-3">
                <ResponsiveText size="sm" className="text-white">Flex Item 1</ResponsiveText>
              </div>
              <div className="bg-green-600 rounded p-3">
                <ResponsiveText size="sm" className="text-white">Flex Item 2</ResponsiveText>
              </div>
              <div className="bg-yellow-600 rounded p-3">
                <ResponsiveText size="sm" className="text-white">Flex Item 3</ResponsiveText>
              </div>
            </ResponsiveFlex>
          </div>
        </ResponsiveContainer>

        {/* Close Button */}
        <ResponsiveContainer>
          <ResponsiveFlex justify="center">
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors responsive-touch-target"
            >
              <ResponsiveText size="base" weight="medium">Close Test</ResponsiveText>
            </button>
          </ResponsiveFlex>
        </ResponsiveContainer>
      </div>
    </ResponsiveModal>
  );
};

export default ResponsiveTest;
