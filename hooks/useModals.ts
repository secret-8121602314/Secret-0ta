import { useState, useCallback } from 'react';
import { ContextMenuState, ContextMenuItem } from '../services/types';
import { FeedbackModalState, ActiveModal } from './useAppState';

interface UseModalsProps {
  setContextMenu: (menu: ContextMenuState | null) => void;
  setFeedbackModalState: (state: FeedbackModalState | null) => void;
  setActiveModal: (modal: ActiveModal) => void;
}

export const useModals = ({
  setContextMenu,
  setFeedbackModalState,
  setActiveModal,
}: UseModalsProps) => {
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleSettingsClick = useCallback((event: React.MouseEvent, userEmail?: string, contextMenuHandlers?: any) => {
    event.preventDefault();
    event.stopPropagation();
    
    const isDeveloperMode = userEmail ? require('../config/developer').canAccessDeveloperFeatures(userEmail) : false;
    
    const menuItems: ContextMenuItem[] = [
      { label: 'Settings', action: () => contextMenuHandlers?.onSettings() },
      { label: 'Insights', action: () => contextMenuHandlers?.onInsights() },
      { label: 'About', action: () => contextMenuHandlers?.onAbout() },
      { label: 'Privacy Policy', action: () => contextMenuHandlers?.onPrivacy() },
      { label: 'Refund Policy', action: () => contextMenuHandlers?.onRefund() },
      { label: 'Contact Us', action: () => contextMenuHandlers?.onContact() },
    ];

    if (isDeveloperMode) {
      menuItems.push(
        { label: 'Cache Performance', action: () => contextMenuHandlers?.onCachePerformance() },
        { label: 'Reset First Run Experience', action: () => contextMenuHandlers?.onResetFirstRun() },
        { label: 'Logout & Reset', action: () => contextMenuHandlers?.onLogout() }
      );
    } else {
      menuItems.push({ label: 'Logout', action: () => contextMenuHandlers?.onLogoutOnly() });
    }

    setContextMenu({
      targetRect: {
        x: event.clientX,
        y: event.clientY,
        width: 0,
        height: 0,
        top: event.clientY,
        right: event.clientX,
        bottom: event.clientY,
        left: event.clientX,
        toJSON: () => ({})
      },
      items: menuItems,
    });
  }, [setContextMenu]);

  const handleContextMenuAction = useCallback((action: string, handlers: {
    onSettings: () => void;
    onInsights: () => void;
    onAbout: () => void;
    onPrivacy: () => void;
    onRefund: () => void;
    onContact: () => void;
    onCachePerformance: () => void;
    onResetFirstRun: () => void;
    onLogout: () => void;
    onReset: () => void;
  }) => {
    setContextMenu(null);
    
    switch (action) {
      case 'settings':
        handlers.onSettings();
        break;
      case 'insights':
        handlers.onInsights();
        break;
      case 'about':
        handlers.onAbout();
        break;
      case 'privacy':
        handlers.onPrivacy();
        break;
      case 'refund':
        handlers.onRefund();
        break;
      case 'contact':
        handlers.onContact();
        break;
      case 'cache-performance':
        handlers.onCachePerformance();
        break;
      case 'reset-first-run':
        handlers.onResetFirstRun();
        break;
      case 'logout':
        handlers.onLogout();
        break;
      case 'reset':
        handlers.onReset();
        break;
    }
  }, [setContextMenu]);

  const handleFeedback = useCallback((type: 'message' | 'insight', convId: string, targetId: string, originalText: string, vote: 'up' | 'down') => {
    setFeedbackModalState({
      isOpen: true,
      messageId: targetId,
      insightId: type === 'insight' ? targetId : undefined,
      conversationId: convId,
      originalText,
      type,
      vote,
    });
  }, [setFeedbackModalState]);

  const closeFeedbackModal = useCallback(() => {
    setFeedbackModalState(null);
  }, [setFeedbackModalState]);

  const openModal = useCallback((modal: ActiveModal) => {
    setActiveModal(modal);
  }, [setActiveModal]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, [setActiveModal]);

  const showConfirmation = useCallback((title: string, message: string, onConfirm: () => void) => {
    console.log('🔐 [Confirmation] Showing confirmation modal:', { title, message });
    setConfirmationModal({ title, message, onConfirm });
  }, []);

  const hideConfirmation = useCallback(() => {
    console.log('🔐 [Confirmation] Hiding confirmation modal');
    setConfirmationModal(null);
  }, []);

  return {
    confirmationModal,
    handleSettingsClick,
    handleContextMenuAction,
    handleFeedback,
    closeFeedbackModal,
    openModal,
    closeModal,
    showConfirmation,
    hideConfirmation,
  };
};
