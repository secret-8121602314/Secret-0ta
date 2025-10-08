import React, { useState } from 'react';
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
  subtabs, 
  activeTabId, 
  onTabClick, 
  isLoading = false 
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<string>(activeTabId || subtabs[0]?.id || '');

  const currentActiveTab = activeTabId || localActiveTab;
  const activeTab = subtabs.find(tab => tab.id === currentActiveTab);

  const handleTabClick = (tabId: string) => {
    setLocalActiveTab(tabId);
    onTabClick?.(tabId);
  };

  if (!subtabs || subtabs.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-xl backdrop-blur-sm">
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#424242]/40">
        {subtabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200
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

      {/* Tab Content */}
      {activeTab && (
        <div className="p-4 max-h-64 overflow-y-auto">
          {isLoading && activeTab.status === 'loading' ? (
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
          ) : (
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
                    <pre className="bg-[#1C1C1C] border border-[#424242] rounded-lg p-3 overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#FF4D4D] pl-4 italic text-[#B0B0B0] my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {activeTab.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubTabs;
