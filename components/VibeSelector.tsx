import React from 'react';
import { useTheme, type Vibe } from '../hooks/useTheme';

interface VibeConfig {
  id: Vibe;
  label: string;
  bgHex: string;
  bgClass: string;
  isDefault?: boolean;
}

const VIBE_OPTIONS: VibeConfig[] = [
  { id: 'cyan', label: 'Bleu', bgHex: '#00c5eb', bgClass: 'bg-[#00c5eb]', isDefault: true },
  { id: 'indigo', label: 'Royal', bgHex: '#6366f1', bgClass: 'bg-[#6366f1]' },
  { id: 'teal', label: 'Lagon', bgHex: '#00c49f', bgClass: 'bg-[#00c49f]' },
  { id: 'emerald', label: 'Forêt', bgHex: '#22c55e', bgClass: 'bg-[#22c55e]' },
  { id: 'orange', label: 'Énergie', bgHex: '#f97316', bgClass: 'bg-[#f97316]' },
  { id: 'amber', label: 'Sable', bgHex: '#f59e0b', bgClass: 'bg-[#f59e0b]' },
  { id: 'rose', label: 'Sunset', bgHex: '#f43f5e', bgClass: 'bg-[#f43f5e]' },
  { id: 'fuchsia', label: 'Flash', bgHex: '#d946ef', bgClass: 'bg-[#d946ef]' },
  { id: 'violet', label: 'Galaxie', bgHex: '#8b5cf6', bgClass: 'bg-[#8b5cf6]' },
];

const VibeSelector: React.FC = () => {
  const { vibe, changeVibe } = useTheme();

  const currentVibeConfig = VIBE_OPTIONS.find(o => o.id === vibe) || VIBE_OPTIONS[0];

  return (
    <div className="space-y-5">
      {/* Theme Preview Card matching screenshot */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#e0f2fe]/80 via-[#eff6ff]/80 to-[#e0e7ff]/80 dark:from-slate-700/60 dark:via-slate-700/40 dark:to-slate-700/60 p-4 sm:p-5 border border-sky-100/60 dark:border-slate-600/50 flex items-center justify-between">
        {/* Soft blur backdrop effect */}
        <div 
          className="absolute -right-4 -bottom-6 w-36 h-36 rounded-full blur-2xl opacity-40 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: currentVibeConfig.bgHex }}
        />

        {/* Left text */}
        <div className="space-y-1 z-10 max-w-[55%]">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
            Un aperçu<br />de votre thème
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Une interface à votre image pour mieux gérer votre budget.
          </p>
        </div>

        {/* Right floating mini mockup */}
        <div className="z-10 shrink-0 transform rotate-3 hover:rotate-0 transition-transform duration-300">
          <div className="w-32 sm:w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-800 dark:text-white">DuoBudget</span>
              <div 
                className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: currentVibeConfig.bgHex }}
              />
            </div>
            
            {/* Mini bar chart */}
            <div className="flex items-end gap-1.5 h-8 bg-slate-50 dark:bg-slate-900/60 rounded-lg p-1.5">
              <div 
                className="w-2 h-4 rounded-xs transition-all duration-300" 
                style={{ backgroundColor: currentVibeConfig.bgHex, opacity: 0.85 }} 
              />
              <div 
                className="w-2 h-6 rounded-xs transition-all duration-300" 
                style={{ backgroundColor: currentVibeConfig.bgHex }} 
              />
              <div 
                className="w-2 h-3.5 rounded-xs transition-all duration-300" 
                style={{ backgroundColor: currentVibeConfig.bgHex, opacity: 0.65 }} 
              />
            </div>

            {/* Placeholder rows */}
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 w-full" />
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3x3 Color Swatch Grid */}
      <div className="grid grid-cols-3 gap-y-6 gap-x-2 sm:gap-x-4 pt-1">
        {VIBE_OPTIONS.map((opt) => {
          const isActive = vibe === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => changeVibe(opt.id)}
              className="flex flex-col items-center justify-center cursor-pointer group select-none"
            >
              {/* Swatch Button */}
              <div className="relative">
                <div 
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-200 shadow-md group-hover:scale-105 active:scale-95 flex items-center justify-center ${
                    isActive 
                      ? 'ring-2 ring-sky-400 dark:ring-sky-400 ring-offset-3 dark:ring-offset-slate-800' 
                      : 'hover:opacity-95'
                  }`}
                  style={{ backgroundColor: opt.bgHex }}
                />

                {/* Active Checkmark Bubble */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-800 animate-scale-in">
                    <svg className="w-3 h-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Swatch Label */}
              <span className={`text-xs sm:text-sm font-bold mt-2 transition-colors ${
                isActive 
                  ? 'text-slate-900 dark:text-white' 
                  : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
              }`}>
                {opt.label}
              </span>

              {/* Default Badge if applicable */}
              {opt.isDefault && (
                <span className="px-2 py-0.5 rounded-full bg-[#e0f2fe] dark:bg-sky-950/70 text-[#0284c7] dark:text-sky-300 text-[10px] font-extrabold mt-0.5 leading-tight">
                  Défaut
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VibeSelector;
