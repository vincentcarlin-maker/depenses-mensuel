import React, { useEffect, useState } from 'react';
import { type Expense } from '../types';

interface UndoableAction {
    type: 'delete' | 'update';
    expense: Expense;
    timerId: number;
}

interface UndoToastProps {
  undoableAction: UndoableAction | null;
  onUndo: () => void;
}

const UndoToast: React.FC<UndoToastProps> = ({ undoableAction, onUndo }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (undoableAction) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [undoableAction]);

  if (!undoableAction) return null;

  const message = undoableAction.type === 'delete' ? 'Dépense supprimée.' : 'Dépense mise à jour.';
  
  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm p-4 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium">{message}</div>
        <button
          onClick={onUndo}
          className="px-4 py-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 whitespace-nowrap"
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