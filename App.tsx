
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase/client';
import { type Expense, User, type Activity, type MoneyPotTransaction } from './types';
import Header from './components/Header';
import ExpenseForm from './components/ExpenseForm';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseList from './components/ExpenseList';
import CategoryTotals from './components/CategoryChart';
import EditExpenseModal from './components/EditExpenseModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import ExpenseSuccessModal from './components/ExpenseSuccessModal';
import Toast from './components/Toast';
import YearlySummary from './components/YearlySummary';
import ReminderAlerts from './components/ReminderAlerts';
import NotificationReminderAlert from './components/NotificationReminderAlert';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './hooks/useTheme';
import OfflineIndicator from './components/OfflineIndicator';
import { useAuth, type Profile, type LoginEvent } from './hooks/useAuth';
import { useMaintenanceMode } from './hooks/useMaintenanceMode';
import { MaintenanceOverlay } from './components/MaintenanceOverlay';
import Login from './components/Login';
import PullToRefresh from './components/PullToRefresh';
import { useLocalStorage } from './hooks/useLocalStorage';
import UndoToast from './components/UndoToast';
import { DEFAULT_CATEGORIES } from './types';
import GlobalSearchModal from './components/GlobalSearchModal';
import FunnelIcon from './components/icons/FunnelIcon';
import MoneyPotTab from './components/MoneyPotTab';
import BottomNavigation, { TabId } from './components/BottomNavigation';
import ChevronDownIcon from './components/icons/ChevronDownIcon';
import PiggyBankIcon from './components/icons/PiggyBankIcon';
import { notifySubscriptionsDirectly } from './webpush-client';

type UndoableAction = {
    type: 'delete' | 'update';
    expense: Expense; // For delete, this is the one deleted. For update, this is the NEW state.
    originalExpense?: Expense; // For update, this is the OLD state.
    timerId: number;
    activityId?: string; // ID of the activity log created by this action, to be deleted on undo
};

export type ModificationType = 'date' | 'amount' | 'other';

const getInitialDate = () => {
    const now = new Date();
    // On construit la date en UTC basée sur le mois LOCAL de l'utilisateur.
    // Cela évite qu'un utilisateur à GMT+1 le 1er janvier à 00h30 se retrouve le 31 décembre UTC.
    const currentMonthUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    
    // Date limite de début de l'application (ex: Octobre 2023)
    const limit = new Date('2023-10-01T00:00:00Z');
    
    return currentMonthUtc < limit ? limit : currentMonthUtc;
};

