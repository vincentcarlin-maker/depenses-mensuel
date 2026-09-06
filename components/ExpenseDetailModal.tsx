
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
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, history = [], onClose, onEdit }) => {
  const { getVisual } = useCategoryVisuals();
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const resolvedVisual = getVisual(expense.category);
  const visual = resolvedVisual || CategoryVisuals[expense.category] || CategoryVisuals["Divers"];
  
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

  const getUserColor = (u: User) => u === User.Sophie ? 'text-pink-600 dark:text-pink-400' : (u === User.Vincent ? 'text-sky-600 dark:text-sky-400' : 'text-purple-600 dark:text-purple-400');

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
          <div className={`w-full h-16 sm:h-20 ${visual.bannerBg} relative`}>
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
          <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100/80 dark:border-sky-900/40 rounded-2xl flex items-center justify-between my-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500 text-white font-extrabold flex items-center justify-center text-base shrink-0 shadow-xs">
                {expense.user.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">PAYÉ PAR</p>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{expense.user}</p>
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
              <div className="space-y-2">
                {history.map(act => (
                  <div key={act.id} className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="font-bold">
                      <span className={getUserColor(act.performedBy)}>{act.performedBy}</span>
                      <span className="text-slate-500 font-normal"> a {act.type === 'add' ? 'ajouté' : 'modifié'}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(act.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(act.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm border border-slate-100 dark:border-slate-700/50">
                <div className="font-bold">
                  <span className={getUserColor(expense.user)}>{expense.user}</span>
                  <span className="text-slate-500 font-normal"> a ajouté</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(expense.created_at || expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(expense.created_at || expense.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
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
