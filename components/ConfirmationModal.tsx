
import React from 'react';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
    console.log('🔐 [ConfirmationModal] Rendering confirmation modal:', { title, message });
    
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in" onClick={onCancel}>
            <div
                className="bg-gradient-to-r from-[#1C1C1C]/95 to-[#0A0A0A]/95 backdrop-blur-xl border-2 border-[#424242]/60 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-md m-4 sm:m-6 relative animate-scale-in hover:border-[#424242]/80 transition-all duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 text-left leading-tight">{title}</h2>
                <p className="text-neutral-300 mb-8 sm:mb-10 text-left leading-relaxed text-base sm:text-lg">{message}</p>

                <div className="flex flex-col sm:flex-row-reverse gap-3 sm:gap-4 justify-start">
                    <button
                        onClick={() => {
                            console.log('🔐 [ConfirmationModal] Confirm button clicked');
                            onConfirm();
                        }}
                        className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/25 text-sm sm:text-base"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto bg-gradient-to-r from-neutral-600 to-neutral-700 hover:from-neutral-700 hover:to-neutral-800 text-white font-medium py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
