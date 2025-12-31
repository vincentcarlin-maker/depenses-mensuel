

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
import Toast from './components/Toast';
import YearlySummary from './components/YearlySummary';
import ReminderAlerts from './components/ReminderAlerts';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './hooks/useTheme';
import OfflineIndicator from './components/OfflineIndicator';
import { useAuth, type Profile, type LoginEvent } from './hooks/useAuth';
import Login from './components/Login';
import PullToRefresh from './components/PullToRefresh';
import { useLocalStorage } from './hooks/useLocalStorage';
import UndoToast from './components/UndoToast';
import { DEFAULT_CATEGORIES } from './types';
import GlobalSearchModal from './components/GlobalSearchModal';
import FunnelIcon from './components/icons/FunnelIcon';
import MoneyPotTab from './components/MoneyPotTab';
import BottomNavigation, { TabId } from './components/BottomNavigation';

type UndoableAction = {
    type: 'delete' | 'update';
    expense: Expense; // For delete, this is the one deleted. For update, this is the NEW state.
    originalExpense?: Expense; // For update, this is the OLD state.
    timerId: number;
};

export type ModificationType = 'date' | 'amount' | 'other';

const getInitialDate = () => {
    const now = new Date();
    const limit = new Date('2025-10-01T00:00:00Z');
    now.setUTCDate(1); // Set day to 1 to avoid month-end issues
    limit.setUTCDate(1);
    return now < limit ? limit : now;
};

