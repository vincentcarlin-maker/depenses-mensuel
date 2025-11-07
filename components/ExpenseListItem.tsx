import React from 'react';
import { type Expense, User, Category } from '../types';
import { CategoryConfig } from '../config/categoryConfig';

const ExpenseListItem: React.FC<{
    expense: Expense;
    onEditExpense: (expense: Expense) => void;
}> = ({ expense, onEditExpense }) => {

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(' ', ' - ');

    const isSophie = expense.user === User.Sophie;
    const userColorClass = isSophie ? 'bg-rose-500' : 'bg-sky-500';

    const config = CategoryConfig[expense.category] || CategoryConfig[Category.Misc];
    const Icon = config.icon;

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
            `}
        >
            <div className={`w-1.5 h-10 rounded-full mr-3 ${userColorClass}`}></div>
            <div className={`w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0 rounded-full ${config.bgColor}`}>
                <div className={config.iconColor}>
                    <Icon />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                 <p className="font-semibold truncate text-slate-700 dark:text-slate-200" title={expense.description}>{expense.description}</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={expense.category}>{expense.category}</p>
            </div>
            <div className="pl-4 flex-shrink-0 text-right">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                    {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{formattedDate}</p>
            </div>
        </div>
    );
};

export default ExpenseListItem;
