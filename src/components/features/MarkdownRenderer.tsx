import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type MarkdownVariant = 'chat' | 'subtab';

interface MarkdownRendererProps {
  content: string;
  variant?: MarkdownVariant;
  /** Accent color for subtab variant (e.g., '#FF4D4D') */
  accentColor?: string;
  /** Hover accent color for subtab variant */
  accentHoverColor?: string;
  className?: string;
}

/**
 * Shared markdown renderer component for AI responses.
 * Consolidates duplicate ReactMarkdown configurations from ChatInterface and SubTabs.
 * 
 * @param variant - 'chat' for chat messages (responsive sizing), 'subtab' for insight panels
 * @param accentColor - Custom accent color for links/code in subtab variant
 */
export function MarkdownRenderer({
  content,
  variant = 'chat',
  accentColor = '#FF4D4D',
  accentHoverColor = '#FF6B6B',
  className = '',
}: MarkdownRendererProps) {
  const isChat = variant === 'chat';

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className={isChat 
              ? "text-base sm:text-lg font-bold text-[#F5F5F5] mb-2 sm:mb-3 mt-1 sm:mt-2"
              : "text-lg font-bold text-[#F5F5F5] mb-3"
            }>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={isChat
              ? "text-sm sm:text-base font-semibold text-[#F5F5F5] mb-1.5 sm:mb-2 mt-1 sm:mt-2"
              : "text-base font-semibold text-[#F5F5F5] mb-2"
            }>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={isChat
              ? "text-sm font-semibold text-[#F5F5F5] mb-1.5 sm:mb-2 mt-1 sm:mt-2"
              : "text-sm font-semibold text-[#F5F5F5] mb-2"
            }>{children}</h3>
          ),
          p: ({ children }) => (
            <p className={isChat
              ? "text-sm sm:text-base text-[#CFCFCF] leading-relaxed mb-2 sm:mb-3"
              : "text-[#CFCFCF] leading-relaxed mb-2"
            }>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className={isChat
              ? "list-disc list-outside ml-4 sm:ml-5 text-sm sm:text-base text-[#CFCFCF] mb-2 sm:mb-3 space-y-1 sm:space-y-1.5"
              : "list-disc list-inside text-[#CFCFCF] mb-2 space-y-1"
            }>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={isChat
              ? "list-decimal list-outside ml-4 sm:ml-5 text-sm sm:text-base text-[#CFCFCF] mb-2 sm:mb-3 space-y-1 sm:space-y-1.5"
              : "list-decimal list-inside text-[#CFCFCF] mb-2 space-y-1"
            }>{children}</ol>
          ),
          li: ({ children }) => (
            <li className={isChat
              ? "text-sm sm:text-base text-[#CFCFCF] leading-relaxed"
              : "text-[#CFCFCF]"
            }>{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#F5F5F5]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#E0E0E0]">{children}</em>
          ),
          code: ({ children }) => (
            <code 
              className="px-1 py-0.5 rounded text-xs font-mono"
              style={{ 
                backgroundColor: '#2E2E2E', 
                color: accentColor,
                ...(isChat && { padding: '0.125rem 0.375rem' })
              }}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className={isChat
              ? "bg-[#1C1C1C] border border-[#424242] rounded-lg p-3 overflow-x-auto mb-3"
              : "bg-[#1C1C1C] border border-[#424242] rounded-lg p-3 overflow-x-auto"
            }>
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote 
              className={isChat
                ? "pl-4 italic text-[#B0B0B0] my-3"
                : "pl-4 italic text-[#B0B0B0] my-2"
              }
              style={{ borderLeft: `4px solid ${accentColor}` }}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline transition-colors"
              style={{ color: accentColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = accentHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = accentColor}
            >
              {children}
            </a>
          ),
          br: () => <br className="my-1" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
