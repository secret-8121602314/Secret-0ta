import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { blogPosts, BlogPost } from '../../data/blogPosts';

interface BlogIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: (slug: string) => void;
}

const BlogIndexModal: React.FC<BlogIndexModalProps> = ({ isOpen, onClose, onSelectPost }) => {
  const [filter, setFilter] = useState<string>('all');
  
  // Get unique categories
  const categories: string[] = ['all', ...Array.from(new Set(blogPosts.map((post: BlogPost) => post.category)))];
  
  // Filter posts
  const filteredPosts = filter === 'all' 
    ? blogPosts 
    : blogPosts.filter((post: BlogPost) => post.category === filter);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="7xl" className="p-0">
      <div className="max-h-[85vh] overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section */}
        <div className="text-center mb-8 lg:mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Gaming Guides
          </h1>
          <p className="text-text-secondary text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Comprehensive AI-powered guides for mastering your favorite games. 
            Boss strategies, build optimization, progression paths, and more.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 lg:gap-3 mb-10 lg:mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-full text-sm lg:text-base font-medium transition-all duration-200 ${
                filter === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-neutral-800/60 text-text-muted hover:bg-neutral-700/60 hover:text-white border border-neutral-700/50'
              }`}
            >
              {cat === 'all' ? 'All Guides' : cat}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-white">
            {filter === 'all' ? 'All Guides' : `${filter} Guides`}
          </h2>
          <span className="text-sm text-text-muted bg-neutral-800/50 px-3 py-1 rounded-full">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'guide' : 'guides'}
          </span>
        </div>

        {/* Guides Grid - Wider cards on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
          {filteredPosts.map((post: BlogPost) => (
            <button
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="group bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-primary/40 rounded-xl lg:rounded-2xl p-5 lg:p-6 text-left transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Top Row: Game & Read Time */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-secondary">{post.game}</span>
                <span className="text-xs text-text-muted bg-neutral-800 px-2.5 py-1 rounded-full">{post.readTime}</span>
              </div>

              {/* Title - Full display, no truncation on desktop */}
              <h3 className="text-lg lg:text-xl font-bold text-white group-hover:text-primary transition-colors duration-200 mb-3 leading-snug">
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className="text-sm text-text-secondary leading-relaxed mb-5 line-clamp-2">
                {post.excerpt}
              </p>

              {/* Bottom Row: Category & Arrow */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  {post.category}
                </span>
                <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-sm font-medium">Read</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 lg:mt-14 p-6 md:p-8 lg:p-10 bg-gradient-to-br from-primary/10 via-secondary/5 to-neutral-900/50 border border-neutral-800 rounded-xl lg:rounded-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Get Real-Time AI Help
              </h3>
              <p className="text-text-secondary max-w-xl">
                These guides are helpful, but Otagon gives you instant, personalized advice while you play—on your phone or second monitor.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                window.location.href = '/';
              }}
              className="shrink-0 inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Try Otagon Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BlogIndexModal;
