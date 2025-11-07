import React, { useEffect, useState } from 'react';
import { type Reminder } from '../types';
import RemindersTab from './RemindersTab';
import CloseIcon from './icons/CloseIcon';
import ThemeToggle from './ThemeToggle';
import HistoryTab from './HistoryTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

type SettingsTab = 'reminders' | 'appearance' | 'history';

const SettingsModal = ({ 
    isOpen, 
    onClose, 
    reminders, 
    onAddReminder, 
    onUpdateReminder, 
    onDeleteReminder 
}: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('reminders');

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
  
  const tabs: {id: SettingsTab, label: string}[] = [
      { id: 'reminders', label: 'Rappels' },
      { id: 'appearance', label: 'Apparence' },
      { id: 'history', label: 'Historique' },
  ];

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
        <main className="h-[calc(100%-64px)] container mx-auto flex flex-col">
           <div className="px-4 md:px-8 border-b border-slate-200 dark:border-slate-700">
             <nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                 {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === tab.id
                          ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
            </nav>
           </div>
            <div className="p-4 md:p-8 overflow-y-auto flex-1">
                {activeTab === 'reminders' && (
                    <RemindersTab
                        reminders={reminders}
                        onAddReminder={onAddReminder}
                        onUpdateReminder={onUpdateReminder}
                        onDeleteReminder={onDeleteReminder}
                    />
                )}
                {activeTab === 'appearance' && (
                     <div className="space-y-8 max-w-2xl mx-auto">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Thème</h3>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex justify-between items-center">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Activer le thème sombre</span>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'history' && (
                    <HistoryTab />
                )}
            </div>
        </main>
    </div>
  );
};

export default SettingsModal;