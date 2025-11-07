import React, { useMemo } from 'react';
import { type Expense, Category } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useTheme } from '../hooks/useTheme';

const CategoryVisuals: { [key: string]: { color: string } } = {
  [Category.Mandatory]: { color: '#64748b' },
  [Category.Fuel]: { color: '#f97316' },
  [Category.Heating]: { color: '#ef4444' },
  [Category.Groceries]: { color: '#22c55e' },
  [Category.Restaurant]: { color: '#a855f7' },
  [Category.CarRepairs]: { color: '#eab308' },
  [Category.Misc]: { color: '#06b6d4' },
};
const FALLBACK_COLOR = '#8884d8';


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
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" stroke={tickColor} tickFormatter={(value) => `${value}€`} />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150} 
                        stroke={tickColor}
                        tick={{ fontSize: 12, fill: tickColor }}
                    />
                    <Tooltip 
                        cursor={{ fill: theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 0.5)' }}
                        formatter={(value: number) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
                        contentStyle={{
                            backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
                            backdropFilter: 'blur(4px)',
                            border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                            borderRadius: '0.75rem',
                        }}
                    />
                    <Bar dataKey="average" name="Moyenne mensuelle" fill="#8884d8" radius={[0, 8, 8, 0]}>
                         {categoryData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={CategoryVisuals[entry.name as Category]?.color || FALLBACK_COLOR} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
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
