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
      initial={{ opacity: 0, x: -20, scale: 0.98 }}
      animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative group"
    >
      {/* Timeline connector dot - improved positioning */}
      <div className="absolute -left-[34px] sm:-left-[40px] top-4 sm:top-5 z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
          className="relative flex items-center justify-center"
        >
          {/* Outer glow ring */}
          <div className={`absolute w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br ${config.gradient} opacity-30 blur-[3px]`} />
          {/* Main dot */}
          <div className={`relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br ${config.gradient} ring-2 ring-[#1a1a1a]`} />
        </motion.div>
      </div>
      
      {/* Event Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.995 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`relative overflow-hidden bg-gradient-to-br ${config.bgGradient} backdrop-blur-sm rounded-xl sm:rounded-2xl border border-[#424242]/30 hover:border-[#424242]/60 transition-all cursor-pointer shadow-sm hover:shadow-md`}
        onClick={onToggle}
      >
        {/* Top accent bar - thinner for cleaner look */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r ${config.gradient}`} />
        
        <div className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Event type icon - better sizing and alignment */}
            <motion.div 
              whileHover={{ rotate: 3, scale: 1.05 }}
              className={`flex-shrink-0 p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-md [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}
            >
              {config.icon}
            </motion.div>
            
            {/* Content - improved layout */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h4 className="font-semibold text-[#F5F5F5] text-[15px] sm:text-base lg:text-lg leading-snug line-clamp-2">{event.title}</h4>
                  <span className="inline-block text-[10px] sm:text-[11px] font-medium px-2 py-0.5 sm:py-1 rounded-full bg-[#424242]/40 text-[#CFCFCF] tracking-wide uppercase">
                    {config.label}
                  </span>
                </div>
                
                {/* Game cover thumbnail - better responsive sizing */}
                {event.igdbData?.cover?.url && (
                  <motion.img 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={getCoverUrl(event.igdbData.cover.url, 'cover_small')} 
                    alt={event.title}
                    className="w-11 h-[60px] sm:w-14 sm:h-[76px] object-cover rounded-lg shadow-lg flex-shrink-0 ring-1 ring-black/20"
                  />
                )}
              </div>
              
              {event.description && (
                <p className="text-[13px] sm:text-sm text-[#8F8F8F] line-clamp-2 mt-2 sm:mt-2.5 leading-relaxed">{event.description}</p>
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
                transition={{ duration: 0.25 }}
                className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[#424242]/30 overflow-hidden"
              >
                {event.specs && Object.keys(event.specs).length > 0 && (
                  <div className="mb-4 sm:mb-5">
                    <h5 className="text-xs sm:text-sm font-semibold text-[#CFCFCF] mb-2.5 sm:mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Specs
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                      {Object.entries(event.specs).map(([key, value]) => (
                        <div key={key} className="bg-[#0A0A0A]/60 rounded-lg px-3 py-2 sm:py-2.5">
                          <span className="text-[#8F8F8F] text-[10px] sm:text-xs uppercase tracking-wider">{key}</span>
                          <p className="text-[#F5F5F5] font-medium truncate text-xs sm:text-sm mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {event.photos && event.photos.length > 0 && (
                  <div className="mb-4 sm:mb-5">
                    <h5 className="text-xs sm:text-sm font-semibold text-[#CFCFCF] mb-2.5 sm:mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Photos
                    </h5>
                    <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                      {event.photos.map((photo, i) => (
                        <motion.img
                          key={i}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          src={photo}
                          alt={`${event.title} photo ${i + 1}`}
                          className="w-[72px] h-[72px] sm:w-24 sm:h-24 object-cover rounded-lg sm:rounded-xl flex-shrink-0 ring-1 ring-white/10"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Delete button - better touch target */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Event
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Expand indicator - always visible on mobile, hover on desktop */}
        <motion.div 
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-1.5 rounded-full bg-[#2a2a2a]/60 text-[#8F8F8F] opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  
  // Auto-collapse state: when true, only show years with events (collapses empty years)
  // Automatically set to true when a new event is added
  const [showOnlyEventYears, setShowOnlyEventYears] = useState(false);

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
    // Auto-collapse to show only years with events after adding
    setShowOnlyEventYears(true);
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

      {/* Main Timeline Content - Restructured for proper fixed header behavior */}
      {/* Stats Banner and Year Selector stay fixed at top, only timeline content scrolls */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Stats Banner - Fixed at top (flex-shrink-0 prevents it from scrolling) */}
        <div className="flex-shrink-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#424242]/40">
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

        {/* Mobile Year Selector with Add Event Button - Fixed at top (flex-shrink-0) */}
        <div className="lg:hidden flex-shrink-0 z-10 bg-[#0A0A0A] border-b border-[#424242]/40 px-4 py-2">
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

        {/* Scrollable Timeline Content Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
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
          <div className="relative px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            {/* Vertical Timeline Line - adjusted for new layout */}
            <div className="absolute left-[18px] sm:left-[34px] lg:left-[42px] top-0 bottom-0 flex flex-col items-center">
              {/* Gradient line with glow effect */}
              <div className="w-0.5 sm:w-[2px] h-full rounded-full bg-gradient-to-b from-[#E53A3A] via-[#E53A3A]/40 via-50% to-[#2a2a2a]/60 relative">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#E53A3A] via-[#E53A3A]/20 to-transparent blur-sm opacity-50" />
              </div>
            </div>

            {/* Collapse/Expand Toggle - Show when collapsed and there are hidden years */}
            {showOnlyEventYears && (() => {
              const yearsWithEvents = allYears.filter(y => (eventsByYear[y]?.length || 0) > 0);
              const hiddenYearsCount = allYears.length - yearsWithEvents.length;
              if (hiddenYearsCount > 0) {
                return (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setShowOnlyEventYears(false)}
                    className="mb-4 ml-10 sm:ml-16 lg:ml-[72px] inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#8F8F8F] hover:text-[#F5F5F5] bg-[#1C1C1C] hover:bg-[#252525] border border-[#424242]/40 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show {hiddenYearsCount} empty year{hiddenYearsCount > 1 ? 's' : ''}
                  </motion.button>
                );
              }
              return null;
            })()}

            {/* Year Sections - Filter based on showOnlyEventYears state */}
            <AnimatePresence mode="popLayout">
            {allYears
              .filter(year => !showOnlyEventYears || (eventsByYear[year]?.length || 0) > 0)
              .map((year) => {
              const yearEvents = eventsByYear[year] || [];
              const hasEventsThisYear = yearEvents.length > 0;
              
              // If year has events, show full section
              // If year is empty (only shown when not collapsed), show Add Event button
              if (!hasEventsThisYear) {
                // Empty year - show Add Event button
                return (
                  <motion.div 
                    key={year} 
                    id={`timeline-year-${year}`} 
                    data-year={year}
                    className="mb-3 sm:mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative flex items-center h-9 sm:h-10 group">
                      {/* Empty year dot */}
                      <div className="absolute left-[8px] sm:left-[20px] w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#2a2a2a] ring-2 ring-[#424242]/60 flex items-center justify-center">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#6B7280]" />
                      </div>
                      <span className="ml-10 sm:ml-16 lg:ml-[72px] text-base sm:text-lg font-medium text-[#6B7280] min-w-[48px]">{year}</span>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setAddEventYear(year);
                          setShowAddModal(true);
                        }}
                        className="ml-3 sm:ml-4 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 h-7 sm:h-8 min-w-[40px] sm:min-w-[100px] bg-[#1C1C1C]/80 hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F] text-[#8F8F8F] hover:text-white text-xs sm:text-sm font-medium rounded-lg transition-all border border-[#424242]/30 hover:border-transparent opacity-60 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">Add Event</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              }
              
              return (
                <motion.div 
                  key={year} 
                  id={`timeline-year-${year}`} 
                  data-year={year}
                  className="mb-10"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Year Header - Enhanced */}
                  <div className="relative flex items-center h-10 sm:h-12 mb-4 sm:mb-5">
                    <motion.div 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      className="absolute left-[6px] sm:left-[18px] flex items-center justify-center"
                    >
                      {/* Outer glow */}
                      <div className={`absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                        hasEventsThisYear 
                          ? 'bg-gradient-to-r from-[#E53A3A]/30 to-[#D98C1F]/30 blur-md' 
                          : 'bg-[#424242]/20 blur-sm'
                      }`} />
                      {/* Main circle */}
                      <div className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ring-[3px] ring-[#1a1a1a] ${
                        hasEventsThisYear 
                          ? 'bg-gradient-to-br from-[#E53A3A] to-[#D98C1F]' 
                          : 'bg-[#2a2a2a] ring-[#424242]'
                      }`}
                      style={hasEventsThisYear ? { boxShadow: '0 0 14px rgba(229, 58, 58, 0.4)' } : {}}
                      >
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${hasEventsThisYear ? 'bg-white' : 'bg-[#6B7280]'}`} />
                      </div>
                    </motion.div>
                    <h3 className="ml-10 sm:ml-16 lg:ml-[72px] text-lg sm:text-xl lg:text-2xl font-bold text-[#F5F5F5] min-w-[48px]">{year}</h3>
                    
                    {/* Add Event Button for this year */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setAddEventYear(year);
                        setShowAddModal(true);
                      }}
                      className="ml-3 sm:ml-4 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 h-7 sm:h-8 min-w-[40px] sm:min-w-[100px] bg-[#1C1C1C]/80 hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F] text-[#8F8F8F] hover:text-white text-xs sm:text-sm font-medium rounded-lg transition-all border border-[#424242]/30 hover:border-transparent"
                      title={`Add event to ${year}`}
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Add Event</span>
                    </motion.button>
                    
                    {/* Event count badge */}
                    {hasEventsThisYear && (
                      <span className="ml-2 px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-[#424242]/60 text-[#CFCFCF]">
                        {yearEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  {hasEventsThisYear ? (
                    <div className="space-y-3 sm:space-y-4 ml-10 sm:ml-16 lg:ml-[72px]">
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
                    <p className="ml-10 sm:ml-16 lg:ml-[72px] text-[#6B7280] text-sm italic flex items-center gap-2">
                      <span className="w-6 h-px bg-[#424242]" />
                      No events recorded - click + to add
                    </p>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>
            
            {/* Collapse button at bottom when expanded (showing all years) */}
            {!showOnlyEventYears && events.length > 0 && (() => {
              const yearsWithEvents = allYears.filter(y => (eventsByYear[y]?.length || 0) > 0);
              const emptyYearsCount = allYears.length - yearsWithEvents.length;
              if (emptyYearsCount > 0) {
                return (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowOnlyEventYears(true)}
                    className="mt-4 ml-10 sm:ml-16 lg:ml-[72px] inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#8F8F8F] hover:text-[#F5F5F5] bg-[#1C1C1C] hover:bg-[#252525] border border-[#424242]/40 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Hide {emptyYearsCount} empty year{emptyYearsCount > 1 ? 's' : ''}
                  </motion.button>
                );
              }
              return null;
            })()}
          </div>
        )}
        </div>
        {/* End of Scrollable Timeline Content Area */}

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
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {(['console', 'game', 'pc_build', 'album'] as AddEventType[]).map((type) => {
                    const config = eventTypeConfig[type];
                    return (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddEvent(type)}
                        className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl bg-gradient-to-br ${config.gradient} text-white font-medium hover:opacity-90 transition-all shadow-lg min-h-[120px]`}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm">
                          {config.icon}
                        </div>
                        <span className="text-sm font-semibold text-center leading-tight">{config.label}</span>
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
        <label className="block text-sm text-[#CFCFCF] mb-2 font-medium flex items-center gap-2">
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-[#E53A3A]">{config.icon}</span>
          <span>Title *</span>
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
        <label className="block text-sm text-[#CFCFCF] mb-2 font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Year *</span>
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
        <label className="block text-sm text-[#CFCFCF] mb-2 font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Description</span>
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
        <label className="block text-sm text-[#CFCFCF] mb-2 font-medium flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Photos (Optional)</span>
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
            <svg className="w-5 h-5 flex-shrink-0 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>PC Specs</span>
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

      <div className="flex gap-3 pt-6">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 bg-[#424242]/50 text-[#CFCFCF] rounded-xl font-medium hover:bg-[#424242] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!title}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </motion.button>
      </div>
    </form>
  );
};

export default GamingExplorerTimeline;
