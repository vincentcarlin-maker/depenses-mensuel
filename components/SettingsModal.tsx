import React, { useState, useEffect } from 'react';
import { type Reminder } from '../types';
import RemindersTab from './RemindersTab';
import CloseIcon from './icons/CloseIcon';
import ThemeToggle from './ThemeToggle';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
import BellIcon from './icons/BellIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  // FIX: The keys to be omitted in the `Omit` type should be a union, not separate arguments.
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

const SettingsMenuItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center p-4 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
  >
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
      {icon}
    </div>
    <div className="flex-1 text-left ml-4">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <div className="text-slate-400 dark:text-slate-500">
      <ChevronRightIcon />
    </div>
  </button>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    reminders, 
    onAddReminder, 
    onUpdateReminder, 
    onDeleteReminder 
}) => {
  const [activeView, setActiveView] = useState<'main' | 'appearance' | 'reminders'>('main');

  useEffect(() => {
    if (isOpen) {
        setActiveView('main');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    const handleEsc = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
          if (activeView !== 'main') {
            setActiveView('main');
          } else {
            onClose();
          }
       }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, activeView]);

  if (!isOpen) {
    return null;
  }
  
  const viewTitles = {
      main: 'Réglages',
      appearance: 'Apparence',
      reminders: 'Gestion des rappels',
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-50 dark:bg-slate-900 z-50 animate-slide-in-up"
      aria-modal="true" 
      role="dialog"
    >
        <header className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {activeView !== 'main' && (
                    <button
                        onClick={() => setActiveView('main')}
                        className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Retour"
                    >
                        <ArrowLeftIcon />
                    </button>
                )}
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{viewTitles[activeView]}</h2>
            </div>
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
            {activeView === 'main' && (
                 <div className="space-y-2 bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-2xl shadow-lg">
                    <SettingsMenuItem
                        icon={<PaintBrushIcon />}
                        title="Apparence"
                        description="Changer le thème de l'application"
                        onClick={() => setActiveView('appearance')}
                    />
                    <SettingsMenuItem
                        icon={<BellIcon />}
                        title="Rappels"
                        description="Gérer les dépenses mensuelles récurrentes"
                        onClick={() => setActiveView('reminders')}
                    />
                 </div>
            )}
            {activeView === 'appearance' && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex justify-between items-center animate-fade-in">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Thème sombre</span>
                    <ThemeToggle />
                </div>
            )}
            {activeView === 'reminders' && (
                <div className="animate-fade-in">
                    <RemindersTab
                        reminders={reminders}
                        onAddReminder={onAddReminder}
                        onUpdateReminder={onUpdateReminder}
                        onDeleteReminder={onDeleteReminder}
                    />
                </div>
            )}
        </main>
    </div>
  );
};

export default SettingsModal;
