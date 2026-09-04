
import React from 'react';
import HomeIcon from './icons/HomeIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import CalendarIcon from './icons/CalendarIcon';
import PiggyBankIcon from './icons/PiggyBankIcon';
import SettingsIcon from './icons/SettingsIcon';

export type TabId = 'dashboard' | 'analysis' | 'yearly' | 'moneypot';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenSettings: () => void;
  isSettingsActive?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, onOpenSettings, isSettingsActive = false }) => {
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Accueil', icon: HomeIcon },
    { id: 'analysis' as TabId, label: 'Analyse', icon: ChartPieIcon },
    { id: 'yearly' as TabId, label: 'Annuel', icon: CalendarIcon },
    { id: 'moneypot' as TabId, label: 'Cagnotte', icon: PiggyBankIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-700/60 rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 px-3 z-30 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] transition-all duration-300">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = !isSettingsActive && activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl px-3.5 py-1.5' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1.5 px-2'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className={`text-[11px] mt-0.5 ${isActive ? 'font-semibold text-blue-600 dark:text-blue-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenSettings}
          className={`flex flex-col items-center justify-center transition-all duration-200 ${
            isSettingsActive
              ? 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl px-3.5 py-1.5'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1.5 px-2'
          }`}
        >
          <SettingsIcon className={`h-5 w-5 ${isSettingsActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className={`text-[11px] mt-0.5 ${isSettingsActive ? 'font-semibold text-blue-600 dark:text-blue-400' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Réglages</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;

