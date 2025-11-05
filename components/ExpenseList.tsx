import React from 'react';
import { type Expense } from '../types';
import ExpenseListItem from './ExpenseListItem';

interface ExpenseListProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEditExpense }) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">Aucune dépense ne correspond à votre recherche. 🧐</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((expense) => (
            <ExpenseListItem
                key={expense.id}
                expense={expense}
                onEditExpense={onEditExpense}
            />
        ))}
    </div>
  );
};

export default ExpenseList;
