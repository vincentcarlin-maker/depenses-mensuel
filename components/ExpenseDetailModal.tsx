

import React, { useEffect, useMemo } from 'react';
import { type Expense, User, type Activity } from '../types';
import CloseIcon from './icons/CloseIcon';
import EditIcon from './icons/EditIcon';
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
    BirthdayIcon
} from './icons/CategoryIcons';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; textColor: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-100 dark:bg-orange-500/20', textColor: 'text-orange-600 dark:text-orange-400' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-100 dark:bg-red-500/20', textColor: 'text-red-600 dark:text-red-400' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-100 dark:bg-green-500/20', textColor: 'text-green-600 dark:text-green-400' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-100 dark:bg-purple-500/20', textColor: 'text-purple-600 dark:text-purple-400' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-100 dark:bg-yellow-500/20', textColor: 'text-yellow-600 dark:text-yellow-400' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-indigo-100 dark:bg-indigo-500/20', textColor: 'text-indigo-600 dark:text-indigo-400' },
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
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const visual = CategoryVisuals[expense.category] || CategoryVisuals["Divers"];
  const IconComponent = visual.icon;
  
  // Parsing logic similar to EditExpenseModal to display fields cleanly
  const parsedDetails = useMemo(() => {
      let displayDescription = expense.description;
      let store = '';
      let person = '';
      let occasion = '';
      let vehicle = '';
      let heating = '';

      if (expense.category === 'Courses') {
          const storeRegex = /\s\(([^)]+)\)$/;
          const match = expense.description.match(storeRegex);
          if (match && expense.description.startsWith('Courses')) { 
              store = match[1];
          } else {
              store = expense.description;
          }
          displayDescription = ''; // Hide generic description if it's just store name
      } else if (expense.category === 'Chauffage') {
          const typeRegex = /\s\(([^)]+)\)$/;
          const match = expense.description.match(typeRegex);
          if (match) {
              heating = match[1];
              displayDescription = '';
          }
      } else if (expense.category === 'Réparation voitures') {
          const carRegex = /\s\(([^)]+)\)$/;
          const match = expense.description.match(carRegex);
          if (match) {
              vehicle = match[1];
              displayDescription = expense.description.replace(carRegex, '').trim();
          }
      } else if (expense.category === 'Vêtements') {
          const personRegex = /\s\(([^)]+)\)$/;
          const match = expense.description.match(personRegex);
          if (match) {
              person = match[1];
              displayDescription = expense.description.replace(personRegex, '').trim();
          }
      } else if (expense.category === 'Cadeau') {
          const detailsRegex = /\s\(([^)]+)\s-\s([^)]+)\)$/;
          const match = expense.description.match(detailsRegex);
          if (match) {
              person = match[1];
              occasion = match[2];
              displayDescription = expense.description.replace(detailsRegex, '').trim();
          }
      } else if (expense.category === 'Carburant') {
          // Usually description IS the car name for fuel
      }

      return { displayDescription, store, person, occasion, vehicle, heating };
  }, [expense]);

  const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  });

  const userColorClass = expense.user === User.Sophie ? 'bg-rose-500' : 'bg-sky-500';
  const isRefund = expense.amount < 0;

  const renderDiffLine = (label: string, oldVal: any, newVal: any, isCurrency = false) => {
      if (oldVal === newVal || oldVal === undefined) return null;

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
                     {formatVal(oldVal)}
                 </span>
                 
                 <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold tracking-wider self-center bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">APRÈS</span>
                 <span className="font-bold text-slate-800 dark:text-slate-100 text-sm self-center break-all">
                     {formatVal(newVal)}
                 </span>
             </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl z-50 w-full max-w-md m-4 animate-fade-in relative overflow-hidden flex flex-col max-h-[90vh]">
         {/* Header Background Accent */}
         <div className={`absolute top-0 left-0 w-full h-24 ${visual.color} opacity-50`}></div>
         
         <div className="relative flex flex-col items-center text-center pt-4 overflow-y-auto">
            {/* Category Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white dark:bg-slate-700 mb-4 flex-shrink-0`}>
                <IconComponent className={`h-8 w-8 ${visual.textColor}`} />
            </div>
            
            {/* Amount */}
            <h2 className={`text-3xl font-extrabold mb-1 ${isRefund ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {Math.abs(expense.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </h2>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-6 ${isRefund ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded' : 'text-slate-400 dark:text-slate-500'}`}>
                {isRefund ? 'Remboursement' : 'Dépense'}
            </p>

            {/* Details Grid */}
            <div className="w-full space-y-4 text-left">
                
                {/* Category & Date */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Catégorie</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{expense.category}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Date</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm capitalize">{formattedDate}</p>
                    </div>
                </div>

                {/* User */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                     <div className={`w-10 h-10 rounded-full ${userColorClass} flex items-center justify-center text-white font-bold shadow-sm`}>
                        {expense.user.charAt(0)}
                     </div>
                     <div>
                         <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Payé par</p>
                         <p className="font-bold text-slate-800 dark:text-slate-100">{expense.user}</p>
                     </div>
                </div>

                {/* Dynamic Fields */}
                <div className="space-y-3">
                    {parsedDetails.displayDescription && (
                        <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Description</p>
                            <p className="font-medium text-slate-800 dark:text-slate-100 text-lg">{parsedDetails.displayDescription}</p>
                        </div>
                    )}
                    
                    {parsedDetails.store && (
                        <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Magasin</p>
                            <p className="font-medium text-slate-800 dark:text-slate-100 text-lg">{parsedDetails.store}</p>
                        </div>
                    )}
                    
                    {(parsedDetails.person || parsedDetails.occasion) && (
                        <div className="flex gap-4">
                            {parsedDetails.person && (
                                <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Pour</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{parsedDetails.person}</p>
                                </div>
                            )}
                            {parsedDetails.occasion && (
                                <div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Occasion</p>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{parsedDetails.occasion}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {parsedDetails.vehicle && (
                        <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Véhicule</p>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{parsedDetails.vehicle}</p>
                        </div>
                    )}
                     {parsedDetails.heating && (
                        <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase">Type</p>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{parsedDetails.heating}</p>
                        </div>
                    )}
                </div>

                {/* Modification History */}
                {history.length > 0 && (
                    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             Historique des modifications
                        </h3>
                        <div className="space-y-4">
                            {history.map(act => (
                                <div key={act.id} className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl text-sm">
                                    <div className="flex justify-between items-start mb-1 pb-2 border-b border-slate-200 dark:border-slate-600">
                                         <span className={`font-bold ${act.expense.user === User.Sophie ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
                                             {act.expense.user}
                                         </span>
                                         <span className="text-xs text-slate-400">
                                             {new Date(act.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                         </span>
                                    </div>
                                    <div className="space-y-1">
                                        {/* Smart label for description based on category */}
                                        {renderDiffLine(
                                            act.expense.category === 'Courses' ? 'Magasin' : 'Description', 
                                            act.oldExpense?.description, 
                                            act.expense.description
                                        )}
                                        {renderDiffLine("Montant", act.oldExpense?.amount, act.expense.amount, true)}
                                        {renderDiffLine("Catégorie", act.oldExpense?.category, act.expense.category)}
                                        {renderDiffLine("Date", 
                                            act.oldExpense?.date ? new Date(act.oldExpense.date).toLocaleDateString('fr-FR') : undefined,
                                            new Date(act.expense.date!).toLocaleDateString('fr-FR')
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full mt-8">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                    Fermer
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 py-3 px-4 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
                >
                    <EditIcon />
                    <span>Modifier</span>
                </button>
            </div>

         </div>
         
         {/* Top Right Close (Optional secondary) */}
         <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/50 dark:bg-black/20 text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
         >
             <CloseIcon />
         </button>

      </div>
    </div>
  );
};

export default ExpenseDetailModal;