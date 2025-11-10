import React from 'react';
import NotificationBell from './NotificationBell';
import SettingsIcon from './icons/SettingsIcon';
import RefreshIcon from './icons/RefreshIcon';
import LogoutIcon from './icons/LogoutIcon';
import { User } from '../types';

const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
        <rect width="40" height="40" rx="8" className="fill-cyan-500"/>
        <path d="M10 28V20" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M16 28V15" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M22 28V22" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M28 28V12" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
);

interface HeaderProps {
  onSetToast: (info: { message: string; type: 'info' | 'error' }) => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  loggedInUser: User;
}

const Header: React.FC<HeaderProps> = ({ onSetToast, onOpenSettings, onRefresh, onLogout, loggedInUser }) => {
  const userColorClass = loggedInUser === User.Sophie ? 'text-rose-500' : 'text-sky-500';
  
  return (
    <header className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Logo />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Dépenses
          </h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Connecté en tant que</span>
              <span className={`font-bold text-sm ${userColorClass}`}>{loggedInUser}</span>
            </div>
            <button
                onClick={onRefresh}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Rafraîchir les données"
                title="Rafraîchir"
            >
                <RefreshIcon />
            </button>
            <NotificationBell onSetToast={onSetToast} />
            <button
                onClick={onOpenSettings}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Ouvrir les réglages"
                title="Réglages"
            >
                <SettingsIcon />
            </button>
             <button
                onClick={onLogout}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Se déconnecter"
                title="Déconnexion"
            >
                <LogoutIcon />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;