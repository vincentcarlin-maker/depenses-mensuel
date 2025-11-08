import React, { useMemo } from 'react';
import { type Expense, Category } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTheme } from '../hooks/useTheme';

// --- Modern SVG Icons (copied from CategoryChart.tsx) ---
const MandatoryIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const FuelIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16V5a2 2 0 012-2h4a2 2 0 012 2v11m-6 0h4m-2 0v3m0-11h-4V5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16H8a2 2 0 00-2 2v1h12v-1a2 2 0 00-2-2h-4z" />
    </svg>
);
const HeatingIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-3.5-6V2" />
        <path d="M12 22a7 7 0 0 1-7-7c0-2 1-3.9 3-5.5s3.5-4 3.5-6V2" />
    </svg>
);
const GroceriesIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const RestaurantIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
        <path d="M7 2v20"/>
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/>
    </svg>
);
const CarRepairsIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const MiscIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CategoryVisuals: { [key in Category]: { icon: React.FC<{ className?: string }>; color: string; pieColor: string } } = {
  [Category.Mandatory]: { icon: MandatoryIcon, color: 'bg-slate-500', pieColor: '#64748b' },
  [Category.Fuel]: { icon: FuelIcon, color: 'bg-orange-500', pieColor: '#f97316' },
  [Category.Heating]: { icon: HeatingIcon, color: 'bg-red-500', pieColor: '#ef4444' },
  [Category.Groceries]: { icon: GroceriesIcon, color: 'bg-green-500', pieColor: '#22c55e' },
  [Category.Restaurant]: { icon: RestaurantIcon, color: 'bg-purple-500', pieColor: '#a855f7' },
  [Category.CarRepairs]: { icon: CarRepairsIcon, color: 'bg-yellow-500', pieColor: '#eab308' },
  [Category.Misc]: { icon: MiscIcon, color: 'bg-cyan-500', pieColor: '#06b6d4' },
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

    const categoryTotals: { [key in Category]?: number } = {};
    for (const category of Object.values(Category)) {
        categoryTotals[category] = 0;
    }

    let total = 0;
    const monthsWithData = new Set<number>();

    for (const expense of expenses) {
      if(categoryTotals[expense.category] !== undefined) {
        categoryTotals[expense.category]! += expense.amount;
      }
      total += expense.amount;
      monthsWithData.add(new Date(expense.date).getMonth());
    }

    const numMonths = monthsWithData.size > 0 ? monthsWithData.size : 1;
    
    const data = (Object.entries(categoryTotals) as [Category, number][])
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
                const visual = CategoryVisuals[entry.name as Category] || CategoryVisuals[Category.Misc];
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
                    <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
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