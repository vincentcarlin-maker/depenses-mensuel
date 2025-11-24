

import React, { useState, useEffect, useRef } from 'react';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import BellIcon from './icons/BellIcon';
import { User, type Expense, type Activity } from '../types';
import CloseIcon from './icons/CloseIcon';
import SearchIcon from './icons/SearchIcon';
import ConfirmationModal from './ConfirmationModal';
import ActivityDetailModal from './ActivityDetailModal';

const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
        <defs>
            <linearGradient id="header-logo-gradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
        </defs>
        <rect width="512" height="512" rx="128" fill="url(#header-logo-gradient)"/>
        <g fill="white">
            <rect x="136" y="256" width="64" height="160" rx="32"/>
            <rect x="224" y="160" width="64" height="256" rx="32"/>
            <rect x="312" y="96" width="64" height="320" rx="32"/>
        </g>
    </svg>
);

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  loggedInUser: User;
  activityItems: Activity[];
  unreadCount: number;
  onMarkAsRead: () => void;
  realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CONNECTING';
  onDeleteActivity: (activityId: string) => void;
  onlineUsers: User[];
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenSearch, onLogout, loggedInUser, activityItems, unreadCount, onMarkAsRead, realtimeStatus, onDeleteActivity, onlineUsers }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const userColorClass = loggedInUser === User.Sophie ? 'bg-rose-500' : 'bg-sky-500';
  const userColorTextClass = loggedInUser === User.Sophie ? 'text-rose-500' : 'text-sky-500';
  const userInitial = loggedInUser.charAt(0).toUpperCase();

  // Determine the partner (the other user)
  const partnerName = loggedInUser === User.Sophie ? User.Vincent : User.Sophie;
  const isPartnerOnline = onlineUsers.includes(partnerName);

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
      if (shouldOpen) {
        onMarkAsRead();
      }
  };
  
  const handleActivityClick = (activity: Activity) => {
    if (activity.type === 'update') {
        return; 
    }
    setSelectedActivity(activity);
    setIsNotificationsOpen(false);
  };
  
  const realtimeStatusStyles = {
    SUBSCRIBED: { textClass: 'text-green-500', title: 'Connecté en temps-réel' },
    CONNECTING: { textClass: 'text-yellow-500 animate-pulse', title: 'Connexion en cours...' },
    CHANNEL_ERROR: { textClass: 'text-red-500', title: 'Erreur de connexion temps-réel' },
    TIMED_OUT: { textClass: 'text-red-500', title: 'Connexion temps-réel expirée' },
  };
  const currentStatusStyle = realtimeStatusStyles[realtimeStatus];


  return (
    <header className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Logo />
          {/* Title hidden on mobile to make room for status */}
          <h1 className="hidden sm:block text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mr-4">
            Dépenses
          </h1>
          
          {/* Partner Status Indicator (Now Visible on All Screens) */}
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 animate-fade-in transition-colors duration-300">
                {isPartnerOnline ? (
                    <>
                        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
                            {partnerName} en ligne
                        </span>
                    </>
                ) : (
                    <>
                         <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300 dark:bg-slate-600"></span>
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {partnerName} hors ligne
                        </span>
                    </>
                )}
            </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
            <button
                onClick={onOpenSearch}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
                aria-label="Rechercher"
                title="Rechercher"
            >
                <SearchIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </button>
            <div className="relative" ref={notificationsRef}>
                <button
                    onClick={handleNotificationsToggle}
                    title={currentStatusStyle?.title}
                    className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
                    aria-label="Notifications"
                >
                    <BellIcon className={`h-6 w-6 transition-colors ${currentStatusStyle?.textClass || 'text-slate-500 dark:text-slate-400'}`} />
                    {unreadCount > 0 && (
                        unreadCount > 1 ? (
                            <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        ) : (
                            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-800" />
                        )
                    )}
                </button>

                {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-30 border border-slate-200 dark:border-slate-700 animate-fade-in">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Activité Récente</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {activityItems.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {activityItems.map((activity) => (
                                        <li 
                                            key={activity.id} 
                                            className={`flex items-center justify-between p-4 gap-2 transition-colors ${activity.type !== 'update' ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer' : ''}`}
                                            onClick={() => activity.type !== 'update' && handleActivityClick(activity)}
                                        >
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                                    <span className={`font-bold ${activity.expense.user === User.Sophie ? 'text-rose-500' : 'text-sky-500'}`}>{activity.expense.user}</span>
                                                    { activity.type === 'add' ? ` a ajouté ` : activity.type === 'update' ? ` a mis à jour ` : ' a supprimé ' }
                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{activity.expense.description || 'une dépense'}</span>
                                                    {typeof activity.expense.amount === 'number' && ` (${activity.expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {new Date(activity.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteActivity(activity.id);
                                                }}
                                                className="flex-shrink-0 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                aria-label="Supprimer cette activité"
                                                title="Supprimer"
                                            >
                                                <CloseIcon />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                                    Aucune activité récente de l'autre utilisateur.
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
                                setIsDropdownOpen(false);
                                setIsLogoutConfirmOpen(true);
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
        <ConfirmationModal
            isOpen={isLogoutConfirmOpen}
            onClose={() => setIsLogoutConfirmOpen(false)}
            onConfirm={() => {
                setIsLogoutConfirmOpen(false);
                onLogout();
            }}
            title="Déconnexion"
            message="Êtes-vous sûr de vouloir vous déconnecter ?"
        />
        {selectedActivity && (
            <ActivityDetailModal
                isOpen={!!selectedActivity}
                onClose={() => setSelectedActivity(null)}
                activity={selectedActivity}
            />
        )}
      </div>
    </header>
  );
};

export default Header;