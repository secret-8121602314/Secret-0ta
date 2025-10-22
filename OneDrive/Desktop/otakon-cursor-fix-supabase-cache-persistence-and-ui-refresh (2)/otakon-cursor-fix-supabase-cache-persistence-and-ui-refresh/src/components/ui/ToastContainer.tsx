import React, { useEffect, useState } from 'react';
import { Toast, toastService } from '../../services/toastService';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

const ToastIcon: React.FC<{ type: Toast['type'] }> = ({ type }) => {
  const className = "w-5 h-5 flex-shrink-0";
  
  switch (type) {
    case 'success':
      return <CheckCircleIcon className={`${className} text-green-500`} />;
    case 'error':
      return <XCircleIcon className={`${className} text-red-500`} />;
    case 'warning':
      return <ExclamationTriangleIcon className={`${className} text-yellow-500`} />;
    case 'info':
      return <InformationCircleIcon className={`${className} text-blue-500`} />;
  }
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-900 dark:text-green-100';
      case 'error':
        return 'text-red-900 dark:text-red-100';
      case 'warning':
        return 'text-yellow-900 dark:text-yellow-100';
      case 'info':
        return 'text-blue-900 dark:text-blue-100';
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()}
        ${getTextColor()}
        p-4 rounded-lg shadow-lg border
        max-w-md w-full
        pointer-events-auto
        animate-slide-in
      `}
    >
      <div className="flex items-start gap-3">
        <ToastIcon type={toast.type} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">
            {toast.message}
          </p>
          
          {toast.action && (
            <button
              onClick={async () => {
                await toast.action?.onClick();
                toastService.dismiss(toast.id);
              }}
              className="
                text-xs mt-2 font-semibold underline
                hover:no-underline
                transition-all
                focus:outline-none focus:ring-2 focus:ring-offset-2
              "
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {toast.dismissible && (
          <button
            onClick={() => toastService.dismiss(toast.id)}
            className="
              flex-shrink-0
              text-current opacity-50 hover:opacity-100
              transition-opacity
              focus:outline-none focus:ring-2 focus:ring-offset-2
              rounded
              p-1
            "
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <div 
      className="
        fixed bottom-4 right-4 z-50
        flex flex-col gap-2
        pointer-events-none
        max-h-screen overflow-hidden
      "
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
