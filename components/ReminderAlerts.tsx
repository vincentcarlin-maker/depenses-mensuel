
import React from 'react';
import { type Reminder, type Expense, User } from '../types';

interface ReminderAlertsProps {
  reminders: Reminder[];
  monthlyExpenses: Expense[];
  onPayReminder: (reminder: Reminder) => void;
  currentYear: number;
  currentMonth: number;
  loggedInUser: User;
}

const ReminderAlerts: React.FC<ReminderAlertsProps> = ({ reminders, monthlyExpenses, onPayReminder, currentYear, currentMonth, loggedInUser }) => {
  const viewedMonthDate = new Date(Date.UTC(currentYear, currentMonth));
  const reminderStartDate = new Date('2025-11-01T00:00:00Z');

  // Reminders feature starts from November 2025
  if (viewedMonthDate < reminderStartDate) {
    return null;
  }

  const now = new Date();
  const realCurrentYear = now.getUTCFullYear();
  const realCurrentMonth = now.getUTCMonth();
  const realCurrentDay = now.getUTCDate();

  const isPastMonth = currentYear < realCurrentYear || (currentYear === realCurrentYear && currentMonth < realCurrentMonth);
  const isFutureMonth = currentYear > realCurrentYear || (currentYear === realCurrentYear && currentMonth > realCurrentMonth);
  const isCurrentMonth = currentYear === realCurrentYear && currentMonth === realCurrentMonth;

  const pendingReminders = reminders.filter(reminder => {
    // FIX: Added validation to prevent crashes from malformed reminder data.
    if (!reminder || typeof reminder.amount !== 'number' || typeof reminder.description !== 'string' || !reminder.is_active) {
      return false;
    }

    // Filter: Show reminders only for the logged-in user
    if (reminder.user !== loggedInUser) {
        return false;
    }

    // Never show reminders for a future month
    if (isFutureMonth) {
      return false;
    }

    const isPaid = monthlyExpenses.some(expense => {
        // 1. Vérification du montant (avec une tolérance minime pour les flottants)
        const amountMatch = Math.abs(expense.amount - reminder.amount) < 0.01;
        if (!amountMatch) return false;

        // 2. Vérification de la description (l'une contient l'autre)
        const normalize = (s: string) => s.toLowerCase().trim();
        const expDesc = normalize(expense.description);
        const remDesc = normalize(reminder.description);
        const descMatch = expDesc.includes(remDesc) || remDesc.includes(expDesc);

        // 3. Vérification de la catégorie
        const categoryMatch = expense.category === reminder.category;

        // CONDITION DE SUCCÈS :
        // Si la description correspond (ex: "Loyer" vs "Loyer Janvier") -> Payé
        if (descMatch) return true;

        // Si la catégorie correspond EXACTEMENT (ex: Rappel "Courses" vs Dépense "Leclerc") -> Payé
        // Cela couvre le cas où le nom change lors de la saisie (ex: magasin spécifique)
        if (categoryMatch) return true;

        return false;
    });

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
  
  const handlePayClick = (reminder: Reminder) => {
    onPayReminder(reminder);
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md mb-8 animate-fade-in-up">
      <div className="flex">
        <div className="flex-shrink-0">
          {/* Icône de cloche pleine et plus contrastée */}
          <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Rappels de Dépenses ({loggedInUser})</p>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <ul className="space-y-2">
              {pendingReminders.map(reminder => (
                <li key={reminder.id}>
                  <div className="flex justify-between items-center gap-2">
                    <span className="flex-1">
                      <strong>{reminder.description}</strong> ({reminder.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) est probablement dû.
                    </span>
                    <button 
                      onClick={() => handlePayClick(reminder)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors whitespace-nowrap shadow-sm shadow-cyan-600/20"
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
