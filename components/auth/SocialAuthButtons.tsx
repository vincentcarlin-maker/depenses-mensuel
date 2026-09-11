import React from 'react';
import GoogleIcon from '../icons/GoogleIcon';

interface SocialAuthButtonsProps {
  onSelect: (provider: 'google') => void;
  loadingProvider: 'google' | null;
  actionLabel?: 'connecter' | 'inscrire' | 'continuer';
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onSelect,
  loadingProvider,
  actionLabel = 'continuer'
}) => {
  const textGoogle =
    actionLabel === 'inscrire'
      ? "S'inscrire avec Google"
      : actionLabel === 'connecter'
      ? 'Se connecter avec Google'
      : 'Continuer avec Google';

  const isLoading = loadingProvider === 'google';

  return (
    <button
      type="button"
      id="auth-google-button"
      onClick={() => onSelect('google')}
      disabled={Boolean(loadingProvider)}
      className="group relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-100 font-semibold text-sm border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent pointer-events-none" />
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-sky-500 rounded-full animate-spin shrink-0" />
      ) : (
        <GoogleIcon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      )}
      <span className="font-medium tracking-tight text-slate-800 dark:text-slate-100">{textGoogle}</span>
    </button>
  );
};

export const AuthDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="relative flex items-center justify-center my-4">
    <div className="border-t border-slate-200/80 dark:border-slate-800 w-full" />
    <span className="bg-white/90 dark:bg-slate-900/90 px-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 select-none backdrop-blur-xs">
      {label}
    </span>
  </div>
);
