import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabase/client';
import { type Expense, User } from './types';
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

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'yearly' | 'search'>('dashboard');
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [toastInfo, setToastInfo] = useState<{ message: string; type: 'info' | 'error' } | null>(null);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
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
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addExpense = async (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => {
    const newExpense: Omit<Expense, 'id' | 'created_at'> = {
      ...expense,
      date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(newExpense)
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error.message || error);
    } else if (data) {
      // L'état est mis à jour localement pour la réactivité, 
      // et le broadcast Supabase mettra à jour les autres clients.
      setExpenses(prevExpenses => [data, ...prevExpenses]);
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error.message || error);
    } else {
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
    }
  };
  
  const updateExpense = async (updatedExpense: Expense) => {
    const { id, created_at, ...updatePayload } = updatedExpense;
    
    const { data, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating expense:', error.message || error);
    } else if (data) {
      setExpenses(prevExpenses =>
        prevExpenses.map(expense =>
          expense.id === data.id ? data : expense
        )
      );
    }
    setExpenseToEdit(null);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesMonth = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
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
      const date = new Date(currentYear, currentMonth);
      if (direction === 'next') {
          date.setMonth(date.getMonth() + 1);
      } else {
          date.setMonth(date.getMonth() - 1);
      }
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setCurrentYear(prevYear => direction === 'next' ? prevYear + 1 : prevYear - 1);
  };
  
  const handleRefresh = useCallback(async () => {
    await fetchExpenses();
    setToastInfo({ message: 'Données actualisées !', type: 'info' });
  }, [fetchExpenses]);

  const monthName = new Date(currentYear, currentMonth).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header onSetToast={setToastInfo} />
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="container mx-auto p-4 md:p-8">
          <div className="mb-8 border-b border-slate-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`${
                  activeTab === 'dashboard'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`${
                  activeTab === 'analysis'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
                aria-current={activeTab === 'analysis' ? 'page' : undefined}
              >
                Analyse
              </button>
              <button
                onClick={() => setActiveTab('yearly')}
                className={`${
                  activeTab === 'yearly'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
                aria-current={activeTab === 'yearly' ? 'page' : undefined}
              >
                Annuel
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`${
                  activeTab === 'search'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
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
                        <ExpenseList expenses={filteredExpenses} onDeleteExpense={deleteExpense} onEditExpense={setExpenseToEdit} />
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
                            onDeleteExpense={deleteExpense}
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
    </div>
  );
};

export default App;