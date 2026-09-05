
import React, { useState, useEffect, useRef } from 'react';
import BellIcon from './icons/BellIcon';
import { User, type Activity } from '../types';
import CloseIcon from './icons/CloseIcon';
import SearchIcon from './icons/SearchIcon';
import ActivityDetailModal from './ActivityDetailModal';
import { APP_LOGO_BASE64 } from '../constants/logoBase64';
import CoinOIcon from './icons/CoinOIcon';

const Logo = () => {
    return (
        <img 
            src={APP_LOGO_BASE64} 
            alt="Logo DuoBudget" 
            className="w-10 h-10 object-contain mr-3 rounded-lg" 
        />
    );
};

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

  const renderActivityContent = (activity: Activity) => {
      const isUpdate = activity.type === 'update';
      // On utilise performedBy pour savoir QUI a fait l'action
      const actorName = activity.performedBy || activity.expense.user;
      const userColor = actorName === User.Sophie ? 'text-pink-500' : 'text-sky-500';
      
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
               const oldD = oldDesc.length > 15 ? oldDesc.substring(0, 12) + '...' : oldDesc;
               const newD = newDesc.length > 15 ? newDesc.substring(0, 12) + '...' : newDesc;
               changes.push(`${oldD} ➔ ${newD}`);
          }
          
          return (
              <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-1">
                       <span className={`font-bold text-sm ${userColor}`}>{actorName}</span>
                       <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(activity.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                  </div>
                  
                  <div className="space-y-1">
                      {changes.length > 0 ? changes.map((c, i) => (
                          <div key={i} className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded px-2 py-1 border-l-2 border-cyan-500">
                            {c}
                          </div>
                      )) : (
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded px-2 py-1 border-l-2 border-cyan-500">
                            Mise à jour
                          </div>
                      )}
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic truncate">
                       sur {activity.expense.description}
                  </p>
              </div>
          );
      }

      return (
          <div className="flex-grow min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className={`font-bold ${userColor}`}>{actorName}</span>
                    { activity.type === 'add' ? ` a ajouté ` : activity.type === 'update' ? ` a mis à jour ` : ' a supprimé ' }
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{activity.expense.description || 'une dépense'}</span>
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
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-normal">
              <span className="text-[#f32e5e]">Du</span>
              <CoinOIcon />
              <span className="text-blue-500">Budget</span>
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold italic -mt-0.5 md:mt-0">
                Vos finances à deux, en toute simplicité.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
            <button
                onClick={onOpenSearch}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
                aria-label="Rechercher"
            >
                <SearchIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </button>
            <div className="relative" ref={notificationsRef}>
                <button
                    onClick={handleNotificationsToggle}
                    className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
                >
                    <BellIcon className={`h-6 w-6 transition-colors ${currentStatusStyle?.textClass || 'text-slate-500 dark:text-slate-400'}`} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
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
                                        >
                                            {renderActivityContent(activity)}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteActivity(activity.id);
                                                }}
                                                className="flex-shrink-0 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 opacity-0 group-hover:opacity-100"
                                            >
                                                <CloseIcon />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                                    Aucune activité récente.
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
