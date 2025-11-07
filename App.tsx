
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { type Expense, User, type Reminder } from './types';
import Header from './components/Header';
import ExpenseForm from './components/ExpenseForm';
import ExpenseSummary from './components/ExpenseSummary';
import ExpenseList from './components/ExpenseList';
import CategoryTotals from './components/CategoryChart';
import EditExpenseModal from './components/EditExpenseModal';
import Toast from './components/Toast';
import YearlySummary from './components/YearlySummary';
import GroupedExpenseList from './components/GroupedExpenseList';
import ReminderAlerts from './components/ReminderAlerts';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './hooks/useTheme';
import OfflineIndicator from './components/OfflineIndicator';
import ConfigurationError from './components/ConfigurationError';

const parseUserAgent = (): string => {
    const ua = navigator.userAgent;
    let browser = 'Navigateur inconnu';
    let os = 'OS inconnu';
    let deviceType = 'Desktop';

    // Détection du type d'appareil
    if (/Mobi|Android|iPhone/.test(ua)) {
        deviceType = 'Mobile';
    } else if (/Tablet|iPad/.test(ua)) {
        deviceType = 'Tablet';
    }

    // Détection de l'OS
    if (/Windows NT/.test(ua)) os = 'Windows';
    else if (/Macintosh/.test(ua)) os = 'macOS';
    else if (/iPhone/.test(ua)) os = 'iPhone';
    else if (/iPad/.test(ua)) os = 'iPad';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Linux/.test(ua)) os = 'Linux';
    
    // Pour les appareils Apple, différencier Mac de iPhone/iPad
    if (os === 'macOS' && 'ontouchend' in document) {
        // Cela pourrait être un Mac avec écran tactile, mais il est plus probable que ce soit une erreur
        // si l'UA est générique. On garde macOS.
    } else if (/Macintosh/.test(ua) && deviceType !== 'Desktop') {
       // Si l'UA contient Macintosh mais est détecté comme mobile/tablette, c'est probablement un iPad.
       os = 'iPadOS';
       deviceType = 'Tablet';
    }


    // Détection du navigateur
    if (/Firefox/.test(ua)) browser = 'Firefox';
    else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
    else if (/Opera|OPR/.test(ua)) browser = 'Opera';
    else if (/Trident/.test(ua)) browser = 'Internet Explorer';
    else if (/Edg/.test(ua)) browser = 'Edge'; // "Edg" est plus fiable pour Edge Chromium
    else if (/Chrome/.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    
    return `${browser} sur ${os} (${deviceType})`;
};

