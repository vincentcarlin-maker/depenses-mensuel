import { useCallback } from 'react';
import { useSyncedSettings } from './useSyncedSettings';
import { type Category, type Expense } from '../types';

export interface CategoryBudgetInfo {
  category: Category;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearBudget: boolean;
  overrunAmount: number;
}

export function useCategoryBudgets(foyerId?: string) {
  const activeFoyerId = foyerId || localStorage.getItem('duobudget_active_foyer_id') || 'foyer_default';

  const [isBudgetEnabled, setIsBudgetEnabled] = useSyncedSettings<boolean>(
    `duobudget_budget_enabled_${activeFoyerId}`,
    false
  );

  const [isBudgetAlertsEnabled, setIsBudgetAlertsEnabled] = useSyncedSettings<boolean>(
    `duobudget_budget_alerts_enabled_${activeFoyerId}`,
    true
  );

  const [categoryBudgets, setCategoryBudgets] = useSyncedSettings<Record<string, number>>(
    `duobudget_category_budgets_${activeFoyerId}`,
    {}
  );

  const setCategoryBudget = useCallback((category: string, amount: number) => {
    setCategoryBudgets(prev => {
      const copy = { ...prev };
      if (amount <= 0 || isNaN(amount)) {
        delete copy[category];
      } else {
        copy[category] = Math.round(amount * 100) / 100;
      }
      return copy;
    });
  }, [setCategoryBudgets]);

  const removeCategoryBudget = useCallback((category: string) => {
    setCategoryBudgets(prev => {
      const copy = { ...prev };
      delete copy[category];
      return copy;
    });
  }, [setCategoryBudgets]);

  const calculateCategoryBudgets = useCallback((
    categories: Category[],
    expenses: Expense[],
    year: number,
    month: number
  ): CategoryBudgetInfo[] => {
    // Filter expenses for specified month & year
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month;
    });

    // Sum expenses per category
    const spentMap = new Map<string, number>();
    monthExpenses.forEach(e => {
      const catKey = e.category || 'Divers';
      spentMap.set(catKey, (spentMap.get(catKey) || 0) + e.amount);
    });

    // Include all categories or categories with budget/spent
    const allCategoryNames = Array.from(new Set([
      ...categories,
      ...Object.keys(categoryBudgets),
      ...Array.from(spentMap.keys())
    ]));

    const result: CategoryBudgetInfo[] = [];

    allCategoryNames.forEach(cat => {
      const budget = categoryBudgets[cat] || 0;
      const spent = spentMap.get(cat) || 0;

      if (budget > 0 || spent > 0) {
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        const remaining = budget > spent ? budget - spent : 0;
        const overrunAmount = spent > budget && budget > 0 ? spent - budget : 0;
        const isOverBudget = spent > budget && budget > 0;
        const isNearBudget = !isOverBudget && budget > 0 && spent >= budget * 0.8;

        result.push({
          category: cat,
          budget,
          spent,
          remaining,
          percentage,
          isOverBudget,
          isNearBudget,
          overrunAmount
        });
      }
    });

    // Sort by budget set first, then by spent descending
    return result.sort((a, b) => {
      if (a.isOverBudget !== b.isOverBudget) return a.isOverBudget ? -1 : 1;
      if ((a.budget > 0) !== (b.budget > 0)) return a.budget > 0 ? -1 : 1;
      return b.spent - a.spent;
    });
  }, [categoryBudgets]);

  return {
    isBudgetEnabled,
    setIsBudgetEnabled,
    isBudgetAlertsEnabled,
    setIsBudgetAlertsEnabled,
    categoryBudgets,
    setCategoryBudget,
    setCategoryBudgets,
    removeCategoryBudget,
    calculateCategoryBudgets
  };
}
