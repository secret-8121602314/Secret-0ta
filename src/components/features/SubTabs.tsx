import React, { useState, useEffect } from 'react';
import { SubTab } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SubTabsProps {
  subtabs: SubTab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  isLoading?: boolean;
}

const SubTabs: React.FC<SubTabsProps> = ({ 
  subtabs = [], 
  activeTabId, 
  onTabClick, 
  isLoading = false 
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<string>(activeTabId || subtabs[0]?.id || '');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);

  const currentActiveTab = activeTabId || localActiveTab;
  const activeTab = subtabs.find(tab => tab.id === currentActiveTab);

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

    // ✅ FIX: More robust status checks
    const allLoading = subtabs.every(tab => tab.status === 'loading');
    const anyLoaded = subtabs.some(tab => tab.status === 'loaded');
    const allLoaded = subtabs.every(tab => tab.status === 'loaded');
    
    // Check if we have subtabs that are loaded with actual content
    const hasLoadedContent = subtabs.some(tab => 
      tab.status === 'loaded' && 
      tab.content && 
      tab.content.trim().length > 0 && 
      tab.content.trim() !== 'Loading...'
    );
    
    console.log('📂 [SubTabs] useEffect triggered:', {
      allLoading,
      anyLoaded,
      allLoaded,
      hasLoadedContent,
      isExpanded,
      hasUserInteracted,
      subtabStatuses: subtabs.map(s => ({ title: s.title, status: s.status })),
      subtabContentLengths: subtabs.map(s => ({ title: s.title, length: s.content?.length || 0 }))
    });
    
    // ✅ FIX: Collapse if all loading
    if (allLoading && isExpanded) {
      console.log('📂 [SubTabs] Collapsing subtabs - all loading');
      setIsExpanded(false);
    }
    
    // ✅ FIX: Expand when ANY content loads (more responsive)
    // Changed from hasLoadedContent to anyLoaded for immediate feedback
    if (anyLoaded && !isExpanded) {
      console.log('📂 [SubTabs] ✅ AUTO-EXPANDING - detected loaded subtabs');
      setIsExpanded(true);
    }
    
    // ✅ NEW: Additional check for all loaded (belt and suspenders)
    if (allLoaded && !isExpanded && subtabs.length > 0) {
      console.log('📂 [SubTabs] ✅ AUTO-EXPANDING - all subtabs loaded');
      setIsExpanded(true);
    }
  }, [subtabs, isExpanded, hasUserInteracted]);

  const handleTabClick = (tabId: string) => {
    setLocalActiveTab(tabId);
    onTabClick?.(tabId);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setHasUserInteracted(true); // Mark that user has manually controlled the accordion
  };

  // Return null if no subtabs (after hooks)
  if (!subtabs || subtabs.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* Collapsible Header - Matching Latest Gaming News style */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between mb-2 py-2 px-3 rounded-lg bg-[#1C1C1C]/50 hover:bg-[#1C1C1C] border border-[#424242]/30 hover:border-[#424242]/60 transition-all duration-200"
      >
        <div className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">
          Lore & Insights
        </div>
        <svg
          className={`w-4 h-4 text-[#A3A3A3] transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded 
            ? 'max-h-[500px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-xl backdrop-blur-sm">
          {/* Tab Headers */}
          <div className="flex items-center gap-2 p-2 sm:p-3 border-b border-[#424242]/40">
            <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
              {subtabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                    ${currentActiveTab === tab.id
                      ? 'bg-[#FF4D4D] text-white shadow-lg'
                      : 'bg-[#2E2E2E]/60 text-[#A3A3A3] hover:bg-[#424242]/60 hover:text-[#F5F5F5]'
                    }
                    ${tab.isNew ? 'ring-2 ring-[#FF4D4D]/50' : ''}
                  `}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    {tab.isNew && (
                      <div className="w-2 h-2 bg-[#FF4D4D] rounded-full animate-pulse" />
                    )}
                    <span>{tab.title}</span>
                    {tab.status === 'loading' && (
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    )}
                    {tab.status === 'error' && (
                      <div className="w-3 h-3 text-red-400">⚠</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab && (
            <div className="p-4 max-h-64 overflow-y-auto transition-all duration-300">
              {activeTab.status === 'loading' || (!activeTab.content && isLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-[#A3A3A3]">
                    <div className="w-5 h-5 border-2 border-[#FF4D4D] border-t-transparent rounded-full animate-spin" />
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold text-[#F5F5F5] mb-3">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-[#CFCFCF] leading-relaxed mb-2">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside text-[#CFCFCF] mb-2 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside text-[#CFCFCF] mb-2 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-[#CFCFCF]">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-[#F5F5F5]">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-[#E0E0E0]">{children}</em>
                      ),
                      code: ({ children }) => (
                        <code className="bg-[#2E2E2E] text-[#FF4D4D] px-1 py-0.5 rounded text-xs font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-[#1C1C1C] border border-[#424442] rounded-lg p-3 overflow-x-auto">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#FF4D4D] pl-4 italic text-[#B0B0B0] my-2">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#FF4D4D] hover:text-[#FF6B6B] underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {activeTab.content}
                  </ReactMarkdown>
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
    </div>
  );
};

export default SubTabs;
