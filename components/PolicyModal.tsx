import React from 'react';

interface PolicyModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl w-full max-w-4xl m-4 relative animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-6 border-b border-[#2E2E2E]/60 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#F5F5F5]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </header>
        <main className="flex-1 overflow-y-auto p-8 min-h-0">
            <div className="prose prose-invert prose-lg max-w-none prose-p:text-neutral-300 prose-a:text-[#FFAB40]">
                {children}
            </div>
        </main>
        <footer className="flex-shrink-0 p-6 border-t border-[#2E2E2E]/60 flex justify-end">
            <button
              onClick={onClose}
              className="bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Back
            </button>
        </footer>
      </div>
    </div>
  );
};

export default PolicyModal;
