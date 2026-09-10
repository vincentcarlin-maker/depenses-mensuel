import React, { useState, useEffect } from 'react';
import { type Reminder, type Category, type Expense, type MoneyPotTransaction, User, type Foyer } from '../types';
import RemindersTab from './RemindersTab';
import ThemeSelector from './ThemeSelector';
import DataAndBackupTab from './DataAndBackupTab';
import AdminAndDevTab from './AdminAndDevTab';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { type Profile, type LoginEvent } from '../hooks/useAuth';
import ManagementTab from './ManagementTab';
import NotificationsTab from './NotificationsTab';
import ConfirmationModal from './ConfirmationModal';
import { useTheme } from '../hooks/useTheme';
import { KeywordIconRulesTab } from './KeywordIconRulesTab';
import ContactTab from './ContactTab';
import { useContactMessages } from '../hooks/useContactMessages';
import { USER_COLORS } from '../utils/userColors';

export type SettingsViewType = 'main' | 'appearance' | 'reminders' | 'management' | 'notifications' | 'users' | 'categories' | 'lists' | 'data' | 'admin' | 'keywords' | 'contact';

interface SettingsTabProps {
  initialView?: SettingsViewType;
  onViewChange?: (view: SettingsViewType) => void;
  reminders: Reminder[];
  expenses: Expense[];
  moneyPotTransactions?: MoneyPotTransaction[];
  onSyncData?: () => Promise<void>;
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  categories: Category[];
  onAddCategory: (name: string) => boolean;
  onUpdateCategory: (oldName: string, newName: string) => boolean;
  onDeleteCategory: (name: string) => void;
  profiles: Profile[];
  allProfiles?: Profile[];
  loggedInUser: User;
  loggedInUsername?: string;
  isAdmin?: boolean;
  onAddProfile: (profile: Profile) => boolean;
  onUpdateProfilePassword: (username: string, newPassword: string) => boolean;
  onUpdateProfileEmail?: (username: string, newEmail: string) => boolean;
  onDeleteProfile: (username: string) => Promise<boolean> | boolean;
  onToggleBlockProfile?: (username: string) => { success: boolean; message: string };
  isMaintenanceMode?: boolean;
  onToggleMaintenanceMode?: (newState?: boolean) => void;
  onUpdateExpense: (expense: Expense) => Promise<void>;
  groceryStores: string[];
  setGroceryStores: React.Dispatch<React.SetStateAction<string[]>>;
  cars: string[];
  setCars: React.Dispatch<React.SetStateAction<string[]>>;
  heatingTypes: string[];
  setHeatingTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
  loginHistory: LoginEvent[];
  onLogout: () => void;
  resetTrigger?: number;
  currentFoyer?: Foyer;
  onDeleteOwnAccount?: (confirmPassword?: string) => Promise<{ success: boolean; error?: string } | boolean>;
  onUpdateUserColor?: (username: string, newColor: string) => Promise<boolean>;
  onLeaveFoyer?: () => Promise<{ success: boolean; error?: string }>;
  onCloseFoyer?: () => Promise<{ success: boolean; error?: string }>;
  onSwitchFoyer?: (foyerId: string) => void;
}

const SettingsItemRow: React.FC<{
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
  titleColor?: string;
  onClick: () => void;
}> = ({ iconBg, iconColor, icon, title, description, value, titleColor, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between p-3.5 sm:p-4.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-800/60 group cursor-pointer"
  >
    <div className="flex items-center gap-3 min-w-0 pr-2">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor} transition-transform group-hover:scale-105`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-sm sm:text-base leading-snug break-words ${titleColor || 'text-slate-900 dark:text-slate-100'}`}>
          {title}
        </p>
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {value && (
        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {value}
        </span>
      )}
      <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
        <ChevronRightIcon className="w-5 h-5" />
      </div>
    </div>
  </button>
);

