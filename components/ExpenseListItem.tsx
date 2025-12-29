
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
    BirthdayIcon,
    ShieldIcon,
    WifiIcon,
    MusicNoteIcon,
    SfrIcon,
    CeoIcon,
    TotalEnergiesIcon,
    TrashBinIcon
} from './icons/CategoryIcons';
import PiggyBankIcon from './icons/PiggyBankIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import HistoryIcon from './icons/HistoryIcon';
import EditIcon from './icons/EditIcon';
import { type ModificationType } from '../App';
import EuroIcon from './icons/EuroIcon';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-500' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-500' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-500' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-500' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-400' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-indigo-500' },
  "Cadeau": { icon: GiftIcon, color: 'bg-fuchsia-500' },
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
    // Fallback for "Commun" or others
    const isCommun = expense.user === User.Commun;

    let userColorClass = 'bg-slate-500';
    let userStyleClass = '';

    if (isSophie) {
        userColorClass = 'bg-pink-500';
        userStyleClass = 'bg-pink-50/60 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20 hover:bg-pink-100 dark:hover:bg-pink-500/20 hover:border-pink-200 dark:hover:border-pink-500/30';
    } else if (isVincent) {
        userColorClass = 'bg-sky-500';
        userStyleClass = 'bg-sky-50/60 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20 hover:border-sky-200 dark:hover:border-sky-500/30';
    } else if (isCommun) {
        userColorClass = 'bg-emerald-500';
        userStyleClass = 'bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-200 dark:hover:border-emerald-500/30';
    }
    
    const amountColorClass = expense.amount < 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-slate-800 dark:text-slate-100';

    // Logique spéciale pour Noël
    const isChristmas = (expense.category === 'Divers' && /no[uëe]l/i.test(expense.description)) || (expense.category === 'Cadeau' && /no[uëe]l/i.test(expense.description));
    const isBirthday = expense.category === 'Cadeau' && /anniversaire/i.test(expense.description);
    
    const lowerCaseDesc = expense.description.toLowerCase();
    const isMutuelle = lowerCaseDesc.includes('mutuelle');
    const isInternet = lowerCaseDesc.includes('internet');
    const isDeezer = lowerCaseDesc.includes('deezer');
    const isSfr = lowerCaseDesc.includes('sfr nathan');
    const isCeo = lowerCaseDesc.includes('ceo');
    const isTotalEnergies = lowerCaseDesc.includes('total energies');
    const isPoubelles = lowerCaseDesc.includes('poubelles');

    const visual = CategoryVisuals[expense.category] || CategoryVisuals["Divers"];
    let IconComponent = visual.icon;
    let iconBgClass = visual.color;

    if (isChristmas) {
        IconComponent = GiftIcon;
        iconBgClass = 'bg-red-600';
    } else if (isBirthday) {
        IconComponent = BirthdayIcon;
    } else if (isInternet) {
        IconComponent = WifiIcon;
    }
    
    const hasSubtractions = expense.category === 'Courses' && expense.subtracted_items && expense.subtracted_items.length > 0;

    let originalAmount = 0;
    if (hasSubtractions) {
        const totalSubtracted = expense.subtracted_items!.reduce((sum, item) => sum + item.amount, 0);
        originalAmount = expense.amount + totalSubtracted;
    }

    return (
        <div
            onClick={() => onExpenseClick(expense)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onExpenseClick(expense); }}
            role="button"
            tabIndex={0}
            className={`
                flex items-center p-3 rounded-xl border
                transition-all duration-200 ease-out cursor-pointer 
                focus:outline-none focus:ring-2 focus:ring-cyan-500
                ${userStyleClass}
                ${isHighlighted ? 'animate-highlight' : ''}
            `}
        >
            <div className={`w-1.5 h-10 rounded-full mr-3 ${userColorClass} shadow-sm`}></div>
            <div className="mr-3 flex-shrink-0">
                {isPoubelles ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <TrashBinIcon className="w-full h-full rounded-full" />
                    </div>
                ) : isDeezer ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <MusicNoteIcon className="w-full h-full rounded-full" />
                    </div>
                ) : isSfr ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <SfrIcon className="w-full h-full rounded-full" />
                    </div>
                ) : isMutuelle ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <ShieldIcon className="w-full h-full rounded-full" />
                    </div>
                ) : isCeo ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <CeoIcon className="w-full h-full rounded-full" />
                    </div>
                ) : isTotalEnergies ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <TotalEnergiesIcon className="w-full h-full rounded-full" />
                    </div>
                ) : expense.category === "Carburant" ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <FuelIcon className="w-full h-full rounded-full" />
                    </div>
                ) : expense.category === "Réparation voitures" ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <CarRepairsIcon className="w-full h-full rounded-full" />
                    </div>
                ) : expense.category === "Vêtements" ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <ClothingIcon className="w-full h-full rounded-full" />
                    </div>
                ) : isInternet ? (
                    <div className="w-10 h-10 rounded-full shadow-sm">
                        <WifiIcon className="w-full h-full rounded-full" />
                    </div>
                ) : (
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBgClass} shadow-sm`}>
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-1.5">
                    {isCommun && <PiggyBankIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    <p className="font-semibold truncate text-slate-700 dark:text-slate-200" title={description}>{description}</p>
                    {modificationTypes && modificationTypes.length > 0 && (
                        <span className="flex-shrink-0 flex items-center gap-1 text-slate-400 dark:text-slate-500" title="Cette dépense a été modifiée">
                            {modificationTypes.includes('date') && <HistoryIcon />}
                            {modificationTypes.includes('amount') && <EuroIcon />}
                            {modificationTypes.includes('other') && <EditIcon className="h-3.5 w-3.5" />}
                        </span>
                    )}
                 </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={expense.category}>{expense.category}</p>
            </div>
            <div className="pl-4 flex-shrink-0 text-right">
                 {hasSubtractions ? (
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                            {originalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                        <ArrowRightIcon className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        <p className={`font-bold ${amountColorClass}`}>
                            {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                ) : (
                    <p className={`font-bold ${amountColorClass}`}>
                        {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formattedDate}</p>
            </div>
        </div>
    );
};

export default ExpenseListItem;
