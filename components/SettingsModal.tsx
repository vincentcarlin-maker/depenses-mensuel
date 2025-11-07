import React, { useEffect, useState } from 'react';
import { type Reminder, type AuditLog } from '../types';
import RemindersTab from './RemindersTab';
import CloseIcon from './icons/CloseIcon';
import ThemeToggle from './ThemeToggle';
import HistoryTab from './HistoryTab';
import BellIcon from './icons/BellIcon';
import HistoryIcon from './icons/HistoryIcon';
import PaletteIcon from './icons/PaletteIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  auditLogs: AuditLog[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    reminders, 
    onAddReminder, 
    onUpdateReminder, 
    onDeleteReminder,
    auditLogs
}) => {
  const [activeTab, setActiveTab] = useState('reminders');

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
  
  const tabs = [
    { id: 'reminders', label: 'Rappels', icon: <BellIcon /> },
    { id: 'history', label: 'Historique', icon: <HistoryIcon /> },
    { id: 'appearance', label: 'Apparence', icon: <PaletteIcon /> },
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
        <div className="flex h-[calc(100%-64px)] container mx-auto">
            <aside className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 p-4">
                <nav className="flex md:flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {activeTab === 'reminders' && (
                     <RemindersTab
                        reminders={reminders}
                        onAddReminder={onAddReminder}
                        onUpdateReminder={onUpdateReminder}
                        onDeleteReminder={onDeleteReminder}
                    />
                )}
                {activeTab === 'history' && <HistoryTab logs={auditLogs} />}
                {activeTab === 'appearance' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Apparence</h3>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex justify-between items-center">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Thème sombre</span>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
};

export default SettingsModal;