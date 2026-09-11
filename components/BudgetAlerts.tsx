import React, { useState } from 'react';
import { type Expense } from '../types';
import { useCategoryBudgets } from '../hooks/useCategoryBudgets';

interface BudgetAlertsProps {
  monthlyExpenses: Expense[];
  currentFoyerId?: string;
  onOpenBudgets: () => void;
}

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({
  monthlyExpenses,
  currentFoyerId,
  onOpenBudgets,
}) => {
  const { isBudgetEnabled, isBudgetAlertsEnabled, categoryBudgets } = useCategoryBudgets(currentFoyerId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isBudgetEnabled || !isBudgetAlertsEnabled) return null;

  // Calculate totals per category for the current month
  const totals = new Map<string, number>();
  monthlyExpenses.forEach(e => {
    totals.set(e.category, (totals.get(e.category) || 0) + e.amount);
  });

  const overruns = Object.entries(categoryBudgets)
    .filter(([cat, limit]) => limit > 0 && (totals.get(cat) || 0) > limit)
    .map(([cat, limit]) => {
      const spent = totals.get(cat) || 0;
      const over = spent - limit;
      const ratio = Math.round((spent / limit) * 100);
      return { cat, limit, spent, over, ratio };
    });

  if (overruns.length === 0) return null;

  const totalOverrun = overruns.reduce((sum, item) => sum + item.over, 0);

  return (
    <div className="bg-gradient-to-r from-rose-50 via-rose-50/90 to-amber-50 dark:from-rose-950/40 dark:via-rose-950/30 dark:to-amber-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-xs mb-6 overflow-hidden transition-all duration-300">
      {/* Primary Collapsible Header / Bandeau */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-rose-100/40 dark:hover:bg-rose-900/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Warning Icon Badge */}
          <div className="p-2 bg-rose-500 text-white rounded-xl shrink-0 shadow-xs animate-pulse">
            <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                Alerte budget dépassé
              </h4>

              {/* Number of Alerts Badge */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-2xs">
                {overruns.length} {overruns.length === 1 ? 'alerte' : 'alertes'}
              </span>

              {/* Total Overrun Tag */}
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800">
                +{totalOverrun.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {isExpanded ? 'Cliquez pour réduire' : 'Cliquez pour afficher le détail des catégories dépassées'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenBudgets();
            }}
            type="button"
            className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Gérer les budgets
          </button>

          <button
            type="button"
            className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700 transition-transform duration-200 cursor-pointer"
            aria-label={isExpanded ? 'Réduire' : 'Déplier'}
          >
            <svg 
              className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="border-t border-rose-200/60 dark:border-rose-900/60 p-4 bg-white/70 dark:bg-slate-900/60 space-y-3 animate-fade-in">
          <div className="space-y-2.5">
            {overruns.map(item => (
              <div key={item.cat} className="bg-rose-50/60 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {item.cat}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {item.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} / {item.limit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                    <span className="font-black text-xs text-rose-700 dark:text-rose-300 bg-rose-200/80 dark:bg-rose-900/80 px-2 py-0.5 rounded-md">
                      +{item.over.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} ({item.ratio}%)
                    </span>
                  </div>
                </div>

                {/* Overrun progress bar */}
                <div className="w-full bg-rose-200/50 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-rose-600 dark:bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, item.ratio)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onOpenBudgets}
              type="button"
              className="sm:hidden w-full py-2 px-3 text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors shadow-2xs text-center cursor-pointer"
            >
              Gérer les budgets mensuels
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetAlerts;
