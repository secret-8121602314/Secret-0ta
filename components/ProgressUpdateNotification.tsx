import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ProgressUpdateNotificationProps {
  progressUpdate: {
    success: boolean;
    data?: {
      old_level: number;
      new_level: number;
      event_id: string;
      game_version: string;
      eventDescription?: string;
      eventType?: string;
      newProgressLevel?: number;
    };
    message?: string;
    isDuplicate?: boolean;
    existingEventId?: string;
  };
  onConfirm: () => void;
  onReject: () => void;
  onDismiss: () => void;
}

export default function ProgressUpdateNotification({ 
  progressUpdate, 
  onConfirm, 
  onReject, 
  onDismiss 
}: ProgressUpdateNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');

  if (!progressUpdate.success) {
    return null;
  }

  const { data, isDuplicate, existingEventId } = progressUpdate;
  
  if (isDuplicate) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-md z-50">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">Progress Already Recorded</h4>
            <p className="text-sm text-blue-700 mt-1">
              This progress event was already recorded. No duplicate entry was created.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              Event ID: {existingEventId}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-blue-400 hover:text-blue-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckIcon className="w-5 h-5 text-green-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">Progress Updated!</h4>
          <p className="text-sm text-gray-600 mt-1">
            {data?.eventDescription || 'Progress level increased'}
          </p>
          
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Level {data?.old_level || 1}</span>
            <span className="text-gray-400">→</span>
            <span className="text-sm font-medium text-green-600">Level {data?.new_level || 1}</span>
          </div>

          <div className="mt-2 flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <InformationCircleIcon className="w-3 h-3" />
              <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
              <div><strong>Event ID:</strong> {data?.event_id}</div>
              <div><strong>Event Type:</strong> {data?.eventType}</div>
              <div><strong>Game Version:</strong> {data?.game_version}</div>
              <div><strong>New Progress Level:</strong> {data?.newProgressLevel}</div>
            </div>
          )}

          <div className="mt-3 flex space-x-2">
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Confirm
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Reject
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Dismiss
            </button>
          </div>

          <div className="mt-2">
            <textarea
              placeholder="Reason for rejection (optional)"
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
