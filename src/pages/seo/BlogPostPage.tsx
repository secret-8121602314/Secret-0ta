import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEOPageLayout } from '../../components/layout/SEOPageLayout';
import { blogPosts, getRelatedPosts, BlogPost } from '../../data/blogPosts';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const post = useMemo(() => {
    return blogPosts.find((p) => p.slug === slug);
  }, [slug]);

  const relatedPosts = useMemo(() => {
    return slug ? getRelatedPosts(slug, 3) : [];
  }, [slug]);

  // Extract table of contents from markdown
  const tableOfContents = useMemo(() => {
    if (!post) {return [];}
    
    const headings: Array<{ id: string; title: string }> = [];
    const h2Regex = /^## (.+)$/gm;
    let match;
    
    while ((match = h2Regex.exec(post.content)) !== null) {
      const title = match[1].trim();
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ id, title });
    }
    
    return headings;
  }, [post]);

  // Scroll to heading on click
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveHeading(id);
    }
  };

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    tableOfContents.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {observer.observe(element);}
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  // Share functions
  const shareOnTwitter = () => {
    const url = `https://otagon.app/blog/${slug}`;
    const text = post ? `${post.title} | Otagon Gaming Guides` : '';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `https://otagon.app/blog/${slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const copyLink = async () => {
    const url = `https://otagon.app/blog/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Enhanced markdown renderer (copied from BlogPostModal)
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
      
      if (!trimmed || trimmed === '#' || trimmed === '##' || trimmed === '###') {
        flushList();
        return;
      }

      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${lineIdx}`} className="text-xl lg:text-2xl font-bold text-white mt-8 mb-4">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(trimmed.replace(/^\d+\.\s/, ''));
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(trimmed.replace(/^[-*]\s/, ''));
        return;
      }

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

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
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

  const renderContent = () => {
    if (!post) {return null;}
    
    const sections = post.content.split(/(?=## )/);
    
    return sections.map((section, idx) => {
      if (!section.trim()) {return null;}
      
      const lines = section.split('\n');
      const firstLine = lines[0];
      const isH2 = firstLine.startsWith('## ');
      
      if (isH2) {
        const title = firstLine.replace('## ', '');
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const content = lines.slice(1).join('\n');
        
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
          <section key={idx} id={id} className="mb-10 lg:mb-12 scroll-mt-24">
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

  if (!post) {
    return (
      <SEOPageLayout
        title="Guide Not Found"
        description="The gaming guide you're looking for doesn't exist."
      >
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-800/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Guide Not Found</h2>
            <p className="text-text-secondary mb-8">The guide you're looking for doesn't exist or has been moved.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Guides
            </Link>
          </div>
        </div>
      </SEOPageLayout>
    );
  }

  return (
    <SEOPageLayout
      title={post.title}
      description={post.excerpt}
      keywords={`${post.game}, gaming guide, ${post.category.toLowerCase()}, walkthrough, tips, strategy`}
      canonicalUrl={`https://otagon.app/blog/${post.slug}`}
    >
      {/* Hero Section */}
      <section className="relative pt-24 pb-8 px-4 overflow-hidden">
        
        <div className="container mx-auto max-w-5xl relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white truncate">{post.title}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-sm font-bold text-primary bg-primary/15 px-4 py-1.5 rounded-full border border-primary/30">
                {post.category}
              </span>
              <span className="text-sm font-semibold text-secondary">
                {post.game}
              </span>
              <span className="text-sm text-text-muted">•</span>
              <span className="text-sm text-text-muted">{post.readTime} read</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed mb-8">
              {post.excerpt}
            </p>

            {/* Author & Date */}
            <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-neutral-800/70">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">OT</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{post.author}</p>
                  <p className="text-sm text-text-muted">
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Social Share */}
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800/60 hover:bg-neutral-700/60 text-white rounded-lg transition-colors border border-neutral-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-sm font-medium">Share</span>
                </button>

                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-10">
                    <button
                      onClick={shareOnTwitter}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <span className="text-white">Twitter</span>
                    </button>
                    <button
                      onClick={shareOnFacebook}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-[#4267B2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="text-white">Facebook</span>
                    </button>
                    <button
                      onClick={copyLink}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white">{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content with Sidebar TOC */}
      <section className="px-4 pb-16 pt-12">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main Article */}
            <article className="flex-1 max-w-4xl">
              <div className="space-y-5">
                {renderContent()}
              </div>

              {/* Author Card */}
              <div className="mt-12 p-6 bg-gradient-to-br from-neutral-900/80 to-neutral-800/40 border border-neutral-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xl">OT</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">About the Author</h4>
                    <p className="text-text-secondary mb-3">
                      Written by the <strong className="text-white">Otagon Gaming Team</strong> - a collective of passionate gamers and AI enthusiasts dedicated to helping players master their favorite games with cutting-edge technology.
                    </p>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                    >
                      Learn more about Otagon
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* Table of Contents Sidebar - Desktop Only */}
            {tableOfContents.length > 0 && (
              <aside className="hidden lg:block lg:w-64 shrink-0">
                <div className="sticky top-24">
                  <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                      Table of Contents
                    </h3>
                    <nav className="space-y-2">
                      {tableOfContents.map(({ id, title }) => (
                        <button
                          key={id}
                          onClick={() => scrollToHeading(id)}
                          className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-all ${
                            activeHeading === id
                              ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                              : 'text-text-muted hover:text-white hover:bg-neutral-800/60'
                          }`}
                        >
                          {title}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-5xl">
          <div className="p-8 md:p-10 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent border border-primary/20 rounded-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  Ready to Dominate {post.game}?
                </h3>
                <p className="text-text-secondary max-w-xl">
                  Stop alt-tabbing to wikis. Otagon AI gives you instant, personalized hints on your phone or second monitor while you play—spoiler-free and always available.
                </p>
              </div>
              <Link
                to="/earlyaccess"
                className="shrink-0 inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Try Otagon Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Guides */}
      {relatedPosts.length > 0 && (
        <section className="px-4 pb-20">
          <div className="container mx-auto max-w-5xl">
            <div className="pt-8 border-t border-neutral-800">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8">
                More {post.category} Guides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((related: BlogPost) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.slug}`}
                    className="group p-6 bg-neutral-900/70 border border-neutral-800 rounded-xl hover:border-primary/40 hover:bg-neutral-800/70 transition-all duration-300"
                  >
                    <span className="text-xs font-semibold text-secondary">{related.game}</span>
                    <h4 className="text-white font-bold mt-3 mb-2 group-hover:text-primary transition-colors leading-snug">
                      {related.title}
                    </h4>
                    <span className="text-xs text-text-muted">{related.readTime} read</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </SEOPageLayout>
  );
};

export { BlogPostPage };
export default BlogPostPage;
