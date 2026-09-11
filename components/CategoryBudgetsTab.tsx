import React, { useState, useMemo } from 'react';
import { type Category, type Expense } from '../types';
import { useCategoryBudgets } from '../hooks/useCategoryBudgets';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';

interface CategoryBudgetsTabProps {
  categories: Category[];
  expenses: Expense[];
  currentFoyerId?: string;
  setToastInfo?: (info: { message: string; type: 'info' | 'error' }) => void;
}

export const CategoryBudgetsTab: React.FC<CategoryBudgetsTabProps> = ({
  categories,
  expenses,
  currentFoyerId,
  setToastInfo
}) => {
  const {
    isBudgetEnabled,
    setIsBudgetEnabled,
    isBudgetAlertsEnabled,
    setIsBudgetAlertsEnabled,
    categoryBudgets,
    setCategoryBudget,
    calculateCategoryBudgets
  } = useCategoryBudgets(currentFoyerId);

  const { getVisual } = useCategoryVisuals();

  // Local state for editing budget values before save/blur
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>({});
  const [filterQuery, setFilterQuery] = useState('');

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const budgetInfos = useMemo(() => {
    return calculateCategoryBudgets(categories, expenses, currentYear, currentMonth);
  }, [categories, expenses, currentYear, currentMonth, calculateCategoryBudgets]);

  // Overall totals
  const totalBudgetConfigured = useMemo(() => {
    return Object.values(categoryBudgets).reduce((sum, b) => sum + (b || 0), 0);
  }, [categoryBudgets]);

  const totalSpentInBudgeted = useMemo(() => {
    return budgetInfos.reduce((sum, info) => sum + info.spent, 0);
  }, [budgetInfos]);

  const totalOverrunCount = useMemo(() => {
    return budgetInfos.filter(info => info.isOverBudget).length;
  }, [budgetInfos]);

  const handleInputChange = (category: string, value: string) => {
    setEditingBudgets(prev => ({ ...prev, [category]: value }));
  };

  const handleInputBlur = (category: string) => {
    const rawVal = editingBudgets[category];
    if (rawVal === undefined) return;

    const num = parseFloat(rawVal.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      setCategoryBudget(category, num);
      if (setToastInfo) {
        setToastInfo({
          message: `Budget pour "${category}" défini à ${num.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
          type: 'info'
        });
      }
    } else if (rawVal.trim() === '' || num === 0) {
      setCategoryBudget(category, 0);
    }
  };

  const handleQuickAdd = (category: string, addAmount: number) => {
    const current = categoryBudgets[category] || 0;
    const newAmount = current + addAmount;
    setCategoryBudget(category, newAmount);
    setEditingBudgets(prev => ({ ...prev, [category]: String(newAmount) }));
  };

  const filteredBudgetInfos = useMemo(() => {
    if (!filterQuery.trim()) return budgetInfos;
    const q = filterQuery.toLowerCase().trim();
    return budgetInfos.filter(info => info.category.toLowerCase().includes(q));
  }, [budgetInfos, filterQuery]);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
      {/* Title & Master Toggle */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-100/90 dark:border-slate-700/60 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-6 h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Budget mensuel & Alertes
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Plafonnez vos catégories et recevez des avertissements de dépassement
              </p>
            </div>
          </div>

          {/* Master Switch Toggle */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isBudgetEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsBudgetEnabled(checked);
                if (setToastInfo) {
                  setToastInfo({
                    message: checked ? "Budget mensuel activé avec succès !" : "Budget mensuel désactivé",
                    type: 'info'
                  });
                }
              }}
              className="sr-only peer"
            />
            <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:after:border-slate-600 peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Feature status banner */}
        <div className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-colors ${
          isBudgetEnabled
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
            : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-400'
        }`}>
          <span className="text-base shrink-0">{isBudgetEnabled ? '🎯' : '💤'}</span>
          <span>
            {isBudgetEnabled
              ? "L'option est activée. Vos budgets par catégorie sont configurables ci-dessous."
              : "L'option est désactivée. Activez l'interrupteur ci-dessus pour définir des plafonds et activer les alertes."}
          </span>
        </div>

        {/* Sub-toggle for alerts on dashboard */}
        {isBudgetEnabled && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                Alertes de dépassement (Page d'accueil)
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Affiche le bandeau dépliable d'alerte en cas de dépassement d'un plafond
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isBudgetAlertsEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsBudgetAlertsEnabled(checked);
                  if (setToastInfo) {
                    setToastInfo({
                      message: checked ? "Alertes de dépassement activées sur la page d'accueil !" : "Alertes de dépassement masquées",
                      type: 'info'
                    });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-rose-500"></div>
            </label>
          </div>
        )}
      </div>

      {isBudgetEnabled && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Budget total
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalBudgetConfigured.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Dépensé ce mois
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalSpentInBudgeted.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border shadow-xs col-span-2 sm:col-span-1 ${
              totalOverrunCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
            }`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Alerte Dépassements
              </p>
              <p className="text-lg sm:text-xl font-extrabold mt-1 flex items-center gap-1.5">
                {totalOverrunCount > 0 ? (
                  <>
                    <span>🚨 {totalOverrunCount} catégorie{totalOverrunCount > 1 ? 's' : ''}</span>
                  </>
                ) : (
                  <>
                    <span>✅ Aucun dépassement</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Search / Filter bar */}
          <div className="relative">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Effacer
              </button>
            )}
          </div>

          {/* List of Category Budgets */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
              Plafond mensuel par catégorie (€)
            </h3>

            {filteredBudgetInfos.map((info) => {
              const { category, budget, spent, percentage, isOverBudget, isNearBudget, overrunAmount } = info;
              const visual = getVisual(category);
              const IconComp = visual.icon;
              const inputVal = editingBudgets[category] !== undefined ? editingBudgets[category] : (budget > 0 ? String(budget) : '');

              return (
                <div
                  key={category}
                  className={`bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border transition-all ${
                    isOverBudget
                      ? 'border-rose-300 dark:border-rose-800 shadow-rose-500/5 shadow-xs'
                      : isNearBudget
                      ? 'border-amber-300 dark:border-amber-800'
                      : 'border-slate-100 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${visual.color || 'bg-blue-500'} text-white shadow-xs`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                            {category}
                          </h4>
                          {isOverBudget && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 uppercase tracking-wide">
                              🚨 Dépassé
                            </span>
                          )}
                          {isNearBudget && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 uppercase tracking-wide">
                              ⚠️ Proche du plafond
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          Dépensé ce mois : <span className="font-bold text-slate-700 dark:text-slate-300">{spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                          {budget > 0 && ` / ${budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
                        </p>
                      </div>
                    </div>

                    {/* Input Field & Quick Add */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="10"
                          min="0"
                          placeholder="Sans limite"
                          value={inputVal}
                          onChange={(e) => handleInputChange(category, e.target.value)}
                          onBlur={() => handleInputBlur(category)}
                          className="w-28 sm:w-32 px-3 py-2 pr-7 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute right-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                          €
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(category, 50)}
                          title="Ajouter +50 € au budget"
                          className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/50 dark:hover:text-amber-300 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          +50€
                        </button>
                        {budget > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryBudget(category, 0);
                              setEditingBudgets(prev => ({ ...prev, [category]: '' }));
                            }}
                            title="Supprimer le budget pour cette catégorie"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar if budget > 0 */}
                  {budget > 0 && (
                    <div className="mt-3.5 space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget
                              ? 'bg-rose-500 dark:bg-rose-600'
                              : isNearBudget
                              ? 'bg-amber-500 dark:bg-amber-600'
                              : 'bg-emerald-500 dark:bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        <span>{percentage.toFixed(0)}% du budget utilisé</span>
                        {isOverBudget ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            Dépassement : +{overrunAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Reste : {(budget - spent).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryBudgetsTab;
