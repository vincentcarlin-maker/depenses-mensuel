import React, { useState, useEffect, useRef } from 'react';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import BellIcon from './icons/BellIcon';
import { User, type Expense } from '../types';

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
  onOpenSettings: () => void;
  onLogout: () => void;
  loggedInUser: User;
  notifications: { expense: Expense; type: 'add' | 'update' }[];
  onClearNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onLogout, loggedInUser, notifications, onClearNotifications }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [lastShownNotifications, setLastShownNotifications] = useState<{ expense: Expense; type: 'add' | 'update' }[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const userColorClass = loggedInUser === User.Sophie ? 'bg-rose-500' : 'bg-sky-500';
  const userColorTextClass = loggedInUser === User.Sophie ? 'text-rose-500' : 'text-sky-500';
  const userInitial = loggedInUser.charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationsToggle = () => {
      const shouldOpen = !isNotificationsOpen;
      setIsNotificationsOpen(shouldOpen);
      if (shouldOpen && notifications.length > 0) {
          setLastShownNotifications(notifications);
          onClearNotifications();
      }
  };

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
            <div className="relative" ref={notificationsRef}>
                <button
                    onClick={handleNotificationsToggle}
                    className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
                    aria-label="Notifications"
                >
                    <BellIcon />
                    {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800" />
                    )}
                </button>

                {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-30 border border-slate-200 dark:border-slate-700 animate-fade-in">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Activité Récente</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {lastShownNotifications.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {lastShownNotifications.map(({ expense, type }) => (
                                        <li key={expense.id} className="p-4">
                                            <p className="text-sm text-slate-700 dark:text-slate-200">
                                                <span className={`font-bold ${expense.user === User.Sophie ? 'text-rose-500' : 'text-sky-500'}`}>{expense.user}</span>
                                                {type === 'add' ? ` a ajouté ` : ` a mis à jour `}
                                                <span className="font-semibold text-slate-800 dark:text-slate-100">{expense.description}</span>
                                                {` (${expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {new Date(expense.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                                    Vous êtes à jour !
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
                >
                    <div className={`w-8 h-8 rounded-full ${userColorClass} flex items-center justify-center text-white font-bold text-sm`}>
                        {userInitial}
                    </div>
                    <span className={`hidden sm:block font-semibold text-sm pr-2 ${userColorTextClass}`}>{loggedInUser}</span>
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl py-2 z-30 border border-slate-200 dark:border-slate-700 animate-fade-in">
                        <button
                            onClick={() => {
                                onOpenSettings();
                                setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <SettingsIcon />
                            <span className="ml-3">Réglages</span>
                        </button>
                        <button
                            onClick={() => {
                                onLogout();
                                setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <LogoutIcon />
                            <span className="ml-3">Déconnexion</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;