import React, { useMemo } from 'react';
import { type Expense, type Category } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { 
    MandatoryIcon, 
    FuelIcon, 
    HeatingIcon, 
    GroceriesIcon, 
    RestaurantIcon, 
    CarRepairsIcon, 
    MiscIcon 
} from './icons/CategoryIcons';


const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; pieColor: string } } = {
    "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-500', pieColor: '#64748b' },
    "Carburant": { icon: FuelIcon, color: 'bg-orange-500', pieColor: '#f97316' },
    "Chauffage": { icon: HeatingIcon, color: 'bg-red-500', pieColor: '#ef4444' },
    "Courses": { icon: GroceriesIcon, color: 'bg-green-500', pieColor: '#22c55e' },
    "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500', pieColor: '#a855f7' },
    "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-yellow-500', pieColor: '#eab308' },
    "Divers": { icon: MiscIcon, color: 'bg-cyan-500', pieColor: '#06b6d4' },
};


interface YearlySummaryProps {
    expenses: Expense[];
    previousYearExpenses: Expense[];
    year: number;
}

const YearlySummary: React.FC<YearlySummaryProps> = ({ expenses, previousYearExpenses, year }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  const { categoryData, totalYearlyExpense, monthlyAverage, numberOfMonthsWithData } = useMemo(() => {
    if (expenses.length === 0) {
      return { categoryData: [], totalYearlyExpense: 0, monthlyAverage: 0, numberOfMonthsWithData: 0 };
    }

    const categoryTotals = new Map<Category, number>();

    let total = 0;
    const monthsWithData = new Set<number>();

    for (const expense of expenses) {
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + expense.amount);
      total += expense.amount;
      monthsWithData.add(new Date(expense.date).getMonth());
    }

    const numMonths = monthsWithData.size > 0 ? monthsWithData.size : 1;
    
    const data = Array.from(categoryTotals.entries())
      .map(([name, total]) => ({
        name,
        total,
        average: total / numMonths,
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.average - a.average);

    return { 
        categoryData: data, 
        totalYearlyExpense: total,
        monthlyAverage: total / numMonths,
        numberOfMonthsWithData: numMonths
    };
  }, [expenses]);

  const maxAverage = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return 0;
    return Math.max(...categoryData.map(d => d.average));
  }, [categoryData]);
  
  const monthlyTrendData = useMemo(() => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = monthNames.map(name => ({
      month: name,
      [year]: 0,
      [year - 1]: 0,
    }));

    for (const expense of expenses) {
      const monthIndex = new Date(expense.date).getMonth();
      data[monthIndex][year] += expense.amount;
    }

    for (const expense of previousYearExpenses) {
      const monthIndex = new Date(expense.date).getMonth();
      data[monthIndex][year - 1] += expense.amount;
    }
    
    const hasCurrentYearData = expenses.length > 0;
    const hasPreviousYearData = previousYearExpenses.length > 0;

    if (!hasCurrentYearData && !hasPreviousYearData) {
        return [];
    }

    return data.map(monthData => ({
        ...monthData,
        [year]: parseFloat(monthData[year].toFixed(2)),
        [year - 1]: parseFloat(monthData[year - 1].toFixed(2)),
    }));
  }, [expenses, previousYearExpenses, year]);

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-center py-16 h-full flex flex-col justify-center items-center">
        <p className="text-4xl mb-2">🗓️</p>
        <p className="text-slate-500 dark:text-slate-400">Aucune dépense enregistrée pour l'année {year}.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100">Résumé de l'Année {year}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Annuel</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {totalYearlyExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Moyenne Mensuelle</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    {monthlyAverage.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                 <p className="text-xs text-slate-400 dark:text-slate-500">calculée sur {numberOfMonthsWithData} mois</p>
            </div>
        </div>

        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Moyenne mensuelle par catégorie</h3>
        <div className="space-y-3">
            {categoryData.map((entry) => {
                const visual = CategoryVisuals[entry.name as Category] || CategoryVisuals["Divers"];
                const IconComponent = visual.icon;
                const percentage = maxAverage > 0 ? (entry.average / maxAverage) * 100 : 0;
                
                return (
                    <div key={entry.name} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${visual.color}`}>
                                <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-2">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={entry.name}>{entry.name}</p>
                                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100 whitespace-nowrap">
                                        {entry.average.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> / mois</span>
                                    </p>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1.5">
                                    <div
                                        className="h-2 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${percentage}%`, backgroundColor: visual.pieColor }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                         <p className="text-xs text-right text-slate-500 dark:text-slate-400 mt-1 pr-1">
                            Total {year}: {entry.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                );
            })}
        </div>
        
        <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">Évolution des dépenses mensuelles</h3>
             <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="month" stroke={tickColor} tick={{ fill: tickColor }} />
                        <YAxis stroke={tickColor} tickFormatter={(value) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`} tick={{ fill: tickColor }} />
                        <Tooltip
                            formatter={(value: number, name: string) => [`${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, `Année ${name}`]}
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                                backdropFilter: 'blur(4px)',
                                border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                                borderRadius: '0.75rem',
                            }}
                        />
                        <Legend wrapperStyle={{ color: tickColor }} />
                        <Line type="monotone" dataKey={year.toString()} stroke="#06b6d4" strokeWidth={2} name={`${year}`} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        {previousYearExpenses.length > 0 && (
                            <Line type="monotone" dataKey={(year - 1).toString()} stroke="#f97316" strokeWidth={2} name={`${year - 1}`} strokeDasharray="5 5" />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};

export default YearlySummary;