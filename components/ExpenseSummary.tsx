import React, { useMemo } from 'react';
import { type Expense, User } from '../types';

interface BalanceReportProps {
  allExpenses: Expense[];
  currentYear: number;
  currentMonth: number;
  sophieTotalMonth: number;
  vincentTotalMonth: number;
}

const ExpenseSummary: React.FC<BalanceReportProps> = ({ allExpenses, currentYear, currentMonth, sophieTotalMonth, vincentTotalMonth }) => {
  const { historicDifference, cumulativeDifference, message } = useMemo(() => {
    const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    
    const historicExpenses = allExpenses.filter(exp => new Date(exp.date) < firstDayOfMonth);
    
    const sophieHistoric = historicExpenses
      .filter(e => e.user === User.Sophie)
      .reduce((sum, e) => sum + e.amount, 0);
      
    const vincentHistoric = historicExpenses
      .filter(e => e.user === User.Vincent)
      .reduce((sum, e) => sum + e.amount, 0);

    // Calcule la différence directe des dépenses historiques
    const historicDifference = sophieHistoric - vincentHistoric;

    // Calcule la différence directe des dépenses du mois en cours
    const currentMonthDifference = sophieTotalMonth - vincentTotalMonth;
    
    // Calcule la différence cumulative
    const cumulativeDifference = historicDifference + currentMonthDifference;

    let message = "Les comptes sont équilibrés. Parfait !";
    if (cumulativeDifference > 0.01) {
      message = `Sophie a dépensé ${cumulativeDifference.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de plus que Vincent.`;
    } else if (cumulativeDifference < -0.01) {
      message = `Vincent a dépensé ${(-cumulativeDifference).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de plus que Sophie.`;
    }
    
    return { historicDifference, cumulativeDifference, message };
  }, [allExpenses, currentYear, currentMonth, sophieTotalMonth, vincentTotalMonth]);
  
  const totalExpenses = sophieTotalMonth + vincentTotalMonth;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <div>
            <h2 className="text-xl font-bold mb-2">📈 Balance des comptes</h2>
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-4 rounded-lg text-center">
                <p className="text-lg font-semibold">{message}</p>
                <p className="text-sm opacity-70 mt-1">
                  Report des mois précédents : {historicDifference.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
        </div>
        <div>
            <h2 className="text-lg font-bold mb-2">Dépenses du mois</h2>
            <div className="space-y-3">
                 <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg">
                    <span className="font-semibold">Total Général</span>
                    <span className="font-bold text-xl text-cyan-600">
                        {totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
                <div className="flex justify-between items-center bg-pink-50 p-3 rounded-lg">
                    <span className="font-semibold text-pink-800">Total Sophie</span>
                    <span className="font-bold text-pink-600">
                        {sophieTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                    <span className="font-semibold text-blue-800">Total Vincent</span>
                    <span className="font-bold text-blue-600">
                        {vincentTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ExpenseSummary;