const MainApp: React.FC<{ 
    user: User, 
    onLogout: () => void,
    profiles: Profile[],
    onAddProfile: (profile: Profile) => boolean,
    onUpdateProfilePassword: (username: string, newPassword: string) => boolean,
    onDeleteProfile: (username: string) => boolean,
    loginHistory: LoginEvent[]
}> = ({ user, onLogout, profiles, onAddProfile, onUpdateProfilePassword, onDeleteProfile, loginHistory }) => {
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<(Omit<Expense, 'id' | 'date' | 'created_at'> & { formKey?: string }) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [highlightedExpenseIds, setHighlightedExpenseIds] = useState<Set<string>>(new Set());
  const [realtimeStatus, setRealtimeStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CONNECTING'>('CONNECTING');
  const [undoableAction, setUndoableAction] = useState<UndoableAction | null>(null);
  const recentlyAddedIds = useRef(new Set<string>());
  const recentlyUpdatedIds = useRef(new Set<string>());
  const recentlyDeletedIds = useRef(new Set<string>());
  const expensesRef = useRef<Expense[]>([]); // Ref to access current expenses in realtime callbacks

  // Presence state
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  // Persistent Activity Log states
  const [lastBellCheck, setLastBellCheck] = useLocalStorage('lastBellCheck', new Date().toISOString());
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Dynamic categories and lists
  const [categories, setCategories] = useLocalStorage<any[]>('expenseCategories', DEFAULT_CATEGORIES);
  const [groceryStores, setGroceryStores] = useLocalStorage<string[]>('groceryStores', ['Leclerc', 'Leclerc Drive', 'Intermarché', 'Intermarché Drive', 'Carrefour', 'Boulangerie']);
  const [cars, setCars] = useLocalStorage<string[]>('cars', ['Peugeot 5008', 'Peugeot 207']);
  const [heatingTypes, setHeatingTypes] = useLocalStorage<string[]>('heatingTypes', ['Bois', 'Fioul']);

  const { currentMonth, currentYear } = useMemo(() => ({
      currentMonth: currentDate.getUTCMonth(),
      currentYear: currentDate.getUTCFullYear(),
  }), [currentDate]);

  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  const { unreadCount, activityItemsForHeader } = useMemo(() => {
    if (!user) return { unreadCount: 0, activityItemsForHeader: [] };
    
    // Filter activities where the other user did something
    const otherUserActivities = activities.filter(act => 
        act.expense.user !== user
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
        if (act.type === 'update' && act.expense?.id) {
            if (!acc[act.expense.id]) {
                acc[act.expense.id] = [];
            }
            acc[act.expense.id].push(act);
        }
        return acc;
    }, {} as Record<string, Activity[]>);

    // 2. Iterate through each group of activities
    for (const expenseId in activitiesByExpenseId) {
        const expenseActivities = activitiesByExpenseId[expenseId];
        const accumulatedChanges = new Set<ModificationType>();

        // 3. For each activity, detect changes and add to the set
        for (const activity of expenseActivities) {
            if (!activity.oldExpense) continue;

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
      return activities
          .filter(a => a.expense.id === expenseToView.id && a.type === 'update')
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
          .slice(0, 50); // Increased limit to store more history for details
  }, []);

  const syncData = useCallback(async () => {
    const expensesPromise = supabase.from('expenses').select('*').gte('date', '2025-10-01T00:00:00Z').order('date', { ascending: false });
    const remindersPromise = supabase.from('reminders').select('*').order('day_of_month', { ascending: true });
    const moneyPotPromise = supabase.from('money_pot').select('*').order('date', { ascending: false });
    const activitiesPromise = supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(50);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const wasAddedLocally = recentlyAddedIds.current.has(newExpense.id);
      if (!wasAddedLocally) {
        setToastInfo({ message: `${newExpense.user} a ajouté "${newExpense.description}".`, type: 'info' });
      }

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
      
      const wasUpdatedLocally = recentlyUpdatedIds.current.has(updatedExpense.id);
      if (!wasUpdatedLocally && updatedExpense.user !== user) {
          setToastInfo({ message: `${updatedExpense.user} a modifié "${updatedExpense.description}".`, type: 'info' });
      }

      setExpenses(prevExpenses =>
        prevExpenses.map(expense =>
          expense.id === updatedExpense.id ? updatedExpense : expense
        )
      );
      highlightExpense(updatedExpense.id);
    };

    const handleExpenseDelete = (payload: any) => {
        const deletedPayload = payload.old as Partial<Expense> & { id: string };
        if (!deletedPayload?.id) {
            console.warn('Real-time: Received DELETE event without an ID.');
            return;
        }

        if (recentlyDeletedIds.current.has(deletedPayload.id)) {
            return;
        }

        setExpenses(prevExpenses => {
            const expenseToDelete = prevExpenses.find(e => e.id === deletedPayload.id);

            if (!expenseToDelete) {
                return prevExpenses.filter(expense => expense.id !== deletedPayload.id);
            }

            const desc = expenseToDelete.description || 'une dépense';
            setToastInfo({
                message: `Dépense "${desc}" supprimée.`,
                type: 'info'
            });

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
                // Prevent duplicate if we added it optimistically
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
      .subscribe((status, err) => {
        switch (status) {
          case 'SUBSCRIBED':
            setRealtimeStatus('SUBSCRIBED');
            console.log('Real-time channel connected. Syncing data...');
            syncData();
            break;
          case 'CHANNEL_ERROR':
            setRealtimeStatus('CHANNEL_ERROR');
            console.error('Real-time channel error:', err);
            break;
          case 'TIMED_OUT':
            setRealtimeStatus('CONNECTING');
            console.warn('Real-time connection timed out. Attempting to reconnect...');
            break;
          default:
            setRealtimeStatus('CONNECTING');
        }
      });
      
    return () => {
      supabase.removeChannel(allChangesChannel);
    };
  }, [highlightExpense, user, syncData, mergeAndDedupeActivities]);

  const logActivity = useCallback(async (activityPayload: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activityPayload,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const { error } = await supabase.from('activities').insert(newActivity);
    if (error) {
      console.error("Failed to log activity:", error.message);
    }
  }, []);

  // Money Pot Handlers (Moved up to be accessible by expense handlers)
  const addMoneyPotTransaction = async (transaction: Omit<MoneyPotTransaction, 'id' | 'created_at'>) => {
      // 1. Generate client-side ID and timestamp for optimistic UI
      const newId = crypto.randomUUID();
      const newTransaction: MoneyPotTransaction = {
          ...transaction,
          id: newId,
          created_at: new Date().toISOString()
      };

      // 2. Optimistic Update: Show immediately
      setMoneyPotTransactions(prev => [newTransaction, ...prev]);

      // 3. Send to Supabase
      const { error } = await supabase.from('money_pot').insert({
          ...transaction,
          id: newId // Ensure ID matches
      });

      if (error) {
          console.error("Error adding money pot transaction", error);
          setToastInfo({ message: "Erreur lors de l'ajout à la cagnotte.", type: "error" });
          // Rollback on error
          setMoneyPotTransactions(prev => prev.filter(t => t.id !== newId));
      } else {
         // Silent success for automatic operations to avoid spamming toast
         if (transaction.user_name !== 'Commun') {
             setToastInfo({ message: "Opération enregistrée !", type: "info" });
         }
      }
  };

  const deleteMoneyPotTransaction = async (id: string) => {
      // 1. Optimistic Update
      const previousTransactions = [...moneyPotTransactions];
      setMoneyPotTransactions(prev => prev.filter(t => t.id !== id));

      // 2. Send to Supabase
      const { error } = await supabase.from('money_pot').delete().eq('id', id);
      
      if (error) {
          console.error("Error deleting money pot transaction", error);
          setToastInfo({ message: "Erreur lors de la suppression.", type: "error" });
          // Rollback
          setMoneyPotTransactions(previousTransactions);
      } else {
          setToastInfo({ message: "Opération supprimée.", type: "info" });
      }
  }

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    
    recentlyAddedIds.current.add(newId);
    setTimeout(() => {
        recentlyAddedIds.current.delete(newId);
    }, 5000);

    const expenseData = {
        ...expense,
        id: newId,
    };

    const optimisticExpense: Expense = {
        ...expenseData,
        created_at: new Date().toISOString(),
    };
    setExpenses(prev => [optimisticExpense, ...prev]);
    highlightExpense(newId);

    // --- AUTOMATIC MONEY POT DEDUCTION ---
    if (expense.user === User.Commun) {
        // Negative amount = Withdrawal from pot
        const withdrawalAmount = -Math.abs(expense.amount);
        addMoneyPotTransaction({
            amount: withdrawalAmount,
            description: `Dépense : ${expense.description}`,
            user_name: 'Commun',
            date: expenseData.date
        });
    }
    // -------------------------------------

    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de l'ajout de la dépense.", type: 'error' });
      setExpenses(prev => prev.filter(e => e.id !== newId));
    } else {
      setFormInitialData(null);
      setToastInfo({ message: 'Dépense ajoutée avec succès !', type: 'info' });
      await logActivity({ type: 'add', expense: data as Expense });
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
      }
  };

  const deleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    if (undoableAction?.timerId) clearTimeout(undoableAction.timerId);

    logActivity({ type: 'delete', expense: expenseToDelete });

    // --- AUTOMATIC MONEY POT REFUND ---
    if (expenseToDelete.user === User.Commun) {
         // Positive amount = Refund to pot
         addMoneyPotTransaction({
            amount: Math.abs(expenseToDelete.amount),
            description: `Annulation : ${expenseToDelete.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
        });
    }
    // ----------------------------------

    setExpenses(prev => prev.filter(e => e.id !== id));

    const timerId = window.setTimeout(() => {
        _performDelete(id);
        setUndoableAction(null);
    }, 7000);

    setUndoableAction({ type: 'delete', expense: expenseToDelete, timerId });
  };
  
  const updateExpense = (updatedExpense: Expense) => {
    const originalExpense = expenses.find(e => e.id === updatedExpense.id);
    if (!originalExpense) return;

    if (undoableAction?.timerId) clearTimeout(undoableAction.timerId);

    logActivity({ type: 'update', expense: updatedExpense, oldExpense: originalExpense });

    // --- AUTOMATIC MONEY POT ADJUSTMENT ---
    // Case 1: Changed TO Commun (from someone else) -> Deduct
    if (originalExpense.user !== User.Commun && updatedExpense.user === User.Commun) {
            addMoneyPotTransaction({
            amount: -Math.abs(updatedExpense.amount),
            description: `Dépense (modif) : ${updatedExpense.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
            });
    }
    // Case 2: Changed FROM Commun (to someone else) -> Refund
    else if (originalExpense.user === User.Commun && updatedExpense.user !== User.Commun) {
            addMoneyPotTransaction({
            amount: Math.abs(originalExpense.amount),
            description: `Annulation (modif) : ${originalExpense.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
            });
    }
    // Case 3: Both Commun, amount changed -> Adjust (Refund old, deduct new via difference)
    else if (originalExpense.user === User.Commun && updatedExpense.user === User.Commun && Math.abs(originalExpense.amount - updatedExpense.amount) > 0.01) {
        // Example: Old 50, New 60. Diff = -10. We need to take 10 more.
        // Example: Old 50, New 40. Diff = 10. We need to give back 10.
        const diff = originalExpense.amount - updatedExpense.amount;
        addMoneyPotTransaction({
            amount: diff,
            description: `Ajustement : ${updatedExpense.description}`,
            user_name: 'Commun',
            date: new Date().toISOString()
            });
    }
    // --------------------------------------

    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setExpenseToEdit(null);
    highlightExpense(updatedExpense.id);

    const timerId = window.setTimeout(() => {
        _performUpdate(updatedExpense);
        setUndoableAction(null);
    }, 7000);

    setUndoableAction({ type: 'update', expense: updatedExpense, originalExpense, timerId });
  };

  const addReminder = async (reminder: Omit<any, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const reminderData = {
        ...reminder,
        id: newId,
    };

    const optimisticReminder: any = {
        ...reminderData,
        created_at: new Date().toISOString(),
    };
    setReminders(prev => [...prev, optimisticReminder].sort((a,b) => a.day_of_month - b.day_of_month));

    const { error } = await supabase
        .from('reminders')
        .insert(reminderData)
        .select()
        .single();
    
    if (error) {
        console.error('Error adding reminder:', error.message || error);
        setToastInfo({ message: "Erreur lors de l'ajout du rappel.", type: 'error' });
        setReminders(prev => prev.filter(r => r.id !== newId));
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
    }
  };

  const { filteredExpenses, sophieTotalMonth, vincentTotalMonth } = useMemo(() => {
    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getUTCFullYear() === currentYear && expenseDate.getUTCMonth() === currentMonth;
    });

    const sophieTotal = filtered
      .filter(e => e.user === User.Sophie)
      .reduce((sum, e) => sum + e.amount, 0);
      
    const vincentTotal = filtered
      .filter(e => e.user === User.Vincent)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      filteredExpenses: filtered,
      sophieTotalMonth: sophieTotal,
      vincentTotalMonth: vincentTotal
    };
  }, [expenses, currentMonth, currentYear]);

  const previousMonthExpenses = useMemo(() => {
    const prevMonthDate = new Date(currentDate);
    prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
    const prevMonth = prevMonthDate.getUTCMonth();
    const prevYear = prevMonthDate.getUTCFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      // IGNORED: October 2025 (Initial data) from trends
      if (expenseDate.getUTCFullYear() === 2025 && expenseDate.getUTCMonth() === 9) return false;
      return expenseDate.getUTCFullYear() === prevYear && expenseDate.getUTCMonth() === prevMonth;
    });
  }, [expenses, currentDate]);

  // NEW: Same month of previous year for detailed trend comparison
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
      // IGNORED: October 2025 (Initial data) from trends
      if (expenseDate.getUTCFullYear() === 2025 && expenseDate.getUTCMonth() === 9) return false;
      const expenseTime = expenseDate.getTime();
      return expenseTime >= threeMonthsAgo.getTime() && expenseTime < oneMonthAgo.getTime();
    });
  }, [expenses, currentDate]);

  // Filtered expenses for the Analysis tab
  const analysisExpenses = useMemo(() => {
     return filteredExpenses.filter(expense => {
        const d = new Date(expense.date);
        // Exclude Oct 2025
        return !(d.getUTCFullYear() === 2025 && d.getUTCMonth() === 9);
     });
  }, [filteredExpenses]);

  const yearlyFilteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
        const d = new Date(expense.date);
        // IGNORED: October 2025 (Initial data) from yearly summary
        if (d.getUTCFullYear() === 2025 && d.getUTCMonth() === 9) return false;
        return d.getUTCFullYear() === currentYear;
    });
  }, [expenses, currentYear]);

  const previousYearFilteredExpenses = useMemo(() => {
    return expenses.filter(expense => new Date(expense.date).getUTCFullYear() === currentYear - 1);
  }, [expenses, currentYear]);
  
  // Advanced Filter Logic
  const searchedExpenses = useMemo(() => {
    return filteredExpenses.filter(e => {
        // Text Match
        const matchesSearch = !searchTerm || e.description.toLowerCase().includes(searchTerm.toLowerCase());
        // User Match
        const matchesUser = filterUser === 'All' || e.user === filterUser;
        // Category Match
        const matchesCategory = filterCategory === 'All' || e.category === filterCategory;

        return matchesSearch && matchesUser && matchesCategory;
    });
  }, [filteredExpenses, searchTerm, filterUser, filterCategory]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
      setCurrentDate(prevDate => {
          const newDate = new Date(prevDate);
          newDate.setUTCMonth(newDate.getUTCMonth() + (direction === 'next' ? 1 : -1));
          
          const limit = new Date('2025-10-01T00:00:00Z');
          if (newDate < limit) {
              return prevDate;
          }
          return newDate;
      });
  };
  
  const isPrevDisabled = useMemo(() => {
      const newDate = new Date(currentDate);
      newDate.setUTCMonth(newDate.getUTCMonth() - 1);
      const limit = new Date('2025-10-01T00:00:00Z');
      return newDate < limit;
  }, [currentDate]);

  const currentMonthName = useMemo(() => {
    return currentDate.toLocaleString('fr-FR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }, [currentDate]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setToastInfo({ message: 'Synchronisation en cours...', type: 'info' });
    await syncData();
    setToastInfo({ message: 'Données mises à jour !', type: 'info' });
    setIsRefreshing(false);
  };
  
  const handlePayReminder = (reminder: any) => {
    setFormInitialData({
      formKey: crypto.randomUUID(),
      description: reminder.description,
      amount: reminder.amount,
      category: reminder.category,
      user: reminder.user,
    });
    const formElement = document.getElementById('expense-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const markActivitiesAsRead = () => {
    setLastBellCheck(new Date().toISOString());
  };

  const deleteActivity = useCallback(async (activityId: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', activityId);
    if (error) {
        console.error("Failed to delete activity:", error);
        setToastInfo({ message: "Erreur lors de la suppression de l'activité.", type: 'error' });
    }
  }, []);

  const handleUndo = useCallback(async () => {
    if (!undoableAction) return;

    clearTimeout(undoableAction.timerId);

    if (undoableAction.type === 'delete') {
        const { error } = await supabase.from('activities').delete().eq('expense->>id', undoableAction.expense.id);
        if (error) console.error("Could not delete activity log for undone action:", error);
        
        setExpenses(prev => [...prev, undoableAction.expense].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        highlightExpense(undoableAction.expense.id);
        
        if (undoableAction.expense.user === User.Commun) {
            addMoneyPotTransaction({
                amount: -Math.abs(undoableAction.expense.amount),
                description: `Annulation suppression : ${undoableAction.expense.description}`,
                user_name: 'Commun',
                date: new Date().toISOString()
            });
        }
    } else if (undoableAction.type === 'update' && undoableAction.originalExpense) {
        const { error } = await supabase.from('activities').delete().eq('expense->>id', undoableAction.originalExpense.id);
         if (error) console.error("Could not delete activity log for undone action:", error);

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
    if (categories.length > 1) {
        setCategories(prev => prev.filter(c => c !== name));
    } else {
        setToastInfo({ message: 'Vous devez conserver au moins une catégorie.', type: 'error' });
    }
  };

  const isConnected = realtimeStatus === 'SUBSCRIBED';

  if (isLoading) {
    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans transition-colors duration-300">
             {/* Header Skeleton */}
             <div className="bg-white dark:bg-slate-800/80 shadow-sm h-16 w-full sticky top-0 z-20 flex items-center px-4 md:px-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
             </div>
             <main className="container mx-auto p-4 md:p-8 space-y-6">
                {/* Month Nav Skeleton */}
                <div className="flex justify-between items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                </div>
                
                {/* Tabs Skeleton */}
                <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 pb-1">
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        {/* Form Skeleton */}
                         <div className="h-96 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-pulse"></div>
                         {/* Summary Skeleton */}
                         <div className="h-48 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-8">
                         {/* Search Input Skeleton */}
                         <div className="h-10 bg-white dark:bg-slate-800 rounded-md shadow-sm animate-pulse"></div>
                         {/* List Skeleton */}
                         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 space-y-4">
                            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4"></div>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-1.5 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                    </div>
                                    <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
             </main>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
      <PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh}>
        <Header 
          onOpenSearch={() => setIsSearchOpen(true)}
          loggedInUser={user}
          activityItems={activityItemsForHeader}
          unreadCount={unreadCount}
          onMarkAsRead={markActivitiesAsRead}
          realtimeStatus={realtimeStatus}
          onDeleteActivity={deleteActivity}
        />

        <main className="container mx-auto p-4 md:p-8 pb-32">
          <div className="flex justify-between items-center mb-6 animate-fade-in-up">
            <button 
              onClick={() => handleMonthChange('prev')} 
              disabled={isPrevDisabled}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 text-center capitalize">{currentMonthName}</h2>
            <button onClick={() => handleMonthChange('next')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          
          <ReminderAlerts 
            reminders={reminders}
            monthlyExpenses={filteredExpenses}
            onPayReminder={handlePayReminder}
            currentMonth={currentMonth}
            currentYear={currentYear}
            loggedInUser={user}
          />
          
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div id="expense-form-container" className="space-y-8">
                  <ExpenseForm
                    key={formInitialData?.formKey || 'default-form'}
                    onAddExpense={addExpense}
                    expenses={expenses}
                    initialData={formInitialData}
                    loggedInUser={user}
                    onlineUsers={onlineUsers}
                    disabled={!isConnected}
                    categories={categories}
                    groceryStores={groceryStores}
                    cars={cars}
                    heatingTypes={heatingTypes}
                  />
                  <ExpenseSummary 
                      allExpenses={expenses}
                      currentYear={currentYear}
                      currentMonth={currentMonth}
                      sophieTotalMonth={sophieTotalMonth}
                      vincentTotalMonth={vincentTotalMonth}
                  />
                </div>
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-lg">
                      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Dépenses du mois</h2>
                       
                       {/* Filtering UI */}
                       <div className="flex gap-2 mb-4">
                           <input
                              type="text"
                              placeholder="Rechercher..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                            />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex-shrink-0 p-2 rounded-lg border transition-colors ${showFilters || filterUser !== 'All' || filterCategory !== 'All' ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                aria-label="Filtres"
                            >
                                <FunnelIcon />
                            </button>
                       </div>

                       {showFilters && (
                           <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4 animate-fade-in">
                               <div>
                                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Par personne</label>
                                   <div className="flex gap-2">
                                       <button 
                                           onClick={() => setFilterUser('All')}
                                           className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors border ${filterUser === 'All' ? 'bg-slate-200 dark:bg-slate-600 border-transparent text-slate-800 dark:text-slate-100' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                       >
                                           Tous
                                       </button>
                                       <button 
                                           onClick={() => setFilterUser(User.Sophie)}
                                           className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors border ${filterUser === User.Sophie ? 'bg-pink-500 border-pink-600 text-white' : 'bg-white dark:bg-slate-800 border-pink-200 dark:border-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10'}`}
                                       >
                                           Sophie
                                       </button>
                                       <button 
                                           onClick={() => setFilterUser(User.Vincent)}
                                           className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors border ${filterUser === User.Vincent ? 'bg-sky-500 border-sky-600 text-white' : 'bg-white dark:bg-slate-800 border-sky-200 dark:border-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10'}`}
                                       >
                                           Vincent
                                       </button>
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Par catégorie</label>
                                   <select
                                       value={filterCategory}
                                       onChange={(e) => setFilterCategory(e.target.value as any | 'All')}
                                       className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                   >
                                       <option value="All">Toutes les catégories</option>
                                       {categories.map(cat => (
                                           <option key={cat} value={cat}>{cat}</option>
                                       ))}
                                   </select>
                               </div>
                           </div>
                       )}

                      <ExpenseList 
                        expenses={searchedExpenses} 
                        onExpenseClick={setExpenseToView} 
                        highlightedIds={highlightedExpenseIds} 
                        modifiedInfo={modifiedExpenseInfo}
                      />
                    </div>
                </div>
              </div>
            )}
            {activeTab === 'analysis' && <CategoryTotals expenses={analysisExpenses} previousMonthExpenses={previousMonthExpenses} previousYearMonthExpenses={previousYearMonthExpenses} last3MonthsExpenses={last3MonthsExpenses} />}
            {activeTab === 'yearly' && <YearlySummary expenses={yearlyFilteredExpenses} previousYearExpenses={previousYearFilteredExpenses} year={currentYear} />}
            {activeTab === 'moneypot' && (
                <MoneyPotTab 
                    transactions={moneyPotTransactions} 
                    onAddTransaction={addMoneyPotTransaction} 
                    onDeleteTransaction={deleteMoneyPotTransaction}
                />
            )}
          </div>
        </main>
      </PullToRefresh>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Detail Modal (View) */}
      {expenseToView && (
          <ExpenseDetailModal
            expense={expenseToView}
            history={expenseHistory}
            onClose={() => setExpenseToView(null)}
            onEdit={() => {
                setExpenseToEdit(expenseToView);
                setExpenseToView(null);
            }}
          />
      )}

      {/* Edit Modal (Action) */}
      {expenseToEdit && (
        <EditExpenseModal
          expense={expenseToEdit}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
          onClose={() => setExpenseToEdit(null)}
          categories={categories}
          groceryStores={groceryStores}
          cars={cars}
          heatingTypes={heatingTypes}
        />
      )}
      
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}
       
      <UndoToast undoableAction={undoableAction} onUndo={handleUndo} />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allExpenses={expenses}
        onEditExpense={setExpenseToView}
        highlightedIds={highlightedExpenseIds}
        modifiedInfo={modifiedExpenseInfo}
        categories={categories}
      />

      <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          reminders={reminders}
          expenses={expenses}
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
          groceryStores={groceryStores}
          setGroceryStores={setGroceryStores}
          cars={cars}
          setCars={setCars}
          heatingTypes={heatingTypes}
          setHeatingTypes={setHeatingTypes}
          setToastInfo={setToastInfo}
          loginHistory={loginHistory}
          onLogout={onLogout}
      />
      <OfflineIndicator />
    </div>
  );
};


const App: React.FC = () => {
  useTheme();
  const { user, login, logout, isLoading, profiles, addProfile, updateProfilePassword, deleteProfile, loginHistory } = useAuth();
  
  if (isLoading) {
    // Auth loading skeleton - simple centered spinner or similar, keeping it minimal as it's usually fast
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-600 rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <MainApp 
        user={user} 
        onLogout={logout} 
        profiles={profiles}
        onAddProfile={addProfile}
        onUpdateProfilePassword={updateProfilePassword}
        onDeleteProfile={deleteProfile}
        loginHistory={loginHistory}
    />
  );
};

export default App;
