
import React, { useEffect, useMemo } from 'react';
import { type Expense, User, type Deduction } from '../types';
import CloseIcon from './icons/CloseIcon';
import EditIcon from './icons/EditIcon';
import { GroceriesIcon, MiscIcon } from './icons/CategoryIcons';

interface ExpenseDetailModalProps {
  expense: Expense;
  history?: any[];
  onClose: () => void;
  onEdit: () => void;
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, history = [], onClose, onEdit }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const detailInfo = useMemo(() => {
    if (!expense.metadata) return null;
    try {
      return JSON.parse(expense.metadata) as { totalTicket: number; deductions: Deduction[] };
    } catch { return null; }
  }, [expense]);

  const formattedDate = new Date(expense.date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const userColor = expense.user === User.Sophie ? 'bg-pink-500' : (expense.user === User.Vincent ? 'bg-sky-500' : 'bg-emerald-500');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        <div className="p-6 text-center space-y-4 overflow-y-auto">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl mx-auto flex items-center justify-center">
            <GroceriesIcon className="h-8 w-8 text-cyan-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">{Math.abs(expense.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{expense.category} • {expense.description}</p>
          
          <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className={`w-8 h-8 rounded-full ${userColor} text-white flex items-center justify-center font-bold text-xs`}>{expense.user.charAt(0)}</div>
            <span className="text-sm font-semibold dark:text-slate-200">Payé par {expense.user}</span>
          </div>

          {detailInfo && (
            <div className="text-left border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Montant total du ticket :</span>
                <span className="font-bold">{detailInfo.totalTicket.toFixed(2)}€</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Articles personnels déduits :</p>
                <div className="space-y-2">
                  {detailInfo.deductions.map(d => (
                    <div key={d.id} className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0">
                      <span className="text-slate-600 dark:text-slate-400">
                        {d.name} <span className={`ml-1 text-[9px] px-1 rounded ${d.user === User.Sophie ? 'bg-pink-100 text-pink-600' : 'bg-sky-100 text-sky-600'}`}>{d.user}</span>
                      </span>
                      <span className="font-medium">-{d.price.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-xl border border-cyan-100 dark:border-cyan-800/30">
                <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300">Part Commune Partagée :</span>
                <span className="font-black text-cyan-600 dark:text-cyan-400">{expense.amount.toFixed(2)}€</span>
              </div>
            </div>
          )}

          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{formattedDate}</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500">Fermer</button>
          <button onClick={onEdit} className="flex-1 py-3 bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2">
            <EditIcon /> Modifier
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExpenseDetailModal;
