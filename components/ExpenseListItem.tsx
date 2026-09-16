
import React from 'react';
import { type Expense, User, type FoyerMember } from '../types';
import { GiftIcon } from './icons/CategoryIcons';
import PiggyBankIcon from './icons/PiggyBankIcon';
import HistoryIcon from './icons/HistoryIcon';
import EditIcon from './icons/EditIcon';
import { type ModificationType } from '../App';
import EuroIcon from './icons/EuroIcon';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';
import { resolveUserTheme } from '../utils/userColors';
import { type Profile } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

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
    foyerMembers?: FoyerMember[];
    profiles?: Profile[];
    showCategory?: boolean;
    showUserBadge?: boolean;
}> = ({ expense, onExpenseClick, isHighlighted, modificationTypes, foyerMembers, profiles, showCategory = false, showUserBadge = false }) => {
    const { isMonthlyExpenseBold } = useTheme();
    const { getVisual } = useCategoryVisuals();
    const { description } = parseDescription(expense.description);

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(' ', ' - ');

    // Logic for styling based on User and their assigned color
    const isCommun = expense.user === User.Commun || String(expense.user).toLowerCase() === 'commun' || String(expense.user).toLowerCase() === 'cagnotte';
    const userTheme = resolveUserTheme(expense.user, foyerMembers, profiles);

    let cardStyleClass = `${userTheme.lightBgClass} ${userTheme.borderClass} hover:opacity-95`;
    let amountColorClass = userTheme.textClass;

    if (expense.amount < 0) {
        amountColorClass = 'text-emerald-600 dark:text-emerald-400';
    }

    // Logique spéciale pour Noël
    const isChristmas = (expense.category === 'Divers' && /no[uëe]l/i.test(expense.description)) || (expense.category === 'Cadeau' && /no[uëe]l/i.test(expense.description));
    
    const visual = getVisual(expense.category, expense.description);
    let IconComponent = visual.icon;
    let iconBgClass = visual.color;
    let isFullBadge = visual.isFullBadge;

    if (isChristmas) {
        IconComponent = GiftIcon;
        iconBgClass = 'bg-red-600';
        isFullBadge = false;
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
                p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border
                transition-all duration-200 ease-out cursor-pointer flex items-center justify-between shadow-xs hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${cardStyleClass}
                ${isHighlighted ? 'animate-highlight' : ''}
            `}
        >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1 pr-2">
                {/* Category Icon */}
                <div className="shrink-0">
                    {isFullBadge ? (
                        <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full shadow-xs">
                            <IconComponent className="w-full h-full rounded-full" />
                        </div>
                    ) : (
                        <div className={`w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center rounded-full ${iconBgClass} shadow-xs`}>
                            <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                    )}
                </div>

                {/* Info Text */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1.5 justify-between">
                        <p className={`text-slate-900 dark:text-slate-100 text-[15px] sm:text-base md:text-lg leading-snug line-clamp-2 break-words expense-item-title ${isMonthlyExpenseBold ? 'font-extrabold' : 'font-semibold'}`} title={description}>{description}</p>
                        {modificationTypes && modificationTypes.length > 0 && (
                            <span className="shrink-0 flex items-center gap-1 text-slate-400 dark:text-slate-500 mt-0.5" title="Cette dépense a été modifiée">
                                {modificationTypes.includes('date') && <HistoryIcon />}
                                {modificationTypes.includes('amount') && <EuroIcon />}
                                {modificationTypes.includes('other') && <EditIcon className="h-3.5 w-3.5" />}
                            </span>
                        )}
                    </div>
                    {(showCategory || showUserBadge) && (
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 mt-1">
                            {showCategory && (
                                <span className={`text-xs sm:text-sm text-slate-600 dark:text-slate-300 expense-monthly-badge ${isMonthlyExpenseBold ? 'font-semibold' : 'font-medium'}`}>
                                    {(expense.category === 'Dépenses obligatoires' || expense.category === 'Dép. récurrentes') ? 'Dép. recurentes' : expense.category}
                                </span>
                            )}
                            {showUserBadge && (
                                isCommun ? (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs sm:text-[13px] expense-monthly-badge shrink-0 ${isMonthlyExpenseBold ? 'font-bold' : 'font-semibold'}`}>
                                        <PiggyBankIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>Cagnotte</span>
                                    </span>
                                ) : (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-[13px] expense-monthly-badge shrink-0 ${userTheme.badgeClass} ${isMonthlyExpenseBold ? 'font-bold' : 'font-semibold'}`}>
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                        <span>{expense.user}</span>
                                    </span>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side Amount & Date */}
            <div className="flex items-center gap-1.5 shrink-0 text-right pl-2">
                <div>
                     {hasSubtractions ? (
                        <div className="flex flex-col items-end justify-center">
                            <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 line-through leading-tight">
                                {originalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                            <p className={`text-base sm:text-lg md:text-xl expense-item-amount ${amountColorClass} ${isMonthlyExpenseBold ? 'font-black' : 'font-bold'}`}>
                                {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                        </div>
                     ) : (
                        <p className={`text-base sm:text-lg md:text-xl expense-item-amount ${amountColorClass} ${isMonthlyExpenseBold ? 'font-black' : 'font-bold'}`}>
                            {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                    )}
                    <p className={`text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap ${isMonthlyExpenseBold ? 'font-semibold' : 'font-medium'}`}>{formattedDate}</p>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400/80 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
};

export default ExpenseListItem;
