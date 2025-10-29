import React, { useMemo } from 'react';
import { type Expense, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#06b6d4', '#ec4899', '#f97316', '#8b5cf6', '#10b981', '#f59e0b'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent * 100 < 5) return null; // Ne pas afficher le label pour les petites parts
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold text-sm">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const CategoryTotals: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
  const { chartData, totalExpenses } = useMemo(() => {
    const totals: { [key in Category]?: number } = {};
    let currentTotal = 0;
    
    for (const category of Object.values(Category)) {
        totals[category] = 0;
    }

    for (const expense of expenses) {
      totals[expense.category]! += expense.amount;
      currentTotal += expense.amount;
    }

    const data = (Object.entries(totals) as [Category, number][])
        .map(([name, value]) => ({ name, value }))
        .filter(d => d.value > 0)
        .sort((a,b) => b.value - a.value); 

    return { chartData: data, totalExpenses: currentTotal };
  }, [expenses]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4">Répartition des Dépenses</h2>
        <div className="text-center py-16 h-[400px] flex flex-col justify-center items-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-slate-500">Aucune dépense à analyser pour ce mois.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Répartition des Dépenses</h2>
      <div style={{ width: '100%', height: 350 }} className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%)] text-center pointer-events-none">
            <p className="text-slate-500 text-sm">Total du mois</p>
            <p className="text-3xl font-bold text-slate-800">
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryTotals;