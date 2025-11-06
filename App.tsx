import React, { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import { supabase } from './supabase/client';
import { type Expense, User, type Reminder } from './types';
import Header from './components/Header';
import ExpenseForm from './components/ExpenseForm';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseList from './components/ExpenseList';
import CategoryTotals from './components/CategoryChart';
import EditExpenseModal from './components/EditExpenseModal';
import Toast from './components/Toast';
import YearlySummary from './components/YearlySummary';
import PullToRefresh from './components/PullToRefresh';
import GroupedExpenseList from './components/GroupedExpenseList';
import ReminderAlerts from './components/ReminderAlerts';
import SettingsModal from './components/SettingsModal';

// FIX: Define types for the Background Sync API (`SyncManager`) to resolve
// the TypeScript error on `sw.sync.register`. This provides type safety for
// this browser feature.
interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
    sync: SyncManager;
}

// --- Helpers pour le mode hors ligne (IndexedDB) ---
const DB_NAME = 'suivi-depenses-db';
const STORE_NAME = 'sync-queue';
const DB_VERSION = 1;

interface QueuedMutation {
    id?: number;
    type: 'add' | 'update' | 'delete';
    table: 'expenses' | 'reminders';
    payload: any;
    timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function queueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
        const req = store.add({ ...mutation, timestamp: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function registerSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
            const sw = await navigator.serviceWorker.ready;
            // FIX: Cast the ServiceWorkerRegistration to our augmented type
            // to access the 'sync' property for Background Sync, resolving the
            // TypeScript error.
            await (sw as ServiceWorkerRegistrationWithSync).sync.register('sync-expenses');
            console.log('Sync registered');
        } catch (error) {
            console.error('Failed to register sync:', error);
        }
    }
}
// --- Fin des helpers ---


const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getUTCMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getUTCFullYear());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'yearly' | 'search'>('dashboard');
  const [isPending, startTransition] = useTransition();
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [toastInfo, setToastInfo] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        setToastInfo({ message: 'Vous êtes de retour en ligne !', type: 'info' });
    };
    const handleOffline = () => {
        setIsOnline(false);
        setToastInfo({ message: 'Vous êtes maintenant hors ligne. Les modifications seront synchronisées plus tard.', type: 'info' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error.message || error);
      if (navigator.onLine) {
        setToastInfo({ message: "Erreur lors de la récupération des dépenses.", type: 'error' });
      }
    } else if (data) {
      setExpenses(data);
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('day_of_month', { ascending: true });

    if (error) {
        console.error('Error fetching reminders:', error.message || error);
         if (navigator.onLine) {
            setToastInfo({ message: "Erreur lors de la récupération des rappels.", type: 'error' });
         }
    } else if (data) {
        setReminders(data);
    }
  }, []);


  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchExpenses(), fetchReminders()]);
        setIsLoading(false);
    };
    fetchData();
  }, [fetchExpenses, fetchReminders]);

  useEffect(() => {
    const handleSyncMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE_DATA') {
            const { payload } = event.data;
            setToastInfo({ message: 'Données synchronisées avec succès !', type: 'info' });

            if (payload.added.expenses.length > 0) {
                setExpenses(prev => {
                    let newExpensesState = [...prev];
                    for (const syncedExpense of payload.added.expenses) {
                        if (newExpensesState.some(e => e.id === syncedExpense.id)) {
                            continue;
                        }
                        const offlineIndex = newExpensesState.findIndex(e =>
                            e.isOffline &&
                            e.description === syncedExpense.description &&
                            e.amount === syncedExpense.amount &&
                            e.user === syncedExpense.user
                        );
                        if (offlineIndex !== -1) {
                            newExpensesState[offlineIndex] = syncedExpense;
                        } else {
                            newExpensesState.unshift(syncedExpense);
                        }
                    }
                    return newExpensesState;
                });
            }
            
            if (payload.updatedOrDeleted.expenses) {
                fetchExpenses();
            }

            if (payload.added.reminders.length > 0) {
                setReminders(prev => {
                    let newRemindersState = [...prev];
                    for (const syncedReminder of payload.added.reminders) {
                        if (newRemindersState.some(r => r.id === syncedReminder.id)) {
                            continue;
                        }
                        const offlineIndex = newRemindersState.findIndex(r =>
                            r.isOffline && r.description === syncedReminder.description && r.amount === syncedReminder.amount
                        );
                        if (offlineIndex !== -1) {
                            newRemindersState[offlineIndex] = syncedReminder;
                        } else {
                            newRemindersState.unshift(syncedReminder);
                        }
                    }
                    return newRemindersState.sort((a,b) => a.day_of_month - b.day_of_month);
                });
            }

            if (payload.updatedOrDeleted.reminders) {
                fetchReminders();
            }
        }
    };
    navigator.serviceWorker.addEventListener('message', handleSyncMessage);

    const expensesChannel = supabase
      .channel('expenses-realtime')
      .on<Expense>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const newExpense = payload.new;
          setExpenses(prevExpenses => {
            if (prevExpenses.some(e => e.id === newExpense.id)) {
              return prevExpenses;
            }
            const offlineIndex = prevExpenses.findIndex(e =>
              e.isOffline &&
              e.description === newExpense.description &&
              e.amount === newExpense.amount &&
              e.user === newExpense.user &&
              e.category === newExpense.category
            );
            if (offlineIndex !== -1) {
              const updatedExpenses = [...prevExpenses];
              updatedExpenses[offlineIndex] = newExpense;
              setToastInfo({ message: `Dépense synchronisée : ${newExpense.description}`, type: 'info' });
              return updatedExpenses;
            } else {
              setToastInfo({
                message: `${newExpense.user} a ajouté : ${newExpense.description} (${newExpense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`,
                type: 'info'
              });
              return [newExpense, ...prevExpenses];
            }
          });
        }
      )
      .on<Expense>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses' },
        (payload) => {
          const updatedExpense = payload.new;
          setExpenses(prevExpenses =>
            prevExpenses.map(expense =>
              expense.id === updatedExpense.id ? updatedExpense : expense
            )
          );
           setToastInfo({
              message: `Dépense "${updatedExpense.description}" mise à jour.`,
              type: 'info'
            });
        }
      )
      .on<Expense>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        (payload) => {
          const deletedExpense = payload.old as Partial<Expense>;
          if (deletedExpense && deletedExpense.id) {
              setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== deletedExpense.id));
              const desc = deletedExpense.description || 'une dépense';
              setToastInfo({
                  message: `Dépense "${desc}" supprimée.`,
                  type: 'info'
              });
          }
        }
      )
      .subscribe();

    const remindersChannel = supabase
      .channel('reminders-realtime')
      .on<Reminder>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(remindersChannel);
      navigator.serviceWorker.removeEventListener('message', handleSyncMessage);
    };
  }, [fetchReminders, fetchExpenses]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => {
    if (!isOnline) {
      const expenseToQueue = { ...expense, date: new Date().toISOString() };
      const tempExpenseForUI: Expense = {
        ...expenseToQueue,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        isOffline: true,
      };
      setExpenses(prev => [tempExpenseForUI, ...prev]);
      await queueMutation({ type: 'add', table: 'expenses', payload: expenseToQueue });
      await registerSync();
      setToastInfo({ message: "Mode hors ligne: Dépense mise en attente.", type: 'info' });
      return;
    }

    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert({ ...expense, date: new Date().toISOString() })
      .select()
      .single();
      
    if (error) {
      console.error('Error adding expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de l'ajout de la dépense.", type: 'error' });
    }
  };

  const deleteExpense = async (id: string) => {
    if (!isOnline) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        await queueMutation({ type: 'delete', table: 'expenses', payload: { id } });
        await registerSync();
        setToastInfo({ message: "Mode hors ligne: Suppression mise en attente.", type: 'info' });
        return;
    }
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Error deleting expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de la suppression.", type: 'error' });
    }
  };
  
  const updateExpense = async (updatedExpense: Expense) => {
    const { isOffline, ...expenseToUpdate } = updatedExpense;

    if (!isOnline) {
        setExpenses(prev => prev.map(e => e.id === expenseToUpdate.id ? { ...expenseToUpdate, isOffline: true } : e));
        await queueMutation({ type: 'update', table: 'expenses', payload: expenseToUpdate });
        await registerSync();
        setToastInfo({ message: "Mode hors ligne: Modification mise en attente.", type: 'info' });
        setExpenseToEdit(null);
        return;
    }
    
    const { id, created_at, ...updatePayload } = expenseToUpdate;
    const { error } = await supabase.from('expenses').update(updatePayload).eq('id', id);
      
    if (error) {
      console.error('Error updating expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de la mise à jour.", type: 'error' });
    }
    setExpenseToEdit(null);
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'created_at'>) => {
    if (!isOnline) {
        const reminderToQueue = { ...reminder };
        const tempReminderForUI: Reminder = {
            ...reminderToQueue,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            isOffline: true,
        };
        setReminders(prev => [...prev, tempReminderForUI].sort((a,b) => a.day_of_month - b.day_of_month));
        await queueMutation({ type: 'add', table: 'reminders', payload: reminderToQueue });
        await registerSync();
        setToastInfo({ message: "Mode hors ligne: Rappel mis en attente.", type: 'info' });
        return;
    }

    const { error } = await supabase.from('reminders').insert(reminder);
    if (error) {
        console.error('Error adding reminder:', error.message || error);
        setToastInfo({ message: "Erreur lors de l'ajout du rappel.", type: 'error' });
    } else {
        setToastInfo({ message: "Rappel ajouté avec succès.", type: 'info' });
    }
  };

  const updateReminder = async (updatedReminder: Reminder) => {
      const { isOffline, ...reminderToUpdate } = updatedReminder;
      if (!isOnline) {
        setReminders(prev => prev.map(r => r.id === reminderToUpdate.id ? { ...reminderToUpdate, isOffline: true } : r));
        await queueMutation({ type: 'update', table: 'reminders', payload: reminderToUpdate });
        await registerSync();
        setToastInfo({ message: "Mode hors ligne: Modification du rappel mise en attente.", type: 'info' });
        return;
      }

      const { id, created_at, ...updatePayload } = reminderToUpdate;
      const { error } = await supabase.from('reminders').update(updatePayload).eq('id', id);
      if (error) {
          console.error('Error updating reminder:', error.message || error);
          setToastInfo({ message: "Erreur lors de la mise à jour du rappel.", type: 'error' });
      }
  };

  const deleteReminder = async (id: string) => {
      if (!isOnline) {
        setReminders(prev => prev.filter(r => r.id !== id));
        await queueMutation({ type: 'delete', table: 'reminders', payload: { id } });
        await registerSync();
        setToastInfo({ message: "Mode hors ligne: Suppression du rappel mise en attente.", type: 'info' });
        return;
      }

      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) {
          console.error('Error deleting reminder:', error.message || error);
          setToastInfo({ message: "Erreur lors de la suppression du rappel.", type: 'error' });
      }
  };

  const handleTabChange = (tab: 'dashboard' | 'analysis' | 'yearly' | 'search') => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesMonth = expenseDate.getUTCMonth() === currentMonth && expenseDate.getUTCFullYear() === currentYear;
      if (!matchesMonth) return false;
      
      if (!searchTerm) return true;

      return expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [expenses, currentMonth, currentYear, searchTerm]);

  const globalFilteredExpenses = useMemo(() => {
    if (globalSearchTerm.trim().length < 2) {
        return [];
    }
    return expenses.filter(expense =>
        expense.description.toLowerCase().includes(globalSearchTerm.toLowerCase())
    );
  }, [expenses, globalSearchTerm]);

  const yearlyExpenses = useMemo(() => {
    return expenses.filter(expense => new Date(expense.date).getFullYear() === currentYear);
  }, [expenses, currentYear]);

  const previousYearlyExpenses = useMemo(() => {
    return expenses.filter(expense => new Date(expense.date).getFullYear() === currentYear - 1);
  }, [expenses, currentYear]);

  const sophieTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => e.user === User.Sophie)
      .reduce((total, expense) => total + expense.amount, 0);
  }, [filteredExpenses]);

  const vincentTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => e.user === User.Vincent)
      .reduce((total, expense) => total + expense.amount, 0);
  }, [filteredExpenses]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
      const date = new Date(Date.UTC(currentYear, currentMonth, 1));
      if (direction === 'next') {
          date.setUTCMonth(date.getUTCMonth() + 1);
      } else {
          date.setUTCMonth(date.getUTCMonth() - 1);
      }
      setCurrentMonth(date.getUTCMonth());
      setCurrentYear(date.getUTCFullYear());
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setCurrentYear(prevYear => direction === 'next' ? prevYear + 1 : prevYear - 1);
  };
  
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchExpenses(), fetchReminders()]);
    setToastInfo({ message: 'Données actualisées !', type: 'info' });
  }, [fetchExpenses, fetchReminders]);

  const monthName = new Date(Date.UTC(currentYear, currentMonth)).toLocaleString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header onSetToast={setToastInfo} onOpenSettings={() => setIsSettingsOpen(true)} />
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="container mx-auto p-4 md:p-8">
          <div className="mb-8 border-b border-slate-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`${
                  activeTab === 'dashboard'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => handleTabChange('analysis')}
                className={`${
                  activeTab === 'analysis'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
                aria-current={activeTab === 'analysis' ? 'page' : undefined}
              >
                Analyse
              </button>
              <button
                onClick={() => handleTabChange('yearly')}
                className={`${
                  activeTab === 'yearly'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
                aria-current={activeTab === 'yearly' ? 'page' : undefined}
              >
                Annuel
              </button>
              <button
                onClick={() => handleTabChange('search')}
                className={`${
                  activeTab === 'search'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
                aria-current={activeTab === 'search' ? 'page' : undefined}
              >
                Recherche
              </button>
            </nav>
          </div>

          {activeTab === 'dashboard' && (
            <div key="dashboard" className="animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                  <ReminderAlerts
                    reminders={reminders}
                    monthlyExpenses={filteredExpenses}
                    onAddExpense={addExpense}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                  />
                  <ExpenseForm onAddExpense={addExpense} expenses={expenses} />
                  <ExpenseSummary 
                    allExpenses={expenses} 
                    currentMonth={currentMonth} 
                    currentYear={currentYear}
                    sophieTotalMonth={sophieTotal}
                    vincentTotalMonth={vincentTotal}
                  />
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="flex justify-between items-center mb-4">
                          <button onClick={() => handleMonthChange('prev')} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Mois précédent">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <h2 className="text-xl font-bold text-center capitalize">{monthName}</h2>
                          <button onClick={() => handleMonthChange('next')} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Mois suivant">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                      </div>
                      <div className="relative mb-4">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                        <input
                            type="search"
                            placeholder="Rechercher une dépense..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        />
                      </div>
                      {isLoading ? (
                        <div className="text-center py-10">
                          <p className="text-slate-500">Chargement des dépenses...</p>
                        </div>
                      ) : (
                        <ExpenseList expenses={filteredExpenses} onEditExpense={setExpenseToEdit} />
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div key="analysis" className="animate-fade-in-up">
              <div className="max-w-4xl mx-auto">
                <CategoryTotals expenses={filteredExpenses} />
              </div>
            </div>
          )}

          {activeTab === 'yearly' && (
            <div key="yearly" className="animate-fade-in-up">
              <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <button onClick={() => handleYearChange('prev')} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Année précédente">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-bold text-center">{currentYear}</h2>
                    <button onClick={() => handleYearChange('next')} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Année suivante">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                <YearlySummary expenses={yearlyExpenses} previousYearExpenses={previousYearlyExpenses} year={currentYear} />
              </div>
            </div>
          )}
          
          {activeTab === 'search' && (
            <div key="search" className="animate-fade-in-up">
              <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Rechercher dans toutes les dépenses</h2>
                <div className="relative mb-6">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Rechercher par description (ex: McDo, Loyer...)"
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    autoFocus
                  />
                </div>
                
                {globalSearchTerm.trim().length < 2 && (
                    <div className="text-center py-10">
                        <p className="text-slate-500">Commencez à taper pour rechercher dans toutes vos dépenses.</p>
                    </div>
                )}
                
                {globalSearchTerm.trim().length >= 2 && globalFilteredExpenses.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-slate-500">Aucune dépense trouvée pour "{globalSearchTerm}".</p>
                    </div>
                )}
                
                {globalFilteredExpenses.length > 0 && (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <GroupedExpenseList 
                            expenses={globalFilteredExpenses}
                            onEditExpense={setExpenseToEdit}
                        />
                    </div>
                )}
              </div>
            </div>
          )}
        </main>
      </PullToRefresh>

      {expenseToEdit && (
        <EditExpenseModal 
          expense={expenseToEdit}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
          onClose={() => setExpenseToEdit(null)}
        />
      )}
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}
       <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        reminders={reminders}
        onAddReminder={addReminder}
        onUpdateReminder={updateReminder}
        onDeleteReminder={deleteReminder}
      />
    </div>
  );
};

export default App;
