
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase/client';
import { type Expense, User, type Reminder, type Category, type Activity } from './types';
import Header from './components/Header';
import ExpenseForm from './components/ExpenseForm';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseList from './components/ExpenseList';
import CategoryTotals from './components/CategoryChart';
import EditExpenseModal from './components/EditExpenseModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import Toast from './components/Toast';
import YearlySummary from './components/YearlySummary';
import GroupedExpenseList from './components/GroupedExpenseList';
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

type UndoableAction = {
    type: 'delete' | 'update';
    expense: Expense; // For delete, this is the one deleted. For update, this is the NEW state.
    originalExpense?: Expense; // For update, this is the OLD state.
    timerId: number;
};

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'yearly' | 'history'>('dashboard');
  
  // Split state for Viewing vs Editing
  const [expenseToView, setExpenseToView] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
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
  const [activities, setActivities] = useLocalStorage<Activity[]>('activityLog', []);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useLocalStorage('lastSyncTimestamp', '1970-01-01T00:00:00.000Z');
  
  // Dynamic categories and lists
  const [categories, setCategories] = useLocalStorage<Category[]>('expenseCategories', DEFAULT_CATEGORIES);
  const [groceryStores, setGroceryStores] = useLocalStorage<string[]>('groceryStores', ['Leclerc', 'Leclerc Drive', 'Intermarché', 'Intermarché Drive', 'Carrefour']);
  const [cars, setCars] = useLocalStorage<string[]>('cars', ['Peugeot 5008', 'Peugeot 207']);
  const [heatingTypes, setHeatingTypes] = useLocalStorage<string[]>('heatingTypes', ['Bois', 'Fioul']);

  const { currentMonth, currentYear } = useMemo(() => ({
      currentMonth: currentDate.getUTCMonth(),
      currentYear: currentDate.getUTCFullYear(),
  }), [currentDate]);

  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  const lastSyncTimestampRef = useRef(lastSyncTimestamp);
  useEffect(() => {
    lastSyncTimestampRef.current = lastSyncTimestamp;
  }, [lastSyncTimestamp]);

  const { unreadCount, activityItemsForHeader } = useMemo(() => {
    if (!user) return { unreadCount: 0, activityItemsForHeader: [] };
    
    const otherUserActivities = activities.filter(act => act.expense.user !== user);
    
    const unread = otherUserActivities.filter(act => 
        new Date(act.timestamp) > new Date(lastBellCheck)
    ).length;
    
    const items = otherUserActivities
        .slice(0, 10) // Show last 10 activities from other user
        .map(act => act); // Just return the Activity object directly
        
    return { unreadCount: unread, activityItemsForHeader: items };
  }, [activities, lastBellCheck, user]);

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
  
  const mergeAndDedupeActivities = useCallback((existing: Activity[], toAdd: Activity[]): Activity[] => {
      const combined = [...toAdd, ...existing];
      const uniqueMap = new Map<string, Activity>();

      for (const act of combined) {
          if (act.type === 'add' || act.type === 'delete') {
              const key = `${act.type}-${act.expense.id}`;
              if (!uniqueMap.has(key)) {
                  uniqueMap.set(key, act);
              }
          } else {
              // For updates, we want to keep them distinct if possible, or dedupe by ID if strictly identical
              uniqueMap.set(act.id, act);
          }
      }

      return Array.from(uniqueMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);
  }, []);

  const syncData = useCallback(async (shouldCatchUp = false) => {
    const expensesPromise = supabase.from('expenses').select('*').gte('date', '2025-10-01T00:00:00Z').order('date', { ascending: false });
    const remindersPromise = supabase.from('reminders').select('*').order('day_of_month', { ascending: true });

    const [expensesResponse, remindersResponse] = await Promise.all([expensesPromise, remindersPromise]);

    if (expensesResponse.error) {
        console.error('Error fetching expenses:', expensesResponse.error.message);
        setToastInfo({ message: "Erreur lors de la récupération des dépenses.", type: 'error' });
    } else if (expensesResponse.data) {
        const fetchedExpenses = expensesResponse.data as Expense[];

        if (shouldCatchUp) {
            const missedAdditions = fetchedExpenses.filter(expense =>
                new Date(expense.created_at) > new Date(lastSyncTimestampRef.current) &&
                expense.user !== user
            );
            
            if (missedAdditions.length > 0) {
                 const newActivities: Activity[] = missedAdditions.map(expense => ({
                    id: crypto.randomUUID(),
                    type: 'add',
                    expense: expense,
                    timestamp: expense.created_at,
                }));
                
                setActivities(prev => mergeAndDedupeActivities(prev, newActivities));
            }
        }
        setExpenses(fetchedExpenses);
    }
    
    if (remindersResponse.error) {
        console.error('Error fetching reminders:', remindersResponse.error.message);
        setToastInfo({ message: "Erreur lors de la récupération des rappels.", type: 'error' });
    } else if (remindersResponse.data) {
        setReminders(remindersResponse.data as Reminder[]);
    }
    
    setLastSyncTimestamp(new Date().toISOString());
  }, [user, setLastSyncTimestamp, setActivities, mergeAndDedupeActivities]);

  useEffect(() => {
    const performInitialSync = async () => {
        setIsLoading(true);
        await syncData(true);
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

  useEffect(() => {
    const handleExpenseInsert = (payload: any) => {
      const newExpense = payload.new as Expense;
      if (!newExpense?.id) return;

      if (newExpense.user !== user) {
        const newActivity: Activity = {
            id: crypto.randomUUID(),
            type: 'add',
            expense: newExpense,
            timestamp: new Date().toISOString()
        };
        setActivities(prev => mergeAndDedupeActivities(prev, [newActivity]));
      }

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

      if (updatedExpense.user !== user) {
        const existingExpense = expensesRef.current.find(e => e.id === updatedExpense.id);
        const oldExpense = existingExpense ? { ...existingExpense } : undefined;

        const newActivity: Activity = {
           id: crypto.randomUUID(),
           type: 'update',
           expense: updatedExpense,
           oldExpense: oldExpense,
           timestamp: new Date().toISOString()
        };
        setActivities(prev => mergeAndDedupeActivities(prev, [newActivity]));
      }

      const wasUpdatedLocally = recentlyUpdatedIds.current.has(updatedExpense.id);
      setExpenses(prevExpenses =>
        prevExpenses.map(expense =>
          expense.id === updatedExpense.id ? updatedExpense : expense
        )
      );
      if (!wasUpdatedLocally) {
        setToastInfo({ message: `${updatedExpense.user} a modifié "${updatedExpense.description}".`, type: 'info' });
      }
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

            if (expenseToDelete.user !== user) {
                const newActivity: Activity = {
                    id: crypto.randomUUID(),
                    type: 'delete',
                    expense: {
                        id: expenseToDelete.id,
                        user: expenseToDelete.user,
                        date: expenseToDelete.date,
                        description: expenseToDelete.description,
                        amount: expenseToDelete.amount,
                        category: expenseToDelete.category,
                    },
                    timestamp: new Date().toISOString()
                };
                setActivities(prev => mergeAndDedupeActivities(prev, [newActivity]));
            }

            return prevExpenses.filter(expense => expense.id !== deletedPayload.id);
        });
    };

    const handleReminderChange = (payload: any) => {
      if (payload.eventType === 'DELETE') {
        const deletedReminder = payload.old as Partial<Reminder>;
        if (deletedReminder && deletedReminder.id) {
          setReminders(prev => prev.filter(r => r.id !== deletedReminder.id));
        }
        return;
      }

      const changedReminder = payload.new as Reminder;
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

    const allChangesChannel = supabase
      .channel('all-changes-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses' }, handleExpenseInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'expenses' }, handleExpenseUpdate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'expenses' }, handleExpenseDelete)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, handleReminderChange)
      .subscribe((status, err) => {
        switch (status) {
          case 'SUBSCRIBED':
            setRealtimeStatus('SUBSCRIBED');
            console.log('Real-time channel connected. Syncing data...');
            syncData(true);
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
  }, [highlightExpense, user, setActivities, syncData, mergeAndDedupeActivities]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    
    recentlyAddedIds.current.add(newId);
    setTimeout(() => {
        recentlyAddedIds.current.delete(newId);
    }, 5000);

    const expenseData = {
        ...expense,
        id: newId,
        date: new Date().toISOString(),
    };

    const optimisticExpense: Expense = {
        ...expenseData,
        created_at: new Date().toISOString(),
    };
    setExpenses(prev => [optimisticExpense, ...prev]);
    highlightExpense(newId);

    const { error } = await supabase
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

    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setExpenseToEdit(null);
    highlightExpense(updatedExpense.id);

    const timerId = window.setTimeout(() => {
        _performUpdate(updatedExpense);
        setUndoableAction(null);
    }, 7000);

    setUndoableAction({ type: 'update', expense: updatedExpense, originalExpense, timerId });
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const reminderData = {
        ...reminder,
        id: newId,
    };

    const optimisticReminder: Reminder = {
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

  const updateReminder = async (updatedReminder: Reminder) => {
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
  
  const searchedExpenses = useMemo(() => {
    if (!searchTerm) return filteredExpenses;
    return filteredExpenses.filter(e =>
      e.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredExpenses, searchTerm]);

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
    await syncData(true);
    setToastInfo({ message: 'Données mises à jour !', type: 'info' });
    setIsRefreshing(false);
  };
  
  const handlePayReminder = (reminder: Reminder) => {
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

  const deleteActivity = useCallback((activityId: string) => {
    setActivities(prevActivities => prevActivities.filter(act => act.id !== activityId));
  }, [setActivities]);

  const handleUndo = useCallback(() => {
    if (!undoableAction) return;

    clearTimeout(undoableAction.timerId);

    if (undoableAction.type === 'delete') {
        setExpenses(prev => [...prev, undoableAction.expense].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        highlightExpense(undoableAction.expense.id);
    } else if (undoableAction.type === 'update' && undoableAction.originalExpense) {
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

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'analysis', label: 'Analyse' },
    { id: 'yearly', label: 'Annuel' },
    { id: 'history', label: 'Historique' },
  ] as const;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
      <PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh}>
        <Header 
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onLogout={onLogout}
          loggedInUser={user}
          activityItems={activityItemsForHeader}
          unreadCount={unreadCount}
          onMarkAsRead={markActivitiesAsRead}
          realtimeStatus={realtimeStatus}
          onDeleteActivity={deleteActivity}
          onlineUsers={onlineUsers}
        />

        <main className="container mx-auto p-4 md:p-8">
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

          <div className="border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                   {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                          ${activeTab === tab.id
                            ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
              </nav>
          </div>
          
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
                       <input
                          type="text"
                          placeholder="Filtrer les dépenses du mois..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 mb-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        />
                      <ExpenseList 
                        expenses={searchedExpenses} 
                        onExpenseClick={setExpenseToView} 
                        highlightedIds={highlightedExpenseIds} 
                      />
                    </div>
                </div>
              </div>
            )}
            {activeTab === 'analysis' && <CategoryTotals expenses={analysisExpenses} previousMonthExpenses={previousMonthExpenses} last3MonthsExpenses={last3MonthsExpenses} />}
            {activeTab === 'yearly' && <YearlySummary expenses={yearlyFilteredExpenses} previousYearExpenses={previousYearFilteredExpenses} year={currentYear} />}
            {activeTab === 'history' && (
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-lg animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Historique Complet</h2>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            {expenses.length} transactions
                        </div>
                    </div>
                    <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                        <GroupedExpenseList
                            expenses={expenses}
                            onExpenseClick={setExpenseToView}
                            highlightedIds={highlightedExpenseIds}
                        />
                    </div>
                </div>
            )}
          </div>
        </main>
      </PullToRefresh>

      {/* Detail Modal (View) */}
      {expenseToView && (
          <ExpenseDetailModal
            expense={expenseToView}
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
