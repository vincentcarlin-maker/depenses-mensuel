import React from 'react';
import { type Expense } from '../types';
import CloseIcon from './icons/CloseIcon';
import UserPlusIcon from './icons/UserPlusIcon';

interface NewExpenseAlertProps {
  expense: Expense | null;
  onDismiss: () => void;
}

const NewExpenseAlert: React.FC<NewExpenseAlertProps> = ({ expense, onDismiss }) => {
  if (!expense) {
    return null;
  }

  const formattedTime = new Date(expense.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const formattedAmount = expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  return (
    <div className="bg-sky-50 dark:bg-sky-500/10 border-l-4 border-sky-400 p-4 rounded-r-lg shadow-md mb-8 animate-fade-in-up">
      <div className="flex">
        <div className="flex-shrink-0">
          <UserPlusIcon className="h-5 w-5 text-sky-400 dark:text-sky-300" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-bold text-sky-800 dark:text-sky-200">Nouvelle Dépense</p>
          <div className="mt-2 text-sm text-sky-700 dark:text-sky-300">
            <p>
              <strong>{expense.user}</strong> a ajouté : <strong>{expense.description}</strong> ({formattedAmount}) à {formattedTime}.
            </p>
          </div>
        </div>
         <button
            onClick={onDismiss}
            className="ml-3 p-1.5 -my-1.5 rounded-full hover:bg-sky-100 dark:hover:bg-sky-500/20"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
      </div>
    </div>
  );
};

export default NewExpenseAlert;