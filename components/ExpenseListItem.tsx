
import React from 'react';
import { type Expense, User, type Category } from '../types';
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
import PiggyBankIcon from './icons/PiggyBankIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import HistoryIcon from './icons/HistoryIcon';
import EditIcon from './icons/EditIcon';
import { type ModificationType } from '../App';
import EuroIcon from './icons/EuroIcon';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string } } = {
  "Dép. récurrentes": { icon: MandatoryIcon, color: 'bg-slate-500' },
  "Dép. recurentes": { icon: MandatoryIcon, color: 'bg-slate-500' },
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-500' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-500' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-500' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-500' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500' },
  "Vacances": { icon: PalmTreeIcon, color: 'bg-teal-500' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-400' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-indigo-500' },
  "Cadeau": { icon: GiftIcon, color: 'bg-fuchsia-500' },
  "Complément alimentaire": { icon: PillIcon, color: 'bg-emerald-500' },
  "Divers": { icon: MiscIcon, color: 'bg-cyan-500' },
};

const parseDescription = (fullDescription: string) => {
    const tagRegex = /(#\w+)/g;
    const description = fullDescription.replace(tagRegex, '').trim();
    return { description };
};

const ExpenseListItem: React.FC<{
    expense: Expense;
    onExpenseClick: (expense: Expense) => void;
    isHighlighted: boolean;
    modificationTypes?: ModificationType[];
}> = ({ expense, onExpenseClick, isHighlighted, modificationTypes }) => {
    const { description } = parseDescription(expense.description);

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(' ', ' - ');

    // Logic for styling based on User
    const isSophie = expense.user === User.Sophie;
    const isVincent = expense.user === User.Vincent;
    const isCommun = expense.user === User.Commun;

    let barColorClass = 'bg-slate-400';
    let cardStyleClass = 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700';
    let amountColorClass = 'text-slate-800 dark:text-slate-100';

    if (expense.amount < 0) {
        amountColorClass = 'text-emerald-600 dark:text-emerald-400';
    } else if (isSophie) {
        barColorClass = 'bg-pink-500';
        cardStyleClass = 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-100/90 dark:border-pink-900/30 hover:bg-pink-50 dark:hover:bg-pink-950/30';
        amountColorClass = 'text-pink-600 dark:text-pink-400';
    } else if (isVincent) {
        barColorClass = 'bg-blue-500';
        cardStyleClass = 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/90 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-950/30';
        amountColorClass = 'text-blue-600 dark:text-blue-400';
    } else if (isCommun) {
        barColorClass = 'bg-purple-500';
        cardStyleClass = 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100/90 dark:border-purple-900/30 hover:bg-purple-50 dark:hover:bg-purple-950/30';
        amountColorClass = 'text-purple-600 dark:text-purple-400';
    }

    // Logique spéciale pour Noël
    const isChristmas = (expense.category === 'Divers' && /no[uëe]l/i.test(expense.description)) || (expense.category === 'Cadeau' && /no[uëe]l/i.test(expense.description));
    const isBirthday = /anniversaire/i.test(expense.description);
    
    const lowerCaseDesc = expense.description.toLowerCase();
    const isMutuelle = lowerCaseDesc.includes('mutuelle');
    const isInternet = lowerCaseDesc.includes('internet');
    const isDeezer = lowerCaseDesc.includes('deezer');
    const isSfr = lowerCaseDesc.includes('sfr nathan');
    const isCeo = lowerCaseDesc.includes('ceo');
    const isTotalEnergies = lowerCaseDesc.includes('total energies');
    const isPoubelles = lowerCaseDesc.includes('poubelles');
    const isNetflix = lowerCaseDesc.includes('netflix');

    const visual = CategoryVisuals[expense.category] || CategoryVisuals["Divers"];
    let IconComponent = visual.icon;
    let iconBgClass = visual.color;

    if (isChristmas) {
        IconComponent = GiftIcon;
        iconBgClass = 'bg-red-600';
    } else if (isInternet) {
        IconComponent = WifiIcon;
    }
    
    const hasSubtractions = expense.category === 'Courses' && expense.subtracted_items && expense.subtracted_items.length > 0;

    let originalAmount = 0;
    if (hasSubtractions) {
        const totalSubtracted = expense.subtracted_items!.filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0);
        originalAmount = expense.amount + totalSubtracted;
    }

    return (
        <div
            onClick={() => onExpenseClick(expense)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onExpenseClick(expense); }}
            role="button"
            tabIndex={0}
            className={`
                p-3.5 sm:p-4 rounded-3xl border
                transition-all duration-200 ease-out cursor-pointer flex items-center justify-between shadow-xs hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${cardStyleClass}
                ${isHighlighted ? 'animate-highlight' : ''}
            `}
        >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                {/* Category Icon (UNTOUCHED / PRESERVED EXACTLY AS BEFORE) */}
                <div className="shrink-0">
                    {isPoubelles ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <TrashBinIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isBirthday ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <BirthdayIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isDeezer ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <MusicNoteIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isSfr ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <SfrIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isMutuelle ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <ShieldIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isCeo ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <CeoIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isTotalEnergies ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <TotalEnergiesIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isNetflix ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <NetflixIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : isInternet ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xs">
                            <WifiIcon className="w-full h-full rounded-full" />
                        </div>
                    ) : (
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full ${iconBgClass} shadow-xs`}>
                            <IconComponent className="h-6 w-6 text-white" />
                        </div>
                    )}
                </div>

                {/* Info Text */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg truncate tracking-tight" title={description}>{description}</p>
                        {modificationTypes && modificationTypes.length > 0 && (
                            <span className="shrink-0 flex items-center gap-1 text-slate-400 dark:text-slate-500" title="Cette dépense a été modifiée">
                                {modificationTypes.includes('date') && <HistoryIcon />}
                                {modificationTypes.includes('amount') && <EuroIcon />}
                                {modificationTypes.includes('other') && <EditIcon className="h-3.5 w-3.5" />}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-nowrap min-w-0 mt-0.5">
                        <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 truncate max-w-[100px] sm:max-w-[130px] shrink">
                            {(expense.category === 'Dépenses obligatoires' || expense.category === 'Dép. récurrentes') ? 'Dép. recurentes' : expense.category}
                        </span>
                        {isSophie && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100/90 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 text-xs font-bold shrink-0">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                <span>Sophie</span>
                            </span>
                        )}
                        {isVincent && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-bold shrink-0">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                <span>Vincent</span>
                            </span>
                        )}
                        {isCommun && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100/90 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 text-xs font-bold shrink-0">
                                <PiggyBankIcon className="w-3 h-3" />
                                <span>Cagnotte</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side Amount & Date */}
            <div className="flex items-center gap-1.5 shrink-0 text-right pl-2">
                <div>
                     {hasSubtractions ? (
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 line-through">
                                {originalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                            <ArrowRightIcon className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            <p className={`font-extrabold text-base sm:text-lg ${amountColorClass}`}>
                                {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                        </div>
                    ) : (
                        <p className={`font-extrabold text-base sm:text-lg ${amountColorClass}`}>
                            {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                    )}
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">{formattedDate}</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
};

export default ExpenseListItem;
