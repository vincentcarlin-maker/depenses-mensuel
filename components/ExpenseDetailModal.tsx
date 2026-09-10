
import React, { useEffect, useMemo } from 'react';
import { type Expense, User, type Activity, type FoyerMember } from '../types';
import CloseIcon from './icons/CloseIcon';
import EditIcon from './icons/EditIcon';
import ScissorsIcon from './icons/ScissorsIcon';
import { resolveUserTheme } from '../utils/userColors';
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
    BirthdayIcon,
    ShieldIcon,
    WifiIcon,
    MusicNoteIcon,
    SfrIcon,
    CeoIcon,
    TotalEnergiesIcon,
    TrashBinIcon,
    NetflixIcon,
    PillIcon
} from './icons/CategoryIcons';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; textColor: string; bannerBg: string } } = {
  "Dépenses récurrentes": { icon: MandatoryIcon, color: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300', bannerBg: 'bg-slate-100/90 dark:bg-slate-700/60' },
  "Dép. recurentes": { icon: MandatoryIcon, color: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300', bannerBg: 'bg-slate-100/90 dark:bg-slate-700/60' },
  "Dép. récurrentes": { icon: MandatoryIcon, color: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300', bannerBg: 'bg-slate-100/90 dark:bg-slate-700/60' },
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300', bannerBg: 'bg-slate-100/90 dark:bg-slate-700/60' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-100 dark:bg-orange-500/20', textColor: 'text-orange-600 dark:text-orange-400', bannerBg: 'bg-orange-100/80 dark:bg-orange-950/40' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-100 dark:bg-red-500/20', textColor: 'text-red-600 dark:text-red-400', bannerBg: 'bg-red-100/80 dark:bg-red-950/40' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-100 dark:bg-green-500/20', textColor: 'text-green-600 dark:text-green-400', bannerBg: 'bg-green-100/80 dark:bg-green-950/40' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-100 dark:bg-purple-500/20', textColor: 'text-purple-600 dark:text-purple-400', bannerBg: 'bg-purple-100/80 dark:bg-purple-950/40' },
  "Vacances": { icon: PalmTreeIcon, color: 'bg-teal-100 dark:bg-teal-500/20', textColor: 'text-teal-600 dark:text-teal-400', bannerBg: 'bg-teal-100/80 dark:bg-teal-950/40' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-100 dark:bg-yellow-500/20', textColor: 'text-yellow-600 dark:text-yellow-400', bannerBg: 'bg-yellow-100/80 dark:bg-yellow-950/40' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-indigo-100 dark:bg-indigo-500/20', textColor: 'text-indigo-600 dark:text-indigo-400', bannerBg: 'bg-indigo-100/80 dark:bg-indigo-950/40' },
  "Cadeau": { icon: GiftIcon, color: 'bg-fuchsia-100 dark:bg-fuchsia-500/20', textColor: 'text-fuchsia-600 dark:text-fuchsia-400', bannerBg: 'bg-fuchsia-100/80 dark:bg-fuchsia-950/40' },
  "Complément alimentaire": { icon: PillIcon, color: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-600 dark:text-emerald-400', bannerBg: 'bg-emerald-100/80 dark:bg-emerald-950/40' },
  "Divers": { icon: MiscIcon, color: 'bg-cyan-100 dark:bg-cyan-500/20', textColor: 'text-cyan-600 dark:text-cyan-400', bannerBg: 'bg-cyan-100/80 dark:bg-cyan-950/40' },
};

interface ExpenseDetailModalProps {
  expense: Expense;
  history?: Activity[];
  onClose: () => void;
  onEdit: () => void;
  foyerMembers?: FoyerMember[];
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, history = [], onClose, onEdit, foyerMembers }) => {
  const { getVisual } = useCategoryVisuals();
  const userTheme = resolveUserTheme(expense.user, foyerMembers);
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const visual = getVisual(expense.category, expense.description);
  
  const lowerCaseDesc = expense.description.toLowerCase();
  const isChristmas = (expense.category === 'Divers' && /no[uëe]l/i.test(expense.description)) || (expense.category === 'Cadeau' && /no[uëe]l/i.test(expense.description));
  const isBirthday = /anniversaire/i.test(expense.description);
  const isMutuelle = lowerCaseDesc.includes('mutuelle');
  const isInternet = lowerCaseDesc.includes('internet');
  const isDeezer = lowerCaseDesc.includes('deezer');
  const isSfr = lowerCaseDesc.includes('sfr nathan');
  const isCeo = lowerCaseDesc.includes('ceo');
  const isTotalEnergies = lowerCaseDesc.includes('total energies');
  const isPoubelles = lowerCaseDesc.includes('poubelles');
  const isNetflix = lowerCaseDesc.includes('netflix');

  let IconComponent = visual.icon;
  let iconColorClass = visual.textColor;

  if (isChristmas) {
    IconComponent = GiftIcon;
    iconColorClass = 'text-red-600';
  } else if (isBirthday) {
    IconComponent = BirthdayIcon;
  } else if (isInternet) {
    IconComponent = WifiIcon;
    iconColorClass = '';
  } else if (isPoubelles) {
    IconComponent = TrashBinIcon;
    iconColorClass = '';
  } else if (isDeezer) {
    IconComponent = MusicNoteIcon;
    iconColorClass = '';
  } else if (isSfr) {
    IconComponent = SfrIcon;
    iconColorClass = '';
  } else if (isMutuelle) {
    IconComponent = ShieldIcon;
    iconColorClass = '';
  } else if (isCeo) {
    IconComponent = CeoIcon;
    iconColorClass = '';
  } else if (isTotalEnergies) {
    IconComponent = TotalEnergiesIcon;
    iconColorClass = '';
  } else if (isNetflix) {
    IconComponent = NetflixIcon;
    iconColorClass = '';
  }

  const hasSubtractions = expense.category === 'Courses' && expense.subtracted_items && expense.subtracted_items.length > 0;
  
  const { receiptTotal, totalSubtracted } = useMemo(() => {
      if (!hasSubtractions) return { receiptTotal: 0, totalSubtracted: 0 };
      const totalSub = expense.subtracted_items!.filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0);
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

  const dateObj = new Date(expense.date);
  const formattedDatePart = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  const formattedTimePart = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const getUserColor = (u: User | string) => {
    const theme = resolveUserTheme(u, foyerMembers);
    return theme.textClass;
  };

  const renderActivityChanges = (act: Activity) => {
    if (act.type === 'add') {
      return (
        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/50 dark:border-emerald-800/40">
            <span>Montant :</span>
            <span>{Math.abs(act.expense.amount ?? expense.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
          </span>
          {act.expense.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Cat.</span>
              <span>{act.expense.category}</span>
            </span>
          )}
          {act.expense.subtracted_items && act.expense.subtracted_items.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/50 dark:border-amber-800/40">
              <ScissorsIcon className="w-3 h-3 inline" />
              <span>{act.expense.subtracted_items.length} article(s) déduit(s)</span>
            </span>
          )}
        </div>
      );
    }

    if (act.type === 'delete') {
      return (
        <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200/50 dark:border-rose-800/40">
            <span>Dépense supprimée ({Math.abs(act.expense.amount ?? expense.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})</span>
          </span>
        </div>
      );
    }

    // Type === 'update'
    const oldExp = act.oldExpense;
    const newExp = act.expense;

    if (!oldExp) {
      return (
        <div className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 italic">
          Détails de la transaction mis à jour
        </div>
      );
    }

    const changeRows: React.ReactNode[] = [];

    // 1. Montant
    if (oldExp.amount !== undefined && newExp.amount !== undefined && oldExp.amount !== newExp.amount) {
      changeRows.push(
        <div key="amount" className="flex items-center justify-between gap-2 py-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Montant</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-rose-500 dark:text-rose-400 line-through bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md text-[11px]">
              {Math.abs(oldExp.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
            <span className="text-slate-400 text-xs">➔</span>
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md text-xs font-black">
              {Math.abs(newExp.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>
      );
    }

    // 2. Catégorie
    if (oldExp.category && newExp.category && oldExp.category !== newExp.category) {
      changeRows.push(
        <div key="category" className="flex items-center justify-between gap-2 py-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catégorie</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-rose-500 dark:text-rose-400 line-through bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md text-[11px]">
              {oldExp.category}
            </span>
            <span className="text-slate-400 text-xs">➔</span>
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md text-xs font-black">
              {newExp.category}
            </span>
          </div>
        </div>
      );
    }

    // 3. Description
    if (oldExp.description && newExp.description && oldExp.description !== newExp.description) {
      changeRows.push(
        <div key="description" className="flex flex-col gap-0.5 py-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
          <div className="flex items-center gap-1.5 font-medium flex-wrap">
            <span className="text-rose-500 dark:text-rose-400 line-through bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md text-[11px] break-all">
              {oldExp.description}
            </span>
            <span className="text-slate-400 text-xs">➔</span>
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md text-xs font-bold break-all">
              {newExp.description}
            </span>
          </div>
        </div>
      );
    }

    // 4. Payé par
    if (oldExp.user && newExp.user && oldExp.user !== newExp.user) {
      changeRows.push(
        <div key="user" className="flex items-center justify-between gap-2 py-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payé par</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-rose-500 dark:text-rose-400 line-through bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md text-[11px]">
              {oldExp.user}
            </span>
            <span className="text-slate-400 text-xs">➔</span>
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md text-xs font-black">
              {newExp.user}
            </span>
          </div>
        </div>
      );
    }

    // 5. Date
    if (oldExp.date && newExp.date) {
      const oldD = new Date(oldExp.date);
      const newD = new Date(newExp.date);
      if (Math.abs(oldD.getTime() - newD.getTime()) > 60000) {
        const fmtOld = oldD.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + oldD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const fmtNew = newD.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + newD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        changeRows.push(
          <div key="date" className="flex items-center justify-between gap-2 py-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-rose-500 dark:text-rose-400 line-through bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md text-[11px]">
                {fmtOld}
              </span>
              <span className="text-slate-400 text-xs">➔</span>
              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md text-xs font-black">
                {fmtNew}
              </span>
            </div>
          </div>
        );
      }
    }

    // 6. Subtracted items (Articles déduits ou supprimés du ticket)
    const oldItems = oldExp.subtracted_items || [];
    const newItems = newExp.subtracted_items || [];
    
    // Articles déduits supprimés
    oldItems.forEach((oldIt, idx) => {
      const stillExists = newItems.some(n => n.description === oldIt.description && Math.abs(n.amount - oldIt.amount) < 0.01);
      if (!stillExists) {
        changeRows.push(
          <div key={`del_item_${idx}`} className="flex items-center gap-1.5 py-1 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-200/50 dark:border-rose-900/50">
            <span className="font-extrabold text-sm">🗑️</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-500">Article déduit supprimé</span>
              <span className="font-medium line-through">{oldIt.description} ({oldIt.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})</span>
            </div>
          </div>
        );
      }
    });

    // Articles déduits ajoutés
    newItems.forEach((newIt, idx) => {
      const wasExisting = oldItems.some(o => o.description === newIt.description && Math.abs(o.amount - newIt.amount) < 0.01);
      if (!wasExisting) {
        changeRows.push(
          <div key={`add_item_${idx}`} className="flex items-center gap-1.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50">
            <span className="font-extrabold text-sm">➕</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-500">Article déduit ajouté</span>
              <span className="font-bold">{newIt.description} ({newIt.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})</span>
            </div>
          </div>
        );
      }
    });

    if (changeRows.length === 0) {
      return (
        <div className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 italic">
          Mise à jour des informations
        </div>
      );
    }

    return (
      <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 space-y-1">
        {changeRows}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[150] flex justify-center items-center p-4">
      <div className="fixed inset-0" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl z-[151] w-full max-w-md animate-fade-in relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Grab Handle */}
        <div className="pt-2 pb-1 bg-white dark:bg-slate-800 shrink-0">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto"></div>
        </div>

        {/* Top Header Banner & Category Icon */}
        <div className="relative shrink-0">
          <div className={`w-full h-16 sm:h-20 ${visual.bannerBg || visual.badgeBg || 'bg-slate-100 dark:bg-slate-700/60'} relative`}>
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-700/90 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors shadow-xs"
              title="Fermer"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Floating Icon Container */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-md border border-slate-100/80 dark:border-slate-700/80 flex items-center justify-center -mt-8 sm:-mt-10 mx-auto relative z-10">
            <IconComponent className={`h-8 w-8 sm:h-10 sm:w-10 ${iconColorClass}`} />
          </div>
        </div>

        {/* Main Content Body */}
        <div className="px-6 pb-6 pt-3 overflow-y-auto flex-1">
          {/* Amount */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-center">
            {Math.abs(expense.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </h2>

          {/* Type Badge */}
          <div className="text-center mt-1.5 mb-5">
            <span className="px-3.5 py-1 bg-orange-100/70 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-extrabold text-[11px] tracking-wider uppercase rounded-full inline-block">
              {expense.amount < 0 ? 'REMBOURSEMENT' : 'DÉPENSE'}
            </span>
          </div>

          {/* 2-Column Section: CATÉGORIE & DATE */}
          <div className="grid grid-cols-2 gap-3 py-3 relative border-t border-b border-slate-100 dark:border-slate-700/60">
            {/* Category Column */}
            <div className="flex items-center gap-2 sm:gap-2.5 pr-1 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-500 shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">CATÉGORIE</p>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-base leading-tight mt-0.5 break-words">
                  {(expense.category === 'Dépenses obligatoires' || expense.category === 'Dép. récurrentes') ? 'Dép. recurentes' : expense.category}
                </p>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="absolute top-3 bottom-3 left-1/2 -ml-px w-px bg-slate-100 dark:bg-slate-700/60"></div>

            {/* Date Column */}
            <div className="flex items-center gap-2 sm:gap-2.5 pl-2 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-500 shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">DATE</p>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm capitalize mt-0.5 leading-tight">
                  {formattedDatePart}
                  <span className="block text-slate-400 dark:text-slate-500 font-normal text-[10px] sm:text-[11px] mt-0.5">à {formattedTimePart}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card: PAYÉ PAR */}
          <div className={`p-3.5 ${userTheme.lightBgClass} border ${userTheme.borderClass} rounded-2xl flex items-center justify-between my-4`}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full text-white font-extrabold flex items-center justify-center text-base shrink-0 shadow-xs"
                style={{ backgroundColor: userTheme.hex }}
              >
                {expense.user.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">PAYÉ PAR</p>
                <p className={`font-extrabold text-base ${userTheme.textClass}`}>{expense.user}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Section: DESCRIPTION */}
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-500 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">DESCRIPTION</p>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base mt-0.5">
                {parsedDetails.displayDescription || parsedDetails.store || expense.description}
              </p>
            </div>
          </div>

          {/* Subtracted ticket details if any */}
          {hasSubtractions && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-300">
                <ScissorsIcon />
                <h4 className="font-bold text-sm uppercase tracking-wider">Détail du ticket</h4>
              </div>
              <div className="space-y-2 mb-3">
                {expense.subtracted_items!.map((item, idx) => (
                  <div key={idx} className={`flex justify-between items-center text-sm ${item.is_subtracted !== false ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                    <div className="flex flex-col">
                      <span className={item.is_subtracted !== false ? 'line-through opacity-70' : ''}>{item.description}</span>
                      {item.target_category && (
                        <span className="text-[11px] text-sky-600 dark:text-sky-400 font-normal">➡️ Réattribué en {item.target_category}</span>
                      )}
                    </div>
                    <span>{item.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-600 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Total ticket</span>
                  <span>{receiptTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                <div className="flex justify-between text-sm text-red-500 dark:text-red-400 font-medium">
                  <span>Articles déduits</span>
                  <span>-{totalSubtracted.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-800 dark:text-slate-100 pt-1">
                  <span>Montant final</span>
                  <span>{expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section: HISTORIQUE */}
          <div className="mt-5 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>HISTORIQUE</span>
            </div>

            {history && history.length > 0 ? (
              <div className="space-y-2.5">
                {history.map(act => (
                  <div key={act.id} className="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-2xl text-xs sm:text-sm border border-slate-100 dark:border-slate-700/60 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={getUserColor(act.performedBy)}>{act.performedBy}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">
                          {act.type === 'add' ? 'a créé la transaction' : act.type === 'delete' ? 'a supprimé la transaction' : 'a modifié la transaction'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(act.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(act.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {renderActivityChanges(act)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-2xl text-xs sm:text-sm border border-slate-100 dark:border-slate-700/60 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className={getUserColor(expense.user)}>{expense.user}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal"> a créé la transaction</span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {new Date(expense.created_at || expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(expense.created_at || expense.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/50 dark:border-emerald-800/40">
                    <span>Montant :</span>
                    <span>{Math.abs(expense.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </span>
                  {expense.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Cat.</span>
                      <span>{expense.category}</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full mt-6 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm sm:text-base rounded-2xl transition-colors text-center"
            >
              Fermer
            </button>
            <button
              onClick={onEdit}
              className="flex-1 py-3.5 px-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition-all"
            >
              <EditIcon />
              <span>Modifier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;
