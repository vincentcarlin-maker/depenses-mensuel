import React from 'react';
import { type Expense } from '../types';

export interface UndoableAction {
  id: string;
  type: 'delete' | 'update';
  expense: Expense;
  originalExpense?: Expense;
  timerId: any;
  activityId?: string;
  createdAt?: number;
}

export interface UndoToastProps {
  undoableAction?: UndoableAction | null;
  undoableActions?: UndoableAction[];
  onUndo: (actionId?: string) => void;
}

const UndoToastItem: React.FC<{ action: UndoableAction; onUndo: (id: string) => void }> = ({ action, onUndo }) => {
  const desc = action.expense.description ? ` "${action.expense.description}"` : '';
  const message = action.type === 'delete' ? `Dépense${desc} supprimée.` : `Dépense${desc} mise à jour.`;

  return (
    <div
      className="pointer-events-auto w-full max-w-sm p-4 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 translate-y-0 opacity-100 relative overflow-hidden"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium truncate" title={action.expense.description}>
          {message}
        </div>
        <button
          onClick={() => onUndo(action.id)}
          className="px-4 py-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 whitespace-nowrap shrink-0"
        >
          Annuler
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-cyan-500 animate-progress-bar"
          style={{ animationDuration: '7s' }}
        ></div>
      </div>
    </div>
  );
};

export const UndoToast: React.FC<UndoToastProps> = ({ undoableAction, undoableActions, onUndo }) => {
  const actions: UndoableAction[] = undoableActions ?? (undoableAction ? [undoableAction] : []);

  if (actions.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 w-full max-w-sm px-4 pointer-events-none items-center"
    >
      {actions.map(action => (
        <UndoToastItem key={action.id} action={action} onUndo={(id) => onUndo(id)} />
      ))}
      <style>{`
        @keyframes progress-bar-animation {
            from { width: 100%; }
            to { width: 0%; }
        }
        .animate-progress-bar {
            animation: progress-bar-animation linear forwards;
        }
      `}</style>
    </div>
  );
};

export default UndoToast;
