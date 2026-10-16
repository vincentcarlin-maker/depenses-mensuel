
import React from 'react';
import HomeIcon from './icons/HomeIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import CalendarIcon from './icons/CalendarIcon';
import PiggyBankIcon from './icons/PiggyBankIcon';
import SettingsIcon from './icons/SettingsIcon';

export type TabId = 'dashboard' | 'analysis' | 'yearly' | 'moneypot' | 'settings';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenSettings?: () => void;
  isSettingsActive?: boolean;
  badges?: Partial<Record<TabId, number>>;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  badges = {} 
}) => {
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Accueil', icon: HomeIcon },
    { id: 'analysis' as TabId, label: 'Analyse', icon: ChartPieIcon },
    { id: 'yearly' as TabId, label: 'Annuel', icon: CalendarIcon },
    { id: 'moneypot' as TabId, label: 'Cagnotte', icon: PiggyBankIcon },
    { id: 'settings' as TabId, label: 'Réglages', icon: SettingsIcon },
  ];

  return (
    <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 z-40 px-3.5 sm:px-6 pointer-events-none pb-[env(safe-area-inset-bottom)] transition-all duration-300">
      <nav 
        className="pointer-events-auto max-w-md sm:max-w-lg mx-auto bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-full p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.14),0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.65)]"
        aria-label="Navigation principale"
      >
        <div className="flex items-center justify-around gap-0.5 sm:gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const badgeCount = badges[tab.id] || 0;
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none min-w-[56px] sm:min-w-[64px] ${
                  isActive 
                    ? 'bg-slate-200/80 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold px-3.5 sm:px-4 py-1.5 rounded-2xl sm:rounded-3xl shadow-2xs scale-[1.02]' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 sm:px-3 py-1.5 rounded-2xl active:scale-95'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon 
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isActive 
                        ? 'text-sky-600 dark:text-sky-400 stroke-[2.3]' 
                        : 'text-slate-700 dark:text-slate-200 stroke-[1.8]'
                    }`} 
                  />
                  {badgeCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 animate-pulse"
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span 
                  className={`text-[11px] mt-0.5 leading-tight ${
                    isActive 
                      ? 'font-bold text-sky-600 dark:text-sky-400' 
                      : 'font-medium text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;

