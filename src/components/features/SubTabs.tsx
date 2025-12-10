import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubTab } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';

// Type-based styling configuration for each subtab type
const subtabStyles: Record<string, { accent: string; accentHover: string; bgTint: string; borderTint: string; icon: string }> = {
  story: {
    accent: '#A855F7',      // Purple - narrative/lore
    accentHover: '#C084FC',
    bgTint: 'rgba(168, 85, 247, 0.05)',
    borderTint: 'rgba(168, 85, 247, 0.2)',
    icon: '📖'
  },
  strategies: {
    accent: '#3B82F6',      // Blue - tactical/planning
    accentHover: '#60A5FA',
    bgTint: 'rgba(59, 130, 246, 0.05)',
    borderTint: 'rgba(59, 130, 246, 0.2)',
    icon: '🎯'
  },
  tips: {
    accent: '#22C55E',      // Green - helpful hints
    accentHover: '#4ADE80',
    bgTint: 'rgba(34, 197, 94, 0.05)',
    borderTint: 'rgba(34, 197, 94, 0.2)',
    icon: '💡'
  },
  walkthrough: {
    accent: '#F97316',      // Orange - step-by-step guides
    accentHover: '#FB923C',
    bgTint: 'rgba(249, 115, 22, 0.05)',
    borderTint: 'rgba(249, 115, 22, 0.2)',
    icon: '🗺️'
  },
  items: {
    accent: '#EAB308',      // Yellow - collectibles/items
    accentHover: '#FACC15',
    bgTint: 'rgba(234, 179, 8, 0.05)',
    borderTint: 'rgba(234, 179, 8, 0.2)',
    icon: '🎒'
  },
  characters: {
    accent: '#EF4444',      // Red - characters/NPCs
    accentHover: '#F87171',
    bgTint: 'rgba(239, 68, 68, 0.05)',
    borderTint: 'rgba(239, 68, 68, 0.2)',
    icon: '👤'
  },
  chat: {
    accent: '#6B7280',      // Gray - general chat
    accentHover: '#9CA3AF',
    bgTint: 'rgba(107, 114, 128, 0.05)',
    borderTint: 'rgba(107, 114, 128, 0.2)',
    icon: '💬'
  }
};

// Helper to get subtab style, with fallback
const getSubtabStyle = (tabType: string | undefined) => {
  const type = tabType?.toLowerCase() || 'chat';
  return subtabStyles[type] || subtabStyles.chat;
};

interface SubTabsProps {
  subtabs: SubTab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  isLoading?: boolean;
  onFeedback?: (tabId: string, type: 'up' | 'down') => void;
  onModifyTab?: (tabId: string, tabTitle: string, suggestion: string, currentContent: string) => void;
  onDeleteTab?: (tabId: string) => void;
  onExpandedChange?: (isExpanded: boolean) => void;
  onRetrySubtab?: (tabId: string) => void;
}

