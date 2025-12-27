import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  onCreateCustomSubtab?: (name: string, type: string, instructions: string) => void;
  forceExpand?: boolean; // Force expand the panel (used during generation)
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
  onRetrySubtab,
  onCreateCustomSubtab,
  forceExpand = false
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<string>(activeTabId || subtabs[0]?.id || '');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  
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
  
  // Custom subtab creation modal state
  const [showCustomSubtabModal, setShowCustomSubtabModal] = useState(false);
  const [customSubtabName, setCustomSubtabName] = useState('');
  const [customSubtabType, setCustomSubtabType] = useState<string>('chat');
  const [customSubtabInstructions, setCustomSubtabInstructions] = useState('');
  const [isCreatingCustomSubtab, setIsCreatingCustomSubtab] = useState(false);
  const customSubtabNameRef = useRef<HTMLInputElement>(null);

  const currentActiveTab = activeTabId || localActiveTab;
  const activeTab = useMemo(() => subtabs.find(tab => tab.id === currentActiveTab), [subtabs, currentActiveTab]);
  
  // 🚀 PERF: Memoize expensive derived values to prevent recalculation on every render
  const { allLoading, hasLoadedContent, contentSignature } = useMemo(() => {
    const allLoad = subtabs.every(tab => tab.status === 'loading');
    const hasLoaded = subtabs.some(tab => 
      tab.status === 'loaded' && 
      tab.content && 
      tab.content.trim().length > 0 && 
      tab.content.trim() !== 'Loading...'
    );
    const signature = subtabs
      .filter(tab => tab.status === 'loaded' && tab.content && tab.content.trim().length > 0)
      .map(tab => `${tab.id}:${tab.content?.length || 0}`)
      .join('|');
    return { allLoading: allLoad, hasLoadedContent: hasLoaded, contentSignature: signature };
  }, [subtabs]);
  
  // Track if we've already responded to forceExpand to prevent re-expansion after user closes
  const hasForceExpandedRef = useRef(false);
  
  // Force expand when forceExpand prop becomes true (only once)
  useEffect(() => {
    if (forceExpand && !isExpanded && !hasForceExpandedRef.current) {
      console.log('📂 [SubTabs] Force expanding due to forceExpand prop');
      setIsExpanded(true);
      onExpandedChange?.(true);
      hasForceExpandedRef.current = true;
    }
    // Reset the flag when forceExpand becomes false
    if (!forceExpand) {
      hasForceExpandedRef.current = false;
    }
  }, [forceExpand, isExpanded, onExpandedChange]);
  
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
  
  // Focus custom subtab name input when modal opens
  useEffect(() => {
    if (showCustomSubtabModal && customSubtabNameRef.current) {
      customSubtabNameRef.current.focus();
    }
  }, [showCustomSubtabModal]);
  
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
  
  // Handle custom subtab creation
  const handleCustomSubtabCreate = useCallback(() => {
    if (!customSubtabName.trim() || !customSubtabInstructions.trim() || isCreatingCustomSubtab) { return; }
    
    setIsCreatingCustomSubtab(true);
    
    // Call the parent handler with custom subtab data
    if (onCreateCustomSubtab) {
      onCreateCustomSubtab(
        customSubtabName.trim(),
        customSubtabType,
        customSubtabInstructions.trim()
      );
    }
    
    // Close modal and reset state
    setShowCustomSubtabModal(false);
    setCustomSubtabName('');
    setCustomSubtabType('chat');
    setCustomSubtabInstructions('');
    setIsCreatingCustomSubtab(false);
  }, [customSubtabName, customSubtabType, customSubtabInstructions, isCreatingCustomSubtab, onCreateCustomSubtab]);
  
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
    e.stopPropagation();
    // Position menu slightly below and to the right of cursor with viewport boundary checking
    const menuWidth = 180;
    const menuHeight = 120;
    const offsetX = 5;
    const offsetY = 5;
    
    const adjustedX = Math.min(e.clientX + offsetX, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(e.clientY + offsetY, window.innerHeight - menuHeight - 10);
    
    console.log('Context menu triggered:', { adjustedX, adjustedY, tabTitle: tab.title });
    
    // Highlight/activate the tab when right-clicking
    handleTabClick(tab.id);
    
    setContextMenu({
      x: adjustedX,
      y: adjustedY,
      tabId: tab.id,
      tabTitle: tab.title
    });
  };
  
  // Handle long-press on subtab (mobile)
  const handleTouchStart = (e: React.TouchEvent, tab: SubTab) => {
    const startTouch = e.touches[0];
    
    console.log('Touch started:', tab.title);
    
    longPressTimer.current = setTimeout(() => {
      console.log('Long press triggered for:', tab.title);
      const touch = e.touches[0] || startTouch;
      // Position menu slightly offset from touch point with viewport boundary checking
      const menuWidth = 180;
      const menuHeight = 120;
      const offsetX = 10;
      const offsetY = 10;
      
      const adjustedX = Math.min(touch.clientX + offsetX, window.innerWidth - menuWidth - 10);
      const adjustedY = Math.min(touch.clientY + offsetY, window.innerHeight - menuHeight - 10);
      
      setContextMenu({
        x: adjustedX,
        y: adjustedY,
        tabId: tab.id,
        tabTitle: tab.title
      });
      console.log(`Long-pressed: ${tab.title} at (${adjustedX}, ${adjustedY})`);
    }, 500); // 500ms hold to trigger
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
  const handleTouchMove = () => {
    // Allow small movements, only cancel if significant movement
    // For now, don't cancel on move to allow long press to work
  };

  // 🔍 DEBUG: Log subtabs state on every render - only in development and throttled
  // 🚀 PERF: Removed per-render logging - use React DevTools instead for debugging

  // Auto-expand when subtabs finish loading (ONLY if user hasn't manually controlled it)
  useEffect(() => {
    // Only auto-expand if user hasn't manually interacted with the accordion
    if (hasUserInteracted) {
      return;
    }

    // Use memoized contentSignature instead of recalculating
    const currentContentSignature = contentSignature;
    
    // Check if content has actually changed (new content generated/updated)
    const contentChanged = currentContentSignature !== prevContentRef.current && currentContentSignature.length > 0;
    
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
  // 🚀 PERF: Use memoized values in dependencies to reduce effect triggers
  }, [contentSignature, allLoading, hasLoadedContent, isExpanded, hasUserInteracted, onExpandedChange]);

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
    
    // Always notify parent of expanded state change (so parent can reset forceExpand if user closed)
    onExpandedChange?.(newExpanded);
  };

  // Return null if no subtabs (after hooks)
  if (!subtabs || subtabs.length === 0) {
    return null;
  }

  // Check if any subtabs are still loading
  const hasLoadingSubtabs = subtabs.some(tab => tab.status === 'loading' || tab.content === 'Loading...');
  const allSubtabsLoading = subtabs.every(tab => tab.status === 'loading' || tab.content === 'Loading...');

  return (
    <div className="mb-4 relative">
      {/* Collapsible Header - Matching Latest Gaming News style */}
      {/* z-30 ensures it's visible above other content but below sidebar (z-60) on mobile */}
      <button
        onClick={toggleExpanded}
        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg border transition-all duration-200 relative z-30 ${
          isExpanded
            ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] border-[#FF4D4D] hover:border-[#FFAB40]'
            : 'bg-[#1C1C1C] hover:bg-[#252525] border-[#424242]/30 hover:border-[#424242]/60'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            isExpanded 
              ? 'text-white' 
              : 'text-[#A3A3A3]'
          }`}>
            Lore & Insights
          </div>
          {/* Unread updates notification dot - show when there are updates or when content exists and collapsed */}
          {!isExpanded && !hasLoadingSubtabs && (hasUnreadUpdates || (subtabs.some(tab => tab.content && tab.content !== 'Loading...'))) && (
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

      {/* Collapsible Content - Overlay positioned ABOVE the button, matching Gaming News style */}
      {isExpanded && (
        <>
          {/* Backdrop overlay - close on click (both mobile and desktop) */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => {
              setIsExpanded(false);
              setHasUserInteracted(true);
              onExpandedChange?.(false); // Notify parent that user closed the panel
            }}
          />
          {/* 
            Mobile: FIXED positioning to break out of all stacking contexts and appear above thread name
            Desktop: ABSOLUTE positioning relative to parent
            Panel positioned above Lore & Insights button on mobile (~250px from bottom for button + input)
          */}
          <div
            className="lg:absolute fixed lg:bottom-full bottom-[250px] left-3 right-3 lg:left-0 lg:right-0 mb-2 z-50 animate-fade-in"
          >
            <div className="bg-[#1C1C1C]/95 backdrop-blur-md border border-[#424242]/60 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[60vh]">
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
                  onTouchMove={handleTouchMove}
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
              
              {/* Add Tab Button */}
              <button
                onClick={() => {
                  setShowCustomSubtabModal(true);
                  setCustomSubtabName('');
                  setCustomSubtabType('chat');
                  setCustomSubtabInstructions('');
                }}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg transition-all duration-200 select-none text-center bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 border border-dashed border-green-500/40"
                title="Add Tab"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="leading-tight">Add Tab</span>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content - Scrollable area that fills available space */}
          {activeTab && (
            <div 
              className="p-4 sm:p-5 md:p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar transition-all duration-300 rounded-b-xl bg-[#2E2E2E]/40 text-left"
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
                <div className="prose prose-invert prose-sm max-w-none text-left">
                  <MarkdownRenderer
                    content={activeTab.content}
                    variant="subtab"
                    accentColor={getSubtabStyle(activeTab.type).accent}
                    accentHoverColor={getSubtabStyle(activeTab.type).accentHover}
                  />
                  
                  {/* Feedback buttons */}
                  {onFeedback && (
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#424242]/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#A3A3A3] mr-2">Was this helpful?</span>
                      <button
                        onClick={() => onFeedback(activeTab.id, 'up')}
                        className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-green-400 hover:bg-green-400/10 transition-colors flex items-center justify-center"
                        title="Helpful"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onFeedback(activeTab.id, 'down')}
                        className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center"
                        title="Not helpful"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
                      {onRetrySubtab && (
                        <button
                          onClick={() => onRetrySubtab(activeTab.id)}
                          className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10 transition-colors flex items-center justify-center"
                          title="Retry generating this tab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      </div>
                      <span className="text-[10px] text-[#666666] hidden sm:block">Right-click tabs</span>
                      <span className="text-[10px] text-[#666666] sm:hidden">Long press tabs</span>
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
      
      {/* Right-click Context Menu - Rendered via Portal to escape overflow constraints */}
      {contextMenu && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed bg-[#1C1C1C] border border-[#424242] rounded-lg shadow-2xl overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 999999,
            maxWidth: '180px',
            pointerEvents: 'auto'
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
        </div>,
        document.body
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
      
      {/* Custom Subtab Creation Modal */}
      {showCustomSubtabModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowCustomSubtabModal(false);
              setCustomSubtabName('');
              setCustomSubtabType('chat');
              setCustomSubtabInstructions('');
            }}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-[#1A1A1A] rounded-xl border border-[#424242] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#424242]/50 bg-[#2A2A2A]">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Custom Tab
              </h3>
              <button
                onClick={() => {
                  setShowCustomSubtabModal(false);
                  setCustomSubtabName('');
                  setCustomSubtabType('chat');
                  setCustomSubtabInstructions('');
                }}
                className="text-[#A3A3A3] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-[#A3A3A3]">
                Create a custom tab with specific instructions for AI generation.
              </p>
              
              {/* Tab Name Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tab Name <span className="text-[#E53A3A]">*</span>
                </label>
                <input
                  ref={customSubtabNameRef}
                  type="text"
                  value={customSubtabName}
                  onChange={(e) => setCustomSubtabName(e.target.value)}
                  placeholder="e.g., Boss Strategies, Secret Locations, Build Guide..."
                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#424242] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#E53A3A]/50 focus:border-[#E53A3A]"
                  maxLength={50}
                />
              </div>
              
              {/* Tab Type Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tab Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(subtabStyles).map(([type, style]) => (
                    <button
                      key={type}
                      onClick={() => setCustomSubtabType(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        customSubtabType === type
                          ? 'border-current bg-current/10'
                          : 'border-[#424242] bg-[#2A2A2A] hover:border-[#666666]'
                      }`}
                      style={{ 
                        color: customSubtabType === type ? style.accent : '#A3A3A3'
                      }}
                    >
                      <span className="text-base">{style.icon}</span>
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Instructions Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Instructions for AI <span className="text-[#E53A3A]">*</span>
                </label>
                <textarea
                  value={customSubtabInstructions}
                  onChange={(e) => setCustomSubtabInstructions(e.target.value)}
                  placeholder={`Describe what information this tab should contain. Be specific about what you want the AI to generate...\n\nExample: "Create a detailed boss guide covering attack patterns, telegraphs, phase transitions, effective counter-strategies, and recommended equipment for each major boss encounter."`}
                  className="w-full h-32 px-3 py-2 bg-[#2A2A2A] border border-[#424242] rounded-lg text-white placeholder-[#6B7280] resize-none focus:outline-none focus:ring-2 focus:ring-[#E53A3A]/50 focus:border-[#E53A3A]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleCustomSubtabCreate();
                    }
                  }}
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Press Ctrl+Enter to create
                </p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-[#424242]/50 bg-[#2A2A2A]">
              <button
                onClick={() => {
                  setShowCustomSubtabModal(false);
                  setCustomSubtabName('');
                  setCustomSubtabType('chat');
                  setCustomSubtabInstructions('');
                }}
                className="px-4 py-2 text-sm font-medium text-[#A3A3A3] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSubtabCreate}
                disabled={!customSubtabName.trim() || !customSubtabInstructions.trim() || isCreatingCustomSubtab}
                className="px-4 py-2 text-sm font-medium bg-[#E53A3A] text-white rounded-lg hover:bg-[#CC2E2E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isCreatingCustomSubtab ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Tab
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SubTabs;
