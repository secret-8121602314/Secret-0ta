import React, { useState, useEffect, useRef } from 'react';
import { ConnectionStatus } from '../../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (code: string) => void;
  onDisconnect: () => void;
  status: ConnectionStatus;
  error: string | null;
  connectionCode: string | null;
  lastSuccessfulConnection: Date | null;
  onShowHowToUse?: () => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  status,
  error,
  connectionCode,
  lastSuccessfulConnection,
  onShowHowToUse
}) => {
  const [code, setCode] = useState(connectionCode || '');
  const wasOpenedWhileConnectedRef = useRef(false);

  const isConnecting = status === ConnectionStatus.CONNECTING;
  const isConnected = status === ConnectionStatus.CONNECTED;

  // Track if modal was opened while already connected
  useEffect(() => {
    if (isOpen && isConnected) {
      wasOpenedWhileConnectedRef.current = true;
      console.log('🔍 Connection modal opened while already connected - will not auto-close');
    } else if (!isOpen) {
      wasOpenedWhileConnectedRef.current = false;
    }
  }, [isOpen, isConnected]);

  // Auto-close modal after successful connection (but not if manually opened)
  useEffect(() => {
    if (isConnected && !wasOpenedWhileConnectedRef.current) {
      const hasConnectedBefore = localStorage.getItem('otakonHasConnectedBefore') === 'true';
      
      if (!hasConnectedBefore) {
        // First time connecting - trigger onboarding flow
        console.log('🎉 First connection - triggering onboarding flow');
        
        // Close modal and let App.tsx handle onboarding progression
        setTimeout(() => {
          onClose();
          // Trigger onboarding update to show how-to-use splash screen
          if (onShowHowToUse) {
            onShowHowToUse();
          }
        }, 1000); // Small delay to show the success message first
      } else {
        // Returning user - auto-close modal and show chat screen
        console.log('🔄 Returning user connected - will auto-close modal');
        setTimeout(() => {
          onClose();
        }, 1500); // Show success message for 1.5 seconds then close
      }
    } else if (isConnected && wasOpenedWhileConnectedRef.current) {
      console.log('🔍 Modal manually opened - will not auto-close');
    }
  }, [isConnected, onClose, onShowHowToUse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code && /^\d{6}$/.test(code)) {
      onConnect(code);
    }
  };

  const formatLastConnection = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fade-in">
      <div className="bg-gradient-to-r from-[#1C1C1C]/95 to-[#0A0A0A]/95 backdrop-blur-xl border-2 border-[#424242]/60 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in hover:border-[#424242]/80 transition-all duration-500">
        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-all duration-300 z-10 hover:scale-110"
            aria-label="Close modal"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <h2 className="text-3xl font-bold text-[#F5F5F5] mb-4 leading-tight">PC Connection</h2>
          <p className="text-[#A3A3A3] mb-6 text-lg leading-relaxed">Sync with the PC client to send screenshots directly from your game.</p>
          
          {/* Saved connection info */}
          {connectionCode && (
            <div className="mb-6 p-4 bg-gradient-to-r from-[#2E2E2E]/60 to-[#1A1A1A]/60 border-2 border-[#424242]/60 rounded-2xl backdrop-blur-sm">
              <div className="text-base text-[#A3A3A3]">
                <span className="font-medium text-[#F5F5F5]">Saved connection:</span> {connectionCode}
                {lastSuccessfulConnection && (
                  <span className="block text-sm text-[#6E6E6E] mt-2">
                    Last connected: {formatLastConnection(lastSuccessfulConnection)}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[#2E2E2E]/60 to-[#1A1A1A]/60 border-2 border-[#424242]/60 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#F5F5F5]">PC Client</h3>
                <span className="text-sm text-[#A3A3A3] bg-gradient-to-r from-[#1C1C1C]/80 to-[#0A0A0A]/80 px-3 py-1.5 rounded-xl border border-[#424242]/60">
                  v1.0.0
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <p className="text-base text-[#A3A3A3] leading-relaxed">
                  PC Client for Otagon - Your Spoiler-Free Gaming Companion
                </p>
                <div className="text-sm text-[#6E6E6E]">
                  Download and install to get started
                </div>
              </div>
              
              <button
                onClick={() => {
                  const downloadUrl = 'https://github.com/readmet3xt/otakon-pc-client/releases/tag/v1.0.0';
                  window.open(downloadUrl, '_blank');
                }}
                className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-6 py-3 rounded-xl font-medium hover:from-[#D42A2A] hover:to-[#C87A1A] transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25"
              >
                Download PC Client
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="connection-code" className="block text-base font-medium text-[#CFCFCF] mb-3">
                6-Digit Connection Code
              </label>
              <div className="relative">
                <input
                  id="connection-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  pattern="\d{6}"
                  title="Enter exactly 6 digits"
                  disabled={isConnecting || isConnected}
                  required
                  className="w-full bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] border-2 border-[#424242]/60 rounded-xl py-3 px-4 pr-12 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] focus:border-[#FFAB40]/60 disabled:opacity-50 text-lg backdrop-blur-sm"
                />
                {code && code.length === 6 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {error && <p className="text-[#E53A3A] text-base">{error}</p>}
            {isConnected && (
              <div className="space-y-4">
                <p className="text-[#5CBB7B] text-base">Connected successfully. Ready to receive screenshots.</p>
                
                {/* Enhanced Status for 6-digit connections */}
                <div className="p-4 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-2 border-green-600/20 rounded-2xl backdrop-blur-sm">
                  <div className="text-sm text-green-400 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                      Enhanced connector connected
                    </div>
                    <div>• Ready for screenshots and AI analysis</div>
                    <div>• Use F1 for single shot, F2 for batch capture</div>
                    <div>• All features unlocked and ready to use</div>
                  </div>
                  
                  {/* Auto-close indicator */}
                  {localStorage.getItem('otakonHasConnectedBefore') === 'true' && !wasOpenedWhileConnectedRef.current && (
                    <div className="mt-3 pt-3 border-t border-green-600/30">
                      <div className="flex items-center gap-2 text-xs text-green-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Modal will close automatically in a moment...
                      </div>
                    </div>
                  )}
                  
                  {/* Manual open indicator */}
                  {wasOpenedWhileConnectedRef.current && (
                    <div className="mt-3 pt-3 border-t border-green-600/30">
                      <div className="flex items-center gap-2 text-xs text-green-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Modal will stay open - you can close it manually
                      </div>
                    </div>
                  )}
                  
                  {/* First time connection indicator */}
                  {localStorage.getItem('otakonHasConnectedBefore') !== 'true' && !wasOpenedWhileConnectedRef.current && (
                    <div className="mt-3 pt-3 border-t border-green-600/30">
                      <div className="flex items-center gap-2 text-xs text-green-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Modal will close automatically in a moment...
                      </div>
                    </div>
                  )}
                </div>
                
                {/* First-time user message */}
                {onShowHowToUse && localStorage.getItem('otakonHasConnectedBefore') !== 'true' && (
                  <div className="p-4 bg-gradient-to-r from-blue-600/10 to-sky-600/10 border-2 border-blue-600/20 rounded-2xl backdrop-blur-sm">
                    <div className="text-sm text-blue-400 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
                        First time connecting!
                      </div>
                      <div>• The "How to Use" guide will appear in a moment</div>
                      <div>• Learn about hotkeys, screenshot modes, and features</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center pt-6 gap-4">
              {isConnected ? (
                  <div className="w-full space-y-3">
                    <button
                        type="button"
                        onClick={onDisconnect}
                        className="w-full flex items-center justify-center bg-gradient-to-r from-[#E53A3A] to-red-600 hover:from-red-600 hover:to-red-700 text-[#F5F5F5] font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/25"
                    >
                        Disconnect
                    </button>
                    {onShowHowToUse && (
                      <button
                          type="button"
                          onClick={onShowHowToUse}
                          className="w-full flex items-center justify-center bg-gradient-to-r from-[#2E2E2E] to-[#1A1A1A] hover:from-[#424242] hover:to-[#2A2A2A] text-[#CFCFCF] font-medium py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-[#424242]/60 hover:border-[#5A5A5A]/60"
                      >
                          Show How to Use Guide
                      </button>
                    )}
                  </div>
              ) : (
                  <button
                      type="submit"
                      disabled={isConnecting || !/^\d{6}$/.test(code)}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] disabled:from-[#5A5A5A] disabled:to-[#424242] disabled:cursor-not-allowed text-[#F5F5F5] font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25"
                  >
                  {isConnecting ? (
                      <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F5F5F5] mr-3"></div>
                      Connecting...
                      </>
                  ) : (
                      'Connect'
                  )}
                  </button>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default React.memo(ConnectionModal);
