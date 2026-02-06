
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Expense, type Category } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { 
    MandatoryIcon, 
    FuelIcon, 
    HeatingIcon, 
    GroceriesIcon, 
    RestaurantIcon, 
    CarRepairsIcon, 
    MiscIcon,
    ClothingIcon,
    GiftIcon,
    PalmTreeIcon
} from './icons/CategoryIcons';
import ExpenseListItem from './ExpenseListItem';
import CloseIcon from './icons/CloseIcon';

const TrendUpIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
const TrendDownIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
);

const StableIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16M4 15h16" />
    </svg>
);

const TrendIndicator: React.FC<{ current: number, previous: number }> = ({ current, previous }) => {
    if (previous === 0) return <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Nouveau</span>;
    
    const diffPercent = ((current - previous) / previous) * 100;

    if (diffPercent > 1) {
        return <TrendUpIcon className="h-4 w-4 text-rose-500" />;
    } else if (diffPercent < -1) {
        return <TrendDownIcon className="h-4 w-4 text-emerald-500" />;
    } else {
        return <StableIcon className="h-3.5 w-3.5 text-slate-400" />;
    }
};

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; pieColor: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-500', pieColor: '#64748b' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-500', pieColor: '#f97316' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-500', pieColor: '#ef4444' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-500', pieColor: '#22c55e' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500', pieColor: '#a855f7' },
  "Vacances": { icon: PalmTreeIcon, color: 'bg-teal-500', pieColor: '#14b8a6' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-400', pieColor: '#FACC15' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-indigo-500', pieColor: '#6366f1' },
  "Cadeau": { icon: GiftIcon, color: 'bg-fuchsia-500', pieColor: '#d946ef' },
  "Divers": { icon: MiscIcon, color: 'bg-cyan-500', pieColor: '#06b6d4' },
};

interface CategoryTotalsProps {
  expenses: Expense[];
  previousMonthExpenses: Expense[];
  previousYearMonthExpenses: Expense[]; // For Year-on-Year comparison
  last3MonthsExpenses: Expense[];
  onExpenseClick: (expense: Expense) => void;
}

