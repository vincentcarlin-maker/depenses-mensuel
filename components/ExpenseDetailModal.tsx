
import React, { useEffect, useMemo } from 'react';
import { type Expense, User, type Activity } from '../types';
import CloseIcon from './icons/CloseIcon';
import EditIcon from './icons/EditIcon';
import ScissorsIcon from './icons/ScissorsIcon';
import { 
    MandatoryIcon, 
    FuelIcon, 
    HeatingIcon, 
    GroceriesIcon, 
    RestaurantIcon, 
    CarRepairsIcon, 
    MiscIcon,
    GiftIcon,
    ClothingIcon,
} from './icons/CategoryIcons';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; textColor: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-100 dark:bg-orange-500/20', textColor: 'text-orange-600 dark:text-orange-400' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-100 dark:bg-red-500/20', textColor: 'text-red-600 dark:text-red-400' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-100 dark:bg-green-500/20', textColor: 'text-green-600 dark:text-green-400' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-100 dark:bg-purple-500/20', textColor: 'text-purple-600 dark:text-purple-400' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-100 dark:bg-yellow-500/20', textColor: 'text-yellow-600 dark:text-yellow-400' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-purple-100 dark:bg-purple-500/20', textColor: 'text-purple-600 dark:text-purple-400' },
  "Cadeau": { icon: GiftIcon, color: 'bg-fuchsia-100 dark:bg-fuchsia-500/20', textColor: 'text-fuchsia-600 dark:text-fuchsia-400' },
  "Divers": { icon: MiscIcon, color: 'bg-cyan-100 dark:bg-cyan-500/20', textColor: 'text-cyan-600 dark:text-cyan-400' },
};

