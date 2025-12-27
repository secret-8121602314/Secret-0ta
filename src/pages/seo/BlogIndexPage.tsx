import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEOPageLayout } from '../../components/layout/SEOPageLayout';
import { blogPosts, BlogPost } from '../../data/blogPosts';

const BlogIndexPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(blogPosts.map((post: BlogPost) => post.category)));
    return ['All', ...cats];
  }, []);

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post: BlogPost) => {
      const matchesSearch = searchQuery === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.game.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <SEOPageLayout
      title="Gaming Guides"
      description="Comprehensive AI-powered gaming guides, boss strategies, build optimization, and walkthroughs for your favorite games. Master any game with expert tips."
      keywords="gaming guides, game walkthroughs, boss strategies, game tips, AI gaming help, Elden Ring guide, Baldur's Gate 3, gaming tutorials"
    >
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4 overflow-hidden">
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Gaming Guides
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Master Any Game with AI-Powered Strategies
            </p>
            <p className="text-base md:text-lg text-text-muted max-w-2xl mx-auto mt-4">
              Comprehensive guides for boss fights, build optimization, progression paths, and more. Get the edge you need to dominate your favorite games.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides by title, game, or topic..."
                className="w-full px-6 py-4 pl-14 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>

          {/* Category Filter Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 scale-105'
                    : 'bg-neutral-900/60 text-text-muted hover:bg-neutral-800/80 hover:text-white border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-0 max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold text-white">
              {selectedCategory === 'All' ? 'All Guides' : `${selectedCategory} Guides`}
            </h2>
            <span className="text-sm text-text-muted bg-neutral-900/60 px-4 py-2 rounded-full border border-neutral-800">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'guide' : 'guides'}
            </span>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="px-4 pb-20 pt-8">
        <div className="container mx-auto max-w-7xl">
          {filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neutral-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Guides Found</h3>
              <p className="text-text-secondary mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post: BlogPost, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block h-full bg-gradient-to-br from-[#1C1C1C]/60 to-[#0A0A0A]/60 border border-neutral-800 rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="p-6">
                      {/* Game Badge & Read Time */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                          {post.game}
                        </span>
                        <span className="text-xs text-text-muted bg-neutral-800/60 px-2.5 py-1 rounded-full">
                          {post.readTime}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-200 mb-3 leading-tight line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-text-secondary leading-relaxed mb-5 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                          <span className="w-2 h-2 rounded-full bg-primary/60" />
                          {post.category}
                        </span>
                        <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-sm font-medium">Read</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 md:p-12 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent border border-primary/20 rounded-2xl"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                  Get Real-Time AI Help While You Play
                </h3>
                <p className="text-text-secondary text-lg max-w-2xl">
                  These guides are helpful, but Otagon gives you instant, personalized hints on your phone or second monitor—no spoilers, just the help you need, when you need it.
                </p>
              </div>
              <Link
                to="/earlyaccess"
                className="shrink-0 inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Try Otagon Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </SEOPageLayout>
  );
};

export { BlogIndexPage };
export default BlogIndexPage;
