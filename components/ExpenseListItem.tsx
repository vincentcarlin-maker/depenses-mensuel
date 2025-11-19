import React from 'react';
import { type Expense, User, type Category } from '../types';
import { 
    MandatoryIcon, 
    FuelIcon, 
    HeatingIcon, 
    GroceriesIcon, 
    RestaurantIcon, 
    CarRepairsIcon, 
    MiscIcon 
} from './icons/CategoryIcons';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-500' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-500' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-500' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-500' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-500' },
  "Divers": { icon: MiscIcon, color: 'bg-cyan-500' },
};


const ExpenseIcon: React.FC<{ category: Category }> = ({ category }) => {
    const visual = CategoryVisuals[category] || CategoryVisuals["Divers"];
    const IconComponent = visual.icon;
    return (
        <div className={`w-10 h-10 flex items-center justify-center rounded-full ${visual.color}`}>
            <IconComponent className="h-6 w-6 text-white" />
        </div>
    );
};

const parseDescription = (fullDescription: string) => {
    const tagRegex = /(#\w+)/g;
    const description = fullDescription.replace(tagRegex, '').trim();
    return { description };
};


const ExpenseListItem: React.FC<{
    expense: Expense;
    onEditExpense: (expense: Expense) => void;
    isHighlighted: boolean;
}> = ({ expense, onEditExpense, isHighlighted }) => {
    const { description } = parseDescription(expense.description);

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(' ', ' - ');

    const isSophie = expense.user === User.Sophie;
    const userColorClass = isSophie ? 'bg-rose-500' : 'bg-sky-500';
    
    const amountColorClass = expense.amount < 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-slate-800 dark:text-slate-100';

    return (
        <div
            onClick={() => onEditExpense(expense)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEditExpense(expense); }}
            role="button"
            tabIndex={0}
            className={`
                flex items-center p-3 rounded-xl border border-transparent
                transition-all duration-200 ease-out cursor-pointer 
                hover:bg-slate-100 hover:dark:bg-slate-700/50 hover:border-slate-200 hover:dark:border-slate-700
                focus:outline-none focus:ring-2 focus:ring-cyan-500
                ${isHighlighted ? 'animate-highlight' : ''}
            `}
        >
            <div className={`w-1.5 h-10 rounded-full mr-3 ${userColorClass}`}></div>
            <div className="mr-3 flex-shrink-0">
                <ExpenseIcon category={expense.category} />
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