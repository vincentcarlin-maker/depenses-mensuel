import React from 'react';
import CoinOIcon from '../icons/CoinOIcon';
import { APP_LOGO_BASE64 } from '../../constants/logoBase64';

export const AuthHeader: React.FC = () => {
  return (
    <div className="relative text-center mb-6">
      {/* Brand Icon with ambient aura */}
      <div className="relative inline-block mb-3">
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#f32e5e]/25 to-sky-500/25 rounded-3xl blur-xl opacity-70 animate-pulse pointer-events-none" />
        <div className="relative p-1 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-lg border border-white/60 dark:border-slate-700/60 backdrop-blur-md">
          <img
            src={APP_LOGO_BASE64}
            alt="Logo DuoBudget"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl shadow-inner"
          />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-0.5">
        <span className="text-[#f32e5e]">Du</span>
        <span className="inline-flex items-center mx-0.5 transform -translate-y-0.5">
          <CoinOIcon />
        </span>
        <span className="text-sky-500">Budget</span>
      </h1>

      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xs sm:max-w-sm mx-auto leading-relaxed">
        Votre gestion de dépenses à deux, équilibrée et synchronisée en direct.
      </p>
    </div>
  );
};
