import React from 'react';

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight?: any;
}

const InsightModal: React.FC<InsightModalProps> = ({ isOpen, onClose, insight }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Insight</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="text-gray-700">
          {insight ? (
            <div>
              <h3 className="font-semibold mb-2">{insight.title}</h3>
              <p>{insight.content}</p>
            </div>
          ) : (
            <p>No insight available.</p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;
