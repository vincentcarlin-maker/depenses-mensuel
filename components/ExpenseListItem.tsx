
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
    BirthdayIcon
} from './icons/CategoryIcons';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-500' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-500' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-500' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-500' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-500' },
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
}> = ({ expense, onExpenseClick, isHighlighted }) => {
    const { description } = parseDescription(expense.description);

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(' ', ' - ');

    const isSophie = expense.user === User.Sophie;
    const userColorClass = isSophie ? 'bg-pink-500' : 'bg-sky-500';
    
    // Add background tint and border based on user for better distinction
    const userStyleClass = isSophie 
        ? 'bg-pink-50/60 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20 hover:bg-pink-100 dark:hover:bg-pink-500/20 hover:border-pink-200 dark:hover:border-pink-500/30'
        : 'bg-sky-50/60 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20 hover:border-sky-200 dark:hover:border-sky-500/30';
    
    const amountColorClass = expense.amount < 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-slate-800 dark:text-slate-100';

    // Logique spéciale pour Noël
    const isChristmas = (expense.category === 'Divers' && /no[uëe]l/i.test(expense.description)) || (expense.category === 'Cadeau' && /no[uëe]l/i.test(expense.description));
    const isBirthday = expense.category === 'Cadeau' && /anniversaire/i.test(expense.description);
    
    const visual = CategoryVisuals[expense.category] || CategoryVisuals["Divers"];
    let IconComponent = visual.icon;
    let iconBgClass = visual.color;

    if (isChristmas) {
        IconComponent = GiftIcon;
        iconBgClass = 'bg-red-600';
    } else if (isBirthday) {
        IconComponent = BirthdayIcon;
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
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBgClass} shadow-sm`}>
                    <IconComponent className="h-6 w-6 text-white" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                 <p className="font-semibold truncate text-slate-700 dark:text-slate-200" title={description}>{description}</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={expense.category}>{expense.category}</p>
            </div>
            <div className="pl-4 flex-shrink-0 text-right">
                <p className={`font-bold ${amountColorClass}`}>
                    {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{formattedDate}</p>
            </div>
        </div>
    );
};

export default ExpenseListItem;
