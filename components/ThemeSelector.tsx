
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import ComputerDesktopIcon from './icons/ComputerDesktopIcon';

const ThemeSelector: React.FC = () => {
  const { themeSetting, changeThemeSetting } = useTheme();

  const options = [
    { id: 'light', label: 'Clair', icon: <SunIcon className="h-5 w-5" /> },
    { id: 'dark', label: 'Sombre', icon: <MoonIcon className="h-5 w-5" /> },
    { id: 'system', label: 'Système', icon: <ComputerDesktopIcon className="h-5 w-5" /> },
  ];
  
  const activeIndex = options.findIndex(o => o.id === themeSetting);

  return (
    <div className="relative flex w-full max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full p-1">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => changeThemeSetting(option.id as any)}
          className={`relative z-10 w-1/3 p-1.5 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-2
            ${
              themeSetting === option.id
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
            }
          `}
          aria-pressed={themeSetting === option.id}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
      <span
        className="absolute top-1 bottom-1 w-1/3 rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
};
export default ThemeSelector;
