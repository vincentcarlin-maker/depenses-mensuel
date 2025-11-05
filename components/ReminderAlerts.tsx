import React from 'react';
import { type Reminder, type Expense } from '../types';

interface ReminderAlertsProps {
  reminders: Reminder[];
  monthlyExpenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => void;
  currentYear: number;
  currentMonth: number;
}

const ReminderAlerts: React.FC<ReminderAlertsProps> = ({ reminders, monthlyExpenses, onAddExpense, currentYear, currentMonth }) => {
  const today = new Date();
  
  const pendingReminders = reminders.filter(reminder => {
    if (!reminder.is_active) return false;

    // Ne pas afficher le rappel si le jour n'est pas encore arrivé dans le mois en cours
    if (today.getUTCFullYear() === currentYear && today.getUTCMonth() === currentMonth && today.getUTCDate() < reminder.day_of_month) {
        return false;
    }

    const isPaid = monthlyExpenses.some(expense => 
        expense.description.toLowerCase().includes(reminder.description.toLowerCase()) &&
        expense.amount === reminder.amount
    );

    return !isPaid;
  });

  if (pendingReminders.length === 0) {
    return null;
  }
  
  const handleAddExpense = (reminder: Reminder) => {
    onAddExpense({
      description: reminder.description,
      amount: reminder.amount,
      category: reminder.category,
      user: reminder.user,
    });
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md mb-8 animate-fade-in-up">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.27-1.21 2.906 0l4.257 8.122c.636 1.21-.107 2.779-1.453 2.779H5.453c-1.346 0-2.089-1.569-1.453-2.779l4.257-8.122zM10 14a1 1 0 110-2 1 1 0 010 2zm-1-3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-bold text-yellow-800">Rappels de Dépenses</p>
          <div className="mt-2 text-sm text-yellow-700">
            <ul className="space-y-2">
              {pendingReminders.map(reminder => (
                <li key={reminder.id}>
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex-1">
                      <strong>{reminder.description}</strong> ({reminder.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) est probablement dû.
                    </span>
                    <button 
                      onClick={() => handleAddExpense(reminder)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors whitespace-nowrap"
                    >
                      Payer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderAlerts;