import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onClearConversation?: () => void;
  canDelete?: boolean;
  canPin?: boolean;
  isPinned?: boolean;
  isEverythingElse?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onDelete,
  onPin,
  onUnpin,
  onClearConversation,
  canDelete = true,
  canPin = true,
  isPinned = false,
  isEverythingElse = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  // Viewport-aware positioning
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const padding = 16;

    let { x, y } = position;

    // Horizontal boundary check
    const menuHalfWidth = menuRect.width / 2;
    if (x - menuHalfWidth < padding) {
      x = menuHalfWidth + padding;
    } else if (x + menuHalfWidth > viewport.width - padding) {
      x = viewport.width - menuHalfWidth - padding;
    }

    // Vertical boundary check
    const spaceBelow = viewport.height - y;
    const spaceAbove = y;
    
    if (spaceBelow < menuRect.height + padding && spaceAbove > spaceBelow) {
      y = Math.max(padding, y - 10);
    } else if (y < padding) {
      y = padding + 10;
    }

    setAdjustedPosition({ x, y });
  }, [isOpen, position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const calculateTransform = () => {
    if (!menuRef.current) return 'translate(-50%, 10px)';
    
    const menuRect = menuRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - adjustedPosition.y;
    
    if (spaceBelow > menuRect.height + 20) {
      return 'translate(-50%, 10px)';
    } else {
      return 'translate(-50%, calc(-100% - 10px))';
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-surface border border-surface-light/20 rounded-lg shadow-xl py-2 min-w-[160px] max-h-[80vh] overflow-y-auto custom-scrollbar"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: calculateTransform(),
      }}
    >
      {/* Pin/Unpin Option */}
      {canPin && !isEverythingElse && (
        <button
          onClick={() => {
            if (isPinned) {
              onUnpin?.();
            } else {
              onPin?.();
            }
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-text-primary hover:bg-surface-light/50 transition-colors duration-200 flex items-center space-x-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isPinned ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            )}
          </svg>
          <span>{isPinned ? 'Unpin' : 'Pin to top'}</span>
        </button>
      )}

      {/* Clear conversation option - available for all conversations */}
      <button
        onClick={() => {
          onClearConversation?.();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-orange-400 hover:bg-orange-500/10 transition-colors duration-200 flex items-center space-x-3"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Clear conversation</span>
      </button>

      {/* Delete Option */}
      {canDelete && !isEverythingElse && (
        <button
          onClick={() => {
            onDelete?.();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors duration-200 flex items-center space-x-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
        </button>
      )}
    </div>
  );
};

export default ContextMenu;
