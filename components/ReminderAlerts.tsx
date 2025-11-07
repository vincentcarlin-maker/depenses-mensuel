import React from 'react';
import { type Reminder, type Expense } from '../types';

interface ReminderAlertsProps {
  reminders: Reminder[];
  monthlyExpenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => void;
  currentYear: number;
  currentMonth: number;
}

const ReminderAlerts = ({ reminders, monthlyExpenses, onAddExpense, currentYear, currentMonth }: ReminderAlertsProps) => {
  const now = new Date();
  const realCurrentYear = now.getUTCFullYear();
  const realCurrentMonth = now.getUTCMonth();
  const realCurrentDay = now.getUTCDate();

  const isPastMonth = currentYear < realCurrentYear || (currentYear === realCurrentYear && currentMonth < realCurrentMonth);
  const isFutureMonth = currentYear > realCurrentYear || (currentYear === realCurrentYear && currentMonth > realCurrentMonth);
  const isCurrentMonth = currentYear === realCurrentYear && currentMonth === realCurrentMonth;

  const pendingReminders = reminders.filter(reminder => {
    if (!reminder.is_active) {
      return false;
    }

    // Never show reminders for a future month
    if (isFutureMonth) {
      return false;
    }

    const isPaid = monthlyExpenses.some(expense => 
        expense.description.toLowerCase().includes(reminder.description.toLowerCase()) &&
        expense.amount === reminder.amount
    );

    if (isPaid) {
      return false;
    }

    // For past months, if it's not paid, it's pending.
    if (isPastMonth) {
      return true;
    }
    
    // For the current month, only show if the day has passed and it's unpaid.
    if (isCurrentMonth) {
      return reminder.day_of_month <= realCurrentDay;
    }

    return false; // Should not be reached, but as a fallback
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
    <div className="bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md mb-8 animate-fade-in-up">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.27-1.21 2.906 0l4.257 8.122c.636 1.21-.107 2.779-1.453 2.779H5.453c-1.346 0-2.089-1.569-1.453-2.779l4.257-8.122zM10 14a1 1 0 110-2 1 1 0 010 2zm-1-3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Rappels de Dépenses</p>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
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