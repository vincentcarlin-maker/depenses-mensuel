
import React, { useMemo } from 'react';
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
    GiftIcon
} from './icons/CategoryIcons';

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


const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; pieColor: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-500', pieColor: '#64748b' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-500', pieColor: '#f97316' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-500', pieColor: '#ef4444' },
  "Courses": { icon: GroceriesIcon, color: 'bg-green-500', pieColor: '#22c55e' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500', pieColor: '#a855f7' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-500', pieColor: '#eab308' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-indigo-500', pieColor: '#6366f1' },
  "Cadeau": { icon: GiftIcon, color: 'bg-fuchsia-500', pieColor: '#d946ef' },
  "Divers": { icon: MiscIcon, color: 'bg-cyan-500', pieColor: '#06b6d4' },
};

interface CategoryTotalsProps {
  expenses: Expense[];
  previousMonthExpenses: Expense[];
  last3MonthsExpenses: Expense[];
}

const CategoryTotals: React.FC<CategoryTotalsProps> = ({ expenses, previousMonthExpenses, last3MonthsExpenses }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

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
            average: categoryAverages.get(name) || 0,
        }))
        .filter(d => d.value > 0)
        .sort((a,b) => b.value - a.value); 

    return { chartData: data };
  }, [expenses, last3MonthsExpenses]);

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
  const TrendIcon = trend.percentageChange > 0 ? TrendUpIcon : TrendDownIcon;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analyse des Dépenses</h2>
      
      <div className="my-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
        <h3 className="text-base font-semibold mb-2 text-slate-700 dark:text-slate-200">Tendance Mensuelle</h3>
        <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${trend.percentageChange > 0 ? 'bg-red-100 dark:bg-red-500/20' : 'bg-green-100 dark:bg-green-500/20'}`}>
                <TrendIcon className={trendColor} />
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
        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Détails par catégorie</h3>
        <div className="space-y-3">
          {chartData.map((entry) => {
            const visual = CategoryVisuals[entry.name as Category] || CategoryVisuals["Divers"];
            const IconComponent = visual.icon;
            const percentage = totalExpenses > 0 ? (entry.value / totalExpenses) * 100 : 0;
            return (
              <div key={`detail-${entry.name}`} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full mr-4 ${visual.color}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}</p>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryTotals;