export const SettingsTab: React.FC<SettingsTabProps> = (props) => {
  const {
    reminders,
    onAddReminder,
    onUpdateReminder,
    onDeleteReminder,
    categories,
    onLogout,
  } = props;
  const [activeView, setActiveView] = useState<SettingsViewType>(props.initialView || 'main');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { themeSetting } = useTheme();

  useEffect(() => {
    const initView = props.initialView;
    if (initView) {
      setActiveView(prev => (prev !== initView ? initView : prev));
    }
  }, [props.initialView]);

  useEffect(() => {
    if (props.resetTrigger !== undefined) {
      setActiveView('main');
    }
  }, [props.resetTrigger]);

  const setView = (view: SettingsViewType) => {
    setActiveView(view);
    if (props.onViewChange) {
      props.onViewChange(view);
    }
  };

  const foyerTitle = props.currentFoyer?.name || 'Mon Foyer';

  const viewTitles: Record<string, string> = {
    main: 'Réglages',
    appearance: 'Apparence',
    reminders: 'Gestion des rappels',
    notifications: 'Notifications',
    users: foyerTitle,
    categories: 'Catégories',
    lists: 'Contenu des listes',
    data: 'Données & sauvegarde',
    admin: 'Administration & Développement',
    management: 'Gestion de l\'application',
    keywords: 'Mots-clés & Icônes',
    contact: 'Nous contacter'
  };

  const activeRemindersCount = reminders.filter(r => r.is_active !== false).length;
  const themeLabel = themeSetting === 'light' ? 'Clair' : themeSetting === 'dark' ? 'Sombre' : 'Système';
  const hasPushEnabled = typeof Notification !== 'undefined' && Notification.permission === 'granted';

  const isVincentAdmin = Boolean(
    props.isAdmin !== undefined
      ? props.isAdmin
      : (props.loggedInUsername
          ? props.loggedInUsername.toLowerCase().trim() === 'vincent'
          : ((props.loggedInUser as any) === User.Vincent || (props.loggedInUser as any) === 'Vincent' || (props.loggedInUser as any) === 'vincent'))
  );

  const currentUserProfile = (props.profiles || []).find(
    p => p.username.toLowerCase() === (props.loggedInUsername || props.loggedInUser || '').toLowerCase()
  );

  const {
    userMessages: userContactMessages,
    unreadRepliesCount: unreadContactRepliesCount,
    sendMessage: handleContactSend,
    sendReply: handleContactReply,
    updateStatus: handleContactStatus,
    markAsRead: handleContactMarkAsRead,
  } = useContactMessages({
    currentUser: props.loggedInUser,
    currentUsername: props.loggedInUsername,
    currentUserEmail: currentUserProfile?.email,
    currentFoyerId: props.currentFoyer?.id,
    currentFoyerName: props.currentFoyer?.name,
    isAdmin: isVincentAdmin,
    onToast: props.setToastInfo,
  });

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto w-full">
      {/* Sub-view Navigation Bar when inside a setting detail */}
      {activeView !== 'main' && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setView('main')}
            className="px-3 py-1.5 -ml-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1.5 font-bold text-sm cursor-pointer"
            aria-label="Retour aux réglages"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Réglages</span>
          </button>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {viewTitles[activeView]}
          </span>
        </div>
      )}

      {/* Main Settings Menu */}
      {activeView === 'main' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Title & Subtitle */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Réglages
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              Personnalisez votre expérience DuoBudget
            </p>
          </div>

          {/* Top Card: Couple Profile / Duo Card */}
          <div 
            onClick={() => setView('users')}
            className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-[26px] shadow-xs border border-slate-100/90 dark:border-slate-700/60 flex items-center justify-between transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/90 cursor-pointer group"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Dynamic Avatars */}
              <div className="relative flex items-center shrink-0">
                {props.currentFoyer?.members && props.currentFoyer.members.length >= 2 ? (
                  <>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#fde8ec] dark:bg-rose-950/60 text-[#e11d48] dark:text-rose-300 font-extrabold text-base sm:text-lg flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs z-0">
                      {props.currentFoyer.members[0]?.name?.charAt(0).toUpperCase() || '1'}
                    </div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/60 shadow-xs flex items-center justify-center -mx-2 z-20 text-[10px] sm:text-xs">
                      💖
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#e0f2fe] dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-300 font-extrabold text-base sm:text-lg flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs z-10">
                      {props.currentFoyer.members[1]?.name?.charAt(0).toUpperCase() || '2'}
                    </div>
                  </>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#e0f2fe] dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-300 font-extrabold text-base sm:text-lg flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
                    {String(props.loggedInUser).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                  {props.currentFoyer?.name || (props.currentFoyer?.members?.map(m => m.name).join(' & ') || 'Mon Foyer Partagé')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                  Compte DuoBudget {props.currentFoyer?.code ? `(${props.currentFoyer.code})` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                <ChevronRightIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section: Personnalisation */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
              Personnalisation
            </h4>
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] shadow-xs border border-slate-100/90 dark:border-slate-700/60 overflow-hidden">
              <SettingsItemRow
                iconBg="bg-[#eff6ff] dark:bg-blue-950/60"
                iconColor="text-[#3b82f6] dark:text-blue-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
                title="Apparence"
                description="Thème et mode sombre"
                value={themeLabel}
                onClick={() => setView('appearance')}
              />
            </div>
          </div>

          {/* Section: Notifications & Rappels */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
              Rappels & Alertes
            </h4>
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] shadow-xs border border-slate-100/90 dark:border-slate-700/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
              <SettingsItemRow
                iconBg="bg-[#ecfdf5] dark:bg-emerald-950/60"
                iconColor="text-[#10b981] dark:text-emerald-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    <circle cx="16" cy="16" r="3" fill="currentColor" className="fill-[#10b981]/20 stroke-[#10b981] stroke-[1.5]" />
                  </svg>
                }
                title="Rappels"
                description="Gérer les dépenses mensuelles récurrentes"
                value={`${activeRemindersCount} actifs`}
                onClick={() => setView('reminders')}
              />
              <SettingsItemRow
                iconBg="bg-[#fff1f2] dark:bg-rose-950/60"
                iconColor="text-[#f43f5e] dark:text-rose-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                }
                title="Notifications Push"
                description="Recevoir les alertes sur cet appareil"
                value={hasPushEnabled ? 'Activées' : 'Gérer'}
                onClick={() => setView('notifications')}
              />
            </div>
          </div>

          {/* Section: Gestion */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
              Gestion
            </h4>
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] shadow-xs border border-slate-100/90 dark:border-slate-700/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
              <SettingsItemRow
                iconBg="bg-[#ecfdf5] dark:bg-emerald-950/60"
                iconColor="text-[#10b981] dark:text-emerald-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                }
                title="Catégories"
                description="Personnaliser vos catégories et icônes"
                onClick={() => setView('categories')}
              />
              <SettingsItemRow
                iconBg="bg-[#fffbeb] dark:bg-amber-950/60"
                iconColor="text-[#d97706] dark:text-amber-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m4-3H6" />
                  </svg>
                }
                title="Mots-clés & Icônes"
                description="Associer des icônes automatiques à des mots-clés"
                onClick={() => setView('keywords')}
              />
              <SettingsItemRow
                iconBg="bg-[#e0f2fe] dark:bg-sky-950/60"
                iconColor="text-[#0284c7] dark:text-sky-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                }
                title="Contenu des listes"
                description="Gérer magasins, véhicules et chauffages"
                onClick={() => setView('lists')}
              />
              <SettingsItemRow
                iconBg="bg-[#f5f3ff] dark:bg-purple-950/60"
                iconColor="text-[#8b5cf6] dark:text-purple-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                }
                title="Données & sauvegarde"
                description="Sauvegarder et restaurer vos données"
                onClick={() => setView('data')}
              />
              {isVincentAdmin && (
                <SettingsItemRow
                  iconBg="bg-[#eef2ff] dark:bg-indigo-950/60"
                  iconColor="text-[#6366f1] dark:text-indigo-400"
                  icon={
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  }
                  title="Administration & Développement"
                  description="Outils techniques et gestion des icônes"
                  value="Admin"
                  onClick={() => setView('admin')}
                />
              )}
            </div>
          </div>

          {/* Section: Support & Contact */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
              Assistance & Support
            </h4>
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] shadow-xs border border-slate-100/90 dark:border-slate-700/60 overflow-hidden">
              <SettingsItemRow
                iconBg="bg-[#eff6ff] dark:bg-sky-950/60"
                iconColor="text-[#0284c7] dark:text-sky-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
                title="Nous contacter"
                description="Signaler un bug, poser une question ou suggérer une idée"
                value={unreadContactRepliesCount > 0 ? `${unreadContactRepliesCount} réponse${unreadContactRepliesCount > 1 ? 's' : ''}` : undefined}
                onClick={() => setView('contact')}
              />
            </div>
          </div>

          {/* Section: Compte */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
              Compte
            </h4>
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] shadow-xs border border-slate-100/90 dark:border-slate-700/60 overflow-hidden">
              <SettingsItemRow
                iconBg="bg-[#fff1f2] dark:bg-rose-950/60"
                iconColor="text-[#f43f5e] dark:text-rose-400"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
                title="Déconnexion"
                titleColor="text-[#e11d48] dark:text-rose-400"
                description="Se déconnecter de votre session"
                onClick={() => setIsLogoutConfirmOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subview: Apparence */}
      {activeView === 'appearance' && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Apparence
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              Personnalisez l'apparence de DuoBudget pour une expérience qui vous ressemble.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] p-4 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-[#0284c7] dark:text-sky-400 shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                  Mode de luminosité
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Thème clair, sombre ou automatique.
                </p>
              </div>
            </div>
            <ThemeSelector />
          </div>

          {/* Subview: Couleur des profils / avatars */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] p-4 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-pink-50 dark:bg-pink-950/60 flex items-center justify-center text-[#ec4899] dark:text-pink-400 shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                  Couleur des profils & avatars
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Personnalisez la couleur d'avatar de chaque membre du foyer.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {props.profiles && props.profiles.length > 0 ? (
                props.profiles.map((p, pIdx) => {
                  const currentColor = p.color || (p.user === User.Sophie ? '#ec4899' : '#0284c7');
                  const initial = p.username.charAt(0).toUpperCase() || 'U';

                  return (
                    <div key={`${p.username}-${p.foyer_id || 'default'}-${pIdx}`} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 space-y-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full font-extrabold flex items-center justify-center text-sm shrink-0 text-white shadow-xs transition-transform hover:scale-105"
                          style={{ backgroundColor: currentColor }}
                        >
                          {initial}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {p.username} {p.user && p.user !== p.username ? `(${p.user})` : ''}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            Sélectionnez une couleur d'avatar :
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {USER_COLORS.map((c) => {
                          const isSelected = currentColor.toLowerCase() === c.value.toLowerCase();
                          return (
                            <button
                              key={c.value}
                              type="button"
                              onClick={async () => {
                                if (props.onUpdateUserColor) {
                                  await props.onUpdateUserColor(p.username, c.value);
                                  props.setToastInfo({
                                    message: `Couleur modifiée pour ${p.username} (${c.label})`,
                                    type: 'info'
                                  });
                                }
                              }}
                              className={`w-7 h-7 rounded-full transition-all cursor-pointer ${c.bgClass} ${
                                isSelected 
                                  ? `ring-3 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${c.ringClass} scale-110 shadow-sm` 
                                  : 'opacity-70 hover:opacity-100 hover:scale-105'
                              }`}
                              title={`${c.label} (${p.username})`}
                              aria-label={`Choisir ${c.label} pour ${p.username}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">Aucun profil trouvé.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subview: Rappels */}
      {activeView === 'reminders' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gestion des rappels
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              Créez et gérez vos dépenses récurrentes
            </p>
          </div>
          <RemindersTab
            reminders={reminders}
            onAddReminder={onAddReminder}
            onUpdateReminder={onUpdateReminder}
            onDeleteReminder={onDeleteReminder}
            categories={categories}
            foyerMembers={props.currentFoyer?.members}
          />
        </div>
      )}

      {/* Subview: Notifications */}
      {activeView === 'notifications' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Notifications
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              Gérez vos alertes et préférences sur cet appareil
            </p>
          </div>
          <NotificationsTab loggedInUser={props.loggedInUser} currentFoyer={props.currentFoyer} />
        </div>
      )}

      {/* Subview: Catégories */}
      {activeView === 'categories' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <ManagementTab 
            focusSection="categories"
            expenses={props.expenses}
            profiles={props.profiles}
            loggedInUser={props.loggedInUser}
            loggedInUsername={props.loggedInUsername}
            onAddProfile={props.onAddProfile}
            onUpdateProfilePassword={props.onUpdateProfilePassword}
            onUpdateProfileEmail={props.onUpdateProfileEmail}
            onDeleteProfile={props.onDeleteProfile}
            categories={props.categories}
            onAddCategory={props.onAddCategory}
            onUpdateCategory={props.onUpdateCategory}
            onDeleteCategory={props.onDeleteCategory}
            groceryStores={props.groceryStores}
            setGroceryStores={props.setGroceryStores}
            cars={props.cars}
            setCars={props.setCars}
            heatingTypes={props.heatingTypes}
            setHeatingTypes={props.setHeatingTypes}
            setToastInfo={props.setToastInfo}
            loginHistory={props.loginHistory}
            currentFoyer={props.currentFoyer}
            onDeleteOwnAccount={props.onDeleteOwnAccount}
            onLeaveFoyer={props.onLeaveFoyer}
            onCloseFoyer={props.onCloseFoyer}
          />
        </div>
      )}

      {/* Subview: Listes */}
      {activeView === 'lists' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <ManagementTab 
            focusSection="lists"
            expenses={props.expenses}
            profiles={props.profiles}
            loggedInUser={props.loggedInUser}
            loggedInUsername={props.loggedInUsername}
            onAddProfile={props.onAddProfile}
            onUpdateProfilePassword={props.onUpdateProfilePassword}
            onUpdateProfileEmail={props.onUpdateProfileEmail}
            onDeleteProfile={props.onDeleteProfile}
            categories={props.categories}
            onAddCategory={props.onAddCategory}
            onUpdateCategory={props.onUpdateCategory}
            onDeleteCategory={props.onDeleteCategory}
            groceryStores={props.groceryStores}
            setGroceryStores={props.setGroceryStores}
            cars={props.cars}
            setCars={props.setCars}
            heatingTypes={props.heatingTypes}
            setHeatingTypes={props.setHeatingTypes}
            setToastInfo={props.setToastInfo}
            loginHistory={props.loginHistory}
            currentFoyer={props.currentFoyer}
            onDeleteOwnAccount={props.onDeleteOwnAccount}
            onLeaveFoyer={props.onLeaveFoyer}
            onCloseFoyer={props.onCloseFoyer}
          />
        </div>
      )}

      {/* Subview: Utilisateurs */}
      {activeView === 'users' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <ManagementTab 
            focusSection="users"
            expenses={props.expenses}
            profiles={props.profiles}
            loggedInUser={props.loggedInUser}
            loggedInUsername={props.loggedInUsername}
            onAddProfile={props.onAddProfile}
            onUpdateProfilePassword={props.onUpdateProfilePassword}
            onUpdateProfileEmail={props.onUpdateProfileEmail}
            onDeleteProfile={props.onDeleteProfile}
            categories={props.categories}
            onAddCategory={props.onAddCategory}
            onUpdateCategory={props.onUpdateCategory}
            onDeleteCategory={props.onDeleteCategory}
            groceryStores={props.groceryStores}
            setGroceryStores={props.setGroceryStores}
            cars={props.cars}
            setCars={props.setCars}
            heatingTypes={props.heatingTypes}
            setHeatingTypes={props.setHeatingTypes}
            setToastInfo={props.setToastInfo}
            loginHistory={props.loginHistory}
            currentFoyer={props.currentFoyer}
            onDeleteOwnAccount={props.onDeleteOwnAccount}
            onLeaveFoyer={props.onLeaveFoyer}
            onCloseFoyer={props.onCloseFoyer}
          />
        </div>
      )}

      {/* Subview: Données & Sauvegarde */}
      {activeView === 'data' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <DataAndBackupTab 
            expenses={props.expenses}
            reminders={props.reminders}
            moneyPotTransactions={props.moneyPotTransactions}
            categories={props.categories}
            groceryStores={props.groceryStores}
            cars={props.cars}
            heatingTypes={props.heatingTypes}
            setToastInfo={props.setToastInfo}
            onSyncData={props.onSyncData}
            currentFoyer={props.currentFoyer}
          />
        </div>
      )}

      {/* Subview: Administration */}
      {activeView === 'admin' && isVincentAdmin && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <AdminAndDevTab 
            expenses={props.expenses}
            reminders={props.reminders}
            moneyPotTransactions={props.moneyPotTransactions}
            categories={props.categories}
            profiles={props.allProfiles || props.profiles}
            loginHistory={props.loginHistory}
            loggedInUser={props.loggedInUser}
            loggedInUsername={props.loggedInUsername}
            isAdmin={isVincentAdmin}
            currentFoyer={props.currentFoyer}
            setToastInfo={props.setToastInfo}
            onSyncData={props.onSyncData}
            onToggleBlockProfile={props.onToggleBlockProfile}
            onDeleteProfile={props.onDeleteProfile}
            onAddProfile={props.onAddProfile}
            onUpdateProfilePassword={props.onUpdateProfilePassword}
            isMaintenanceMode={props.isMaintenanceMode}
            onToggleMaintenanceMode={props.onToggleMaintenanceMode}
            onSwitchFoyer={props.onSwitchFoyer}
          />
        </div>
      )}

      {/* Subview: Management général */}
      {activeView === 'management' && (
        <div className="animate-fade-in bg-white dark:bg-slate-800 p-4 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 dark:border-slate-700/60">
          <ManagementTab 
            focusSection="all"
            expenses={props.expenses}
            profiles={props.profiles}
            loggedInUser={props.loggedInUser}
            loggedInUsername={props.loggedInUsername}
            onAddProfile={props.onAddProfile}
            onUpdateProfilePassword={props.onUpdateProfilePassword}
            onUpdateProfileEmail={props.onUpdateProfileEmail}
            onDeleteProfile={props.onDeleteProfile}
            categories={props.categories}
            onAddCategory={props.onAddCategory}
            onUpdateCategory={props.onUpdateCategory}
            onDeleteCategory={props.onDeleteCategory}
            groceryStores={props.groceryStores}
            setGroceryStores={props.setGroceryStores}
            cars={props.cars}
            setCars={props.setCars}
            heatingTypes={props.heatingTypes}
            setHeatingTypes={props.setHeatingTypes}
            setToastInfo={props.setToastInfo}
            loginHistory={props.loginHistory}
            currentFoyer={props.currentFoyer}
            onDeleteOwnAccount={props.onDeleteOwnAccount}
            onLeaveFoyer={props.onLeaveFoyer}
            onCloseFoyer={props.onCloseFoyer}
          />
        </div>
      )}

      {/* Subview: Mots-clés & Icônes */}
      {activeView === 'keywords' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <KeywordIconRulesTab setToastInfo={props.setToastInfo} />
        </div>
      )}

      {/* Subview: Nous contacter */}
      {activeView === 'contact' && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in">
          <ContactTab
            onBack={() => setView('main')}
            userMessages={userContactMessages}
            unreadRepliesCount={unreadContactRepliesCount}
            onSendMessage={handleContactSend}
            onSendReply={handleContactReply}
            onUpdateStatus={handleContactStatus}
            onMarkAsRead={handleContactMarkAsRead}
            currentUserEmail={currentUserProfile?.email}
            currentUsername={props.loggedInUsername || props.loggedInUser}
          />
        </div>
      )}

      {/* Logout Confirmation Dialog */}
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
    </div>
  );
};

export default SettingsTab;
