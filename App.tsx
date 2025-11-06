import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import GroupedExpenseList from './components/GroupedExpenseList';
import ReminderAlerts from './components/ReminderAlerts';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
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

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const expensesChannel = supabase
      .channel('expenses-realtime')
      .on<Expense>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const newExpense = payload.new;
          setExpenses(prevExpenses => {
            // Empêche les doublons si l'événement arrive pour un ajout déjà optimiste
            if (prevExpenses.some(e => e.id === newExpense.id)) {
                // Remplace l'élément optimiste par la version de la BDD
                return prevExpenses.map(e => e.id === newExpense.id ? newExpense : e);
            }
            
            // Ajout depuis un autre client
            setToastInfo({
              message: `${newExpense.user} a ajouté : ${newExpense.description} (${newExpense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`,
              type: 'info'
            });
            return [newExpense, ...prevExpenses];
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
        (payload) => {
            // Pour les rappels, un simple re-fetch est suffisant et fiable.
            const newReminder = payload.new as Reminder;
            if (newReminder) {
                // Remplacement optimiste pour une meilleure UX
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
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(remindersChannel);
    };
  }, [fetchReminders, fetchExpenses]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const expenseData = {
        ...expense,
        id: newId,
        date: new Date().toISOString(),
    };

    // Mise à jour optimiste de l'UI
    const optimisticExpense: Expense = {
        ...expenseData,
        created_at: new Date().toISOString(),
    };
    setExpenses(prev => [optimisticExpense, ...prev]);

    const { error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de l'ajout de la dépense.", type: 'error' });
      // Rollback en cas d'erreur
      setExpenses(prev => prev.filter(e => e.id !== newId));
    }
  };

  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    // Mise à jour optimiste de l'UI
    setExpenses(prev => prev.filter(e => e.id !== id));

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    
    if (error) {
      console.error('Error deleting expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de la suppression.", type: 'error' });
      // Rollback en cas d'erreur
      setExpenses(prev => [...prev, expenseToDelete]);
    }
  };
  
  const updateExpense = async (updatedExpense: Expense) => {
    const originalExpense = expenses.find(e => e.id === updatedExpense.id);
    if (!originalExpense) return;

    // Mise à jour optimiste de l'UI
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setExpenseToEdit(null);

    const { id, created_at, ...updatePayload } = updatedExpense;
    const { error } = await supabase.from('expenses').update(updatePayload).eq('id', id);
      
    if (error) {
      console.error('Error updating expense:', error.message || error);
      setToastInfo({ message: "Erreur lors de la mise à jour.", type: 'error' });
      // Rollback en cas d'erreur
      setExpenses(prev => prev.map(e => e.id === originalExpense.id ? originalExpense : e));
    }
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

    // Mise à jour optimiste
    setReminders(prev => prev.map(r => r.id === updatedReminder.id ? updatedReminder : r).sort((a,b) => a.day_of_month - b.day_of_month));

    const { id, created_at, ...updatePayload } = updatedReminder;
    const { error } = await supabase.from('reminders').update(updatePayload).eq('id', id);

    if (error) {
        console.error('Error updating reminder:', error.message || error);
        setToastInfo({ message: "Erreur lors de la mise à jour du rappel.", type: 'error' });
        // Rollback
        setReminders(prev => prev.map(r => r.id === originalReminder.id ? originalReminder : r).sort((a,b) => a.day_of_month - b.day_of_month));
    }
  };

  const deleteReminder = async (id: string) => {
    const reminderToDelete = reminders.find(r => r.id === id);
    if (!reminderToDelete) return;
    
    // Mise à jour optimiste
    setReminders(prev => prev.filter(r => r.id !== id));

    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) {
        console.error('Error deleting reminder:', error.message || error);
        setToastInfo({ message: "Erreur lors de la suppression du rappel.", type: 'error' });
        // Rollback
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
        <div className="flex justify-center items-center min-h-screen bg-slate-100">
            <div className="text-center">
                <p className="text-xl font-semibold text-slate-600">Chargement des données...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <Header 
        onSetToast={setToastInfo} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={handleRefresh}
      />

      <main className="container mx-auto p-4 md:p-8">
        {activeTab !== 'search' && (
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => handleMonthChange('prev')} className="px-4 py-2 bg-white rounded-lg shadow hover:bg-slate-50 transition-colors">&lt; Préc.</button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-700 text-center capitalize">{currentMonthName}</h2>
            <button onClick={() => handleMonthChange('next')} className="px-4 py-2 bg-white rounded-lg shadow hover:bg-slate-50 transition-colors">Suiv. &gt;</button>
          </div>
        )}
        
        <ReminderAlerts 
          reminders={reminders}
          monthlyExpenses={filteredExpenses}
          onAddExpense={addExpense}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />

        <div className="flex justify-center mb-6 bg-slate-200 p-1 rounded-lg">
          {(['dashboard', 'analysis', 'yearly', 'search'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full md:w-auto md:px-6 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-white text-cyan-600 shadow' : 'text-slate-600 hover:bg-slate-300'}`}
            >
              {tab === 'dashboard' ? 'Tableau de bord' : tab === 'analysis' ? 'Analyse' : tab === 'yearly' ? 'Annuel' : 'Recherche'}
            </button>
          ))}
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
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Dépenses du mois</h2>
                     <input
                        type="text"
                        placeholder="Filtrer les dépenses du mois..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 mb-4 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      />
                    <ExpenseList expenses={searchedExpenses} onEditExpense={setExpenseToEdit} />
                  </div>
              </div>
            </div>
          )}
          {activeTab === 'analysis' && <CategoryTotals expenses={filteredExpenses} />}
          {activeTab === 'yearly' && <YearlySummary expenses={yearlyFilteredExpenses} previousYearExpenses={previousYearFilteredExpenses} year={currentYear} />}
          {activeTab === 'search' && (
             <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-4">Recherche globale</h2>
              <input
                type="text"
                placeholder="Rechercher dans toutes les dépenses..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="w-full px-3 py-2 mb-4 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
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
    </div>
  );
};

export default App;