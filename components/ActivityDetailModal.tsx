
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Activity, User } from '../types';
import CloseIcon from './icons/CloseIcon';

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

  if (!isOpen || !activity || !activity.expense) return null;

  const { type, expense, oldExpense, timestamp } = activity;
  
  // Sécurisation des valeurs
  const safeCategory = expense.category || '';
  const safeDescription = expense.description || '';
  const safeUser = expense.user || 'Inconnu';
  
  const formattedDate = new Date(timestamp).toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const userColorClass = safeUser === User.Sophie ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400';
  const actionText = type === 'add' ? 'ajouté' : type === 'update' ? 'modifié' : 'supprimé';
  
  const renderDiff = (label: string, oldValue: string | number | undefined, newValue: string | number | undefined, isCurrency = false) => {
      // 1. ADD / DELETE / Simple view
      if (type !== 'update') {
          if (newValue === undefined || newValue === '' || newValue === null) return null;
          return (
            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{label}</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium break-all">
                    {isCurrency && typeof newValue === 'number' 
                        ? newValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) 
                        : newValue
                    }
                </p>
            </div>
          );
      }

      // 2. UPDATE: Show only if changed (or if context allows, but minimizing noise)
      if (oldValue === newValue || (oldValue === undefined && newValue === undefined)) {
          return null;
      }

      const formatVal = (val: any) => {
          if (val === undefined || val === null) return "Inconnu";
          if (isCurrency && typeof val === 'number') return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
          return String(val);
      };

      return (
          <div className="flex flex-col text-sm mt-2 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
             <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold mb-2">{label}</span>
             <div className="grid grid-cols-[min-content_1fr] gap-x-3 gap-y-1">
                 <span className="text-[10px] uppercase text-rose-500 font-bold tracking-wider self-center bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">AVANT</span>
                 <span className="text-slate-500 dark:text-slate-400 line-through text-xs self-center break-all">
                     {formatVal(oldValue)}
                 </span>
                 
                 <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold tracking-wider self-center bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">APRÈS</span>
                 <span className="font-bold text-slate-800 dark:text-slate-100 text-sm self-center break-all">
                     {formatVal(newValue)}
                 </span>
             </div>
          </div>
      );
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-start pt-20 overflow-y-auto" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl z-[100] w-full max-w-md m-4 animate-fade-in relative">
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
                <span className={`font-bold ${userColorClass}`}>{safeUser}</span> a {actionText} une transaction.
            </p>
        </div>

        <div className="space-y-1">
            {type === 'update' ? (
                <>
                    {renderDiff(
                        safeCategory === 'Courses' ? 'Magasin' : 'Description', 
                        oldExpense?.description, 
                        safeDescription
                    )}
                    {renderDiff("Montant", oldExpense?.amount, expense.amount, true)}
                    {renderDiff("Catégorie", oldExpense?.category, safeCategory)}
                </>
            ) : (
                <>
                    {renderDiff(
                        safeCategory === 'Courses' ? 'Magasin' : 'Description', 
                        undefined, 
                        safeDescription
                    )}
                    {renderDiff("Montant", undefined, expense.amount, true)}
                    {renderDiff("Catégorie", undefined, safeCategory)}
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
    </div>,
    document.body
  );
};

export default ActivityDetailModal;
