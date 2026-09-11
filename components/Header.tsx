
import React, { useState, useEffect, useRef } from 'react';
import BellIcon from './icons/BellIcon';
import { User, type Activity, type Expense, type FoyerJoinRequest } from '../types';
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
  onlineUsers?: (User | string)[];
  foyerMembers?: { id: string; name: string }[];
  pendingJoinRequests?: FoyerJoinRequest[];
  onOpenJoinRequests?: () => void;
  onExpenseClick?: (expense: Expense, activity?: Activity) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onOpenSearch, 
  loggedInUser: _loggedInUser, 
  activityItems, 
  unreadCount, 
  onMarkAsRead, 
  realtimeStatus, 
  onDeleteActivity,
  onlineUsers: _onlineUsers = [],
  foyerMembers: _foyerMembers = [],
  pendingJoinRequests = [],
  onOpenJoinRequests,
  onExpenseClick
}) => {
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
      setIsNotificationsOpen(false);
      if (onExpenseClick && activity.expense) {
        onExpenseClick(activity.expense as Expense, activity);
      } else {
        setSelectedActivity(activity);
      }
  };

  const handleJoinRequestNotificationClick = () => {
      setIsNotificationsOpen(false);
      if (onOpenJoinRequests) {
        onOpenJoinRequests();
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
          if (old.category && curr.category && old.category !== curr.category) {
               changes.push(`${old.category} ➔ ${curr.category}`);
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
                  <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">
                       👉 Cliquer pour voir la dépense
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
                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                    👉 Cliquer pour voir la dépense
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
                        <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800 animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-30 border border-slate-200 dark:border-slate-700 animate-fade-in overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Notifications</h3>
                            {pendingJoinRequests.length > 0 && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                    {pendingJoinRequests.length} demande{pendingJoinRequests.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        <div className="max-h-[32rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/80">
                            {/* Pending Join Requests section */}
                            {pendingJoinRequests.length > 0 && (
                                <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 space-y-2">
                                    <div className="px-2 pt-1 pb-0.5 flex items-center justify-between">
                                        <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>⏳</span> Demande d’intégration
                                        </span>
                                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Action requise</span>
                                    </div>
                                    {pendingJoinRequests.map(req => {
                                        const initial = req.name.charAt(0).toUpperCase() || 'U';
                                        return (
                                            <div
                                                key={req.id}
                                                onClick={handleJoinRequestNotificationClick}
                                                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 shadow-2xs hover:bg-amber-50/50 dark:hover:bg-slate-700/80 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div 
                                                        className="w-9 h-9 rounded-full font-black flex items-center justify-center text-sm shrink-0 text-white shadow-2xs"
                                                        style={{ backgroundColor: req.color || '#ec4899' }}
                                                    >
                                                        {initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                            {req.name} <span className="font-mono font-medium text-slate-500">(@{req.username})</span>
                                                        </p>
                                                        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium truncate">
                                                            Souhaite rejoindre votre foyer
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                            {new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center">
                                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-2xs transition-transform group-hover:scale-105">
                                                        Valider
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Activities / Expenses section */}
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
                                                title="Supprimer la notification"
                                                className="flex-shrink-0 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <CloseIcon />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : !pendingJoinRequests.length ? (
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                                    Aucune activité récente.
                                </p>
                            ) : null}
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
