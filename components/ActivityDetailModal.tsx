
import React, { useEffect } from 'react';
import { type Activity, User } from '../types';
import CloseIcon from './icons/CloseIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ isOpen, onClose, activity }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { type, expense, oldExpense, timestamp } = activity;
  const formattedDate = new Date(timestamp).toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const userColorClass = expense.user === User.Sophie ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400';
  const actionText = type === 'add' ? 'ajouté' : type === 'update' ? 'modifié' : 'supprimé';
  
  const renderDiff = (label: string, oldValue: string | number | undefined, newValue: string | number | undefined, isCurrency = false) => {
      if (oldValue === newValue || oldValue === undefined) {
          return (
            <div className="mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">{label}</p>
                <p className="text-slate-800 dark:text-slate-200 text-lg">
                    {isCurrency && typeof newValue === 'number' 
                        ? newValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) 
                        : newValue
                    }
                </p>
            </div>
          );
      }

      return (
        <div className="mb-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
             <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{label} (Modifié)</p>
             <div className="flex items-center gap-3 flex-wrap">
                 <div className="line-through text-slate-400 dark:text-slate-500 text-sm">
                    {isCurrency && typeof oldValue === 'number'
                        ? oldValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                        : oldValue
                    }
                 </div>
                 <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                 <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                    {isCurrency && typeof newValue === 'number'
                        ? newValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                        : newValue
                    }
                 </div>
             </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl z-50 w-full max-w-md m-4 animate-fade-in">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Détail de l'activité</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Fermer"
            >
              <CloseIcon />
            </button>
        </div>
        
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
            <p className="text-lg text-slate-700 dark:text-slate-300">
                <span className={`font-bold ${userColorClass}`}>{expense.user}</span> a {actionText} une dépense.
            </p>
        </div>

        <div className="space-y-2">
            {type === 'update' && oldExpense ? (
                <>
                    {renderDiff("Description", oldExpense.description, expense.description)}
                    {renderDiff("Montant", oldExpense.amount, expense.amount, true)}
                    {renderDiff("Catégorie", oldExpense.category, expense.category)}
                </>
            ) : (
                <>
                    <div className="mb-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Description</p>
                        <p className="text-slate-800 dark:text-slate-200 text-lg">{expense.description}</p>
                    </div>
                    <div className="mb-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Montant</p>
                        <p className={`text-lg font-bold ${expense.amount && expense.amount < 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100'}`}>
                             {expense.amount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                    <div className="mb-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Catégorie</p>
                        <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-sm mt-1">
                            {expense.category}
                        </span>
                    </div>
                </>
            )}
        </div>
        
        <div className="mt-6 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                Fermer
            </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;
