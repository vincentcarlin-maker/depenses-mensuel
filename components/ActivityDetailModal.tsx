
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
    // Empêcher le scroll du body quand la modale est ouverte
    document.body.style.overflow = 'hidden';

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'auto';
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
      // Si c'est une création ou suppression, pas de diff
      if (type !== 'update') {
          if (newValue === undefined || newValue === '') return null;
          return (
            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{label}</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {isCurrency && typeof newValue === 'number' 
                        ? newValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) 
                        : newValue
                    }
                </p>
            </div>
          );
      }

      // Si les valeurs sont identiques, on affiche juste la valeur actuelle
      if (oldValue === newValue || (oldValue === undefined && newValue !== undefined)) {
          return (
            <div className="mb-3 px-3 py-2 border-l-2 border-slate-200 dark:border-slate-600">
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold">{label}</p>
                <p className="text-slate-600 dark:text-slate-300">
                    {isCurrency && typeof newValue === 'number' 
                        ? newValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) 
                        : newValue
                    }
                </p>
            </div>
          );
      }

      // C'est une modification : on met en avant le changement
      return (
        <div className="mb-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl">
             <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {label} modifié
             </p>
             <div className="flex flex-col gap-2">
                 <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                    <span className="w-16 text-xs uppercase">Avant :</span>
                    <span className="line-through decoration-slate-400 dark:decoration-slate-500">
                        {isCurrency && typeof oldValue === 'number'
                            ? oldValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                            : oldValue || '(Vide)'
                        }
                    </span>
                 </div>
                 <div className="flex items-center font-bold text-slate-800 dark:text-slate-100 text-lg">
                    <span className="w-16 text-xs uppercase font-normal text-slate-500 dark:text-slate-400">Après :</span>
                    <span className="text-cyan-700 dark:text-cyan-400">
                        {isCurrency && typeof newValue === 'number'
                            ? newValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                            : newValue
                        }
                    </span>
                 </div>
             </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start pt-20 overflow-y-auto" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl z-50 w-full max-w-md m-4 animate-fade-in relative">
        <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Détail de l'activité</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Fermer"
            >
              <CloseIcon />
            </button>
        </div>
        
        <div className="mb-6">
            <p className="text-lg text-slate-700 dark:text-slate-300">
                <span className={`font-bold ${userColorClass}`}>{expense.user}</span> a {actionText} une transaction.
            </p>
        </div>

        <div className="space-y-1">
            {type === 'update' && oldExpense ? (
                <>
                    {renderDiff("Description", oldExpense.description, expense.description)}
                    {renderDiff("Montant", oldExpense.amount, expense.amount, true)}
                    {renderDiff("Catégorie", oldExpense.category, expense.category)}
                </>
            ) : (
                <>
                    {renderDiff("Description", undefined, expense.description)}
                    {renderDiff("Montant", undefined, expense.amount, true)}
                    {renderDiff("Catégorie", undefined, expense.category)}
                </>
            )}
        </div>
        
        <div className="mt-8 flex justify-end">
            <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-lg shadow-cyan-500/20"
            >
                Fermer
            </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;