interface ExpenseDetailModalProps {
  expense: Expense;
  history?: Activity[];
  onClose: () => void;
  onEdit: () => void;
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, history = [], onClose, onEdit }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const visual = CategoryVisuals[expense.category] || CategoryVisuals["Divers"];
  const IconComponent = visual.icon;
  const hasSubtractions = expense.category === 'Courses' && expense.subtracted_items && expense.subtracted_items.length > 0;
  
  const { receiptTotal, totalSubtracted } = useMemo(() => {
      if (!hasSubtractions) return { receiptTotal: 0, totalSubtracted: 0 };
      const totalSub = expense.subtracted_items!.reduce((sum, item) => sum + item.amount, 0);
      return { receiptTotal: expense.amount + totalSub, totalSubtracted: totalSub };
  }, [expense, hasSubtractions]);

  const parsedDetails = useMemo(() => {
      let displayDescription = expense.description, store = '', person = '', occasion = '', vehicle = '', heating = '';
      if (expense.category === 'Courses') { store = expense.description; displayDescription = ''; }
      else if (expense.category === 'Chauffage') { const match = expense.description.match(/\s\(([^)]+)\)$/); if (match) { heating = match[1]; displayDescription = ''; } }
      else if (expense.category === 'Réparation voitures') { const match = expense.description.match(/\s\(([^)]+)\)$/); if (match) { vehicle = match[1]; displayDescription = expense.description.replace(/\s\(([^)]+)\)$/, '').trim(); } }
      else if (expense.category === 'Vêtements') { const match = expense.description.match(/\s\(([^)]+)\)$/); if (match) { person = match[1]; displayDescription = expense.description.replace(/\s\(([^)]+)\)$/, '').trim(); } }
      else if (expense.category === 'Cadeau') { const match = expense.description.match(/\s\(([^)]+)\s-\s([^)]+)\)$/); if (match) { person = match[1]; occasion = match[2]; displayDescription = expense.description.replace(/\s\(([^)]+)\s-\s([^)]+)\)$/, '').trim(); } }
      return { displayDescription, store, person, occasion, vehicle, heating };
  }, [expense]);

  const formattedDate = new Date(expense.date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const renderDiffLine = (label: string, oldVal: any, newVal: any, isCurrency = false) => {
      if (oldVal === newVal || oldVal === undefined) return null;
      const formatVal = (val: any) => {
          if (val === undefined || val === null) return "Inconnu";
          if (isCurrency && typeof val === 'number') return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
          return String(val);
      };
      return (
          <div className="flex flex-col text-[11px] mt-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
             <span className="text-[9px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">{label}</span>
             <div className="grid grid-cols-[min-content_1fr] gap-x-2 gap-y-0.5">
                 <span className="text-[8px] uppercase text-rose-500 font-bold self-center bg-rose-50 dark:bg-rose-900/20 px-1 py-0.5 rounded">AVANT</span>
                 <span className="text-slate-500 dark:text-slate-400 line-through self-center break-all">{formatVal(oldVal)}</span>
                 <span className="text-[8px] uppercase text-emerald-600 dark:text-emerald-400 font-bold self-center bg-emerald-50 dark:bg-emerald-900/20 px-1 py-0.5 rounded">APRÈS</span>
                 <span className="font-bold text-slate-800 dark:text-slate-100 self-center break-all">{formatVal(newVal)}</span>
             </div>
          </div>
      );
  };

  const getUserColor = (u: User) => u === User.Sophie ? 'text-pink-600' : (u === User.Vincent ? 'text-sky-600' : 'text-emerald-600');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm z-[60] flex justify-center items-center">
      <div className="fixed inset-0" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl z-[60] w-full max-w-md m-4 animate-fade-in relative overflow-hidden flex flex-col max-h-[90vh]">
         <div className={`absolute top-0 left-0 w-full h-24 ${visual.color} opacity-50`}></div>
         <div className="relative flex flex-col items-center text-center pt-4 overflow-y-auto">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white dark:bg-slate-700 mb-4 flex-shrink-0`}><IconComponent className={`h-8 w-8 ${visual.textColor}`} /></div>
            <h2 className={`text-3xl font-extrabold mb-1 ${expense.amount < 0 ? 'text-green-600' : 'text-slate-800 dark:text-slate-100'}`}>{Math.abs(expense.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h2>
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">{expense.amount < 0 ? 'Remboursement' : 'Dépense'}</p>
            <div className="w-full space-y-4 text-left">
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div><p className="text-xs text-slate-400 uppercase">Catégorie</p><p className="font-medium text-slate-700 dark:text-slate-200">{expense.category}</p></div>
                    <div className="text-right"><p className="text-xs text-slate-400 uppercase">Date</p><p className="font-medium text-slate-700 dark:text-slate-200 text-sm capitalize">{formattedDate}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                     <div className={`w-10 h-10 rounded-full ${expense.user === User.Sophie ? 'bg-pink-500' : (expense.user === User.Vincent ? 'bg-sky-500' : 'bg-emerald-500')} flex items-center justify-center text-white font-bold shadow-sm`}>{expense.user.charAt(0)}</div>
                     <div><p className="text-xs text-slate-400 uppercase">Payé par</p><p className="font-bold text-slate-800 dark:text-slate-100">{expense.user}</p></div>
                </div>
                <div className="space-y-3">
                    {parsedDetails.displayDescription && (<div><p className="text-xs text-slate-400 uppercase">Description</p><p className="font-medium text-slate-800 dark:text-slate-100 text-lg">{parsedDetails.displayDescription}</p></div>)}
                    {parsedDetails.store && !hasSubtractions && (<div><p className="text-xs text-slate-400 uppercase">Magasin</p><p className="font-medium text-slate-800 dark:text-slate-100 text-lg">{parsedDetails.store}</p></div>)}
                </div>
                {history.length > 0 && (
                    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0118 0z" /></svg>Historique</h3>
                        <div className="space-y-3">
                            {history.map(act => (
                                <div key={act.id} className="bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded-xl text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                         <span className="font-bold">
                                            <span className={getUserColor(act.performedBy)}>{act.performedBy}</span>
                                            <span className="text-slate-400 font-normal"> a {act.type === 'add' ? 'ajouté' : 'modifié'}</span>
                                         </span>
                                         <span className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {act.type === 'update' && (
                                        <div className="space-y-1">
                                            {renderDiffLine('Description', act.oldExpense?.description, act.expense.description)}
                                            {renderDiffLine("Montant", act.oldExpense?.amount, act.expense.amount, true)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex gap-3 w-full mt-8">
                <button onClick={onClose} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl">Fermer</button>
                <button onClick={onEdit} className="flex-1 py-3 px-4 bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"><EditIcon /><span>Modifier</span></button>
            </div>
         </div>
         <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-black/20 text-slate-500 transition-colors"><CloseIcon /></button>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;
