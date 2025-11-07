import React, { useEffect } from 'react';
import { type Reminder } from '../types';
import RemindersTab from './RemindersTab';
import CloseIcon from './icons/CloseIcon';
import ThemeToggle from './ThemeToggle';

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
      className="fixed inset-0 bg-gray-50 dark:bg-slate-900 z-50 animate-slide-in-up"
      aria-modal="true" 
      role="dialog"
    >
        <header className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Réglages</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Fermer les réglages"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <main className="p-4 md:p-8 overflow-y-auto h-[calc(100%-64px)] container mx-auto">
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Apparence</h3>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex justify-between items-center">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Thème sombre</span>
                        <ThemeToggle />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Gestion des rappels</h3>
                    <RemindersTab
                        reminders={reminders}
                        onAddReminder={onAddReminder}
                        onUpdateReminder={onUpdateReminder}
                        onDeleteReminder={onDeleteReminder}
                    />
                </div>
            </div>
        </main>
    </div>
  );
};

export default SettingsModal;