const App: React.FC = () => {
  if (!isSupabaseConfigured) {
    return <ConfigurationError />;
  }
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getUTCMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getUTCFullYear());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'yearly' | 'search'>('dashboard');
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [toastInfo, setToastInfo] = useState<{ message: string; type: 'info' | 'error' } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize theme
  useTheme();

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase!
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error.message || error);
      setToastInfo({ message: "Erreur lors de la récupération des dépenses.", type: 'error' });
    } else if (data) {
      setExpenses(data);
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    const { data, error } = await supabase!
        .from('reminders')
        .select('*')
        .order('day_of_month', { ascending: true });

    if (error) {
        console.error('Error fetching reminders:', error.message || error);
        setToastInfo({ message: "Erreur lors de la récupération des rappels.", type: 'error' });
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
    const expensesChannel = supabase!
      .channel('expenses-realtime')
      // FIX: Removed generic type argument `<Expense>` to resolve TypeScript error
      // "Untyped function calls may not accept type arguments".
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          // FIX: Added `as Expense` type assertion since the payload is now implicitly `any`.
          const newExpense = payload.new as Expense;
          setExpenses(prevExpenses => {
            if (prevExpenses.some(e => e.id === newExpense.id)) {
                return prevExpenses.map(e => e.id === newExpense.id ? newExpense : e);
            }
            
            setToastInfo({
              message: `${newExpense.user} a ajouté : ${newExpense.description} (${newExpense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`,
              type: 'info'
            });
            return [newExpense, ...prevExpenses];
          });
        }
      )
      // FIX: Removed generic type argument `<Expense>` to resolve TypeScript error
      // "Untyped function calls may not accept type arguments".
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses' },
        (payload) => {
          // FIX: Added `as Expense` type assertion since the payload is now implicitly `any`.
          const updatedExpense = payload.new as Expense;
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
      // FIX: Removed generic type argument `<Expense>` to resolve TypeScript error
      // "Untyped function calls may not accept type arguments".
      .on(
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

    const remindersChannel = supabase!
      .channel('reminders-realtime')
      // FIX: Removed generic type argument `<Reminder>` to resolve TypeScript error
      // "Untyped function calls may not accept type arguments".
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        (payload) => {
            const newReminder = payload.new as Reminder;
            if (newReminder) {
                setReminders(prev => {
                    const existingIndex = prev.findIndex(r => r.id === newReminder.id);
                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = newReminder;
                        return updated;
                    }
                    return [...prev, newReminder].sort((a,b) => a.day_of_month - b.day_of_month);
                });
            } else {
                fetchReminders();
            }
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(expensesChannel);
      supabase!.removeChannel(remindersChannel);
    };
  }, [fetchReminders, fetchExpenses]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const expenseData = {
        ...expense,
        id: newId,
        date: new Date().toISOString(),
        user_agent: parseUserAgent(),
    };

    const optimisticExpense: Expense = {
        ...expenseData,
        created_at: new Date().toISOString(),
    };
    setExpenses(prev => [optimisticExpense, ...prev]);

    const { error } = await supabase!
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de l'ajout de la dépense.", type: 'error' });
      setExpenses(prev => prev.filter(e => e.id !== newId));
    }
  };

  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    setExpenses(prev => prev.filter(e => e.id !== id));

    const { error } = await supabase!.from('expenses').delete().eq('id', id);
    
    if (error) {
      console.error('Error deleting expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de la suppression.", type: 'error' });
      setExpenses(prev => [...prev, expenseToDelete]);
    }
  };
  
  const updateExpense = async (updatedExpense: Expense) => {
    const originalExpense = expenses.find(e => e.id === updatedExpense.id);
    if (!originalExpense) return;

    const expenseWithUserAgent = {
        ...updatedExpense,
        user_agent: parseUserAgent(),
    };

    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? expenseWithUserAgent : e));
    setExpenseToEdit(null);

    const { id, created_at, ...updatePayload } = expenseWithUserAgent;
    const { error } = await supabase!.from('expenses').update(updatePayload).eq('id', id);
      
    if (error) {
      console.error('Error updating expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de la mise à jour.", type: 'error' });
      setExpenses(prev => prev.map(e => e.id === originalExpense.id ? originalExpense : e));
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const reminderData = {
        ...reminder,
        id: newId,
        user_agent: parseUserAgent(),
    };

    const optimisticReminder: Reminder = {
        ...reminderData,
        created_at: new Date().toISOString(),
    };
    setReminders(prev => [...prev, optimisticReminder].sort((a,b) => a.day_of_month - b.day_of_month));

    const { error } = await supabase!
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
    
    const reminderWithUserAgent = {
        ...updatedReminder,
        user_agent: parseUserAgent(),
    };

    setReminders(prev => prev.map(r => r.id === updatedReminder.id ? reminderWithUserAgent : r).sort((a,b) => a.day_of_month - b.day_of_month));

    const { id, created_at, ...updatePayload } = reminderWithUserAgent;
    const { error } = await supabase!.from('reminders').update(updatePayload).eq('id', id);

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

    const { error } = await supabase!.from('reminders').delete().eq('id', id);
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

  const yearlyFilteredExpenses = useMemo(() => {
    return expenses.filter(expense => new Date(expense.date).getUTCFullYear() === currentYear);
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

  const globalSearchedExpenses = useMemo(() => {
    if (!globalSearchTerm) return [];
    return expenses.filter(e =>
      e.description.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      e.amount.toString().includes(globalSearchTerm) ||
      e.category.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      e.user.toLowerCase().includes(globalSearchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, globalSearchTerm]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
      if (direction === 'next') {
        if (currentMonth === 11) {
          setCurrentMonth(0);
          setCurrentYear(prev => prev + 1);
        } else {
          setCurrentMonth(prev => prev + 1);
        }
      } else {
        if (currentMonth === 0) {
          setCurrentMonth(11);
          setCurrentYear(prev => prev - 1);
        } else {
          setCurrentMonth(prev => prev - 1);
        }
      }
  };

  const currentMonthName = useMemo(() => {
    return new Date(Date.UTC(currentYear, currentMonth)).toLocaleString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }, [currentMonth, currentYear]);

  const handleRefresh = async () => {
    setToastInfo({ message: 'Synchronisation en cours...', type: 'info' });
    await Promise.all([fetchExpenses(), fetchReminders()]);
    setToastInfo({ message: 'Données mises à jour !', type: 'info' });
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="text-center">
                <p className="text-xl font-semibold text-slate-600 dark:text-slate-300">Chargement des données...</p>
            </div>
        </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'analysis', label: 'Analyse' },
    { id: 'yearly', label: 'Annuel' },
    { id: 'search', label: 'Recherche' }
  ] as const;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
      <Header 
        onSetToast={setToastInfo} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={handleRefresh}
      />

      <main className="container mx-auto p-4 md:p-8">
        {activeTab !== 'search' && (
          <div className="flex justify-between items-center mb-6 animate-fade-in-up">
            <button onClick={() => handleMonthChange('prev')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 text-center capitalize">{currentMonthName}</h2>
            <button onClick={() => handleMonthChange('next')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
        
        <ReminderAlerts 
          reminders={reminders}
          monthlyExpenses={filteredExpenses}
          onAddExpense={addExpense}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />

        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
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
              <div className="space-y-8">
                <ExpenseForm onAddExpense={addExpense} expenses={expenses} />
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
                    <ExpenseList expenses={searchedExpenses} onEditExpense={setExpenseToEdit} />
                  </div>
              </div>
            </div>
          )}
          {activeTab === 'analysis' && <CategoryTotals expenses={filteredExpenses} />}
          {activeTab === 'yearly' && <YearlySummary expenses={yearlyFilteredExpenses} previousYearExpenses={previousYearFilteredExpenses} year={currentYear} />}
          {activeTab === 'search' && (
             <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Recherche globale</h2>
              <input
                type="text"
                placeholder="Rechercher dans toutes les dépenses..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="w-full px-3 py-2 mb-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              />
              {globalSearchTerm && (
                <GroupedExpenseList expenses={globalSearchedExpenses} onEditExpense={setExpenseToEdit} />
              )}
             </div>
          )}
        </div>
      </main>
      
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
      <OfflineIndicator />
    </div>
  );
};

export default App;