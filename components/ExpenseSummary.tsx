import React from 'react';
import { type Expense, User } from '../types';

interface BalanceReportProps {
  allExpenses: Expense[];
  currentYear: number;
  currentMonth: number;
  sophieTotalMonth: number;
  vincentTotalMonth: number;
}

const ExpenseSummary = ({ allExpenses, currentYear, currentMonth, sophieTotalMonth, vincentTotalMonth }: BalanceReportProps) => {
  const { historicDifference, cumulativeDifference, message } = React.useMemo(() => {
    const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    
    const historicExpenses = allExpenses.filter(exp => new Date(exp.date) < firstDayOfMonth);
    
    const sophieHistoric = historicExpenses
      .filter(e => e.user === User.Sophie)
      .reduce((sum, e) => sum + e.amount, 0);
      
    const vincentHistoric = historicExpenses
      .filter(e => e.user === User.Vincent)
      .reduce((sum, e) => sum + e.amount, 0);

    const historicDifference = sophieHistoric - vincentHistoric;
    const currentMonthDifference = sophieTotalMonth - vincentTotalMonth;
    const cumulativeDifference = historicDifference + currentMonthDifference;

    let message;
    if (Math.abs(cumulativeDifference) < 0.01) {
      message = "Les comptes sont parfaitement équilibrés.";
    } else if (cumulativeDifference > 0) {
      message = `Sophie a dépensé ${cumulativeDifference.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de plus.`;
    } else {
      message = `Vincent a dépensé ${(-cumulativeDifference).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de plus.`;
    }
    
    return { historicDifference, cumulativeDifference, message };
  }, [allExpenses, currentYear, currentMonth, sophieTotalMonth, vincentTotalMonth]);
  
  const totalExpenses = sophieTotalMonth + vincentTotalMonth;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
        <div>
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Balance des comptes</h2>
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{message}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl">
                        <span className="font-semibold text-rose-800 dark:text-rose-300">Total Sophie</span>
                        <span className="font-bold text-lg text-rose-600 dark:text-rose-400">
                            {sophieTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-sky-50 dark:bg-sky-500/10 p-4 rounded-xl">
                        <span className="font-semibold text-sky-800 dark:text-sky-300">Total Vincent</span>
                        <span className="font-bold text-lg text-sky-600 dark:text-sky-400">
                            {vincentTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ExpenseSummary;