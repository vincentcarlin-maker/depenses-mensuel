
import React, { useState, useEffect, useRef } from 'react';
import BellIcon from './icons/BellIcon';
import { User, type Activity } from '../types';
import CloseIcon from './icons/CloseIcon';
import SearchIcon from './icons/SearchIcon';
import ActivityDetailModal from './ActivityDetailModal';

const Logo = () => (
    <svg width="44" height="44" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
        <defs>
            <linearGradient id="headerPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <linearGradient id="headerBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="headerNoteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            
            <filter id="headerSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="8"></feGaussianBlur>
                <feOffset dx="0" dy="8"></feOffset>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.15"></feFuncA>
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
        </defs>

        <rect x="60" y="140" width="392" height="230" rx="40" stroke="url(#headerNoteGrad)" strokeWidth="20" filter="url(#headerSoftGlow)"></rect>
        <path d="M120 180H392M120 330H392" stroke="url(#headerNoteGrad)" strokeWidth="4" strokeOpacity="0.2" strokeLinecap="round"></path>
        
        <g filter="url(#headerSoftGlow)">
            <circle cx="210" cy="280" r="90" fill="url(#headerBlueGrad)"></circle>
            <circle cx="210" cy="280" r="70" stroke="white" strokeWidth="4" strokeOpacity="0.4" fill="none"></circle>
            <path d="M225 255C215 250 200 250 190 260C180 270 180 290 190 300C200 310 215 310 225 305M180 275H205M180 285H205" stroke="white" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.9"></path>
        </g>

        <g filter="url(#headerSoftGlow)">
            <circle cx="310" cy="240" r="90" fill="url(#headerPinkGrad)"></circle>
            <circle cx="310" cy="240" r="70" stroke="white" strokeWidth="4" strokeOpacity="0.4" fill="none"></circle>
            <path d="M325 215C315 210 300 210 290 220C280 230 280 250 290 260C300 270 315 270 325 265M280 235H305M280 245H305" stroke="white" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.9"></path>
        </g>
    </svg>
);

interface HeaderProps {
  onOpenSearch: () => void;
  loggedInUser: User;
  activityItems: Activity[];
  unreadCount: number;
  onMarkAsRead: () => void;
  realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CONNECTING';
  onDeleteActivity: (activityId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSearch, loggedInUser, activityItems, unreadCount, onMarkAsRead, realtimeStatus, onDeleteActivity }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
          setSelectedActivity(activity);
          setIsNotificationsOpen(false);
      } else {
        setSelectedActivity(activity);
        setIsNotificationsOpen(false);
      }
  };
  
  const realtimeStatusStyles = {
    SUBSCRIBED: { textClass: 'text-green-500', title: 'Connecté en temps-réel' },
    CONNECTING: { textClass: 'text-yellow-500 animate-pulse', title: 'Connexion en cours...' },
    CHANNEL_ERROR: { textClass: 'text-red-500', title: 'Erreur de connexion temps-réel' },
    TIMED_OUT: { textClass: 'text-red-500', title: 'Connexion temps-réel expirée' },
  };
  const currentStatusStyle = realtimeStatusStyles[realtimeStatus];

  const renderActivityContent = (activity: Activity) => {
      const isUpdate = activity.type === 'update';
      const userColor = activity.expense.user === User.Sophie ? 'text-pink-500' : 'text-sky-500';
      
      if (isUpdate && activity.oldExpense) {
          const changes = [];
          const old = activity.oldExpense;
          const curr = activity.expense;
          
          if (old.amount !== curr.amount) {
              const oldAmt = typeof old.amount === 'number' ? old.amount : 0;
              const newAmt = typeof curr.amount === 'number' ? curr.amount : 0;
              changes.push(`${oldAmt}€ ➔ ${newAmt}€`);
          }
          if (old.description !== curr.description) {
               const oldDesc = old.description || '';
               const newDesc = curr.description || '';
               // Truncate if too long
               const oldD = oldDesc.length > 15 ? oldDesc.substring(0, 12) + '...' : oldDesc;
               const newD = newDesc.length > 15 ? newDesc.substring(0, 12) + '...' : newDesc;
               changes.push(`${oldD} ➔ ${newD}`);
          }
          if (old.category !== curr.category) {
              changes.push(`${old.category} ➔ ${curr.category}`);
          }
          
          if (changes.length > 0) {
              return (
                  <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                           <span className={`font-bold text-sm ${userColor}`}>{activity.expense.user}</span>
                           <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {new Date(activity.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                      </div>
                      
                      <div className="space-y-1">
                          {changes.map((c, i) => (
                              <div key={i} className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded px-2 py-1 border-l-2 border-cyan-500">
                                {c}
                              </div>
                          ))}
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic truncate">
                           sur {activity.expense.description}
                      </p>
                  </div>
              );
          }
      }

      // Default for Add/Delete
      return (
          <div className="flex-grow min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className={`font-bold ${userColor}`}>{activity.expense.user}</span>
                    { activity.type === 'add' ? ` a ajouté ` : activity.type === 'update' ? ` a mis à jour ` : ' a supprimé ' }
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{activity.expense.description || 'une dépense'}</span>
                    {activity.type !== 'update' && typeof activity.expense.amount === 'number' && ` (${activity.expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
      );
  }


  return (
    <header className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Logo />
          <div className="ml-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              <span className="text-slate-900 dark:text-white">Duo</span>
              <span className="text-blue-500">Budget</span>
            </h1>
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
                                            onClick={() => handleActivityClick(activity)}
                                            className="flex items-center justify-between p-4 gap-2 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                                            role="button"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {renderActivityContent(activity)}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteActivity(activity.id);
                                                }}
                                                className="flex-shrink-0 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
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
        </div>

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
