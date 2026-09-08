
import React from 'react';
import { type Expense, type FoyerMember } from '../types';
import ExpenseListItem from './ExpenseListItem';
import { type ModificationType } from '../App';
import { type Profile } from '../hooks/useAuth';

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseClick: (expense: Expense) => void;
  highlightedIds: Set<string>;
  modifiedInfo?: Map<string, ModificationType[]>;
  foyerMembers?: FoyerMember[];
  profiles?: Profile[];
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onExpenseClick, highlightedIds, modifiedInfo = new Map(), foyerMembers, profiles }) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500 dark:text-slate-400">Aucune dépense pour ce mois. 🥳</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
      {expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((expense) => (
            <ExpenseListItem
                key={expense.id}
                expense={expense}
                onExpenseClick={onExpenseClick}
                isHighlighted={highlightedIds.has(expense.id)}
                modificationTypes={modifiedInfo.get(expense.id)}
                foyerMembers={foyerMembers}
                profiles={profiles}
            />
        ))}
    </div>
  );
};

export default ExpenseList;
