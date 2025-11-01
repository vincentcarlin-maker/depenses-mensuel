import React, { useMemo } from 'react';
import { type Expense, Category } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#06b6d4', '#ec4899', '#f97316', '#8b5cf6', '#10b981', '#f59e0b'];

interface YearlySummaryProps {
    expenses: Expense[];
    previousYearExpenses: Expense[];
    year: number;
}

const YearlySummary: React.FC<YearlySummaryProps> = ({ expenses, previousYearExpenses, year }) => {
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
      categoryTotals[expense.category]! += expense.amount;
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
      <div className="text-center py-16 h-[400px] flex flex-col justify-center items-center">
        <p className="text-4xl mb-2">🗓️</p>
        <p className="text-slate-500">Aucune dépense enregistrée pour l'année {year}.</p>
      </div>
    );
  }

  return (
    <div>
        <h2 className="text-xl font-bold mb-6 text-center">Résumé de l'Année {year}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-100 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-500">Total Annuel</p>
                <p className="text-2xl font-bold text-slate-800">
                    {totalYearlyExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-500">Moyenne Mensuelle</p>
                <p className="text-2xl font-bold text-cyan-600">
                    {monthlyAverage.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                 <p className="text-xs text-slate-400">calculée sur {numberOfMonthsWithData} mois</p>
            </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Moyenne mensuelle par catégorie</h3>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `${value}€`} />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150} 
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                        cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                        formatter={(value: number) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                        }}
                    />
                    <Bar dataKey="average" name="Moyenne mensuelle" fill="#8884d8" radius={[0, 8, 8, 0]}>
                         {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
        
        <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4">Évolution des dépenses mensuelles</h3>
             <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`} />
                        <Tooltip
                            formatter={(value: number, name: string) => [`${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, `Année ${name}`]}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.75rem',
                            }}
                        />
                        <Legend />
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