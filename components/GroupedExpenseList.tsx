import React from 'react';
import { type Expense } from '../types';
import ExpenseListItem from './ExpenseListItem';

interface GroupedExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
}

const GroupedExpenseList: React.FC<GroupedExpenseListProps> = ({ expenses, onDeleteExpense, onEditExpense }) => {
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthYear = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  // Sort groups by date, with the most recent month first
  const sortedGroupKeys = Object.keys(groupedExpenses).sort((a, b) => {
      const dateA = new Date(groupedExpenses[a][0].date);
      const dateB = new Date(groupedExpenses[b][0].date);
      // We only need month/year precision for sorting the groups
      const monthYearA = new Date(dateA.getFullYear(), dateA.getMonth());
      const monthYearB = new Date(dateB.getFullYear(), dateB.getMonth());
      return monthYearB.getTime() - monthYearA.getTime();
  });

  return (
    <div className="space-y-6">
      {sortedGroupKeys.map(groupKey => (
        <div key={groupKey}>
          <h3 className="text-lg font-semibold text-slate-600 mb-3 capitalize border-b pb-2">{groupKey}</h3>
          <div className="space-y-3">
            {groupedExpenses[groupKey]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => (
                <ExpenseListItem
                  key={expense.id}
                  expense={expense}
                  onDeleteExpense={onDeleteExpense}
                  onEditExpense={onEditExpense}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupedExpenseList;
