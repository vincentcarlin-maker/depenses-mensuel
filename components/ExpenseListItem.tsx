import React from 'react';
import { type Expense, User, type Category } from '../types';

// --- Modern SVG Icons ---
const MandatoryIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const FuelIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16V5a2 2 0 012-2h4a2 2 0 012 2v11m-6 0h4m-2 0v3m0-11h-4V5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16H8a2 2 0 00-2 2v1h12v-1a2 2 0 00-2-2h-4z" />
    </svg>
);
const HeatingIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-3.5-6V2" />
        <path d="M12 22a7 7 0 0 1-7-7c0-2 1-3.9 3-5.5s3.5-4 3.5-6V2" />
    </svg>
);
const GroceriesIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const RestaurantIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
        <path d="M7 2v20"/>
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/>
    </svg>
);
const CarRepairsIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.87-5.87m0 0L11.42 15.17m5.87-5.87L15.17 11.42m0 0L5.87 21m9.3-9.3L15.17 11.42M11.42 15.17l-9.3-9.3a2.652 2.652 0 0 1 0-3.752l3.75-3.752a2.652 2.652 0 0 1 3.752 0l9.3 9.3" />
  </svg>
);
const MiscIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

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
            <IconComponent className="h-6 w-6" />
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