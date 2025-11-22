
import React, { useMemo } from 'react';
import { type Expense, type Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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

const PIE_COLORS = ['#06b6d4', '#ec4899', '#f97316', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#d946ef'];

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


const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent * 100 < 5) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-sm">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 list-none p-0">
        {payload.map((entry: any, index: number) => {
          const visual = CategoryVisuals[entry.value as Category] || CategoryVisuals["Divers"];
          if (!visual) return null;
          const IconComponent = visual.icon;
          return (
            <li key={`item-${index}`} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <span className={`w-5 h-5 flex items-center justify-center rounded-full mr-2 ${visual.color}`}>
                <IconComponent className="h-3.5 w-3.5 text-white" />
              </span>
              <span>{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
};

interface CategoryTotalsProps {
  expenses: Expense[];
  previousMonthExpenses: Expense[];
  last3MonthsExpenses: Expense[];
}

const CategoryTotals: React.FC<CategoryTotalsProps> = ({ expenses, previousMonthExpenses, last3MonthsExpenses }) => {
  const { theme } = useTheme();

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

      <div style={{ width: '100%', height: 350 }} className="relative">
        <div className="absolute top-[calc(50%-20px)] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Total du mois</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
        </div>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={90}
              outerRadius={140}
              fill="#8884d8"
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CategoryVisuals[entry.name as Category]?.pieColor || PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
              contentStyle={{
                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                backdropFilter: 'blur(4px)',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
              }}
            />
            <Legend content={<CustomLegend />} verticalAlign="bottom" wrapperStyle={{ bottom: -10 }} />
          </PieChart>
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
