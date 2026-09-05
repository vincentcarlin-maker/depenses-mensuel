
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import ComputerDesktopIcon from './icons/ComputerDesktopIcon';

const ThemeSelector: React.FC = () => {
  const { themeSetting, changeThemeSetting } = useTheme();

  const options = [
    { id: 'light', label: 'Clair', icon: <SunIcon className="w-5 h-5" /> },
    { id: 'dark', label: 'Sombre', icon: <MoonIcon className="w-5 h-5" /> },
    { id: 'system', label: 'Automatique', icon: <ComputerDesktopIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full bg-[#f1f5f9] dark:bg-slate-700/50 p-1.5 rounded-2xl sm:rounded-full flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-600/40">
      {options.map((option) => {
        const isActive = themeSetting === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => changeThemeSetting(option.id as any)}
            className={`flex-1 py-3 px-2 rounded-xl sm:rounded-full flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isActive
                ? 'bg-[#e0f2fe] dark:bg-sky-950/70 text-[#0284c7] dark:text-sky-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-slate-200/40 dark:hover:bg-slate-600/40'
            }`}
            aria-pressed={isActive}
          >
            <div className={isActive ? 'text-[#0284c7] dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}>
              {option.icon}
            </div>
            <span className="text-xs sm:text-sm">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSelector;