const CategoryTotals: React.FC<CategoryTotalsProps> = ({ expenses, previousMonthExpenses, previousYearMonthExpenses, last3MonthsExpenses, onExpenseClick }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (selectedCategory) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedCategory]);

  const { totalExpenses, trend } = useMemo(() => {
    const currentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    let percentageChange = 0;
    if (previousTotal > 0.01) {
      percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    } else if (currentTotal > 0.01) {
      percentageChange = Infinity;
    }
    
    return {
      totalExpenses: currentTotal,
      trend: {
        previousTotal,
        percentageChange,
      }
    };
  }, [expenses, previousMonthExpenses]);

  const { chartData } = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const expense of expenses) {
      totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
    }

    const prevYearMonthTotals = new Map<Category, number>();
    for (const expense of previousYearMonthExpenses) {
        prevYearMonthTotals.set(expense.category, (prevYearMonthTotals.get(expense.category) || 0) + expense.amount);
    }

    const categoryAverages = new Map<Category, number>();
    const categoryTotalsLast3Months = new Map<Category, number>();
    
    last3MonthsExpenses.forEach(e => {
        categoryTotalsLast3Months.set(e.category, (categoryTotalsLast3Months.get(e.category) || 0) + e.amount);
    });

    categoryTotalsLast3Months.forEach((total, cat) => {
        categoryAverages.set(cat, total / 3);
    });

    const data = Array.from(totals.entries())
        .map(([name, value]) => ({
            name,
            value,
            previousYearMonthValue: prevYearMonthTotals.get(name) || 0,
            average: categoryAverages.get(name) || 0,
        }))
        .filter(d => d.value > 0)
        .sort((a,b) => b.value - a.value); 

    return { chartData: data };
  }, [expenses, last3MonthsExpenses, previousYearMonthExpenses]);

  const filteredCategoryExpenses = useMemo(() => {
      if (!selectedCategory) return [];
      return expenses.filter(e => e.category === selectedCategory);
  }, [selectedCategory, expenses]);

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Analyse des Dépenses</h2>
        <div className="text-center py-16 h-[400px] flex flex-col justify-center items-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-slate-500 dark:text-slate-400">Aucune dépense à analyser pour ce mois.</p>
        </div>
      </div>
    );
  }

  const trendColor = trend.percentageChange > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  const ActualTrendIcon = trend.percentageChange > 0 ? TrendUpIcon : TrendDownIcon;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analyse des Dépenses</h2>
      
      <div className="my-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
        <h3 className="text-base font-semibold mb-2 text-slate-700 dark:text-slate-200">Tendance Mensuelle (M-1)</h3>
        <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${trend.percentageChange > 0 ? 'bg-red-100 dark:bg-red-500/20' : 'bg-green-100 dark:bg-green-500/20'}`}>
                <ActualTrendIcon className={trendColor} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
                {trend.previousTotal > 0.01 ? (
                    <>
                    C'est <span className={`font-bold ${trendColor}`}>{Math.abs(trend.percentageChange).toFixed(0)}%</span> de {trend.percentageChange >= 0 ? 'plus' : 'moins'} que le mois dernier ({trend.previousTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}).
                    </>
                ) : (
                    "Aucune dépense le mois dernier pour comparer."
                )}
            </p>
        </div>
      </div>

      <div style={{ width: '100%', height: Math.max(300, chartData.length * 50) }} className="relative">
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                tick={{ fill: tickColor, fontSize: 12 }}
                interval={0}
            />
            <Tooltip 
              cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }}
              formatter={(value: number) => [`${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, 'Montant']}
              contentStyle={{
                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                backdropFilter: 'blur(4px)',
                border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CategoryVisuals[entry.name as Category]?.pieColor || '#8884d8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Détails par catégorie</h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">Tendance (Y/Y)</span>
        </div>
        <p className="text-[10px] text-slate-400 italic mb-4 -mt-2">Cliquez sur une catégorie pour voir le détail des dépenses.</p>
        
        <div className="space-y-3">
          {chartData.map((entry) => {
            const visual = CategoryVisuals[entry.name as Category] || CategoryVisuals["Divers"];
            const IconComponent = visual.icon;
            const percentage = totalExpenses > 0 ? (entry.value / totalExpenses) * 100 : 0;

            return (
              <button 
                key={`detail-${entry.name}`} 
                onClick={() => setSelectedCategory(entry.name)}
                className="w-full flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full mr-4 ${visual.color}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{entry.name}</p>
                    <TrendIndicator current={entry.value} previous={entry.previousYearMonthValue} />
                  </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">
                      Moyenne 3 mois: {entry.average.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                   </p>
                </div>
                <div className="text-right ml-4 flex-shrink-0 w-28">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {entry.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{percentage.toFixed(1)}%</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Détail de catégorie (Modal) */}
      {selectedCategory && createPortal(
          <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
                <div 
                    className="fixed inset-0"
                    onClick={() => setSelectedCategory(null)}
                ></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${CategoryVisuals[selectedCategory]?.color || 'bg-slate-500'}`}>
                                {CategoryVisuals[selectedCategory]?.icon && React.createElement(CategoryVisuals[selectedCategory].icon, { className: "h-6 w-6 text-white" })}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Dépenses : {selectedCategory}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Pour le mois en cours</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="space-y-3 pb-4">
                            {filteredCategoryExpenses.length > 0 ? (
                                filteredCategoryExpenses
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(expense => (
                                        <ExpenseListItem 
                                            key={expense.id} 
                                            expense={expense} 
                                            onExpenseClick={(e) => {
                                                onExpenseClick(e);
                                                setSelectedCategory(null);
                                            }} 
                                            isHighlighted={false}
                                        />
                                    ))
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">Aucune dépense trouvée.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total de la catégorie</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xl">
                                {filteredCategoryExpenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
      )}
    </div>
  );
};

export default CategoryTotals;
