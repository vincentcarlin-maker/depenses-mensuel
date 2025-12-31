
import React, { useState, useEffect } from 'react';
import { type Reminder, type Category, type Expense, User } from '../types';
import RemindersTab from './RemindersTab';
import CloseIcon from './icons/CloseIcon';
import ThemeSelector from './ThemeSelector';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
import BellIcon from './icons/BellIcon';
import { type Profile, type LoginEvent } from '../hooks/useAuth';
import ManagementTab from './ManagementTab';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import LogoutIcon from './icons/LogoutIcon';
import ConfirmationModal from './ConfirmationModal';
import BottomNavigation, { TabId } from './BottomNavigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  expenses: Expense[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  categories: Category[];
  onAddCategory: (name: string) => boolean;
  onUpdateCategory: (oldName: string, newName: string) => boolean;
  onDeleteCategory: (name: string) => void;
  profiles: Profile[];
  loggedInUser: User;
  onAddProfile: (profile: Profile) => boolean;
  onUpdateProfilePassword: (username: string, newPassword: string) => boolean;
  onDeleteProfile: (username: string) => boolean;
  groceryStores: string[];
  setGroceryStores: React.Dispatch<React.SetStateAction<string[]>>;
  cars: string[];
  setCars: React.Dispatch<React.SetStateAction<string[]>>;
  heatingTypes: string[];
  setHeatingTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
  loginHistory: LoginEvent[];
  onLogout: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const SettingsMenuItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}> = ({ icon, title, description, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-4 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${className}`}
  >
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
      {icon}
    </div>
    <div className="flex-1 text-left ml-4">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <div className="text-slate-400 dark:text-slate-500">
      <ChevronRightIcon />
    </div>
  </button>
);


const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { 
    isOpen, 
    onClose, 
    reminders, 
    onAddReminder, 
    onUpdateReminder, 
    onDeleteReminder,
    categories,
    onLogout,
    activeTab,
    onTabChange,
  } = props;
  const [activeView, setActiveView] = useState<'main' | 'appearance' | 'reminders' | 'management'>('main');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setActiveView('main');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    const handleEsc = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
          if (activeView !== 'main') {
            setActiveView('main');
          } else {
            onClose();
          }
       }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, activeView]);
  
  const handleTabChange = (tab: TabId) => {
    onTabChange(tab);
    onClose();
  };

  if (!isOpen) {
    return null;
  }
  
  const viewTitles = {
      main: 'Réglages',
      appearance: 'Apparence',
      reminders: 'Gestion des rappels',
      management: 'Gestion de l\'application'
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-50 dark:bg-slate-900 z-50 animate-slide-in-up"
      aria-modal="true" 
      role="dialog"
    >
        <header className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {activeView !== 'main' && (
                    <button
                        onClick={() => setActiveView('main')}
                        className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Retour"
                    >
                        <ArrowLeftIcon />
                    </button>
                )}
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{viewTitles[activeView]}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Fermer les réglages"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <main className="p-4 md:p-8 overflow-y-auto h-[calc(100%-64px)] container mx-auto pb-24">
            {activeView === 'main' && (
                 <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-2xl shadow-lg">
                    <div className="space-y-2">
                        <SettingsMenuItem
                            icon={<PaintBrushIcon />}
                            title="Apparence"
                            description="Changer le thème de l'application"
                            onClick={() => setActiveView('appearance')}
                        />
                        <SettingsMenuItem
                            icon={<BellIcon />}
                            title="Rappels"
                            description="Gérer les dépenses mensuelles récurrentes"
                            onClick={() => setActiveView('reminders')}
                        />
                        <SettingsMenuItem
                            icon={<WrenchScrewdriverIcon />}
                            title="Gestion"
                            description="Utilisateurs, données et catégories"
                            onClick={() => setActiveView('management')}
                        />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                         <button
                            onClick={() => setIsLogoutConfirmOpen(true)}
                            className="w-full flex items-center p-4 rounded-xl transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                                <LogoutIcon />
                            </div>
                            <div className="flex-1 text-left ml-4">
                            <p className="font-semibold text-red-700 dark:text-red-400">Déconnexion</p>
                            <p className="text-sm text-red-600 dark:text-red-500">Se déconnecter de votre session</p>
                            </div>
                        </button>
                    </div>
                 </div>
            )}
            {activeView === 'appearance' && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg flex justify-between items-center animate-fade-in">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Thème</span>
                    <ThemeSelector />
                </div>
            )}
            {activeView === 'reminders' && (
                <div className="animate-fade-in">
                    <RemindersTab
                        reminders={reminders}
                        onAddReminder={onAddReminder}
                        onUpdateReminder={onUpdateReminder}
                        onDeleteReminder={onDeleteReminder}
                        categories={categories}
                    />
                </div>
            )}
            {activeView === 'management' && (
                <div className="animate-fade-in">
                    <ManagementTab 
                        expenses={props.expenses}
                        profiles={props.profiles}
                        loggedInUser={props.loggedInUser}
                        onAddProfile={props.onAddProfile}
                        onUpdateProfilePassword={props.onUpdateProfilePassword}
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
                    />
                </div>
            )}
        </main>

        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenSettings={() => {}} // No-op as we are already in settings
          isSettingsActive={true}
        />
        
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

export default SettingsModal;
