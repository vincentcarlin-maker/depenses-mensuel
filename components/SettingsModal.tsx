import React, { useEffect } from 'react';
import { type Reminder } from '../types';
import RemindersTab from './RemindersTab';
import CloseIcon from './icons/CloseIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    reminders, 
    onAddReminder, 
    onUpdateReminder, 
    onDeleteReminder 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
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

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-50 z-50 animate-slide-in-right"
      aria-modal="true" 
      role="dialog"
    >
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Réglages</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Fermer les réglages"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <main className="p-4 md:p-8 overflow-y-auto h-[calc(100%-64px)]">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Gestion des rappels</h3>
            <RemindersTab
                reminders={reminders}
                onAddReminder={onAddReminder}
                onUpdateReminder={onUpdateReminder}
                onDeleteReminder={onDeleteReminder}
            />
        </main>
    </div>
  );
};

export default SettingsModal;