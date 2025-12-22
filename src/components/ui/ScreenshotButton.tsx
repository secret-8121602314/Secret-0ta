import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserTier } from '../../types';
import { send } from '../../services/websocketService';

interface ScreenshotButtonProps {
  isConnected: boolean;
  isProcessing: boolean;
  isManualUploadMode: boolean;
  onRequestConnect?: () => void;
  usage?: { tier: UserTier };
  onFirstUse?: () => void;
}

type Mode = 'single' | 'multi';

const ScreenshotButton: React.FC<ScreenshotButtonProps> = ({ 
  isConnected, 
  isProcessing, 
  isManualUploadMode, 
  onRequestConnect,
  usage,
  onFirstUse
}) => {
  const [mode, setMode] = useState<Mode>('single');
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const longPressRef = useRef<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Check if user can access multishot
  const canUseMultishot = usage?.tier === 'pro' || usage?.tier === 'vanguard_pro';
  const isFreeUser = usage?.tier === 'free';

  // Persist mode - ensure free users can't have multishot saved
  useEffect(() => {
    const saved = localStorage.getItem('otakon_screenshot_mode');
    if (saved === 'single' || (saved === 'multi' && canUseMultishot)) {
      setMode(saved);
    } else if (saved === 'multi' && !canUseMultishot) {
      // Reset to single if free user had multishot saved
      setMode('single');
      localStorage.setItem('otakon_screenshot_mode', 'single');
    }
    // Don't show hint by default - only show on first interaction
    setShowHint(false);
  }, [canUseMultishot]);

  const setModeAndPersist = (m: Mode) => {
    // Prevent free users from setting multishot mode
    if (m === 'multi' && !canUseMultishot) {
      return;
    }
    setMode(m);
    localStorage.setItem('otakon_screenshot_mode', m);
    setMenuOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handler, { passive: true } as AddEventListenerOptions);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const openMenu = (e?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    e?.preventDefault?.();
    
    // Calculate menu position based on button location
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top - 10, // Position above the button with small gap
        right: window.innerWidth - rect.right
      });
    }
    
    e?.stopPropagation?.();
    setMenuOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Explicitly handle right-click
    e.preventDefault();
    e.stopPropagation();
    if (!isConnected) {
      onRequestConnect?.();
      return;
    }
    openMenu();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Right-button fallback
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      if (!isConnected) {
        onRequestConnect?.();
        return;
      }
      openMenu();
    }
  };

  const handleTouchStart = () => {
    // Long-press 1.75s
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current);
    }
    longPressRef.current = window.setTimeout(() => {
      if (!isConnected) {
        onRequestConnect?.();
        return;
      }
      openMenu();
    }, 1750);
  };

  const clearLongPress = () => {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleClick = async () => {
    if (!isConnected) { onRequestConnect?.(); return; }
    if (isProcessing) {
      return;
    }
    
    // Check if this is first time using screenshot feature
    const hasSeenInfo = localStorage.getItem('otakon_screenshot_info_seen') === 'true';
    if (!hasSeenInfo && onFirstUse) {
      onFirstUse();
      return;
    }
    
    // Prevent multishot for free users
    if (mode === 'multi' && !canUseMultishot) {
      return;
    }
    
    const processImmediate = isManualUploadMode ? false : mode === 'single';
    const msg: { type: string; mode: string; processImmediate: boolean; count?: number } = {
      type: 'screenshot_request',
      mode,
      processImmediate,
    };
    if (mode === 'multi') {
      msg.count = 5;
    }
    
    // Send screenshot request via websocket
    if (typeof send === 'function') {
      send(msg);
    }
  };

  const handleMultishotClick = () => {
    if (!canUseMultishot) {
      // Show upgrade prompt for free users
      setMenuOpen(false);
      // You can add an upgrade modal trigger here if needed
      return;
    }
    setModeAndPersist('multi');
  };

  return (
    <div ref={rootRef} className="relative z-[200]">
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearLongPress}
        onTouchCancel={clearLongPress}
        aria-disabled={!isConnected || isProcessing}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1A1A1A]/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
          isConnected 
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-[#2A2A2A]/80 hover:border-emerald-500/40 hover:scale-105' 
            : 'border border-[#333]/50 text-[#8A8A8A] opacity-70 cursor-pointer hover:opacity-90 hover:border-[#444]/60'
        } ${isProcessing ? 'opacity-60 cursor-wait' : ''} active:scale-95`}
        title={isConnected ? 'Screenshot (right-click/long-press to change mode)' : 'Connect your PC to enable screenshots'}
      >
        {mode === 'single' ? (
          // Monitor with capture corner (single)
          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8" />
            <path d="M7 7h3M7 10h3M14 7h3" />
            <path d="M4 3v4M4 3h4" />
          </svg>
        ) : (
          // Stacked monitors (multi)
          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="5" width="14" height="9" rx="2" />
            <rect x="6" y="10" width="14" height="9" rx="2" />
            <path d="M10 22h6" />
          </svg>
        )}
      </button>

      {showHint && isConnected && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-3 top-full text-xs text-[#CFCFCF] bg-[#101010]/95 border border-[#424242]/60 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-50">
          <button
            type="button"
            onClick={() => { setShowHint(false); localStorage.setItem('otakon_screenshot_hint_seen', '1'); }}
            className="w-full h-full"
          >
            Press & hold (1.75s) or right-click to change mode
          </button>
        </div>
      )}

      {menuOpen && isConnected && createPortal(
        <div 
          className="fixed bg-[#101010]/98 border border-[#424242]/60 rounded-xl shadow-2xl min-w-[200px] overflow-hidden backdrop-blur-md animate-fade-in"
          style={{ 
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            zIndex: 9999,
            transform: 'translateY(-100%)'
          }}
        >
          <button 
            onClick={() => setModeAndPersist('single')} 
            className={`w-full text-left px-4 py-3 hover:bg-[#2E2E2E]/60 transition-colors ${mode === 'single' ? 'text-emerald-400' : 'text-[#CFCFCF]'}`}
          >
            📸 Single Shot {mode === 'single' ? '✓' : ''}
          </button>
          
          <button 
            onClick={handleMultishotClick} 
            className={`w-full text-left px-4 py-3 transition-all duration-200 ${
              canUseMultishot 
                ? `hover:bg-[#2E2E2E]/60 ${mode === 'multi' ? 'text-emerald-400' : 'text-[#CFCFCF]'}` 
                : 'text-[#666666] cursor-not-allowed opacity-60'
            }`}
            disabled={!canUseMultishot}
          >
            {canUseMultishot ? (
              <>📸 Multi Shot (5) {mode === 'multi' ? '✓' : ''}</>
            ) : (
              <div className="flex items-center justify-between">
                <span>🔒 Multi Shot (5)</span>
                <span className="text-xs bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-2 py-1 rounded-full">
                  PRO
                </span>
              </div>
            )}
          </button>
          
          {isFreeUser && (
            <div className="px-4 py-2 text-xs text-[#999999] border-t border-[#424242]/40">
              Upgrade to Pro for batch screenshots
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ScreenshotButton;

