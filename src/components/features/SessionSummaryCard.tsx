import React, { useState } from 'react';

interface SessionSummaryCardProps {
  mode: 'playing' | 'planning';
  gameTitle: string;
  progress?: number;
  currentObjective?: string;
  keyPoints: string[];
  objectives: string[];
  recentActivity?: string;
  strategicNotes?: string;
  timestamp: number;
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor: string;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  accentColor,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  
  // Measure content height when it changes or when opened
  React.useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);
  
  return (
    <div 
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{ 
        background: isOpen ? `${accentColor}08` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isOpen ? `${accentColor}25` : 'rgba(255,255,255,0.05)'}`,
        boxShadow: isOpen ? `0 4px 12px ${accentColor}10` : 'none'
      }}
    >
      {/* Clickable header - entire area toggles */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 active:bg-white/10 transition-all duration-200 cursor-pointer select-none text-left"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <div 
            className="p-2 rounded-lg transition-all duration-200"
            style={{ 
              background: isOpen ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
              boxShadow: isOpen ? `0 2px 8px ${accentColor}15` : 'none'
            }}
          >
            {icon}
          </div>
          <span 
            className="text-xs font-bold uppercase tracking-wider transition-colors duration-200"
            style={{ color: isOpen ? accentColor : 'rgba(255,255,255,0.5)' }}
          >
            {title}
          </span>
        </div>
        <div 
          className="p-1 rounded-full transition-all duration-200 pointer-events-none"
          style={{ background: isOpen ? `${accentColor}15` : 'transparent' }}
        >
          <svg 
            className="w-4 h-4 transition-transform duration-300"
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: isOpen ? accentColor : 'rgba(255,255,255,0.3)'
            }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* Expandable content */}
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          maxHeight: isOpen ? `${contentHeight + 32}px` : '0',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div ref={contentRef} className="px-4 pb-4 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

// Format content with proper bullet points and line breaks
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  // Split content by newlines and process each line
  const lines = content.split('\n').filter(line => line.trim());
  
  // Check if content has bullet points (including numbered lists)
  const hasBullets = lines.some(line => /^[•\-*]\s|^\d+[.)]\s/.test(line.trim()));
  
  if (hasBullets) {
    return (
      <ul className="space-y-2.5">
        {lines.map((line, index) => {
          const cleanLine = line.replace(/^[•\-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
          if (!cleanLine) { return null; }
          return (
            <li key={index} className="flex items-start gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/40" />
              <span className="text-sm text-white/70 leading-relaxed">{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  
  // Render as paragraphs with proper spacing
  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <p key={index} className="text-sm text-white/70 leading-relaxed">
          {line.trim()}
        </p>
      ))}
    </div>
  );
};

/**
 * Parse a session summary message content into structured data
 */
export const parseSessionSummaryMessage = (content: string): SessionSummaryCardProps | null => {
  // Check if this is a session summary message by looking for the summary header
  const isPlayingSessionSummary = content.includes('**Playing Session Summary for');
  const isPlanningSessionSummary = content.includes('**Planning Session Summary for');
  
  if (!isPlayingSessionSummary && !isPlanningSessionSummary) { return null; }

  // Playing Session Summary = user was PLAYING, now switching TO PLANNING
  // Planning Session Summary = user was PLANNING, now switching TO PLAYING
  // So the MODE we display should be what we're switching TO:
  const switchingToPlaying = isPlanningSessionSummary;  // Planning summary -> entering Playing

  // Extract game title
  const titleMatch = content.match(/Session Summary for ([^\n*]+)/);
  const gameTitle = titleMatch ? titleMatch[1].trim() : 'Unknown Game';

  // Extract progress
  const progressMatch = content.match(/\*\*Progress:\*\*\s*(\d+)%/);
  const progress = progressMatch ? parseInt(progressMatch[1], 10) : undefined;

  // Extract current objective/focus
  const objectiveMatch = content.match(/\*\*Current Focus:\*\*\s*([^\n]+)/);
  const currentObjective = objectiveMatch ? objectiveMatch[1].trim() : undefined;

  // Extract key points/achievements - updated to match new section names
  const keyPoints: string[] = [];
  const keyPointsSection = content.match(/\*\*(Session Activity|Key Achievements|Strategies Discussed)[^:]*:\*\*\n([\s\S]*?)(?=\n\n\*\*|\n\*Switching|\*\*Planning Objectives|\*\*Current Objectives)/);
  if (keyPointsSection) {
    const points = keyPointsSection[2].match(/[•\-*]\s*([^\n]+)/g);
    if (points) {
      keyPoints.push(...points.map(p => p.replace(/^[•\-*]\s*/, '').trim()));
    }
  }

  // Extract objectives - updated to match new section names
  const objectives: string[] = [];
  const objectivesSection = content.match(/\*\*(Current Objectives|Planning Objectives|Goals for Next Session)[^:]*:\*\*\n([\s\S]*?)(?=\n\n\*\*|\n\*Switching|$)/);
  if (objectivesSection) {
    const objs = objectivesSection[2].match(/[•\-*]\s*([^\n]+)/g);
    if (objs) {
      objectives.push(...objs.map(o => o.replace(/^[•\-*]\s*/, '').trim()));
    }
  }

  // Extract recent activity (for playing mode)
  // Match everything after "Recent Activity:" until we hit the switching message or end
  let recentActivity: string | undefined;
  const activitySection = content.split(/\*\*Recent Activity:\*\*/);
  if (activitySection.length > 1) {
    // Get content after the header, stop at the switching message
    const afterHeader = activitySection[1];
    const beforeSwitch = afterHeader.split(/\n\*Switching to Planning Mode/)[0];
    recentActivity = beforeSwitch.trim();
    // Also clean up any trailing empty lines
    recentActivity = recentActivity.replace(/\n\n+$/, '').trim();
  }

  // Extract strategic notes (for planning mode)
  let strategicNotes: string | undefined;
  const strategySection = content.split(/\*\*Strategic Notes:\*\*/);
  if (strategySection.length > 1) {
    const afterHeader = strategySection[1];
    const beforeSwitch = afterHeader.split(/\n\*Switching to Playing Mode/)[0];
    strategicNotes = beforeSwitch.trim();
    strategicNotes = strategicNotes.replace(/\n\n+$/, '').trim();
  }

  return {
    // mode reflects what we're switching TO
    mode: switchingToPlaying ? 'playing' : 'planning',
    gameTitle,
    progress,
    currentObjective,
    keyPoints,
    objectives,
    recentActivity,
    strategicNotes,
    timestamp: Date.now()
  };
};

const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({
  mode,
  gameTitle,
  progress,
  currentObjective,
  keyPoints,
  objectives,
  recentActivity,
  strategicNotes,
  timestamp
}) => {
  const isPlaying = mode === 'playing';
  
  // Enhanced color palette
  // Playing = Vibrant Red/Orange gradient, Planning = Cool Blue/Purple gradient
  const colors = isPlaying ? {
    primary: '#FF6B6B',
    secondary: '#FF8E53',
    accent: '#FFB347',
    glow: 'rgba(255, 107, 107, 0.3)',
    glowSecondary: 'rgba(255, 142, 83, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 142, 83, 0.04) 100%)',
    headerBg: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 142, 83, 0.08) 100%)',
    iconBg: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
  } : {
    primary: '#60A5FA',
    secondary: '#818CF8',
    accent: '#A78BFA',
    glow: 'rgba(96, 165, 250, 0.3)',
    glowSecondary: 'rgba(129, 140, 248, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(129, 140, 248, 0.04) 100%)',
    headerBg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(129, 140, 248, 0.08) 100%)',
    iconBg: 'linear-gradient(135deg, #60A5FA 0%, #818CF8 100%)',
  };

  return (
    <div className="w-full flex justify-start">
      <div 
        className="relative w-[calc(100%-1.5rem)] mx-3 sm:w-full sm:max-w-lg md:max-w-xl md:mx-0 my-4 overflow-hidden"
        style={{
          background: colors.bgGradient,
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: `0 8px 32px ${colors.glow}, 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)`
        }}
      >
        {/* Animated gradient border effect */}
        <div 
          className="absolute inset-0 rounded-[16px] pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}20 0%, transparent 50%, ${colors.secondary}20 100%)`,
            opacity: 0.5
          }}
        />

        {/* Header with glass effect */}
        <div 
          className="relative p-4 pb-3"
          style={{ background: colors.headerBg }}
        >
          {/* Top accent line */}
          <div 
            className="absolute top-0 left-6 right-6 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colors.primary} 30%, ${colors.secondary} 50%, ${colors.accent} 70%, transparent 100%)`,
              opacity: 0.8
            }}
          />
          
          <div className="flex items-center gap-4">
            {/* Mode Icon with gradient background */}
            <div 
              className="relative p-3 rounded-2xl flex-shrink-0 shadow-lg"
              style={{
                background: colors.iconBg,
                boxShadow: `0 4px 16px ${colors.glow}`
              }}
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              )}
              {/* Subtle shine effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-30"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)'
                }}
              />
            </div>

            {/* Title & Game Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 
                  className="text-lg font-bold tracking-wide bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                >
                  {isPlaying ? 'Active Session' : 'Planning Session'}
                </h3>
                <span 
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}15)`,
                    color: colors.primary,
                    border: `1px solid ${colors.primary}30`,
                    boxShadow: `0 2px 8px ${colors.glow}`
                  }}
                >
                  <span>{isPlaying ? 'Playing' : 'Planning'}</span>
                </span>
              </div>
              <p className="text-sm text-white/90 font-medium mt-1 break-words">{gameTitle}</p>
              <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {progress !== undefined && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 font-medium uppercase tracking-wide">Game Progress</span>
              <span 
                className="text-sm font-bold"
                style={{ color: colors.primary }}
              >
                {progress}%
              </span>
            </div>
            <div 
              className="h-2.5 rounded-full overflow-hidden"
              style={{ 
                background: 'rgba(255,255,255,0.05)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
                }}
              >
                {/* Animated shine */}
                <div 
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Current Focus Card */}
        {currentObjective && (
          <div className="px-4 pb-3">
            <div 
              className="p-3.5 rounded-xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}12, ${colors.secondary}08)`,
                border: `1px solid ${colors.primary}20`
              }}
            >
              {/* Left accent bar */}
              <div 
                className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
              />
              <div className="flex items-start gap-2.5 pl-3">
                <svg 
                  className="w-4 h-4 mt-0.5 flex-shrink-0" 
                  style={{ color: colors.primary }} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                <div>
                  <span 
                    className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                    style={{ color: colors.primary }}
                  >
                    {isPlaying ? 'Current Objective' : 'Main Focus'}
                  </span>
                  <p className="text-sm text-white/85 leading-relaxed">{currentObjective}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Sections */}
        <div className="relative z-10 px-4 pt-3 pb-4 space-y-2.5">
          {/* Achievements / Key Strategies */}
          {keyPoints.length > 0 && (
            <CollapsibleSection
              title={isPlaying ? 'Activity Summary' : 'Key Strategies'}
              accentColor={colors.primary}
              defaultOpen={true}
              icon={
                isPlaying ? (
                  <svg className="w-4 h-4" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )
              }
            >
              <ul className="space-y-2.5">
                {keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span 
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        boxShadow: `0 0 6px ${colors.glow}`
                      }}
                    />
                    <span className="text-sm text-white/70 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Objectives / Goals */}
          {objectives.length > 0 && (
            <CollapsibleSection
              title={isPlaying ? 'Current Objectives' : 'Session Goals'}
              accentColor={colors.secondary}
              defaultOpen={false}
              icon={
                <svg className="w-4 h-4" style={{ color: colors.secondary }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              }
            >
              <ul className="space-y-2.5">
                {objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span 
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.secondary}, ${colors.accent})`,
                        boxShadow: `0 0 6px ${colors.glowSecondary}`
                      }}
                    />
                    <span className="text-sm text-white/70 leading-relaxed">{objective}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Recent Activity / Strategic Notes */}
          {(recentActivity || strategicNotes) && (
            <CollapsibleSection
              title={recentActivity ? 'Recent Activity' : 'Strategic Notes'}
              accentColor="rgba(255,255,255,0.4)"
              defaultOpen={false}
              icon={
                <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              }
            >
              <FormattedContent content={recentActivity || strategicNotes || ''} />
            </CollapsibleSection>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{ 
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="relative w-2.5 h-2.5 rounded-full"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 0 8px ${colors.glow}`
              }}
            >
              <div 
                className="absolute inset-0 rounded-full animate-ping"
                style={{ 
                  background: colors.primary,
                  opacity: 0.4
                }}
              />
            </div>
            <span className="text-xs text-white/40">Session synced</span>
          </div>
          <span 
            className="text-xs font-semibold flex items-center gap-1.5"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {isPlaying ? 'Session in progress' : 'Planning session active'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionSummaryCard;