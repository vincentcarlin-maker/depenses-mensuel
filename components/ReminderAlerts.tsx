
import React, { useState } from 'react';
import { type Reminder, type Expense, User } from '../types';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';
import { getReminderVisual } from './RemindersTab';

interface ReminderAlertsProps {
  reminders: Reminder[];
  monthlyExpenses: Expense[];
  onPayReminder: (reminder: Reminder) => Promise<void> | void;
  onUpdateReminder?: (reminder: Reminder) => Promise<void> | void;
  currentYear: number;
  currentMonth: number;
  loggedInUser: User;
  onOpenReminders?: () => void;
}

export const ReminderAlerts: React.FC<ReminderAlertsProps> = ({ 
  reminders, 
  monthlyExpenses, 
  onPayReminder, 
  onUpdateReminder,
  currentYear, 
  currentMonth, 
  loggedInUser
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');
  const [isSavingAmount, setIsSavingAmount] = useState(false);
  const { getVisual } = useCategoryVisuals();

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
    if (!reminder || typeof reminder.amount !== 'number' || typeof reminder.description !== 'string' || !reminder.is_active) {
      return false;
    }

    // Filter: Show reminders only for the logged-in user (or generic if user not specified)
    if (reminder.user && reminder.user !== loggedInUser) {
      return false;
    }

    // Never show reminders for a future month
    if (isFutureMonth) {
      return false;
    }

    const isPaid = monthlyExpenses.some(expense => {
      const normalize = (s: string) => s.toLowerCase().trim();
      const expDesc = normalize(expense.description || '');
      const remDesc = normalize(reminder.description || '');
      const remCat = normalize(reminder.category || '');
      
      // 1. Match description
      const descMatch = expDesc.includes(remDesc) || remDesc.includes(expDesc);

      // 2. Match exact category if generic reminder
      const categoryMatch = expense.category === reminder.category;
      if (descMatch) return true;
      if (categoryMatch && remDesc === remCat) return true;

      return false;
    });

    if (isPaid) {
      return false;
    }

    // For past months, if it's not paid, it's pending
    if (isPastMonth) {
      return true;
    }
    
    // For the current month, only show if the day has passed and it's unpaid
    if (isCurrentMonth) {
      return reminder.day_of_month <= realCurrentDay;
    }

    return false;
  });

  if (pendingReminders.length === 0) {
    return null;
  }

  const totalAmount = pendingReminders.reduce((sum, item) => sum + item.amount, 0);

  const handleStartEdit = (e: React.MouseEvent, reminder: Reminder) => {
    e.stopPropagation();
    setEditingId(reminder.id);
    setEditingAmount(String(reminder.amount));
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditingAmount('');
  };

  const handleSaveAmount = async (e: React.MouseEvent | React.FormEvent | React.KeyboardEvent, reminder: Reminder) => {
    if (e) e.stopPropagation();
    const cleanStr = editingAmount.replace(',', '.').trim();
    const parsed = parseFloat(cleanStr);
    if (isNaN(parsed) || parsed <= 0) {
      return;
    }
    const rounded = Math.round(parsed * 100) / 100;
    if (rounded === reminder.amount) {
      setEditingId(null);
      return;
    }

    setIsSavingAmount(true);
    try {
      if (onUpdateReminder) {
        await onUpdateReminder({ ...reminder, amount: rounded });
      }
      setEditingId(null);
    } catch (err) {
      console.error('Error saving reminder amount:', err);
    } finally {
      setIsSavingAmount(false);
    }
  };

  const handlePayClick = async (e: React.MouseEvent, reminder: Reminder) => {
    e.stopPropagation();
    let reminderToPay = reminder;

    // If currently editing this reminder, commit the amount first
    if (editingId === reminder.id) {
      const cleanStr = editingAmount.replace(',', '.').trim();
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed) && parsed > 0) {
        const rounded = Math.round(parsed * 100) / 100;
        if (rounded !== reminder.amount) {
          reminderToPay = { ...reminder, amount: rounded };
          if (onUpdateReminder) {
            await onUpdateReminder(reminderToPay);
          }
        }
      }
      setEditingId(null);
    }

    setPayingId(reminder.id);
    try {
      await onPayReminder(reminderToPay);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 via-orange-50/90 to-amber-50 dark:from-orange-950/40 dark:via-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-900/60 rounded-2xl shadow-xs mb-6 overflow-hidden transition-all duration-300 animate-fade-in">
      {/* Primary Collapsible Header / Bandeau */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-orange-100/40 dark:hover:bg-orange-900/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Orange Notification Badge Icon */}
          <div className="p-2 bg-orange-500 text-white rounded-xl shrink-0 shadow-xs animate-pulse">
            <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                Rappels de dépenses
              </h4>

              {/* Number of Alerts Badge in Orange */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-600 text-white shadow-2xs">
                {pendingReminders.length} {pendingReminders.length === 1 ? 'rappel' : 'rappels'}
              </span>

              {/* Total Pending Tag */}
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/60 border border-orange-200/80 dark:border-orange-800">
                {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {isExpanded ? 'Cliquez pour réduire' : 'Cliquez pour afficher le détail des rappels en attente'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-orange-200/80 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-slate-700 transition-transform duration-200 cursor-pointer"
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
        <div className="border-t border-orange-200/60 dark:border-orange-900/60 p-4 bg-white/70 dark:bg-slate-900/60 space-y-3 animate-fade-in">
          <div className="space-y-2.5">
            {pendingReminders.map(reminder => {
              const visual = getReminderVisual(reminder, getVisual);
              const VisualIcon = visual?.icon;
              const isEditing = editingId === reminder.id;

              return (
                <div 
                  key={reminder.id} 
                  className="bg-orange-50/60 dark:bg-orange-950/30 p-3 sm:p-3.5 rounded-xl border border-orange-100 dark:border-orange-900/40 flex items-center justify-between gap-3 hover:bg-orange-100/40 dark:hover:bg-orange-950/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {VisualIcon && (
                      <div className="shrink-0 scale-90 sm:scale-100">
                        <VisualIcon />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate block">
                        {reminder.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Amount with Click-to-Edit */}
                    {isEditing ? (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-orange-300 dark:border-orange-700 shadow-xs"
                      >
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveAmount(e, reminder);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit(e as any);
                              }
                            }}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            className="w-20 sm:w-24 px-2 py-1 text-sm font-extrabold text-orange-950 dark:text-orange-100 bg-orange-50/70 dark:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-right pr-6"
                            placeholder="0.00"
                          />
                          <span className="absolute right-2 text-xs font-bold text-orange-600 dark:text-orange-400 pointer-events-none">
                            €
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleSaveAmount(e, reminder)}
                          disabled={isSavingAmount}
                          title="Valider la modification"
                          aria-label="Valider la modification"
                          className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          {isSavingAmount ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          title="Annuler"
                          aria-label="Annuler"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(e, reminder)}
                        title="Cliquer pour modifier le montant"
                        className="group font-extrabold text-sm sm:text-base text-orange-800 dark:text-orange-200 bg-orange-100/80 dark:bg-orange-900/60 hover:bg-orange-200/90 dark:hover:bg-orange-800/80 px-2.5 py-1 rounded-lg border border-orange-200/80 dark:border-orange-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                      >
                        <span>{reminder.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        <svg 
                          className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 opacity-60 group-hover:opacity-100 transition-opacity" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={2.2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    )}

                    {/* Action Button: Ajouter instead of Payer */}
                    <button 
                      onClick={(e) => handlePayClick(e, reminder)}
                      disabled={payingId === reminder.id}
                      type="button"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 transition-all rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {payingId === reminder.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Ajout en cours...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                          </svg>
                          <span>Ajouter</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total des rappels en attente : <strong className="font-extrabold text-orange-700 dark:text-orange-300">{totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderAlerts;
