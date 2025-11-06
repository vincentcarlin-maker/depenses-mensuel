import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import CloudSlashIcon from './icons/CloudSlashIcon';

const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center w-full max-w-xs p-4 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in-up"
      role="status"
      aria-live="polite"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-lg">
        <CloudSlashIcon />
      </div>
      <div className="ml-3 text-sm font-medium">Vous êtes hors ligne</div>
    </div>
  );
};

export default OfflineIndicator;