const SubTabs: React.FC<SubTabsProps> = ({ 
  subtabs = [], 
  activeTabId, 
  onTabClick, 
  isLoading = false,
  onFeedback,
  onModifyTab,
  onDeleteTab,
  onExpandedChange,
  onRetrySubtab
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<string>(activeTabId || subtabs[0]?.id || '');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  
  // Ref for the subtabs container to calculate available space
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track previous content to detect actual updates
  const prevContentRef = useRef<string>('');
  
  // Track if this is the initial mount (to prevent auto-expand on page refresh)
  const isInitialMountRef = useRef<boolean>(true);
  
  // Track if subtabs have been auto-expanded at least once (first generation complete)
  const hasAutoExpandedOnceRef = useRef<boolean>(false);
  
  // Track if there are unread updates (show dot notification)
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState<boolean>(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string; tabTitle: string } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Modify modal state
  const [modifyModal, setModifyModal] = useState<{ tabId: string; tabTitle: string; currentContent: string } | null>(null);
  const [modifySuggestion, setModifySuggestion] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const modifyInputRef = useRef<HTMLTextAreaElement>(null);

  const currentActiveTab = activeTabId || localActiveTab;
  const activeTab = subtabs.find(tab => tab.id === currentActiveTab);
  
  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [contextMenu]);
  
  // Focus modify input when modal opens
  useEffect(() => {
    if (modifyModal && modifyInputRef.current) {
      modifyInputRef.current.focus();
    }
  }, [modifyModal]);
  
  // Handle modify submit
  const handleModifySubmit = useCallback(() => {
    if (!modifyModal || !modifySuggestion.trim() || isModifying) { return; }
    
    setIsModifying(true);
    
    // Call the parent handler with all context
    if (onModifyTab) {
      onModifyTab(
        modifyModal.tabId,
        modifyModal.tabTitle,
        modifySuggestion.trim(),
        modifyModal.currentContent
      );
    }
    
    // Close modal and reset state
    setModifyModal(null);
    setModifySuggestion('');
    setIsModifying(false);
  }, [modifyModal, modifySuggestion, isModifying, onModifyTab]);
  
  // Handle delete confirmation
  const handleDeleteConfirm = useCallback((tabId: string) => {
    if (onDeleteTab) {
      onDeleteTab(tabId);
    }
    setContextMenu(null);
  }, [onDeleteTab]);

  // Handle right-click on subtab (desktop)
  const handleContextMenu = (e: React.MouseEvent, tab: SubTab) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId: tab.id,
      tabTitle: tab.title
    });
  };
  
  // Handle long-press on subtab (mobile)
  const handleTouchStart = (e: React.TouchEvent, tab: SubTab) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        tabId: tab.id,
        tabTitle: tab.title
      });
    }, 500); // 500ms hold to trigger
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 🔍 DEBUG: Log subtabs state on every render
  console.log('🎨 [SubTabs] Rendering:', {
    subtabCount: subtabs.length,
    statuses: subtabs.map(s => ({ title: s.title, status: s.status, hasContent: !!s.content })),
    isExpanded,
    hasUserInteracted,
    activeTabTitle: activeTab?.title,
    activeTabStatus: activeTab?.status,
    activeTabHasContent: !!activeTab?.content
  });

  // Auto-expand when subtabs finish loading (ONLY if user hasn't manually controlled it)
  useEffect(() => {
    // Only auto-expand if user hasn't manually interacted with the accordion
    if (hasUserInteracted) {
      return;
    }

    // Create a content signature to detect actual content changes
    const currentContentSignature = subtabs
      .filter(tab => tab.status === 'loaded' && tab.content && tab.content.trim().length > 0)
      .map(tab => `${tab.id}:${tab.content?.length || 0}`)
      .join('|');
    
    // Check if content has actually changed (new content generated/updated)
    const contentChanged = currentContentSignature !== prevContentRef.current && currentContentSignature.length > 0;
    
    // ✅ FIX: More robust status checks
    const allLoading = subtabs.every(tab => tab.status === 'loading');
    const hasLoadedContent = subtabs.some(tab => 
      tab.status === 'loaded' && 
      tab.content && 
      tab.content.trim().length > 0 && 
      tab.content.trim() !== 'Loading...'
    );
    
    console.log('📂 [SubTabs] useEffect triggered:', {
      allLoading,
      hasLoadedContent,
      contentChanged,
      isExpanded,
      hasUserInteracted,
      isInitialMount: isInitialMountRef.current,
      currentContentSignature: currentContentSignature.substring(0, 50),
      prevContentSignature: prevContentRef.current.substring(0, 50)
    });
    
    // ✅ FIX: Collapse if all loading
    if (allLoading && isExpanded) {
      setIsExpanded(false);
      onExpandedChange?.(false);
    }
    
    // Mark initial mount as complete after first render with content
    if (isInitialMountRef.current && hasLoadedContent) {
      console.log('📂 [SubTabs] Initial mount complete - content already exists, NOT auto-expanding');
      isInitialMountRef.current = false;
      // Store the initial content signature so we don't expand for existing content
      prevContentRef.current = currentContentSignature;
      return;
    }
    
    // ✅ NEW BEHAVIOR: Auto-expand ONLY on first generation completion (during session)
    // Show dot notification for subsequent updates
    // Skip if user has manually interacted with the panel
    if (contentChanged && hasLoadedContent && !isExpanded && !hasUserInteracted) {
      if (!hasAutoExpandedOnceRef.current) {
        // First time generation complete - auto-expand
        console.log('📂 [SubTabs] Auto-expanding: first generation complete');
        setIsExpanded(true);
        onExpandedChange?.(true);
        hasAutoExpandedOnceRef.current = true;
      } else {
        // Subsequent updates - show dot notification instead of auto-expanding
        console.log('📂 [SubTabs] New updates detected - showing notification dot');
        setHasUnreadUpdates(true);
      }
    }
    
    // Update the previous content reference
    if (currentContentSignature.length > 0) {
      prevContentRef.current = currentContentSignature;
    }
  }, [subtabs, isExpanded, hasUserInteracted, onExpandedChange]);

  // Calculate the bottom position for the fixed panel
  const [panelBottom, setPanelBottom] = useState<number>(180);
  
  // Calculate panel position when expanded
  useEffect(() => {
    if (isExpanded && containerRef.current) {
      const calculatePanelPosition = () => {
        const container = containerRef.current;
        if (!container) return;
        
        // Get the container's position relative to viewport
        const rect = container.getBoundingClientRect();
        
        // Calculate the bottom position: distance from viewport bottom to top of button + margin
        const bottomFromViewport = window.innerHeight - rect.top + 8;
        setPanelBottom(bottomFromViewport);
      };
      
      calculatePanelPosition();
      
      // Recalculate on resize
      window.addEventListener('resize', calculatePanelPosition);
      return () => window.removeEventListener('resize', calculatePanelPosition);
    }
  }, [isExpanded]);

  const handleTabClick = (tabId: string) => {
    setLocalActiveTab(tabId);
    onTabClick?.(tabId);
  };

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setHasUserInteracted(true); // Mark that user has manually controlled the accordion
    
    // Clear unread updates notification when user manually opens
    if (newExpanded) {
      setHasUnreadUpdates(false);
    }
    
    onExpandedChange?.(newExpanded); // Notify parent of expanded state change
  };

  // Return null if no subtabs (after hooks)
  if (!subtabs || subtabs.length === 0) {
    return null;
  }

  // Check if any subtabs are still loading
  const hasLoadingSubtabs = subtabs.some(tab => tab.status === 'loading' || tab.content === 'Loading...');
  const allSubtabsLoading = subtabs.every(tab => tab.status === 'loading' || tab.content === 'Loading...');

  return (
    <div ref={containerRef} className="mb-4 relative">
      {/* Collapsible Header - Matching Latest Gaming News style */}
      <button
        onClick={() => { haptic.button(); toggleExpanded(); }}
        className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-[#1C1C1C] hover:bg-[#252525] border border-[#424242]/30 hover:border-[#424242]/60 transition-all duration-200 relative z-[51]"
      >
        <div className="flex items-center gap-2">
          <div className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            isExpanded 
              ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent' 
              : 'text-[#A3A3A3]'
          }`}>
            Lore & Insights
          </div>
          {/* Unread updates notification dot */}
          {hasUnreadUpdates && !isExpanded && !hasLoadingSubtabs && (
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-[#FF4D4D] animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#FF4D4D] animate-ping opacity-75" />
            </div>
          )}
          {/* Loading indicator when subtabs are being generated */}
          {hasLoadingSubtabs && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-[#FF4D4D] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-[#A3A3A3]">
                {allSubtabsLoading ? 'Generating...' : 'Updating...'}
              </span>
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-all duration-200 ${
            isExpanded 
              ? 'rotate-180 text-[#FF4D4D]' 
              : 'text-[#A3A3A3]'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content - Overlay positioned ABOVE the button on ALL screen sizes
          Z-INDEX STACKING ORDER (mobile):
          - z-[60]: Sidebar (when open)
          - z-[55]: Sidebar backdrop (when open)
          - z-50: SubTabs expanded panel (this)
          - z-40: SubTabs container (in ChatInterface)
          - z-30: Chat Thread Name header (in MainApp)
          
          POSITIONING: Fixed positioning on mobile to ensure it doesn't overflow.
          Uses CSS top/bottom constraints to stay within visible area.
          Top accounts for: header bar + progress bar + chat thread name (~150px total on mobile)
      */}
      {isExpanded && (
        <>
          {/* Backdrop overlay - close on click (mobile/tablet only) */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsExpanded(false)}
          />
          {/* 
            Fixed panel on mobile: Positioned between header elements and the button area.
            Top: 150px accounts for header + progress bar + chat thread name
            Bottom: dynamically calculated from button position
            
            Desktop (lg+): Uses absolute positioning with bottom-full to appear above the button.
            
            CRITICAL: Using CSS classes for ALL positioning to avoid JS/CSS breakpoint mismatch.
            The mobile styles (top/bottom) are applied via a style tag inside, only when NOT at lg breakpoint.
          */}
          <div
            className="subtabs-panel z-50 animate-fade-in fixed left-3 right-3 lg:absolute lg:left-0 lg:right-0 lg:bottom-full lg:mb-2 lg:max-h-[60vh] lg:top-auto"
            style={{
              // Mobile/tablet positioning - will be overridden by lg: classes on desktop
              '--mobile-top': '150px',
              '--mobile-bottom': `${panelBottom}px`,
            } as React.CSSProperties}
          >
            {/* Apply mobile positioning via inline style that only affects non-lg screens */}
            <style>{`
              @media (max-width: 1023px) {
                .subtabs-panel {
                  top: var(--mobile-top) !important;
                  bottom: var(--mobile-bottom) !important;
                }
              }
            `}</style>
            <div className="h-full bg-[#1C1C1C] border border-[#424242]/60 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Tab Headers - Grid layout on all screen sizes */}
          <div className="border-b border-[#424242]/40 flex-shrink-0">
            {/* Mobile: 3-4 cols | Tablet (sm/md): 4 cols | Desktop (lg+): 5 cols */}
            <div className="grid grid-cols-3 xs:grid-cols-4 gap-1.5 p-2 sm:grid-cols-4 sm:gap-2 sm:p-3 lg:grid-cols-5">
              {subtabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  onContextMenu={(e) => handleContextMenu(e, tab)}
                  onTouchStart={(e) => handleTouchStart(e, tab)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  className={`
                    px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg transition-all duration-200 select-none
                    text-center
                    ${currentActiveTab === tab.id
                      ? 'bg-[#FF4D4D] text-white shadow-lg'
                      : 'bg-[#2E2E2E]/60 text-[#A3A3A3] hover:bg-[#424242]/60 hover:text-[#F5F5F5]'
                    }
                    ${tab.isNew ? 'ring-2 ring-[#FF4D4D]/50' : ''}
                  `}
                  disabled={isLoading}
                  title={tab.title}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    {tab.isNew && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FF4D4D] rounded-full animate-pulse flex-shrink-0" />
                    )}
                    <span className="leading-tight">{tab.title}</span>
                    {tab.status === 'loading' && (
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                    {tab.status === 'error' && (
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0">⚠</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content - Scrollable area that fills available space */}
          {activeTab && (
            <div 
              className="p-3 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar transition-all duration-300 rounded-b-xl bg-[#2E2E2E]/40"
            >
              {activeTab.status === 'loading' || (!activeTab.content && isLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-[#A3A3A3]">
                    <div 
                      className="w-5 h-5 border-2 border-[#A3A3A3] border-t-transparent rounded-full animate-spin"
                    />
                    <span>Loading {activeTab.title}...</span>
                  </div>
                </div>
              ) : activeTab.status === 'error' ? (
                <div className="text-center py-8 text-[#A3A3A3]">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p>Failed to load {activeTab.title} content</p>
                  <p className="text-sm mt-1">Please try again later</p>
                </div>
              ) : activeTab.content ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <MarkdownRenderer
                    content={activeTab.content}
                    variant="subtab"
                    accentColor={getSubtabStyle(activeTab.type).accent}
                    accentHoverColor={getSubtabStyle(activeTab.type).accentHover}
                  />
                  
                  {/* Feedback buttons */}
                  {onFeedback && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#424242]/50">
                      <span className="text-xs text-[#A3A3A3] mr-2">Was this helpful?</span>
                      <button
                        onClick={() => onFeedback(activeTab.id, 'up')}
                        className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-green-400 hover:bg-green-400/10 transition-colors"
                        title="Helpful"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onFeedback(activeTab.id, 'down')}
                        className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Not helpful"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
                      {onRetrySubtab && (
                        <button
                          onClick={() => onRetrySubtab(activeTab.id)}
                          className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10 transition-colors"
                          title="Retry generating this tab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      {onRetrySubtab && (
                        <button
                          onClick={() => onRetrySubtab(activeTab.id)}
                          className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10 transition-colors"
                          title="Retry generating this tab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[#A3A3A3]">
                  <p>No content available for {activeTab.title}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </>
      )}
      
      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#1C1C1C] border border-[#424242] rounded-lg shadow-2xl overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 10000
          }}
        >
          <div className="px-3 py-2 border-b border-[#424242]/50 bg-[#2A2A2A]">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
              {contextMenu.tabTitle}
            </span>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                // Find the tab to get its current content
                const tab = subtabs.find(t => t.id === contextMenu.tabId);
                setModifyModal({
                  tabId: contextMenu.tabId,
                  tabTitle: contextMenu.tabTitle,
                  currentContent: tab?.content || ''
                });
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-[#F5F5F5] hover:bg-[#E53A3A]/20 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Modify Tab</span>
            </button>
            <button
              onClick={() => handleDeleteConfirm(contextMenu.tabId)}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Tab</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Modify Modal Overlay */}
      {modifyModal && (
        <div 
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModifyModal(null);
              setModifySuggestion('');
            }
          }}
        >
          <div 
            className="bg-[#1C1C1C] border border-[#424242] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#424242]/50 bg-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-semibold text-white">Modify "{modifyModal.tabTitle}"</span>
              </div>
              <button
                onClick={() => {
                  setModifyModal(null);
                  setModifySuggestion('');
                }}
                className="p-1 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#424242]/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-[#A3A3A3]">
                Describe what changes you'd like to see in this tab. The AI will regenerate the content based on your feedback.
              </p>
              
              <textarea
                ref={modifyInputRef}
                value={modifySuggestion}
                onChange={(e) => setModifySuggestion(e.target.value)}
                placeholder="e.g., Make it more detailed, focus on combat strategies, include item locations..."
                className="w-full h-32 px-3 py-2 bg-[#2A2A2A] border border-[#424242] rounded-lg text-white placeholder-[#6B7280] resize-none focus:outline-none focus:ring-2 focus:ring-[#E53A3A]/50 focus:border-[#E53A3A]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleModifySubmit();
                  }
                }}
              />
              
              <p className="text-xs text-[#6B7280]">
                Press Ctrl+Enter to submit
              </p>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-[#424242]/50 bg-[#2A2A2A]">
              <button
                onClick={() => {
                  setModifyModal(null);
                  setModifySuggestion('');
                }}
                className="px-4 py-2 text-sm font-medium text-[#A3A3A3] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModifySubmit}
                disabled={!modifySuggestion.trim() || isModifying}
                className="px-4 py-2 text-sm font-medium bg-[#E53A3A] text-white rounded-lg hover:bg-[#CC2E2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isModifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubTabs;
