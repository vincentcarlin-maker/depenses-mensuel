
import React, { useMemo, useState } from 'react';
import { type Expense, User } from '../types';
import ExpenseList from './ExpenseList';
import CloseIcon from './icons/CloseIcon';

interface BalanceReportProps {
  allExpenses: Expense[];
  currentYear: number;
  currentMonth: number;
  sophieTotalMonth: number;
  vincentTotalMonth: number;
  loggedInUser?: User | null;
}

const ExpenseSummary: React.FC<BalanceReportProps> = ({ allExpenses, currentYear, currentMonth, sophieTotalMonth, vincentTotalMonth, loggedInUser }) => {
  const [userExpensesModal, setUserExpensesModal] = useState<{ user: User, expenses: Expense[] } | null>(null);

  const { historicDifference, cumulativeDifference, message, messageColor, containerClass, secondaryTextColor, communTotalMonth, sophieExpenses, vincentExpenses } = useMemo(() => {
    const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    
    // Expenses for the current month paid by "Commun" (Cagnotte)
    const currentMonthExpenses = allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getUTCFullYear() === currentYear && expenseDate.getUTCMonth() === currentMonth;
    });

    const communTotalMonth = currentMonthExpenses
        .filter(e => e.user === User.Commun)
        .reduce((sum, e) => sum + e.amount, 0);

    const sophieExpenses = currentMonthExpenses.filter(e => e.user === User.Sophie);
    const vincentExpenses = currentMonthExpenses.filter(e => e.user === User.Vincent);

    const historicExpenses = allExpenses.filter(exp => new Date(exp.date) < firstDayOfMonth);
    
    const sophieHistoric = historicExpenses
      .filter(e => e.user === User.Sophie)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const vincentHistoric = historicExpenses
      .filter(e => e.user === User.Vincent)
      .reduce((sum, e) => sum + e.amount, 0);

    // Expenses paid by "Commun" do not affect the debt balance between Sophie and Vincent.
    const historicDifference = sophieHistoric - vincentHistoric;
    const currentMonthDifference = sophieTotalMonth - vincentTotalMonth;
    const cumulativeDifference = historicDifference + currentMonthDifference;

    let message;
    let messageColor = "text-slate-700 dark:text-slate-200";
    let containerClass = "bg-slate-100 dark:bg-slate-700/50 border border-transparent";
    let secondaryTextColor = "text-slate-500 dark:text-slate-400";

    if (Math.abs(cumulativeDifference) < 0.01) {
      message = "Les comptes sont parfaitement équilibrés.";
    } else {
      const sophieAhead = cumulativeDifference > 0;
      const amount = Math.abs(cumulativeDifference).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
      
      if (loggedInUser === User.Sophie || loggedInUser === User.Vincent) {
        const isAhead = (loggedInUser === User.Sophie && sophieAhead) || (loggedInUser === User.Vincent && !sophieAhead);
        const otherUser = loggedInUser === User.Sophie ? "Vincent" : "Sophie";
        
        if (isAhead) {
          message = `Tu as une avance de ${amount} par rapport à ${otherUser}.`;
          messageColor = "text-emerald-600 dark:text-emerald-400";
          containerClass = "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/30";
          secondaryTextColor = "text-emerald-500/80 dark:text-emerald-400/70";
        } else {
          message = `Tu as un retard de ${amount} par rapport à ${otherUser}.`;
          messageColor = "text-red-500 dark:text-red-400";
          containerClass = "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/30";
          secondaryTextColor = "text-red-400/80 dark:text-red-400/70";
        }
      } else {
        if (sophieAhead) {
          message = `Sophie a dépensé ${amount} de plus.`;
        } else {
          message = `Vincent a dépensé ${amount} de plus.`;
        }
      }
    }
    
    return { historicDifference, cumulativeDifference, message, messageColor, containerClass, secondaryTextColor, communTotalMonth, sophieExpenses, vincentExpenses };
  }, [allExpenses, currentYear, currentMonth, sophieTotalMonth, vincentTotalMonth, loggedInUser]);
  
  // Total including individual spending AND common spending
  const totalExpenses = sophieTotalMonth + vincentTotalMonth + communTotalMonth;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
        <div>
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Balance des comptes</h2>
            <div className={`${containerClass} p-4 rounded-xl text-center transition-all duration-300`}>
                <p className={`text-lg font-semibold ${messageColor}`}>{message}</p>
                <p className={`text-sm ${secondaryTextColor} mt-1`}>
                  Report des mois précédents : {historicDifference.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
        </div>
        <div>
            <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-100">Dépenses du mois</h2>
            <div className="space-y-3">
                 <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Total Général</span>
                    <span className="font-bold text-2xl text-cyan-600 dark:text-cyan-400">
                        {totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
                {communTotalMonth > 0 && (
                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">Payé par la Cagnotte</span>
                        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                            {communTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                        className="flex justify-between items-center bg-pink-50 dark:bg-pink-500/10 p-4 rounded-xl cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-500/20 transition-colors"
                        onClick={() => setUserExpensesModal({ user: User.Sophie, expenses: sophieExpenses })}
                    >
                        <span className="font-semibold text-pink-800 dark:text-pink-300">Total Sophie</span>
                        <span className="font-bold text-lg text-pink-600 dark:text-pink-400">
                            {sophieTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                    <div 
                        className="flex justify-between items-center bg-sky-50 dark:bg-sky-500/10 p-4 rounded-xl cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                        onClick={() => setUserExpensesModal({ user: User.Vincent, expenses: vincentExpenses })}
                    >
                        <span className="font-semibold text-sky-800 dark:text-sky-300">Total Vincent</span>
                        <span className="font-bold text-lg text-sky-600 dark:text-sky-400">
                            {vincentTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {userExpensesModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
                <div className="fixed inset-0" onClick={() => setUserExpensesModal(null)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Dépenses de {userExpensesModal.user}</h3>
                        <button onClick={() => setUserExpensesModal(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="p-4 overflow-y-auto">
                        <ExpenseList expenses={userExpensesModal.expenses} onExpenseClick={() => {}} highlightedIds={new Set()} />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ExpenseSummary;