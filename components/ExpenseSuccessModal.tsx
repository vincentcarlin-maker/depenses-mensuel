import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { type Expense } from '../types';
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
    PalmTreeIcon, 
    PillIcon 
} from './icons/CategoryIcons';

interface ExpenseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onViewExpense?: (expense: Expense) => void;
  title?: string;
  subtitle?: string;
}

const CategoryVisuals: { 
  [key: string]: { 
    icon: React.FC<{ className?: string }>; 
    bg: string; 
    textColor: string; 
  } 
} = {
  "Dép. recurentes": { icon: MandatoryIcon, bg: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300' },
  "Dép. récurrentes": { icon: MandatoryIcon, bg: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300' },
  "Dépenses obligatoires": { icon: MandatoryIcon, bg: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300' },
  "Carburant": { icon: FuelIcon, bg: 'bg-orange-100 dark:bg-orange-500/20', textColor: 'text-orange-500 dark:text-orange-400' },
  "Chauffage": { icon: HeatingIcon, bg: 'bg-red-100 dark:bg-red-500/20', textColor: 'text-red-500 dark:text-red-400' },
  "Courses": { icon: GroceriesIcon, bg: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-500 dark:text-emerald-400' },
  "Restaurant": { icon: RestaurantIcon, bg: 'bg-purple-100 dark:bg-purple-500/20', textColor: 'text-purple-500 dark:text-purple-400' },
  "Vacances": { icon: PalmTreeIcon, bg: 'bg-teal-100 dark:bg-teal-500/20', textColor: 'text-teal-500 dark:text-teal-400' },
  "Réparation voitures": { icon: CarRepairsIcon, bg: 'bg-yellow-100 dark:bg-yellow-500/20', textColor: 'text-yellow-600 dark:text-yellow-400' },
  "Vêtements": { icon: ClothingIcon, bg: 'bg-indigo-100 dark:bg-indigo-500/20', textColor: 'text-indigo-500 dark:text-indigo-400' },
  "Cadeau": { icon: GiftIcon, bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/20', textColor: 'text-fuchsia-500 dark:text-fuchsia-400' },
  "Complément alimentaire": { icon: PillIcon, bg: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-500 dark:text-emerald-400' },
  "Divers": { icon: MiscIcon, bg: 'bg-cyan-100 dark:bg-cyan-500/20', textColor: 'text-cyan-500 dark:text-cyan-400' },
};

export const ExpenseSuccessModal: React.FC<ExpenseSuccessModalProps> = ({
  isOpen,
  onClose,
  expense,
  onViewExpense,
  title,
  subtitle,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Gérer l'ouverture et fermeture dynamique
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      // Fermer le clavier virtuel mobile pour centrage parfait
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.style.overflow = 'hidden';
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        document.body.style.overflow = 'auto';
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback((callback?: () => void) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      document.body.style.overflow = 'auto';
      onClose();
      if (callback) callback();
    }, 200);
  }, [onClose]);

  // Écoute de la touche Échap
  useEffect(() => {
    if (!isRendered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendered, handleClose]);

  if (!isRendered || !expense) return null;

  const visual = CategoryVisuals[expense.category] || CategoryVisuals["Divers"];
  const CategoryIcon = visual.icon;

  const isIncome = expense.amount < 0;
  const absAmount = Math.abs(expense.amount);
  const formattedAmount = `${absAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  const modalTitle = title || (isIncome ? 'Remboursement ajouté' : 'Dépense ajoutée');
  const modalSubtitle = subtitle || (isIncome ? 'Votre remboursement a bien été enregistré.' : 'Votre dépense a bien été enregistrée.');

  return createPortal(
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-4" 
      aria-modal="true" 
      role="dialog"
    >
      {/* Backdrop semi-transparent avec flou d'arrière-plan */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer ${
          isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
        onClick={() => handleClose()}
        aria-hidden="true"
      />

      {/* Boîte de dialogue dynamique */}
      <div 
        className={`relative z-10 w-full max-w-[340px] sm:max-w-[360px] bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-700/70 text-center select-none transform transition-all ${
          isClosing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        {/* Graphique de célébration : checkmark vert menthe avec rayons de burst */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          {/* Rayons de célébration / burst étincelles */}
          <div className="absolute inset-0 pointer-events-none animate-burst-pulse">
            <svg viewBox="0 0 80 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Rayons supérieur-gauche / supérieur-droit */}
              <line x1="22" y1="22" x2="16" y2="16" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="58" y1="22" x2="64" y2="16" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
              
              {/* Rayons latéraux gauche / droite */}
              <line x1="14" y1="40" x2="7" y2="40" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="66" y1="40" x2="73" y2="40" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
              
              {/* Rayons inférieur-gauche / inférieur-droit */}
              <line x1="22" y1="58" x2="17" y2="63" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="58" y1="58" x2="63" y2="63" stroke="#86efac" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Cercle vert pastel central */}
          <div className="w-14 h-14 rounded-full bg-[#dcfce7] dark:bg-emerald-950/70 flex items-center justify-center shadow-sm relative z-10 animate-check-pop">
            <svg 
              className="w-7 h-7 text-[#10b981]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Titre et Sous-titre */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-3">
          {modalTitle}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
          {modalSubtitle}
        </p>

        {/* Carte récapitulative de la dépense enregistrée */}
        <div className="mt-5 bg-[#f8fafc] dark:bg-slate-700/50 border border-slate-100/90 dark:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left">
          {/* Icône de catégorie dans son badge rond coloré */}
          <div className={`w-11 h-11 rounded-full ${visual.bg} ${visual.textColor} flex items-center justify-center shrink-0`}>
            <CategoryIcon className="w-6 h-6" />
          </div>

          {/* Nom de la catégorie et description/commerce */}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 dark:text-white text-base leading-tight truncate">
              {expense.category}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5 font-medium">
              {expense.description || expense.category}
            </div>
          </div>

          {/* Montant formaté */}
          <div className="font-bold text-base sm:text-lg text-slate-900 dark:text-white shrink-0 text-right">
            {formattedAmount}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-5 space-y-2.5">
          {/* Bouton principal "OK" */}
          <button
            type="button"
            onClick={() => handleClose()}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-semibold py-3.5 px-4 rounded-2xl shadow-sm text-base transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 cursor-pointer"
          >
            OK
          </button>

          {/* Bouton secondaire "Voir la dépense" */}
          {onViewExpense && (
            <button
              type="button"
              onClick={() => handleClose(() => onViewExpense(expense))}
              className="w-full bg-[#eff6ff] hover:bg-[#dbeafe] active:bg-[#bfdbfe] dark:bg-slate-700/90 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-[#2563eb] dark:text-blue-400 font-semibold py-3.5 px-4 rounded-2xl text-base transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/50 cursor-pointer"
            >
              Voir la dépense
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExpenseSuccessModal;
