import React from 'react';
import { Helmet } from 'react-helmet-async';
import Modal from '../ui/Modal';
import { blogPosts, getRelatedPosts, BlogPost } from '../../data/blogPosts';

interface BlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  slug: string | null;
  onSelectPost?: (slug: string) => void;
}

const BlogPostModal: React.FC<BlogPostModalProps> = ({ 
  isOpen, 
  onClose, 
  onBack, 
  slug,
  onSelectPost 
}) => {
  const post = blogPosts.find(p => p.slug === slug);
  const relatedPosts = slug ? getRelatedPosts(slug, 3) : [];

  if (!post) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="7xl">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neutral-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Guide Not Found</h2>
          <p className="text-text-secondary mb-6">The guide you're looking for doesn't exist or has been moved.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Guides
          </button>
        </div>
      </Modal>
    );
  }

  // Parse markdown content into sections
  const renderContent = () => {
    const sections = post.content.split(/(?=## )/);
    
    return sections.map((section, idx) => {
      if (!section.trim()) {
        return null;
      }
      
      const lines = section.split('\n');
      const firstLine = lines[0];
      const isH2 = firstLine.startsWith('## ');
      
      if (isH2) {
        const title = firstLine.replace('## ', '');
        const content = lines.slice(1).join('\n');
        
        // Apply gradient to "Otagon" in headers
        const renderTitle = () => {
          if (title.includes('Otagon')) {
            const parts = title.split('Otagon');
            return (
              <>
                {parts[0]}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
                  Otagon
                </span>
                {parts[1]}
              </>
            );
          }
          return title;
        };
        
        return (
          <section key={idx} className="mb-10 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-5">
              {renderTitle()}
            </h2>
            <div className="space-y-4">
              {renderMarkdown(content)}
            </div>
          </section>
        );
      }
      
      return (
        <div key={idx} className="mb-6">
          {renderMarkdown(section)}
        </div>
      );
    });
  };

  // Enhanced markdown renderer
  const renderMarkdown = (text: string) => {
    const elements: JSX.Element[] = [];
    const lines = text.split('\n');
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        const ListTag = listType === 'ul' ? 'ul' : 'ol';
        elements.push(
          <ListTag 
            key={`list-${elements.length}`} 
            className={`${listType === 'ul' ? 'list-disc' : 'list-decimal'} list-outside ml-6 space-y-3 my-5 text-text-secondary`}
          >
            {currentList.map((item, i) => (
              <li key={i} className="leading-relaxed pl-2">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      
      // Skip empty lines and standalone hash marks
      if (!trimmed || trimmed === '#' || trimmed === '##' || trimmed === '###') {
        flushList();
        return;
      }

      // H3 headers
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${lineIdx}`} className="text-xl lg:text-2xl font-bold text-white mt-8 mb-4">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(trimmed.replace(/^\d+\.\s/, ''));
        return;
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(trimmed.replace(/^[-*]\s/, ''));
        return;
      }

      // Regular paragraph
      flushList();
      if (trimmed) {
        elements.push(
          <p key={`p-${lineIdx}`} className="text-text-secondary text-base lg:text-lg leading-relaxed">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  // Parse inline markdown
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold text **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(
          <strong key={key++} className="text-white font-semibold">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Inline code `code`
      const codeMatch = remaining.match(/`([^`]+)`/);
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(remaining.slice(0, codeMatch.index));
        }
        parts.push(
          <code key={key++} className="bg-neutral-800/80 text-primary px-2 py-1 rounded text-sm font-mono">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
        continue;
      }

      parts.push(remaining);
      break;
    }

    return parts;
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | Otagon Gaming Guides</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://otagon.app/?modal=blog-post&slug=${post.slug}`} />
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://otagon.app/?modal=blog-post&slug=${post.slug}`} />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        
        {/* JSON-LD structured data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt,
            "author": {
              "@type": "Organization",
              "name": "Otagon Gaming Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Otagon",
              "logo": {
                "@type": "ImageObject",
                "url": "https://otagon.app/logo.png"
              }
            },
            "datePublished": post.date,
            "dateModified": post.date,
            "articleSection": post.category,
            "keywords": `${post.game}, gaming guide, walkthrough, tips, strategy, ${post.category.toLowerCase()}`
          })}
        </script>
      </Helmet>
      
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="7xl" className="p-0">
        <div className="max-h-[85vh] overflow-y-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8">
        {/* Back Navigation */}
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-8"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">All Gaming Guides</span>
        </button>

        {/* Article Header */}
        <header className="mb-12 lg:mb-16 max-w-5xl">
          {/* Meta Tags */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-sm font-bold text-primary bg-primary/15 px-4 py-1.5 rounded-full">
              {post.category}
            </span>
            <span className="text-sm font-semibold text-secondary">
              {post.game}
            </span>
            <span className="text-sm text-text-muted">•</span>
            <span className="text-sm text-text-muted">{post.readTime} read</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            {post.title}
          </h1>

          {/* Excerpt / Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-text-secondary leading-relaxed mb-8 max-w-4xl">
            {post.excerpt}
          </p>

          {/* Author Info */}
          <div className="flex items-center gap-4 py-6 border-y border-neutral-800/70">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold">OT</span>
            </div>
            <div>
              <p className="text-white font-semibold">{post.author}</p>
              <p className="text-sm text-text-muted">
                Published {new Date(post.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="max-w-4xl mx-auto lg:mx-0 space-y-5">
          {renderContent()}
        </article>

        {/* CTA Section */}
        <div className="mt-10 lg:mt-14 p-6 md:p-8 lg:p-10 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent border border-primary/20 rounded-xl lg:rounded-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Ready to Dominate {post.game}?
              </h3>
              <p className="text-text-secondary max-w-xl">
                Stop alt-tabbing to wikis. Otagon AI gives you instant, personalized hints on your phone or second monitor while you play.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                window.location.href = '/';
              }}
              className="shrink-0 inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Try Otagon Free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Related Guides */}
        {relatedPosts.length > 0 && (
          <div className="mt-10 lg:mt-14 pt-8 lg:pt-10 border-t border-neutral-800">
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-5 lg:mb-6">More {post.category} Guides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
              {relatedPosts.map((related: BlogPost) => (
                <button
                  key={related.id}
                  onClick={() => onSelectPost?.(related.slug)}
                  className="group p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-left hover:border-primary/40 hover:bg-neutral-800/60 transition-all duration-300"
                >
                  <span className="text-xs font-semibold text-secondary">{related.game}</span>
                  <h4 className="text-white font-bold mt-2 mb-2 group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                  <span className="text-xs text-text-muted">{related.readTime} read</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
    </>
  );
};

export default BlogPostModal;
