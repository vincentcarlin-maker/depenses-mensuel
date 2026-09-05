
import React, { useMemo, useState } from 'react';
import { type Expense, User } from '../types';
import ExpenseList from './ExpenseList';
import CloseIcon from './icons/CloseIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import PiggyBankIcon from './icons/PiggyBankIcon';
import bannerRetardImg from '../src/assets/banner-retard.png';
import bannerAvanceImg from '../src/assets/banner-avance.png';

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

  const { historicDifference, cumulativeDifference, statusType, message, communTotalMonth, sophieExpenses, vincentExpenses } = useMemo(() => {
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

    let message: string;
    let statusType: 'ahead' | 'behind' | 'balanced' = 'balanced';

    if (Math.abs(cumulativeDifference) < 0.01) {
      message = "Les comptes sont parfaitement équilibrés.";
      statusType = 'balanced';
    } else {
      const sophieAhead = cumulativeDifference > 0;
      const amount = Math.abs(cumulativeDifference).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
      
      if (loggedInUser === User.Sophie || loggedInUser === User.Vincent) {
        const isAhead = (loggedInUser === User.Sophie && sophieAhead) || (loggedInUser === User.Vincent && !sophieAhead);
        const otherUser = loggedInUser === User.Sophie ? "Vincent" : "Sophie";
        
        if (isAhead) {
          message = `Tu as une avance de ${amount} par rapport à ${otherUser}.`;
          statusType = 'ahead';
        } else {
          message = `Tu as un retard de ${amount} par rapport à ${otherUser}.`;
          statusType = 'behind';
        }
      } else {
        if (sophieAhead) {
          message = `Sophie a dépensé ${amount} de plus par rapport à Vincent.`;
          statusType = 'ahead';
        } else {
          message = `Vincent a dépensé ${amount} de plus par rapport à Sophie.`;
          statusType = 'ahead';
        }
      }
    }
    
    return { historicDifference, cumulativeDifference, statusType, message, communTotalMonth, sophieExpenses, vincentExpenses };
  }, [allExpenses, currentYear, currentMonth, sophieTotalMonth, vincentTotalMonth, loggedInUser]);
  
  // Total including individual spending AND common spending
  const totalExpenses = sophieTotalMonth + vincentTotalMonth + communTotalMonth;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-7">
        {/* Balance des comptes section */}
        <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Balance des comptes</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Répartition et solde entre Sophie et Vincent</p>
            
            {/* Status Banner */}
            {(() => {
              const bannerBg = statusType === 'behind' 
                ? (bannerRetardImg || 'banner-retard.png') 
                : (bannerAvanceImg || 'banner-avance.png');

              return (
                <div className={`mt-5 p-5 sm:p-6 rounded-3xl transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm min-h-[140px] ${
                  statusType === 'ahead' 
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-100/90 dark:border-emerald-900/40' 
                    : statusType === 'behind'
                    ? 'bg-rose-50/90 dark:bg-rose-950/50 border border-rose-100/90 dark:border-rose-900/40'
                    : 'bg-blue-50/90 dark:bg-blue-950/50 border border-blue-100/90 dark:border-blue-900/40'
                }`}>
                  {/* Custom Background Image */}
                  <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    <img
                      src={bannerBg}
                      alt="Statut balance"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        const fallback = statusType === 'behind' ? 'banner-retard.png' : 'banner-avance.png';
                        if (!e.currentTarget.src.endsWith(fallback)) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 relative z-10 backdrop-blur-xs shadow-sm bg-white/70 dark:bg-black/30">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs ${
                      statusType === 'ahead'
                        ? 'bg-emerald-600'
                        : statusType === 'behind'
                        ? 'bg-rose-600'
                        : 'bg-blue-600'
                    }`}>
                      <svg className="w-5 h-5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={statusType === 'behind' ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M5 13l4 4L19 7"} />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 relative z-10">
                    <p className={`text-lg sm:text-xl font-extrabold leading-snug ${
                      statusType === 'ahead'
                        ? 'text-emerald-950 dark:text-emerald-50'
                        : statusType === 'behind'
                        ? 'text-rose-950 dark:text-rose-50'
                        : 'text-blue-950 dark:text-blue-50'
                    }`}>
                      {message}
                    </p>

                    <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 mt-3 rounded-2xl text-xs sm:text-sm font-semibold backdrop-blur-md shadow-xs ${
                      statusType === 'ahead'
                        ? 'bg-white/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100 border border-emerald-200/60 dark:border-emerald-800/40'
                        : statusType === 'behind'
                        ? 'bg-white/80 dark:bg-rose-950/80 text-rose-900 dark:text-rose-100 border border-rose-200/60 dark:border-rose-800/40'
                        : 'bg-white/80 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 border border-blue-200/60 dark:border-blue-800/40'
                    }`}>
                      <TrendingUpIcon className="w-4 h-4 shrink-0" />
                      <span>Report des mois précédents : {historicDifference.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Dépenses du mois section */}
        <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-4">Dépenses du mois</h2>
            <div className="space-y-3.5">
                 {/* Total Général */}
                 <div className="flex items-center justify-between p-4 sm:p-5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/40 rounded-3xl transition-all shadow-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 18V6c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2zm-2 0H5V6h14v12zm-3-6c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">Total Général</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Toutes les dépenses du mois</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl sm:text-2xl text-blue-600 dark:text-blue-400">
                          {totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                </div>

                {/* Total Sophie */}
                <div 
                    className="flex items-center justify-between p-4 sm:p-5 bg-pink-50/60 dark:bg-pink-950/30 border border-pink-100/80 dark:border-pink-900/40 rounded-3xl transition-all shadow-xs cursor-pointer hover:shadow-md hover:scale-[1.005] active:scale-[0.99]"
                    onClick={() => setUserExpensesModal({ user: User.Sophie, expenses: sophieExpenses })}
                >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">Total Sophie</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Dépenses de Sophie</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl sm:text-2xl text-pink-600 dark:text-pink-400">
                          {sophieTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                      <ChevronRightIcon />
                    </div>
                </div>

                {/* Total Vincent */}
                <div 
                    className="flex items-center justify-between p-4 sm:p-5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/40 rounded-3xl transition-all shadow-xs cursor-pointer hover:shadow-md hover:scale-[1.005] active:scale-[0.99]"
                    onClick={() => setUserExpensesModal({ user: User.Vincent, expenses: vincentExpenses })}
                >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">Total Vincent</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Dépenses de Vincent</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl sm:text-2xl text-blue-600 dark:text-blue-400">
                          {vincentTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                      <ChevronRightIcon />
                    </div>
                </div>

                {/* Cagnotte if > 0 */}
                {communTotalMonth > 0 && (
                  <div className="flex items-center justify-between p-4 sm:p-5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100/80 dark:border-purple-900/40 rounded-3xl transition-all shadow-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <PiggyBankIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">Payé par la Cagnotte</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Dépenses communes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xl sm:text-2xl text-purple-600 dark:text-purple-400">
                          {communTotalMonth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>
                )}
            </div>
        </div>

        {/* Modal when clicking on a user total */}
        {userExpensesModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
                <div className="fixed inset-0" onClick={() => setUserExpensesModal(null)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Dépenses de {userExpensesModal.user}</h3>
                        <button onClick={() => setUserExpensesModal(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="p-5 overflow-y-auto">
                        <ExpenseList expenses={userExpensesModal.expenses} onExpenseClick={() => {}} highlightedIds={new Set()} />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ExpenseSummary;