
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
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, onOpenSettings }) => {
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Accueil', icon: HomeIcon },
    { id: 'analysis' as TabId, label: 'Analyse', icon: ChartPieIcon },
    { id: 'yearly' as TabId, label: 'Annuel', icon: CalendarIcon },
    { id: 'moneypot' as TabId, label: 'Cagnotte', icon: PiggyBankIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-[calc(env(safe-area-inset-bottom)+16px)] z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive 
                  ? 'text-cyan-600 dark:text-cyan-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <SettingsIcon />
          <span className="text-[10px] font-medium">Réglages</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;
