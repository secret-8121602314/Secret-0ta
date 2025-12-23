/**
 * Gaming Explorer Gallery
 * 
 * Displays all screenshots uploaded to chat, organized by game/conversation.
 * Mobile-first responsive design with album view, image viewer, and timeline integration.
 * 
 * Features:
 * - Album grid view (grouped by game/conversation)
 * - Filter by game
 * - Full-screen image viewer with gestures
 * - Download images
 * - Add to timeline
 * - Responsive grid (2 cols mobile, 3 cols tablet, 4+ cols desktop)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { galleryService, GalleryAlbum, GalleryImage, GalleryData } from '../../services/galleryService';

interface GamingExplorerGalleryProps {
  user: User;
}

const GamingExplorerGallery: React.FC<GamingExplorerGalleryProps> = ({ user }) => {
  const [galleryData, setGalleryData] = useState<GalleryData>({
    albums: [],
    totalImages: 0,
    loading: true,
  });
  
  // UI State
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [filterGame, setFilterGame] = useState<string>('');
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineImage, setTimelineImage] = useState<GalleryImage | null>(null);
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineYear, setTimelineYear] = useState(new Date().getFullYear());
  const [timelineDescription, setTimelineDescription] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Image rotation state (0, 90, 180, 270 degrees) - temporary per viewing session
  const [imageRotation, setImageRotation] = useState<number>(0);

  // Fetch gallery data
  useEffect(() => {
    const fetchData = async () => {
      if (!user.authUserId) {
        return;
      }
      
      setGalleryData(prev => ({ ...prev, loading: true }));
      const data = await galleryService.fetchGalleryData(user.authUserId);
      setGalleryData(data);
    };

    fetchData();
  }, [user.authUserId]);

  // Get unique game titles for filter
  const gameTitles = useMemo(() => {
    return galleryService.getGameTitles(galleryData.albums);
  }, [galleryData.albums]);

  // Filter albums
  const filteredAlbums = useMemo(() => {
    if (!filterGame) {
      return galleryData.albums;
    }
    return galleryService.filterByGame(galleryData.albums, filterGame);
  }, [galleryData.albums, filterGame]);

  // Handle image download
  const handleDownload = useCallback(async (image: GalleryImage) => {
    setDownloadingId(image.id);
    const filename = `${image.gameTitle || 'screenshot'}_${new Date(image.capturedAt).toISOString().split('T')[0]}.png`;
    await galleryService.downloadImage(image.imageUrl, filename);
    setDownloadingId(null);
  }, []);

  // Handle add to timeline
  const handleAddToTimeline = useCallback((image: GalleryImage) => {
    setTimelineImage(image);
    setTimelineTitle(`Screenshot - ${image.gameTitle || image.conversationTitle}`);
    setTimelineYear(new Date(image.capturedAt).getFullYear());
    setTimelineDescription('');
    setShowTimelineModal(true);
  }, []);

  // Confirm add to timeline
  const confirmAddToTimeline = useCallback(() => {
    if (!timelineImage) {
      return;
    }
    
    galleryService.addToTimeline(
      timelineImage,
      timelineTitle,
      timelineYear,
      timelineDescription
    );
    
    setShowTimelineModal(false);
    setTimelineImage(null);
  }, [timelineImage, timelineTitle, timelineYear, timelineDescription]);

  // Navigate images in viewer
  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (!selectedImage || !selectedAlbum) {
      return;
    }
    
    const currentIndex = selectedAlbum.images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) {
      return;
    }
    
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + selectedAlbum.images.length) % selectedAlbum.images.length
      : (currentIndex + 1) % selectedAlbum.images.length;
    
    setSelectedImage(selectedAlbum.images[newIndex]);
    // Reset rotation when navigating to a new image
    setImageRotation(0);
  }, [selectedImage, selectedAlbum]);

  // Rotate image 90 degrees clockwise
  const rotateImage = useCallback(() => {
    setImageRotation(prev => (prev + 90) % 360);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) {
        return;
      }
      
      if (e.key === 'Escape') {
        setSelectedImage(null);
        setImageRotation(0); // Reset rotation on close
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'r' || e.key === 'R') {
        rotateImage(); // Rotate image with 'R' key
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, navigateImage, rotateImage]);

  // Loading state
  if (galleryData.loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#E53A3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8F8F8F] text-sm">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (galleryData.error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#E53A3A] font-medium mb-2">Failed to load gallery</p>
          <p className="text-[#8F8F8F] text-sm">{galleryData.error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (galleryData.albums.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#E53A3A]/20 to-[#D98C1F]/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">No Screenshots Yet</h3>
          <p className="text-[#8F8F8F] text-sm">
            Upload screenshots in your game chats to see them here. Your gaming memories will be automatically organized by game!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats and filter */}
      <div className="flex-shrink-0 px-4 py-4 sm:px-6 border-b border-[#424242]/40 bg-[#1C1C1C]/80">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E53A3A]/20 to-[#D98C1F]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-[#F5F5F5]">{galleryData.totalImages}</p>
                <p className="text-xs text-[#8F8F8F]">Screenshots</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[#424242]/60 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-[#F5F5F5]">{galleryData.albums.length}</p>
                <p className="text-xs text-[#8F8F8F]">Albums</p>
              </div>
            </div>
          </div>

          {/* Filter by game */}
          {gameTitles.length > 0 && (
            <div className="flex-1 sm:max-w-xs">
              <select
                value={filterGame}
                onChange={(e) => setFilterGame(e.target.value)}
                className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#424242] rounded-lg text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] transition-colors"
              >
                <option value="">All Games</option>
                {gameTitles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Album Grid or Album Detail */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {selectedAlbum ? (
            // Album Detail View
            <motion.div
              key="album-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Back button and album info */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setSelectedAlbum(null)}
                  className="p-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors"
                >
                  <svg className="w-5 h-5 text-[#CFCFCF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-[#F5F5F5]">
                    {selectedAlbum.gameTitle || selectedAlbum.conversationTitle}
                  </h2>
                  <p className="text-sm text-[#8F8F8F]">{selectedAlbum.imageCount} screenshots</p>
                </div>
              </div>

              {/* Images grid - 2 cols mobile, 3 tablet, 4 desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {selectedAlbum.images.map((image, index) => (
                  <motion.button
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedImage(image)}
                    className="aspect-video relative rounded-lg overflow-hidden bg-[#1C1C1C] border border-[#424242]/40 hover:border-[#E53A3A]/60 transition-all group"
                  >
                    <img
                      src={image.imageUrl}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white/80 truncate">
                          {new Date(image.capturedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            // Albums Grid View
            <motion.div
              key="albums-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
            >
              {filteredAlbums.map((album, index) => (
                <motion.button
                  key={album.conversationId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedAlbum(album)}
                  className="group relative bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#424242]/40 hover:border-[#E53A3A]/60 transition-all text-left"
                >
                  {/* Cover image */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {album.images[0]?.imageUrl || album.coverUrl ? (
                      <img
                        src={album.images[0]?.imageUrl || album.coverUrl}
                        alt={album.gameTitle || album.conversationTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#2A2A2A] to-[#1C1C1C] flex items-center justify-center">
                        <svg className="w-10 h-10 text-[#424242]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Image count badge */}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                      <span className="text-xs font-medium text-white">{album.imageCount}</span>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>

                  {/* Album info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-1">
                      {album.gameTitle || album.conversationTitle}
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      {new Date(album.latestImageAt).toLocaleDateString()}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full-screen Image Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => { setSelectedImage(null); setImageRotation(0); }}
          >
            {/* Close button */}
            <button
              onClick={() => { setSelectedImage(null); setImageRotation(0); }}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Rotate button - top left */}
            <button
              onClick={(e) => { e.stopPropagation(); rotateImage(); }}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Rotate image (R)"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Navigation arrows */}
            {selectedAlbum && selectedAlbum.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={selectedImage.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: imageRotation }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              src={selectedImage.imageUrl}
              alt="Screenshot"
              className={`object-contain ${
                imageRotation === 90 || imageRotation === 270
                  ? 'max-h-[100vw] max-w-[100vh]' // Swap dimensions when rotated for fullscreen
                  : 'max-w-[100vw] max-h-[100vh]'
              }`}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Bottom action bar */}
            <div 
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedImage.gameTitle || selectedImage.conversationTitle}
                  </p>
                  <p className="text-xs text-white/60">
                    {new Date(selectedImage.capturedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Download button */}
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    disabled={downloadingId === selectedImage.id}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                    title="Download"
                  >
                    {downloadingId === selectedImage.id ? (
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Add to timeline button */}
                  <button
                    onClick={() => handleAddToTimeline(selectedImage)}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title="Add to Timeline"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Timeline Modal */}
      <AnimatePresence>
        {showTimelineModal && timelineImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowTimelineModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#1C1C1C] rounded-2xl overflow-hidden border border-[#424242]/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-[#424242]/40">
                <h3 className="text-lg font-semibold text-[#F5F5F5]">Add to Timeline</h3>
                <p className="text-sm text-[#8F8F8F] mt-1">Save this screenshot to your gaming timeline</p>
              </div>

              {/* Preview */}
              <div className="p-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-black/50 mb-4">
                  <img
                    src={timelineImage.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#CFCFCF] mb-1">Title</label>
                    <input
                      type="text"
                      value={timelineTitle}
                      onChange={(e) => setTimelineTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#424242] rounded-lg text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] transition-colors"
                      placeholder="Enter a title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#CFCFCF] mb-1">Year</label>
                    <input
                      type="number"
                      value={timelineYear}
                      onChange={(e) => setTimelineYear(parseInt(e.target.value) || new Date().getFullYear())}
                      min={1970}
                      max={new Date().getFullYear() + 1}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#424242] rounded-lg text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#CFCFCF] mb-1">Description (optional)</label>
                    <textarea
                      value={timelineDescription}
                      onChange={(e) => setTimelineDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#424242] rounded-lg text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] transition-colors resize-none"
                      placeholder="Add a description..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-[#424242]/40 flex gap-3">
                <button
                  onClick={() => setShowTimelineModal(false)}
                  className="flex-1 py-2.5 px-4 bg-[#2A2A2A] text-[#CFCFCF] rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddToTimeline}
                  disabled={!timelineTitle.trim()}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Timeline
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamingExplorerGallery;
