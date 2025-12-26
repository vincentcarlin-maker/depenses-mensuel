
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import WarningIcon from './icons/WarningIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  useEffect(() => {
    if (!isOpen) return;
    
    // Fermer le clavier virtuel sur mobile pour maximiser l'espace et le centrage
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-center items-center px-4 min-h-screen" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl z-[101] w-full max-w-sm m-4 animate-fade-in-up relative transform transition-all">
        <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/20 sm:mx-0 sm:h-10 sm:w-10">
                <div className="text-red-600 dark:text-red-400">
                    <WarningIcon />
                </div>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-bold text-slate-900 dark:text-slate-100" id="modal-title">
                    {title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {message}
                    </p>
                </div>
            </div>
        </div>
        <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
                type="button"
                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-all active:scale-95"
                onClick={onConfirm}
            >
                Confirmer
            </button>
            <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2.5 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:w-auto sm:text-sm transition-all active:scale-95"
                onClick={onClose}
            >
                Annuler
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
