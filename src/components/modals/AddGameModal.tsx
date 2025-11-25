import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PuzzlePieceIcon } from '@heroicons/react/24/solid';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (gameName: string, query: string) => void;
}

const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onCreateGame,
}) => {
  const [gameName, setGameName] = useState('');
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!gameName.trim()) {
      setError('Please enter a game name');
      return;
    }
    if (!query.trim()) {
      setError('Please enter a query or question');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateGame(gameName.trim(), query.trim());
      
      // Reset form and close modal on success
      setGameName('');
      setQuery('');
      onClose();
    } catch (err) {
      setError('Failed to create game tab. Please try again.');
      console.error('Error creating game:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setGameName('');
      setQuery('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border-2 border-transparent bg-clip-padding" style={{ backgroundImage: 'linear-gradient(#1a1a1a, #1a1a1a), linear-gradient(135deg, #FF4D4D, #FFAB40)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src="/images/mascot/6.png"
              alt="Add Game"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain aspect-square"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <h2 className="text-2xl font-bold text-white">Add Game</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Game Name Input */}
          <div>
            <label htmlFor="gameName" className="block text-sm font-medium text-gray-300 mb-2">
              Game Name *
            </label>
            <input
              id="gameName"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g., The Witcher 3, Elden Ring, Valorant"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              maxLength={100}
            />
          </div>

          {/* Query Input */}
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-300 mb-2">
              Question or Query *
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to know about this game? (e.g., 'How do I get started?' or 'Best build for beginners?')"
              disabled={isSubmitting}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {query.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !gameName.trim() || !query.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Game Tab'
              )}
            </button>
          </div>
        </form>

        {/* Helper Text */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500">
            💡 Tip: Otagon will create a dedicated chat tab for your game with AI-powered assistance and subtabs for different aspects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
