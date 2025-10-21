import React, { useState, useEffect } from 'react';

export interface TTSStatus {
  status: 'available' | 'unavailable' | 'error' | 'testing';
  message: string;
  lastError?: any;
}

export const TTSStatusIndicator: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ className = '', showDetails = false }) => {
  const [ttsStatus, setTtsStatus] = useState<TTSStatus>({
    status: 'testing',
    message: 'Checking TTS availability...'
  });

  useEffect(() => {
    checkTTSAvailability();
  }, []);

  const checkTTSAvailability = async () => {
    try {
      // Check if TTS is supported
      if (!('speechSynthesis' in window)) {
        setTtsStatus({
          status: 'unavailable',
          message: 'TTS not supported'
        });
        return;
      }

      // Test TTS with silent utterance
      const testUtterance = new SpeechSynthesisUtterance('');
      testUtterance.volume = 0; // Silent test
      testUtterance.rate = 0.1; // Very fast to minimize delay
      
      testUtterance.onerror = (e) => {
        setTtsStatus({
          status: 'error',
          message: 'TTS error detected',
          lastError: e
        });
      };
      
      testUtterance.onend = () => {
        setTtsStatus({
          status: 'available',
          message: 'TTS ready'
        });
      };
      
      // Set a timeout in case the test doesn't complete
      setTimeout(() => {
        if (ttsStatus.status === 'testing') {
          setTtsStatus({
            status: 'available',
            message: 'TTS ready'
          });
        }
      }, 2000);
      
      speechSynthesis.speak(testUtterance);
    } catch (error) {
      setTtsStatus({
        status: 'error',
        message: 'TTS test failed',
        lastError: error
      });
    }
  };

  const getStatusIcon = () => {
    switch (ttsStatus.status) {
      case 'available':
        return '🔊';
      case 'unavailable':
        return '🔇';
      case 'error':
        return '⚠️';
      case 'testing':
        return '🔄';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (ttsStatus.status) {
      case 'available':
        return 'text-green-600';
      case 'unavailable':
        return 'text-gray-500';
      case 'error':
        return 'text-red-600';
      case 'testing':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  const handleRetry = () => {
    setTtsStatus({
      status: 'testing',
      message: 'Rechecking TTS availability...'
    });
    checkTTSAvailability();
  };

  return (
    <div className={`tts-status-indicator ${className}`}>
      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className="text-sm font-medium">{ttsStatus.message}</span>
        
        {ttsStatus.status === 'error' && (
          <button
            onClick={handleRetry}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
      
      {showDetails && ttsStatus.lastError && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <details>
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-1 whitespace-pre-wrap">
              {JSON.stringify(ttsStatus.lastError, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default TTSStatusIndicator;

