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
  
  return (
    <div 
      className="border rounded-lg overflow-hidden transition-all duration-200"
      style={{ 
        borderColor: isOpen ? `${accentColor}40` : 'rgba(255,255,255,0.08)',
        background: isOpen ? `${accentColor}08` : 'transparent'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="p-1.5 rounded-md"
            style={{ background: `${accentColor}20` }}
          >
            {icon}
          </div>
          <span 
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: accentColor }}
          >
            {title}
          </span>
        </div>
        <svg 
          className="w-4 h-4 text-[#888] transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-3 pb-3 pt-1 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

// Format content with proper bullet points and line breaks
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  // Split content by newlines and process each line
  const lines = content.split('\n').filter(line => line.trim());
  
  // Check if content has bullet points
  const hasBullets = lines.some(line => /^[•\-\*]\s/.test(line.trim()));
  
  if (hasBullets) {
    return (
      <ul className="space-y-2">
        {lines.map((line, index) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
          if (!cleanLine) return null;
          return (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#666]" />
              <span className="text-sm text-[#B8B8B8] leading-relaxed">{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  
  // Render as paragraphs
  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <p key={index} className="text-sm text-[#A3A3A3] leading-relaxed">
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
  
  if (!isPlayingSessionSummary && !isPlanningSessionSummary) return null;

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

  // Extract key points/achievements
  const keyPoints: string[] = [];
  const keyPointsSection = content.match(/\*\*(Key Achievements|Strategies Discussed)[^:]*:\*\*\n([\s\S]*?)(?=\n\n\*\*|\n\*Switching|\*\*Goals|\*\*Current Objectives)/);
  if (keyPointsSection) {
    const points = keyPointsSection[2].match(/[•\-]\s*([^\n]+)/g);
    if (points) {
      keyPoints.push(...points.map(p => p.replace(/^[•\-]\s*/, '').trim()));
    }
  }

  // Extract objectives
  const objectives: string[] = [];
  const objectivesSection = content.match(/\*\*(Current Objectives|Goals for Next Session)[^:]*:\*\*\n([\s\S]*?)(?=\n\n\*\*|\n\*Switching|$)/);
  if (objectivesSection) {
    const objs = objectivesSection[2].match(/[•\-]\s*([^\n]+)/g);
    if (objs) {
      objectives.push(...objs.map(o => o.replace(/^[•\-]\s*/, '').trim()));
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
  
  // Toggle colors: Playing = Red (#FF4D4D/#EF4444), Planning = Blue (#3B82F6/#2563EB)
  const primaryColor = isPlaying ? '#EF4444' : '#3B82F6';
  const secondaryColor = isPlaying ? '#FF4D4D' : '#2563EB';
  const glowColor = isPlaying ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)';

  return (
    // Wrapper: Left-aligned on desktop (md:ml-0 md:mr-auto), centered with margin on mobile
    <div className="w-full flex justify-start">
      <div 
        className="relative w-[calc(100%-1.5rem)] mx-3 sm:w-full sm:max-w-lg md:max-w-xl md:mx-0 my-3"
        style={{
          background: '#141414',
          borderRadius: '12px',
          border: `1px solid ${primaryColor}30`,
          boxShadow: `0 4px 24px ${glowColor}, 0 0 0 1px rgba(255,255,255,0.03)`
        }}
      >
        {/* Top accent bar */}
        <div 
          className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${primaryColor}, ${secondaryColor}, ${primaryColor}, transparent)`
          }}
        />

        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Mode Icon */}
            <div 
              className="relative p-2.5 rounded-xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}25, ${primaryColor}10)`,
                border: `1px solid ${primaryColor}30`
              }}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              )}
            </div>

            {/* Title & Badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 
                  className="text-base font-bold tracking-wide"
                  style={{ color: primaryColor }}
                >
                  {isPlaying ? 'GAME ON' : 'STRATEGY TIME'}
                </h3>
                <span 
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md"
                  style={{
                    background: `${primaryColor}15`,
                    color: primaryColor,
                    border: `1px solid ${primaryColor}30`
                  }}
                >
                  {isPlaying ? '🎮 Playing' : '📋 Planning'}
                </span>
              </div>
              <p className="text-sm text-white/90 font-medium truncate">{gameTitle}</p>
              <p className="text-xs text-[#666] mt-1">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#888] font-medium">Progress</span>
              <span className="text-sm font-bold" style={{ color: primaryColor }}>{progress}%</span>
            </div>
            <div className="h-2 bg-[#1F1F1F] rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
                }}
              />
            </div>
          </div>
        )}

        {/* Current Focus */}
        {currentObjective && (
          <div 
            className="mx-4 mb-3 p-3 rounded-lg"
            style={{
              background: `${primaryColor}10`,
              borderLeft: `3px solid ${primaryColor}`
            }}
          >
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
              </svg>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: primaryColor }}>
                  Current Focus
                </span>
                <p className="text-sm text-white/90 leading-relaxed">{currentObjective}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Sections */}
        <div className="px-4 pb-4 space-y-2">
          {/* Achievements / Key Strategies */}
          {keyPoints.length > 0 && (
            <CollapsibleSection
              title={isPlaying ? 'Achievements' : 'Key Strategies'}
              accentColor={primaryColor}
              defaultOpen={true}
              icon={
                isPlaying ? (
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )
              }
            >
              <ul className="space-y-2">
                {keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span 
                      className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-sm text-[#B8B8B8] leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Objectives / Goals */}
          {objectives.length > 0 && (
            <CollapsibleSection
              title={isPlaying ? 'Next Objectives' : 'Session Goals'}
              accentColor={secondaryColor}
              defaultOpen={false}
              icon={
                <svg className="w-4 h-4" style={{ color: secondaryColor }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              }
            >
              <ul className="space-y-2">
                {objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span 
                      className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <span className="text-sm text-[#B8B8B8] leading-relaxed">{objective}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Recent Activity / Strategic Notes */}
          {(recentActivity || strategicNotes) && (
            <CollapsibleSection
              title={recentActivity ? 'Recent Activity' : 'Strategic Notes'}
              accentColor="#888"
              defaultOpen={false}
              icon={
                <svg className="w-4 h-4 text-[#888]" fill="currentColor" viewBox="0 0 20 20">
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
          className="px-4 py-3 flex items-center justify-between border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-xs text-[#666]">Session saved</span>
          </div>
          <span 
            className="text-xs font-medium"
            style={{ color: `${primaryColor}CC` }}
          >
            {isPlaying ? '⚡ Ready to conquer!' : '🎯 Plan your victory!'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionSummaryCard;