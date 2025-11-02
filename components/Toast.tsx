import React, { useEffect } from 'react';
import InfoIcon from './icons/InfoIcon';
import CloseIcon from './icons/CloseIcon';
import WarningIcon from './icons/WarningIcon';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'info' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000, type = 'info' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  const isError = type === 'error';

  const iconContainerClass = isError 
    ? "inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg"
    : "inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-cyan-500 bg-cyan-100 rounded-lg";

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center w-full max-w-xs p-4 text-slate-600 bg-white rounded-lg shadow-lg border border-slate-200 animate-slide-in-right"
      role="alert"
    >
      <div className={iconContainerClass}>
        {isError ? <WarningIcon /> : <InfoIcon />}
      </div>
      <div className="ml-3 text-sm font-normal">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 inline-flex h-8 w-8"
        aria-label="Close"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <CloseIcon />
      </button>
    </div>
  );
};

export default Toast;