const MainApp: React.FC<{ 
    user: User, 
    onLogout: () => void,
    profiles: Profile[],
    onAddProfile: (profile: Profile) => boolean,
    onUpdateProfilePassword: (username: string, newPassword: string) => boolean,
    onDeleteProfile: (username: string) => boolean,
    onToggleBlockProfile: (username: string) => { success: boolean; message: string },
    isMaintenanceMode: boolean,
    onToggleMaintenanceMode: (newState?: boolean) => void,
    loginHistory: LoginEvent[]
}> = ({ 
    user, 
    onLogout, 
    profiles, 
    onAddProfile, 
    onUpdateProfilePassword, 
    onDeleteProfile, 
    onToggleBlockProfile,
    isMaintenanceMode,
    onToggleMaintenanceMode,
    loginHistory 
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [moneyPotTransactions, setMoneyPotTransactions] = useState<MoneyPotTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  
  // Split state for Viewing vs Editing
  const [expenseToView, setExpenseToView] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterUser, setFilterUser] = useState<User | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<any | 'All'>('All');

  const [toastInfo, setToastInfo] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialView, setSettingsInitialView] = useState<'main' | 'appearance' | 'reminders' | 'management' | 'notifications'>('main');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<(Omit<Expense, 'id' | 'date' | 'created_at'> & { formKey?: string }) | null>(null);
  const [successExpense, setSuccessExpense] = useState<Expense | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [highlightedExpenseIds, setHighlightedExpenseIds] = useState<Set<string>>(new Set());
  const [realtimeStatus, setRealtimeStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CONNECTING'>('CONNECTING');
  const [undoableAction, setUndoableAction] = useState<UndoableAction | null>(null);
  const recentlyAddedIds = useRef(new Set<string>());
  const recentlyUpdatedIds = useRef(new Set<string>());
  const recentlyDeletedIds = useRef(new Set<string>());
  const expensesRef = useRef<Expense[]>([]); // Ref to access current expenses in realtime callbacks
  const allChangesChannelRef = useRef<any>(null);

  const broadcastChange = useCallback((table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', payload: any, performedBy?: string) => {
    if (allChangesChannelRef.current) {
      allChangesChannelRef.current.send({
        type: 'broadcast',
        event: 'db-change',
        payload: { table, eventType, payload, performedBy }
      });
    }
  }, []);

  // Presence state
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  // Persistent Activity Log states
  const [lastBellCheck, setLastBellCheck] = useLocalStorage('lastBellCheck', new Date().toISOString());
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Dynamic categories and lists
  const [categories, setCategories] = useLocalStorage<any[]>('expenseCategories', DEFAULT_CATEGORIES);
  
  useEffect(() => {
      if (!categories.includes("Complément alimentaire")) {
          setCategories(prev => [...prev, "Complément alimentaire"]);
      }
      if (categories.includes("Dépenses obligatoires") || categories.includes("Dép. récurrentes")) {
          setCategories(prev => prev.map(c => (c === "Dépenses obligatoires" || c === "Dép. récurrentes") ? "Dép. recurentes" : c));
      }
  }, [categories, setCategories]);

  const [groceryStores, setGroceryStores] = useLocalStorage<string[]>('groceryStores', ['Leclerc', 'Leclerc Drive', 'Intermarché', 'Intermarché Drive', 'Carrefour', 'Boulangerie']);
  const [cars, setCars] = useLocalStorage<string[]>('cars', ['Peugeot 5008', 'Peugeot 207']);
  const [heatingTypes, setHeatingTypes] = useLocalStorage<string[]>('heatingTypes', ['Bois', 'Fioul']);

  const { currentMonth, currentYear } = useMemo(() => ({
      currentMonth: currentDate.getUTCMonth(),
      currentYear: currentDate.getUTCFullYear(),
  }), [currentDate]);

  const availableMonths = useMemo(() => {
    const options = [];
    const startYear = 2023;
    const endYear = new Date().getFullYear() + 1;
    for (let y = endYear; y >= startYear; y--) {
      for (let m = 11; m >= 0; m--) {
        const date = new Date(Date.UTC(y, m, 1));
        const label = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
        options.push({ value: `${y}-${m}`, label, year: y, month: m });
      }
    }
    return options;
  }, []);

  const availableYears = useMemo(() => {
    const years = [];
    const startYear = 2023;
    const currentActualYear = new Date().getFullYear();
    const endYear = Math.max(currentActualYear + 2, currentYear + 1);
    for (let y = endYear; y >= startYear; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, m] = e.target.value.split('-').map(Number);
    setCurrentDate(new Date(Date.UTC(y, m, 1)));
  };

  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  const { unreadCount, activityItemsForHeader } = useMemo(() => {
    if (!user) return { unreadCount: 0, activityItemsForHeader: [] };
    
    // Filter activities where the other user (actor) did something
    const otherUserActivities = activities.filter(act => 
        act.performedBy !== user
    );
    
    const unread = otherUserActivities.filter(act => 
        new Date(act.timestamp) > new Date(lastBellCheck)
    ).length;
    
    const items = otherUserActivities
        .slice(0, 10) // Show last 10 activities
        .map(act => act);
        
    return { unreadCount: unread, activityItemsForHeader: items };
  }, [activities, lastBellCheck, user]);

  // Compute detailed modification info for expenses to show the correct icon (clock or pencil)
  const modifiedExpenseInfo = useMemo(() => {
    const infoMap = new Map<string, ModificationType[]>();

    // 1. Group activities by expense ID
    const activitiesByExpenseId = activities.reduce((acc, act) => {
        const expenseId = act.expense?.id;
        if (expenseId) {
            if (!acc[expenseId]) {
                acc[expenseId] = [];
            }
            acc[expenseId].push(act);
        }
        return acc;
    }, {} as Record<string, Activity[]>);

    // 2. Iterate through each group of activities
    for (const expenseId in activitiesByExpenseId) {
        const expenseActivities = activitiesByExpenseId[expenseId];
        const accumulatedChanges = new Set<ModificationType>();

        // 3. For each activity, detect changes and add to the set
        for (const activity of expenseActivities) {
            
            // --- Cas 1: Modification (Update) ---
            if (activity.type === 'update' && activity.oldExpense) {
                const oldExp = activity.oldExpense as Partial<Expense>;
                const newExp = activity.expense as Partial<Expense>;

                // Check for date change
                if (oldExp.date && newExp.date) {
                    const oldDate = new Date(oldExp.date);
                    oldDate.setSeconds(0, 0);
                    const newDate = new Date(newExp.date);
                    newDate.setSeconds(0, 0);
                    if (oldDate.getTime() !== newDate.getTime()) {
                        accumulatedChanges.add('date');
                    }
                }

                // Check for amount change
                if (oldExp.amount !== newExp.amount) {
                    accumulatedChanges.add('amount');
                }

                // Check for other changes
                const otherChange =
                    oldExp.description !== newExp.description ||
                    oldExp.category !== newExp.category ||
                    oldExp.user !== newExp.user ||
                    JSON.stringify(oldExp.subtracted_items || []) !== JSON.stringify(newExp.subtracted_items || []);
                
                if (otherChange) {
                    accumulatedChanges.add('other');
                }
            }
            // --- Cas 2: Ajout (Add) avec modification de date manuelle ---
            else if (activity.type === 'add' && activity.expense.date) {
                const creationTime = new Date(activity.timestamp).getTime();
                const expenseTime = new Date(activity.expense.date).getTime();
                
                if (Math.abs(expenseTime - creationTime) > 60000) {
                    accumulatedChanges.add('date');
                }
            }
        }

        // 4. Store the accumulated changes
        if (accumulatedChanges.size > 0) {
            infoMap.set(expenseId, Array.from(accumulatedChanges));
        }
    }

    return infoMap;
  }, [activities]);

  // Compute history for the currently viewed expense
  const expenseHistory = useMemo(() => {
      if (!expenseToView) return [];
      // Include both 'update' and 'add' events to show full history
      return activities
          .filter(a => a.expense.id === expenseToView.id && (a.type === 'update' || a.type === 'add'))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [expenseToView, activities]);

  const highlightExpense = useCallback((id: string) => {
    setHighlightedExpenseIds(prev => new Set(prev).add(id));
    setTimeout(() => {
        setHighlightedExpenseIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    }, 3500); // Highlight duration
  }, []);
  
  const mergeAndDedupeActivities = useCallback((existing: any[], toAdd: any[]): any[] => {
      const combined = [...toAdd, ...existing];
      const uniqueMap = new Map<string, any>();

      for (const act of combined) {
          uniqueMap.set(act.id, act);
      }

      return Array.from(uniqueMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100); // Limit to last 100 activities
  }, []);

  const syncData = useCallback(async () => {
    const expensesPromise = supabase.from('expenses').select('*').gte('date', '2023-10-01T00:00:00Z').order('date', { ascending: false });
    const remindersPromise = supabase.from('reminders').select('*').order('day_of_month', { ascending: true });
    const moneyPotPromise = supabase.from('money_pot').select('*').order('date', { ascending: false });
    const activitiesPromise = supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(100);

    const [expensesResponse, remindersResponse, moneyPotResponse, activitiesResponse] = await Promise.all([expensesPromise, remindersPromise, moneyPotPromise, activitiesPromise]);

    if (expensesResponse.error) {
        console.error('Error fetching expenses:', expensesResponse.error.message);
        setToastInfo({ message: "Erreur lors de la récupération des dépenses.", type: 'error' });
    } else if (expensesResponse.data) {
        setExpenses(expensesResponse.data as Expense[]);
    }
    
    if (remindersResponse.error) {
        console.error('Error fetching reminders:', remindersResponse.error.message);
        setToastInfo({ message: "Erreur lors de la récupération des rappels.", type: 'error' });
    } else if (remindersResponse.data) {
        setReminders(remindersResponse.data as any[]);
    }

    if (moneyPotResponse.error) {
        console.warn('Error fetching money pot (Table may not exist yet):', moneyPotResponse.error.message);
    } else if (moneyPotResponse.data) {
        setMoneyPotTransactions(moneyPotResponse.data as MoneyPotTransaction[]);
    }
    
    if (activitiesResponse.error) {
        console.error('Error fetching activities:', activitiesResponse.error.message);
    } else if (activitiesResponse.data) {
        setActivities(activitiesResponse.data as Activity[]);
    }
  }, []);

  useEffect(() => {
    const performInitialSync = async () => {
        setIsLoading(true);
        await syncData();
        setIsLoading(false);
    };
    performInitialSync();
  }, [syncData]);

  // Presence Effect
  useEffect(() => {
      const presenceChannel = supabase.channel('online-users', {
          config: {
              presence: {
                  key: user,
              },
          },
      });

      presenceChannel
          .on('presence', { event: 'sync' }, () => {
              const newState = presenceChannel.presenceState();
              const users = Object.keys(newState) as User[];
              setOnlineUsers(users);
          })
          .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                 await presenceChannel.track({ online_at: new Date().toISOString(), user_id: user });
              }
          });
      
      return () => {
          supabase.removeChannel(presenceChannel);
      }
  }, [user]);

  // Realtime subscription for Activities
   useEffect(() => {
        const handleActivityInsert = (payload: any) => {
            const newActivity = payload.new as Activity;
            setActivities(prev => mergeAndDedupeActivities(prev, [newActivity]));
        };

        const handleActivityDelete = (payload: any) => {
            setActivities(prev => prev.filter(a => a.id !== payload.old.id));
        };

        const activityChannel = supabase
            .channel('public:activities')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, handleActivityInsert)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'activities' }, handleActivityDelete)
            .subscribe();

        return () => {
            supabase.removeChannel(activityChannel);
        };
    }, [mergeAndDedupeActivities]);

  useEffect(() => {
    const handleExpenseInsert = (payload: any) => {
      const newExpense = payload.new as Expense;
      if (!newExpense?.id) return;

      setExpenses(prevExpenses => {
        const expenseExists = prevExpenses.some(e => e.id === newExpense.id);
        if (expenseExists) {
          return prevExpenses.map(e => (e.id === newExpense.id ? newExpense : e));
        } else {
          return [newExpense, ...prevExpenses];
        }
      });
      highlightExpense(newExpense.id);
    };

    const handleExpenseUpdate = (payload: any) => {
      const updatedExpense = payload.new as Expense;
      if (!updatedExpense?.id) return;

      setExpenses(prevExpenses =>
        prevExpenses.map(expense =>
          expense.id === updatedExpense.id ? updatedExpense : expense
        )
      );
      highlightExpense(updatedExpense.id);
    };

    const handleExpenseDelete = (payload: any) => {
        const deletedPayload = payload.old as Partial<Expense> & { id: string };
        if (!deletedPayload?.id) return;

        if (recentlyDeletedIds.current.has(deletedPayload.id)) return;

        setExpenses(prevExpenses => {
            return prevExpenses.filter(expense => expense.id !== deletedPayload.id);
        });
    };

    const handleReminderChange = (payload: any) => {
      if (payload.eventType === 'DELETE') {
        const deletedReminder = payload.old as Partial<any>;
        if (deletedReminder && deletedReminder.id) {
          setReminders(prev => prev.filter(r => r.id !== deletedReminder.id));
        }
        return;
      }

      const changedReminder = payload.new as any;
      setReminders(prev => {
        const existingIndex = prev.findIndex(r => r.id === changedReminder.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = changedReminder;
          return updated.sort((a, b) => a.day_of_month - b.day_of_month);
        }
        return [...prev, changedReminder].sort((a, b) => a.day_of_month - b.day_of_month);
      });
    };
    
    const handleMoneyPotChange = (payload: any) => {
        if (payload.eventType === 'INSERT') {
            const newTransaction = payload.new as MoneyPotTransaction;
            setMoneyPotTransactions(prev => {
                if (prev.some(t => t.id === newTransaction.id)) return prev;
                return [newTransaction, ...prev];
            });
        } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMoneyPotTransactions(prev => prev.filter(t => t.id !== deletedId));
        }
    }

    const allChangesChannel = supabase
      .channel('all-changes-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses' }, handleExpenseInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'expenses' }, handleExpenseUpdate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'expenses' }, handleExpenseDelete)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, handleReminderChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'money_pot' }, handleMoneyPotChange)
      .on('broadcast', { event: 'db-change' }, (payload: any) => {
        const { table, eventType, payload: data } = payload.payload || {};
        if (table === 'expenses') {
            if (eventType === 'INSERT') {
                handleExpenseInsert({ new: data });
            } else if (eventType === 'UPDATE') {
                handleExpenseUpdate({ new: data });
            } else if (eventType === 'DELETE') {
                handleExpenseDelete({ old: data });
            }
        } else if (table === 'reminders') {
            handleReminderChange({ eventType, new: data, old: data });
        } else if (table === 'money_pot') {
            handleMoneyPotChange({ eventType, new: data, old: data });
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
            setRealtimeStatus('SUBSCRIBED');
            syncData();
        } else if (status === 'CHANNEL_ERROR') {
            setRealtimeStatus('CHANNEL_ERROR');
        } else if (status === 'TIMED_OUT') {
            setRealtimeStatus('CONNECTING');
        } else {
            setRealtimeStatus('CONNECTING');
        }
      });
      
    allChangesChannelRef.current = allChangesChannel;
      
    return () => {
      supabase.removeChannel(allChangesChannel);
      allChangesChannelRef.current = null;
    };
  }, [highlightExpense, user, syncData, mergeAndDedupeActivities]);

  const logActivity = useCallback(async (activityPayload: Omit<Activity, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    const newActivity: Activity = {
      ...activityPayload,
      id: id,
      timestamp: new Date().toISOString(),
    };
    const { error } = await supabase.from('activities').insert(newActivity);
    if (error) {
      console.error("Failed to log activity:", error.message);
      return null;
    }
    return id;
  }, []);

  // Multi-route Unified Push Notification Dispatcher (Sequential single-route dispatch to avoid duplicate triggers)
  const dispatchPushNotification = useCallback(async (payload: { type: 'add' | 'delete' | 'update' | 'moneypot'; expense?: any; moneyPotTransaction?: any; performedBy?: string }) => {
    try {
      const author = user === 'Duo' ? 'Commun' : user;
      const fullPayload = { ...payload, performedBy: author };

      // 1. Essayer l'Edge Function Supabase en priorité
      let dispatched = false;
      try {
        const { data, error: funcError } = await supabase.functions.invoke('send-notification', {
          body: fullPayload
        });
        if (!funcError && data && (data.success || data.message)) {
          dispatched = true;
        }
      } catch (e) {
        console.warn("L'Edge Function Supabase est indisponible, bascule sur le fallback local...");
      }

      // 2. Si l'Edge Function n'a pas pu envoyer, utiliser le serveur backend local
      if (!dispatched) {
        try {
          const res = await fetch(window.location.origin + '/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload)
          });
          if (res.ok) {
            dispatched = true;
          }
        } catch (e) {
          console.warn("Le serveur local n'a pas pu envoyer la notification push.");
        }
      }

      // 3. Dernier recours : envoi direct Web Push depuis le navigateur
      if (!dispatched) {
        try {
          await notifySubscriptionsDirectly(author, fullPayload);
        } catch (err) {
          console.error("Erreur d'envoi push direct:", err);
        }
      }
    } catch(e) {
      console.error("Erreur d'émission d'avis push:", e);
    }
  }, [user]);

  // Money Pot Handlers
  const addMoneyPotTransaction = async (transaction: Omit<MoneyPotTransaction, 'id' | 'created_at'>) => {
      const newId = crypto.randomUUID();
      const newTransaction: MoneyPotTransaction = {
          ...transaction,
          id: newId,
          created_at: new Date().toISOString()
      };

      setMoneyPotTransactions(prev => [newTransaction, ...prev]);

      const { error } = await supabase.from('money_pot').insert({ ...transaction, id: newId });

      if (error) {
          console.error("Error adding money pot transaction", error);
          setToastInfo({ message: "Erreur lors de l'ajout à la cagnotte.", type: "error" });
          setMoneyPotTransactions(prev => prev.filter(t => t.id !== newId));
      } else {
         if (transaction.user_name !== 'Commun') {
             setToastInfo({ message: "Opération enregistrée !", type: "info" });
         }
         // Déclencher une notification push pour l'activité cagnotte
         dispatchPushNotification({
             type: 'moneypot',
             moneyPotTransaction: newTransaction
         });
         broadcastChange('money_pot', 'INSERT', newTransaction);
      }
  };

  const deleteMoneyPotTransaction = async (id: string) => {
      const previousTransactions = [...moneyPotTransactions];
      setMoneyPotTransactions(prev => prev.filter(t => t.id !== id));

      const { error } = await supabase.from('money_pot').delete().eq('id', id);
      
      if (error) {
          console.error("Error deleting money pot transaction", error);
          setToastInfo({ message: "Erreur lors de la suppression.", type: "error" });
          setMoneyPotTransactions(previousTransactions);
      } else {
          setToastInfo({ message: "Opération supprimée.", type: "info" });
          broadcastChange('money_pot', 'DELETE', { id });
      }
  }

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    
    recentlyAddedIds.current.add(newId);
    setTimeout(() => recentlyAddedIds.current.delete(newId), 5000);

    const expenseData = { ...expense, id: newId };
    const optimisticExpense: Expense = { ...expenseData, created_at: new Date().toISOString() };
    setExpenses(prev => [optimisticExpense, ...prev]);
    highlightExpense(newId);

    if (expense.user === User.Commun) {
        const withdrawalAmount = -Math.abs(expense.amount);
        addMoneyPotTransaction({
            amount: withdrawalAmount,
            description: `Dépense : ${expense.description}`,
            user_name: 'Commun',
            date: expenseData.date
        });
    }

    const { data, error } = await supabase.from('expenses').insert(expenseData).select().single();
      
    if (error) {
      console.error('Error adding expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de l'ajout de la dépense.", type: 'error' });
      setExpenses(prev => prev.filter(e => e.id !== newId));
    } else {
      // Notification Push unifiée et hautement configurée
      dispatchPushNotification({
          type: 'add',
          expense: data
      });
      
      setFormInitialData(null);
      setSuccessExpense(data as Expense);
      broadcastChange('expenses', 'INSERT', data, user);
      await logActivity({ type: 'add', expense: data as Expense, performedBy: user });
    }
  };
  
  const _performDelete = async (id: string) => {
      recentlyDeletedIds.current.add(id);
      setTimeout(() => recentlyDeletedIds.current.delete(id), 5000);
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        console.error('Error deleting expense:', error.message || error);
        setToastInfo({ message: "La suppression a échoué. Veuillez réessayer.", type: 'error' });
        syncData();
      } else {
        broadcastChange('expenses', 'DELETE', { id }, user);
      }
  };

  const _performUpdate = async (expenseToUpdate: Expense) => {
      recentlyUpdatedIds.current.add(expenseToUpdate.id);
      setTimeout(() => recentlyUpdatedIds.current.delete(expenseToUpdate.id), 5000);
      
      const { id, created_at, ...updatePayload } = expenseToUpdate;
      const { error } = await supabase.from('expenses').update(updatePayload).eq('id', id);

      if (error) {
          console.error('Error updating expense:', error.message || error);
          setToastInfo({ message: "La mise à jour a échoué. Veuillez réessayer.", type: 'error' });
          syncData();
      } else {
          broadcastChange('expenses', 'UPDATE', expenseToUpdate, user);
      }
  };

  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    if (undoableAction?.timerId) clearTimeout(undoableAction.timerId);

    const activityId = await logActivity({ type: 'delete', expense: expenseToDelete, performedBy: user });

    if (expenseToDelete.user === User.Commun) {
         addMoneyPotTransaction({
            amount: Math.abs(expenseToDelete.amount),
            description: `Annulation : ${expenseToDelete.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
        });
    }

    setExpenses(prev => prev.filter(e => e.id !== id));

    // Envoyer une notification push pour alerter de la suppression
    dispatchPushNotification({
        type: 'delete',
        expense: expenseToDelete
    });

    const timerId = window.setTimeout(() => {
        _performDelete(id);
        setUndoableAction(null);
    }, 7000);

    setUndoableAction({ type: 'delete', expense: expenseToDelete, timerId, activityId: activityId || undefined });
  };
  
  const updateExpense = async (updatedExpense: Expense) => {
    const originalExpense = expenses.find(e => e.id === updatedExpense.id);
    if (!originalExpense) return;

    if (undoableAction?.timerId) clearTimeout(undoableAction.timerId);

    const activityId = await logActivity({ 
        type: 'update', 
        expense: updatedExpense, 
        oldExpense: originalExpense,
        performedBy: user 
    });

    if (originalExpense.user !== User.Commun && updatedExpense.user === User.Commun) {
            addMoneyPotTransaction({
            amount: -Math.abs(updatedExpense.amount),
            description: `Dépense (modif) : ${updatedExpense.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
            });
    }
    else if (originalExpense.user === User.Commun && updatedExpense.user !== User.Commun) {
            addMoneyPotTransaction({
            amount: Math.abs(originalExpense.amount),
            description: `Annulation (modif) : ${originalExpense.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
            });
    }
    else if (originalExpense.user === User.Commun && updatedExpense.user === User.Commun && Math.abs(originalExpense.amount - updatedExpense.amount) > 0.01) {
        const diff = originalExpense.amount - updatedExpense.amount;
        addMoneyPotTransaction({
            amount: diff,
            description: `Ajustement : ${updatedExpense.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
            });
    }

    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setExpenseToEdit(null);
    highlightExpense(updatedExpense.id);

    // Déclencher un avis push de modification de dépense
    dispatchPushNotification({
        type: 'update',
        expense: updatedExpense
    });

    const timerId = window.setTimeout(() => {
        _performUpdate(updatedExpense);
        setUndoableAction(null);
    }, 7000);

    setUndoableAction({ type: 'update', expense: updatedExpense, originalExpense, timerId, activityId: activityId || undefined });
  };

  const addReminder = async (reminder: Omit<any, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const reminderData = { ...reminder, id: newId };
    const optimisticReminder: any = { ...reminderData, created_at: new Date().toISOString() };
    setReminders(prev => [...prev, optimisticReminder].sort((a,b) => a.day_of_month - b.day_of_month));

    const { data, error } = await supabase.from('reminders').insert(reminderData).select().single();
    if (error) {
        console.error('Error adding reminder:', error.message || error);
        setToastInfo({ message: "Erreur lors de l'ajout du rappel.", type: 'error' });
        setReminders(prev => prev.filter(r => r.id !== newId));
    } else {
        broadcastChange('reminders', 'INSERT', data);
    }
  };

  const updateReminder = async (updatedReminder: any) => {
    const originalReminder = reminders.find(r => r.id === updatedReminder.id);
    if (!originalReminder) return;

    setReminders(prev => prev.map(r => r.id === updatedReminder.id ? updatedReminder : r).sort((a,b) => a.day_of_month - b.day_of_month));

    const { id, created_at, ...updatePayload } = updatedReminder;
    const { error } = await supabase.from('reminders').update(updatePayload).eq('id', id);

    if (error) {
        console.error('Error updating reminder:', error.message || error);
        setToastInfo({ message: "Erreur lors de la mise à jour du rappel.", type: 'error' });
        setReminders(prev => prev.map(r => r.id === originalReminder.id ? originalReminder : r).sort((a,b) => a.day_of_month - b.day_of_month));
    } else {
        broadcastChange('reminders', 'UPDATE', updatedReminder);
    }
  };

  const deleteReminder = async (id: string) => {
    const reminderToDelete = reminders.find(r => r.id === id);
    if (!reminderToDelete) return;
    
    setReminders(prev => prev.filter(r => r.id !== id));

    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) {
        console.error('Error deleting reminder:', error.message || error);
        setToastInfo({ message: "Erreur lors de la suppression du rappel.", type: 'error' });
        setReminders(prev => [...prev, reminderToDelete].sort((a,b) => a.day_of_month - b.day_of_month));
    } else {
        broadcastChange('reminders', 'DELETE', { id });
    }
  };

  const { filteredExpenses, sophieTotalMonth, vincentTotalMonth } = useMemo(() => {
    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getUTCFullYear() === currentYear && expenseDate.getUTCMonth() === currentMonth;
    });

    const sophieTotal = filtered.filter(e => e.user === User.Sophie).reduce((sum, e) => sum + e.amount, 0);
    const vincentTotal = filtered.filter(e => e.user === User.Vincent).reduce((sum, e) => sum + e.amount, 0);

    return { filteredExpenses: filtered, sophieTotalMonth: sophieTotal, vincentTotalMonth: vincentTotal };
  }, [expenses, currentMonth, currentYear]);

  const previousMonthExpenses = useMemo(() => {
    const prevMonthDate = new Date(currentDate);
    prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
    const prevMonth = prevMonthDate.getUTCMonth();
    const prevYear = prevMonthDate.getUTCFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getUTCFullYear() === 2025 && expenseDate.getUTCMonth() === 9) return false;
      return expenseDate.getUTCFullYear() === prevYear && expenseDate.getUTCMonth() === prevMonth;
    });
  }, [expenses, currentDate]);

  const previousYearMonthExpenses = useMemo(() => {
    const prevYear = currentYear - 1;
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getUTCFullYear() === prevYear && expenseDate.getUTCMonth() === currentMonth;
    });
  }, [expenses, currentYear, currentMonth]);

  const last3MonthsExpenses = useMemo(() => {
    const threeMonthsAgo = new Date(currentDate);
    threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
    const oneMonthAgo = new Date(currentDate);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getUTCFullYear() === 2025 && expenseDate.getUTCMonth() === 9) return false;
      const expenseTime = expenseDate.getTime();
      return expenseTime >= threeMonthsAgo.getTime() && expenseTime < oneMonthAgo.getTime();
    });
  }, [expenses, currentDate]);

  const analysisExpenses = useMemo(() => {
     return filteredExpenses.filter(expense => {
        const d = new Date(expense.date);
        return !(d.getUTCFullYear() === 2025 && d.getUTCMonth() === 9);
     });
  }, [filteredExpenses]);

  const yearlyFilteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
        const d = new Date(expense.date);
        if (d.getUTCFullYear() === 2025 && d.getUTCMonth() === 9) return false;
        return d.getUTCFullYear() === currentYear;
    });
  }, [expenses, currentYear]);

  const previousYearFilteredExpenses = useMemo(() => {
    return expenses.filter(expense => new Date(expense.date).getUTCFullYear() === currentYear - 1);
  }, [expenses, currentYear]);
  
  const searchedExpenses = useMemo(() => {
    return filteredExpenses.filter(e => {
        const matchesSearch = !searchTerm || e.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUser = filterUser === 'All' || e.user === filterUser;
        const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
        return matchesSearch && matchesUser && matchesCategory;
    });
  }, [filteredExpenses, searchTerm, filterUser, filterCategory]);

  const handleDateNavigation = (direction: 'next' | 'prev') => {
      setCurrentDate(prevDate => {
          const newDate = new Date(prevDate);
          if (activeTab === 'yearly') newDate.setUTCFullYear(newDate.getUTCFullYear() + (direction === 'next' ? 1 : -1));
          else newDate.setUTCMonth(newDate.getUTCMonth() + (direction === 'next' ? 1 : -1));
          
          const limit = new Date('2023-10-01T00:00:00Z');
          return newDate < limit ? prevDate : newDate;
      });
  };
  
  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const limit = new Date('2023-10-01T00:00:00Z');
        if (activeTab === 'yearly') {
            const year = parseInt(e.target.value, 10);
            const newDate = new Date(currentDate);
            newDate.setUTCFullYear(year);
            setCurrentDate(newDate < limit ? limit : newDate);
        } else {
            const [year, month] = e.target.value.split('-').map(Number);
            const newDate = new Date(Date.UTC(year, month - 1, 1));
            setCurrentDate(newDate < limit ? limit : newDate);
        }
  };

  const isPrevDisabled = useMemo(() => {
      const newDate = new Date(currentDate);
      if (activeTab === 'yearly') newDate.setUTCFullYear(newDate.getUTCFullYear() - 1);
      else newDate.setUTCMonth(newDate.getUTCMonth() - 1);
      return newDate < new Date('2023-10-01T00:00:00Z');
  }, [currentDate, activeTab]);

  const currentMonthName = useMemo(() => currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }), [currentDate]);
  const monthInputValue = useMemo(() => `${currentDate.getUTCFullYear()}-${(currentDate.getUTCMonth() + 1).toString().padStart(2, '0')}`, [currentDate]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setToastInfo({ message: 'Synchronisation en cours...', type: 'info' });
    await syncData();
    setToastInfo({ message: 'Données mises à jour !', type: 'info' });
    setIsRefreshing(false);
  };
  
  const handlePayReminder = async (reminder: any) => {
    try {
      await addExpense({
        description: reminder.description,
        amount: reminder.amount,
        category: reminder.category,
        user: reminder.user,
        date: new Date().toISOString(),
        subtracted_items: []
      });
    } catch (err) {
      console.error(err);
      setToastInfo({ message: "Erreur lors de l'ajout automatique de la dépense.", type: 'error' });
    }
  };

  const markActivitiesAsRead = () => setLastBellCheck(new Date().toISOString());

  const deleteActivity = useCallback(async (activityId: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', activityId);
    if (error) setToastInfo({ message: "Erreur lors de la suppression de l'activité.", type: 'error' });
  }, []);

  const handleUndo = useCallback(async () => {
    if (!undoableAction) return;
    clearTimeout(undoableAction.timerId);

    if (undoableAction.type === 'delete') {
        if (undoableAction.activityId) await supabase.from('activities').delete().eq('id', undoableAction.activityId);
        setExpenses(prev => [...prev, undoableAction.expense].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        highlightExpense(undoableAction.expense.id);
        if (undoableAction.expense.user === User.Commun) {
            addMoneyPotTransaction({ amount: -Math.abs(undoableAction.expense.amount), description: `Annulation suppression : ${undoableAction.expense.description}`, user_name: 'Commun', date: new Date().toISOString() });
        }
    } else if (undoableAction.type === 'update' && undoableAction.originalExpense) {
        if (undoableAction.activityId) await supabase.from('activities').delete().eq('id', undoableAction.activityId);
        setExpenses(prev => prev.map(e => e.id === undoableAction.originalExpense!.id ? undoableAction.originalExpense! : e));
        highlightExpense(undoableAction.originalExpense.id);
    }
    setUndoableAction(null);
  }, [undoableAction, highlightExpense]);

  const addCategory = (name: string): boolean => {
    const trimmedName = name.trim();
    if (trimmedName && !categories.find(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        setCategories(prev => [...prev, trimmedName]);
        return true;
    }
    return false;
  };

  const updateCategory = (oldName: string, newName: string): boolean => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName || oldName === trimmedNewName) return false;
    if (categories.find(c => c.toLowerCase() === trimmedNewName.toLowerCase())) {
        setToastInfo({ message: `La catégorie "${trimmedNewName}" existe déjà.`, type: 'error' });
        return false;
    }
    setCategories(prev => prev.map(c => c === oldName ? trimmedNewName : c));
    return true;
  };

  const deleteCategory = (name: string) => {
    if (categories.length > 1) setCategories(prev => prev.filter(c => c !== name));
    else setToastInfo({ message: 'Vous devez conserver au moins une catégorie.', type: 'error' });
  };

  const isConnected = realtimeStatus === 'SUBSCRIBED';

  if (isLoading) {
    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans transition-colors duration-300">
             <div className="bg-white dark:bg-slate-800/80 shadow-sm h-16 w-full sticky top-0 z-20 flex items-center px-4 md:px-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
             </div>
             <main className="container mx-auto p-4 md:p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                </div>
                <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 pb-1">
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8"><div className="h-96 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-pulse"></div><div className="h-48 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-pulse"></div></div>
                    <div className="space-y-8"><div className="h-10 bg-white dark:bg-slate-800 rounded-md shadow-sm animate-pulse"></div><div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 space-y-4">{[1,2,3,4,5].map(i => (<div key={i} className="flex items-center gap-3"><div className="w-1.5 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div><div className="flex-1 space-y-2"><div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div><div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></div></div>))}</div></div>
                </div>
             </main>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
      {isMaintenanceMode && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2.5 font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-md z-[90] sticky top-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🛠️</span>
            <span>MODE MAINTENANCE ACTIF — Accès restreint aux administrateurs.</span>
          </div>
          <button 
            type="button"
            onClick={() => onToggleMaintenanceMode(false)}
            className="px-3 py-1 bg-slate-900 text-amber-400 rounded-lg text-xs font-extrabold hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            Désactiver
          </button>
        </div>
      )}
      <PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh}>
        <Header onOpenSearch={() => setIsSearchOpen(true)} loggedInUser={user} activityItems={activityItemsForHeader} unreadCount={unreadCount} onMarkAsRead={markActivitiesAsRead} realtimeStatus={realtimeStatus} onDeleteActivity={deleteActivity} />
        <main className="container mx-auto p-4 md:p-8 pb-32">
          <div className="flex justify-between items-center max-w-md mx-auto mb-6 px-2 animate-fade-in-up">
            <button onClick={() => handleDateNavigation('prev')} disabled={isPrevDisabled} className="w-10 h-10 rounded-full bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="relative group cursor-pointer flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 text-center capitalize tracking-tight">{activeTab === 'yearly' ? currentYear : currentMonthName}</h2>
                <ChevronDownIcon className="text-slate-400 dark:text-slate-500 w-4 h-4" />
                {activeTab === 'yearly' ? (
                  <select
                    value={currentYear}
                    onChange={(e) => {
                      const year = parseInt(e.target.value, 10);
                      if (!isNaN(year)) {
                        const limit = new Date('2023-10-01T00:00:00Z');
                        const newDate = new Date(currentDate);
                        newDate.setUTCFullYear(year);
                        setCurrentDate(newDate < limit ? limit : newDate);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 font-bold"
                    aria-label="Sélectionner l'année"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold">
                        {y}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="month" value={monthInputValue} min="2023-10" onChange={handleDateSelect} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" ref={(input) => { if (input) input.onclick = () => { try { input.showPicker(); } catch (err) {} } }} />
                )}
            </div>
            <button onClick={() => handleDateNavigation('next')} className="w-10 h-10 rounded-full bg-slate-100/90 dark:bg-slate-800/90 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <ReminderAlerts reminders={reminders} monthlyExpenses={filteredExpenses} onPayReminder={handlePayReminder} currentMonth={currentMonth} currentYear={currentYear} loggedInUser={user} />
          <NotificationReminderAlert onOpenSettings={() => { setSettingsInitialView('notifications'); setIsSettingsOpen(true); }} />
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div id="expense-form-container" className="space-y-8"><ExpenseForm key={formInitialData?.formKey || 'default-form'} onAddExpense={addExpense} expenses={expenses} initialData={formInitialData} loggedInUser={user} onlineUsers={onlineUsers} disabled={!isConnected} categories={categories} groceryStores={groceryStores} cars={cars} heatingTypes={heatingTypes} /><ExpenseSummary allExpenses={expenses} currentYear={currentYear} currentMonth={currentMonth} sophieTotalMonth={sophieTotalMonth} vincentTotalMonth={vincentTotalMonth} loggedInUser={user} /></div>
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 space-y-5">
                    {/* Header with Title and Month badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Dépenses du mois</h2>
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-0.5">Historique des transactions du mois</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50/80 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-2xl p-1 shadow-2xs">
                        <button
                          onClick={handlePrevMonth}
                          className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="Mois précédent"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="relative flex items-center px-1">
                          <svg className="w-4 h-4 text-slate-500 mr-1.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <select
                            value={`${currentYear}-${currentMonth}`}
                            onChange={handleMonthChange}
                            className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none pr-5 appearance-none py-1"
                          >
                            {availableMonths.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <svg className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        <button
                          onClick={handleNextMonth}
                          className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="Mois suivant"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Search and Filter button */}
                    <div className="flex gap-2.5 items-center">
                      <div className="relative flex-1">
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Rechercher une dépense..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50/80 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600/80 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-2xs"
                        />
                      </div>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center transition-all shadow-2xs ${
                          showFilters || filterUser !== 'All' || filterCategory !== 'All'
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-50/80 dark:bg-slate-700/50 border-slate-200/80 dark:border-slate-600/80 text-slate-500 hover:bg-slate-100'
                        }`}
                        aria-label="Filtres"
                      >
                        <FunnelIcon />
                      </button>
                    </div>

                    {/* Person Filter Pill Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => setFilterUser('All')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border shrink-0 ${
                          filterUser === 'All'
                            ? 'bg-blue-100/90 dark:bg-blue-950/80 border-blue-200/90 dark:border-blue-800 text-blue-600 dark:text-blue-300 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-700/40 border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 18V6c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2zm-2 0H5V6h14v12zm-3-6c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z"/>
                        </svg>
                        <span>Toutes</span>
                      </button>

                      <button
                        onClick={() => setFilterUser(User.Sophie)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border shrink-0 ${
                          filterUser === User.Sophie
                            ? 'bg-pink-100/90 dark:bg-pink-950/80 border-pink-200/90 dark:border-pink-800 text-pink-600 dark:text-pink-300 shadow-2xs'
                            : 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-100/80 dark:border-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-100/60'
                        }`}
                      >
                        <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span>Sophie</span>
                      </button>

                      <button
                        onClick={() => setFilterUser(User.Vincent)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border shrink-0 ${
                          filterUser === User.Vincent
                            ? 'bg-blue-100/90 dark:bg-blue-950/80 border-blue-200/90 dark:border-blue-800 text-blue-600 dark:text-blue-300 shadow-2xs'
                            : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/80 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100/60'
                        }`}
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span>Vincent</span>
                      </button>

                      <button
                        onClick={() => setFilterUser(User.Commun)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border shrink-0 ${
                          filterUser === User.Commun
                            ? 'bg-purple-100/90 dark:bg-purple-950/80 border-purple-200/90 dark:border-purple-800 text-purple-600 dark:text-purple-300 shadow-2xs'
                            : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100/80 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100/60'
                        }`}
                      >
                        <PiggyBankIcon className="w-4 h-4 text-purple-500" />
                        <span>Cagnotte</span>
                      </button>
                    </div>

                    {showFilters && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 animate-fade-in">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Par catégorie</label>
                          <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as any | 'All')}
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="All">Toutes les catégories</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <ExpenseList expenses={searchedExpenses} onExpenseClick={setExpenseToView} highlightedIds={highlightedExpenseIds} modifiedInfo={modifiedExpenseInfo} />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'analysis' && <CategoryTotals expenses={analysisExpenses} previousMonthExpenses={previousMonthExpenses} previousYearMonthExpenses={previousYearMonthExpenses} last3MonthsExpenses={last3MonthsExpenses} onExpenseClick={setExpenseToView} />}
            {activeTab === 'yearly' && <YearlySummary expenses={yearlyFilteredExpenses} previousYearExpenses={previousYearFilteredExpenses} year={currentYear} onExpenseClick={setExpenseToView} />}
            {activeTab === 'moneypot' && (<MoneyPotTab transactions={moneyPotTransactions} onAddTransaction={addMoneyPotTransaction} onDeleteTransaction={deleteMoneyPotTransaction} />)}
          </div>
        </main>
      </PullToRefresh>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} onOpenSettings={() => { setSettingsInitialView('main'); setIsSettingsOpen(true); }} />
      <ExpenseSuccessModal
        isOpen={!!successExpense}
        onClose={() => setSuccessExpense(null)}
        expense={successExpense}
        onViewExpense={(exp) => {
          setSuccessExpense(null);
          setExpenseToView(exp);
        }}
      />
      {expenseToView && (<ExpenseDetailModal expense={expenseToView} history={expenseHistory} onClose={() => setExpenseToView(null)} onEdit={() => { setExpenseToEdit(expenseToView); setExpenseToView(null); }} />)}
      {expenseToEdit && (<EditExpenseModal expense={expenseToEdit} expenses={expenses} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense} onClose={() => setExpenseToEdit(null)} categories={categories} groceryStores={groceryStores} cars={cars} heatingTypes={heatingTypes} loggedInUser={user} onAddExpense={addExpense} />)}
      {toastInfo && (<Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo(null)} />)}
      <UndoToast undoableAction={undoableAction} onUndo={handleUndo} />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} allExpenses={expenses} onEditExpense={setExpenseToView} highlightedIds={highlightedExpenseIds} modifiedInfo={modifiedExpenseInfo} categories={categories} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        initialView={settingsInitialView}
        reminders={reminders} 
        expenses={expenses} 
        moneyPotTransactions={moneyPotTransactions}
        onSyncData={syncData}
        onAddReminder={addReminder} 
        onUpdateReminder={updateReminder} 
        onDeleteReminder={deleteReminder} 
        categories={categories} 
        onAddCategory={addCategory} 
        onUpdateCategory={updateCategory} 
        onDeleteCategory={deleteCategory} 
        profiles={profiles} 
        loggedInUser={user} 
        onAddProfile={onAddProfile} 
        onUpdateProfilePassword={onUpdateProfilePassword} 
        onDeleteProfile={onDeleteProfile} 
        onToggleBlockProfile={onToggleBlockProfile}
        isMaintenanceMode={isMaintenanceMode}
        onToggleMaintenanceMode={onToggleMaintenanceMode}
        onUpdateExpense={updateExpense}
        groceryStores={groceryStores} 
        setGroceryStores={setGroceryStores} 
        cars={cars} 
        setCars={setCars} 
        heatingTypes={heatingTypes} 
        setHeatingTypes={setHeatingTypes} 
        setToastInfo={setToastInfo} 
        loginHistory={loginHistory} 
        onLogout={onLogout} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <OfflineIndicator />
    </div>
  );
};

const App: React.FC = () => {
  useTheme();
  const { isMaintenanceMode, toggleMaintenanceMode } = useMaintenanceMode();
  const { 
    user, 
    login, 
    loginWithResult, 
    logout, 
    isLoading, 
    profiles, 
    addProfile, 
    updateProfilePassword, 
    toggleBlockProfile, 
    deleteProfile, 
    loginHistory 
  } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Maintenance mode handling
  if (isMaintenanceMode && user !== User.Vincent) {
    return <MaintenanceOverlay onAdminLogin={loginWithResult} />;
  }

  if (!user) {
    return <Login onLogin={loginWithResult} />;
  }

  return (
    <MainApp 
      user={user} 
      onLogout={logout} 
      profiles={profiles} 
      onAddProfile={addProfile} 
      onUpdateProfilePassword={updateProfilePassword} 
      onDeleteProfile={deleteProfile} 
      onToggleBlockProfile={toggleBlockProfile}
      isMaintenanceMode={isMaintenanceMode}
      onToggleMaintenanceMode={toggleMaintenanceMode}
      loginHistory={loginHistory} 
    />
  );
};

export default App;
