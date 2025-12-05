/**
 * Gaming Explorer Timeline
 * 
 * Visual timeline of user's gaming journey.
 * Features:
 * - Vertical scrollable timeline with sticky year headers
 * - Year jump navigation with decade grouping
 * - Event nodes: Console, Game, PC Build, Photo Album, Gameplay Session
 * - Stats banner with animated counters
 * - Interactive event cards with hover effects
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { User } from '../../types';
import { 
  timelineStorage, 
  userProfileStorage,
  gameplaySessionsStorage,
  TimelineEvent,
  TimelineEventType,
} from '../../services/gamingExplorerStorage';
import { getCoverUrl } from '../../services/igdbService';

interface GamingExplorerTimelineProps {
  user: User;
}

type AddEventType = 'console' | 'game' | 'pc_build' | 'album';

// Event type configurations with enhanced styling
const eventTypeConfig: Record<TimelineEventType, { 
  gradient: string; 
  bgGradient: string;
  icon: JSX.Element; 
  label: string;
  emoji: string;
}> = {
  console: {
    gradient: 'from-[#3B82F6] to-[#1D4ED8]',
    bgGradient: 'from-[#3B82F6]/10 to-[#1D4ED8]/10',
    emoji: '🎮',
    label: 'Console',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  game: {
    gradient: 'from-[#E53A3A] to-[#D98C1F]',
    bgGradient: 'from-[#E53A3A]/10 to-[#D98C1F]/10',
    emoji: '🕹️',
    label: 'Game',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  pc_build: {
    gradient: 'from-[#10B981] to-[#059669]',
    bgGradient: 'from-[#10B981]/10 to-[#059669]/10',
    emoji: '🖥️',
    label: 'PC Build',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  album: {
    gradient: 'from-[#8B5CF6] to-[#6D28D9]',
    bgGradient: 'from-[#8B5CF6]/10 to-[#6D28D9]/10',
    emoji: '📸',
    label: 'Photos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  gameplay_session: {
    gradient: 'from-[#F59E0B] to-[#D97706]',
    bgGradient: 'from-[#F59E0B]/10 to-[#D97706]/10',
    emoji: '🎬',
    label: 'Session',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

// Timeline event card component with enhanced animations
const TimelineEventCard: React.FC<{
  event: TimelineEvent;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ event, isExpanded, onToggle, onDelete }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const config = eventTypeConfig[event.type];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative group"
    >
      {/* Timeline connector dot */}
      <div className="absolute -left-[38px] sm:-left-[42px] top-5 sm:top-6 z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative"
        >
          {/* Outer glow ring */}
          <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${config.gradient} opacity-40 blur-sm`} />
          {/* Main dot */}
          <div className={`relative w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gradient-to-br ${config.gradient} border-2 border-[#1a1a1a]`} />
        </motion.div>
      </div>
      
      {/* Event Card */}
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative overflow-hidden bg-gradient-to-br ${config.bgGradient} backdrop-blur-sm rounded-xl border border-[#424242]/40 hover:border-[#424242]/80 transition-all cursor-pointer`}
        onClick={onToggle}
      >
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
        
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Event type icon - smaller on mobile */}
            <motion.div 
              whileHover={{ rotate: 5 }}
              className={`flex-shrink-0 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-lg [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}
            >
              {config.icon}
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#F5F5F5] text-sm sm:text-lg leading-tight line-clamp-2 sm:line-clamp-1">{event.title}</h4>
                  <div className="flex items-center mt-1">
                    <span className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-[#424242]/50 text-[#CFCFCF]">
                      {config.label}
                    </span>
                  </div>
                </div>
                
                {/* Game cover thumbnail - smaller on mobile */}
                {event.igdbData?.cover?.url && (
                  <motion.img 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={getCoverUrl(event.igdbData.cover.url, 'cover_small')} 
                    alt={event.title}
                    className="w-10 h-14 sm:w-14 sm:h-18 object-cover rounded-md sm:rounded-lg shadow-lg flex-shrink-0"
                  />
                )}
              </div>
              
              {event.description && (
                <p className="text-xs sm:text-sm text-[#8F8F8F] line-clamp-2 mt-1.5 sm:mt-2">{event.description}</p>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#424242]/40 overflow-hidden"
              >
                {event.specs && Object.keys(event.specs).length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <h5 className="text-xs sm:text-sm font-medium text-[#CFCFCF] mb-2 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Specs
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      {Object.entries(event.specs).map(([key, value]) => (
                        <div key={key} className="bg-[#0A0A0A]/50 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
                          <span className="text-[#8F8F8F] text-[10px] sm:text-xs">{key}</span>
                          <p className="text-[#F5F5F5] font-medium truncate text-xs sm:text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {event.photos && event.photos.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <h5 className="text-xs sm:text-sm font-medium text-[#CFCFCF] mb-2 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Photos
                    </h5>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {event.photos.map((photo, i) => (
                        <motion.img
                          key={i}
                          whileHover={{ scale: 1.05 }}
                          src={photo}
                          alt={`${event.title} photo ${i + 1}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Event
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Expand indicator */}
        <motion.div 
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="absolute bottom-2 right-2 p-1 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const GamingExplorerTimeline: React.FC<GamingExplorerTimelineProps> = ({ user: _user }) => {
  const [events, setEvents] = useState<TimelineEvent[]>(() => timelineStorage.getAll());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEventType, setAddEventType] = useState<AddEventType | null>(null);
  const [addEventYear, setAddEventYear] = useState<number | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const profile = userProfileStorage.get();
  const currentYear = new Date().getFullYear();
  const startYear = profile.gamingStartYear || currentYear - 10;

  // Generate all years from start to current
  const allYears = useMemo(() => {
    const years: number[] = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  }, [currentYear, startYear]);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const grouped: Record<number, TimelineEvent[]> = {};
    events.forEach(event => {
      if (!grouped[event.year]) {
        grouped[event.year] = [];
      }
      grouped[event.year].push(event);
    });
    return grouped;
  }, [events]);

  // Calculate stats
  const stats = useMemo(() => {
    const yearsGaming = currentYear - startYear;
    const consoleCount = events.filter(e => e.type === 'console').length;
    const gameCount = events.filter(e => e.type === 'game').length;
    const sessionCount = gameplaySessionsStorage.getAll().length;
    const totalEvents = events.length;
    return { yearsGaming, consoleCount, gameCount, sessionCount, totalEvents };
  }, [events, currentYear, startYear]);

  // Track current visible year for year navigation highlighting
  const [visibleYear, setVisibleYear] = useState(currentYear);

  // Intersection observer for tracking visible year
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const year = parseInt(entry.target.getAttribute('data-year') || '');
            if (!isNaN(year)) {
              setVisibleYear(year);
            }
          }
        });
      },
      { threshold: 0.5, root: scrollContainerRef.current }
    );

    const yearElements = document.querySelectorAll('[data-year]');
    yearElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [events]);

  const handleJumpToYear = useCallback((year: number) => {
    setSelectedYear(year);
    const element = document.getElementById(`timeline-year-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleAddEvent = useCallback((type: AddEventType) => {
    setAddEventType(type);
    setShowAddModal(true);
  }, []);

  const handleDeleteEvent = useCallback((eventId: string) => {
    timelineStorage.deleteEvent(eventId);
    setEvents(timelineStorage.getAll());
    setExpandedEvent(null);
  }, []);

  const handleSaveEvent = useCallback((eventData: Partial<TimelineEvent>) => {
    if (!addEventType) {
      return;
    }

    const eventYear = addEventYear || eventData.year || currentYear;

    timelineStorage.addEvent({
      type: addEventType as TimelineEventType,
      eventDate: `${eventYear}-01-01`,
      year: eventYear,
      title: eventData.title || 'Untitled',
      description: eventData.description,
      specs: eventData.specs,
      photos: eventData.photos,
      igdbGameId: eventData.igdbGameId,
      igdbData: eventData.igdbData,
    });

    setEvents(timelineStorage.getAll());
    setShowAddModal(false);
    setAddEventYear(null);
    setAddEventType(null);
  }, [addEventType, addEventYear, currentYear]);

  // Check if there are any events at all
  const hasEvents = events.length > 0;

  return (
    <div className="flex h-full bg-[#0A0A0A]">
      {/* Year Jump Navigation (Desktop) - Modernized */}
      <div className="hidden lg:flex flex-col w-24 bg-gradient-to-b from-[#1C1C1C] to-[#0A0A0A] border-r border-[#424242]/40 overflow-hidden">
        <div className="p-3 border-b border-[#424242]/40">
          <p className="text-xs text-[#8F8F8F] text-center font-medium">Timeline</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {allYears.map((year) => {
            const hasEventsThisYear = (eventsByYear[year]?.length || 0) > 0;
            const isVisible = visibleYear === year;
            return (
              <motion.button
                key={year}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleJumpToYear(year)}
                className={`relative w-full py-2 text-sm rounded-lg transition-all ${
                  isVisible
                    ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-medium shadow-lg'
                    : hasEventsThisYear
                    ? 'text-[#F5F5F5] hover:bg-[#2A2A2A]'
                    : 'text-[#6B7280] hover:bg-[#1C1C1C] hover:text-[#8F8F8F]'
                }`}
              >
                {year}
                {hasEventsThisYear && !isVisible && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E53A3A]" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Timeline Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {/* Stats Banner - Enhanced Grid Layout */}
        <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#424242]/40">
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            {/* Mobile: 3 stat cards in grid, Add button below */}
            {/* Desktop: All stats + Add button in row */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-6">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#1C1C1C]/50 sm:bg-transparent rounded-xl p-2 sm:p-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#E53A3A]/20 to-[#D98C1F]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-xl font-bold text-[#F5F5F5]">{stats.yearsGaming}</p>
                  <p className="text-[10px] sm:text-xs text-[#8F8F8F]">Years</p>
                </div>
              </motion.div>
              
              <div className="hidden sm:block w-px h-10 bg-[#424242]" />
              
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#1C1C1C]/50 sm:bg-transparent rounded-xl p-2 sm:p-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#1D4ED8]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-xl font-bold text-[#F5F5F5]">{stats.consoleCount}</p>
                  <p className="text-[10px] sm:text-xs text-[#8F8F8F]">Consoles</p>
                </div>
              </motion.div>
              
              <div className="hidden sm:block w-px h-10 bg-[#424242]" />
              
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#1C1C1C]/50 sm:bg-transparent rounded-xl p-2 sm:p-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#D98C1F]/20 to-[#B45309]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#D98C1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-xl font-bold text-[#F5F5F5]">{stats.totalEvents}</p>
                  <p className="text-[10px] sm:text-xs text-[#8F8F8F]">Milestones</p>
                </div>
              </motion.div>

              {/* Add Event Button - Desktop Only (mobile has it in year selector) */}
              <div className="hidden sm:block w-px h-10 bg-[#424242]" />
              
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Event</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Year Selector with Add Event Button */}
        <div className="lg:hidden sticky top-[88px] z-10 bg-[#0A0A0A] border-b border-[#424242]/40 px-4 py-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedYear || visibleYear || ''}
                onChange={(e) => handleJumpToYear(Number(e.target.value))}
                className="w-full appearance-none bg-[#1C1C1C] text-[#F5F5F5] rounded-lg px-4 py-2.5 pr-10 border border-[#424242]/60 focus:outline-none focus:border-[#E53A3A]"
              >
                <option value="" disabled>Jump to year...</option>
                {allYears.map((year) => (
                  <option key={year} value={year}>
                    {year} {eventsByYear[year]?.length ? `(${eventsByYear[year].length} events)` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8F8F8F]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* Mobile Add Event Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-medium rounded-lg shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Empty State */}
        {!hasEvents && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E53A3A]/20 to-[#D98C1F]/20 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">Start Your Gaming Journey</h3>
            <p className="text-[#8F8F8F] text-center max-w-md mb-6">
              Record your gaming milestones, consoles, PC builds, and memorable moments. Your timeline is waiting!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              Add Your First Event
            </motion.button>
          </motion.div>
        )}

        {/* Timeline */}
        {hasEvents && (
          <div className="relative px-4 sm:px-6 py-6">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[22px] sm:left-9 top-0 bottom-0 flex flex-col items-center">
              {/* Gradient line with glow effect */}
              <div className="w-0.5 sm:w-[3px] h-full rounded-full bg-gradient-to-b from-[#E53A3A] via-[#E53A3A]/50 via-40% to-[#2a2a2a] relative">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#E53A3A] via-[#E53A3A]/30 to-transparent blur-sm opacity-60" />
              </div>
            </div>

            {/* Year Sections - Empty years show Add Event button */}
            {allYears.map((year) => {
              const yearEvents = eventsByYear[year] || [];
              const hasEventsThisYear = yearEvents.length > 0;
              
              // If year has events, show full section
              // If year is empty, show Add Event button instead of collapse
              if (!hasEventsThisYear) {
                // Empty year - show Add Event button
                return (
                  <div 
                    key={year} 
                    id={`timeline-year-${year}`} 
                    data-year={year}
                    className="mb-4"
                  >
                    <div className="relative flex items-center h-8 group">
                      {/* Empty year dot */}
                      <div className="absolute left-[14px] sm:left-[27px] w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#2a2a2a] border-2 border-[#424242] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
                      </div>
                      <span className="ml-12 sm:ml-[72px] text-lg font-medium text-[#6B7280] min-w-[52px]">{year}</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setAddEventYear(year);
                          setShowAddModal(true);
                        }}
                        className="ml-4 inline-flex items-center justify-center gap-1.5 px-3 h-8 min-w-[44px] sm:min-w-[110px] bg-[#1C1C1C] hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F] text-[#8F8F8F] hover:text-white text-sm font-medium rounded-lg transition-all border border-[#424242]/40 hover:border-transparent"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Add Event</span>
                      </motion.button>
                    </div>
                  </div>
                );
              }
              
              return (
                <div 
                  key={year} 
                  id={`timeline-year-${year}`} 
                  data-year={year}
                  className="mb-10"
                >
                  {/* Year Header - Enhanced */}
                  <div className="relative flex items-center h-8 mb-6">
                    <motion.div 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      className="absolute left-[10px] sm:left-[21px] flex items-center justify-center"
                    >
                      {/* Outer glow */}
                      <div className={`absolute w-8 h-8 sm:w-9 sm:h-9 rounded-full ${
                        hasEventsThisYear 
                          ? 'bg-gradient-to-r from-[#E53A3A]/30 to-[#D98C1F]/30 blur-md' 
                          : 'bg-[#424242]/20 blur-sm'
                      }`} />
                      {/* Main circle */}
                      <div className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-[3px] border-[#1a1a1a] ${
                        hasEventsThisYear 
                          ? 'bg-gradient-to-br from-[#E53A3A] to-[#D98C1F]' 
                          : 'bg-[#2a2a2a] border-[#424242]'
                      }`}
                      style={hasEventsThisYear ? { boxShadow: '0 0 16px rgba(229, 58, 58, 0.5)' } : {}}
                      >
                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${hasEventsThisYear ? 'bg-white' : 'bg-[#6B7280]'}`} />
                      </div>
                    </motion.div>
                    <h3 className="ml-12 sm:ml-[72px] text-xl sm:text-2xl font-bold text-[#F5F5F5] min-w-[52px]">{year}</h3>
                    
                    {/* Add Event Button for this year */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setAddEventYear(year);
                        setShowAddModal(true);
                      }}
                      className="ml-4 inline-flex items-center justify-center gap-1.5 px-3 h-8 min-w-[44px] sm:min-w-[110px] bg-[#1C1C1C] hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F] text-[#8F8F8F] hover:text-white text-sm font-medium rounded-lg transition-all border border-[#424242]/40 hover:border-transparent"
                      title={`Add event to ${year}`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Add Event</span>
                    </motion.button>
                    
                    {/* Event count badge */}
                    {hasEventsThisYear && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-[#424242] text-[#CFCFCF]">
                        {yearEvents.length} event{yearEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  {hasEventsThisYear ? (
                    <div className="space-y-4 ml-12 sm:ml-[72px]">
                      {yearEvents.map((event) => (
                        <TimelineEventCard
                          key={event.id}
                          event={event}
                          isExpanded={expandedEvent === event.id}
                          onToggle={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                          onDelete={() => handleDeleteEvent(event.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="ml-12 sm:ml-[72px] text-[#6B7280] text-sm italic flex items-center gap-2">
                      <span className="w-6 h-px bg-[#424242]" />
                      No events recorded - click + to add
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Add Button - Hidden on mobile to avoid overlap with back-to-chat button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddModal(true)}
          className="hidden lg:flex fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white rounded-full items-center justify-center z-30"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(229, 58, 58, 0.4)' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </div>

      {/* Add Event Modal - Enhanced */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setAddEventType(null);
              setAddEventYear(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1C1C] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#424242]/40"
            >
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">
                {addEventType ? `Add ${eventTypeConfig[addEventType]?.label || addEventType}` : 'Add Timeline Event'}
              </h2>
              {addEventYear && (
                <p className="text-sm text-[#8F8F8F] mb-4">Adding to {addEventYear}</p>
              )}

              {!addEventType ? (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {(['console', 'game', 'pc_build', 'album'] as AddEventType[]).map((type) => {
                    const config = eventTypeConfig[type];
                    return (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddEvent(type)}
                        className={`p-4 rounded-xl bg-gradient-to-br ${config.gradient} text-white font-medium hover:opacity-90 transition-opacity shadow-lg`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8">{config.icon}</div>
                          <span className="text-sm">{config.label}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <AddEventForm
                  type={addEventType}
                  startYear={startYear}
                  currentYear={currentYear}
                  initialYear={addEventYear}
                  onSave={handleSaveEvent}
                  onCancel={() => setAddEventType(null)}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Add Event Form Component
interface AddEventFormProps {
  type: AddEventType;
  startYear: number;
  currentYear: number;
  initialYear?: number | null;
  onSave: (data: Partial<TimelineEvent>) => void;
  onCancel: () => void;
}

const AddEventForm: React.FC<AddEventFormProps> = ({
  type,
  startYear,
  currentYear,
  initialYear,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(initialYear || currentYear);
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const config = eventTypeConfig[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      year,
      description: description || undefined,
      specs: Object.keys(specs).length > 0 ? specs : undefined,
      photos: photos.length > 0 ? photos : undefined,
    });
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      return;
    }
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const result = event.target.result as string;
            setPhotos(prev => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm text-[#CFCFCF] mb-1.5 font-medium flex items-center gap-2">
          <span className="w-5 h-5 text-[#E53A3A]">{config.icon}</span>
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'console' ? 'e.g., PlayStation 5' : type === 'pc_build' ? 'e.g., Gaming Rig 2024' : 'Enter title'}
          className="w-full bg-[#0A0A0A] border border-[#424242] rounded-xl px-4 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] transition-colors"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm text-[#CFCFCF] mb-1.5 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Year *
        </label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full bg-[#0A0A0A] border border-[#424242] rounded-xl px-4 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] transition-colors"
        >
          {Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-[#CFCFCF] mb-1.5 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes or memories..."
          rows={3}
          className="w-full bg-[#0A0A0A] border border-[#424242] rounded-xl px-4 py-2.5 text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] resize-none transition-colors"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm text-[#CFCFCF] mb-1.5 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Photos (Optional)
        </label>
        
        {/* Photo Preview Grid */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-[#424242] rounded-xl text-[#8F8F8F] hover:border-[#E53A3A] hover:text-[#E53A3A] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Photos
        </button>
      </div>

      {type === 'pc_build' && (
        <div className="space-y-2">
          <label className="block text-sm text-[#CFCFCF] font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            PC Specs
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['CPU', 'GPU', 'RAM', 'Storage'].map((spec) => (
              <input
                key={spec}
                type="text"
                value={specs[spec] || ''}
                onChange={(e) => setSpecs({ ...specs, [spec]: e.target.value })}
                placeholder={spec}
                className="bg-[#0A0A0A] border border-[#424242] rounded-lg px-3 py-2 text-[#F5F5F5] text-sm focus:outline-none focus:border-[#E53A3A] transition-colors"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 bg-[#424242]/50 text-[#CFCFCF] rounded-xl font-medium hover:bg-[#424242] transition-colors"
        >
          Back
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!title}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Add Event
        </motion.button>
      </div>
    </form>
  );
};

export default GamingExplorerTimeline;
