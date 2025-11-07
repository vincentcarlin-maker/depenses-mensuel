import React, { useMemo } from 'react';
import { type Expense, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '../hooks/useTheme';

const COLORS = ['#06b6d4', '#ec4899', '#f97316', '#8b5cf6', '#10b981', '#f59e0b'];

const CategoryEmojiMap: { [key: string]: string } = {
  "Dépenses obligatoires": '📄',
  "Gasoil": '⛽',
  "Courses": '🛒',
  "Chauffage": '🔥',
  "Divers": '🎉',
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
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
            <span className="mr-2 text-lg">{CategoryEmojiMap[entry.value] || '❓'}</span>
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
};


const CategoryTotals: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
  const { theme } = useTheme();

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
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Répartition des Dépenses</h2>
        <div className="text-center py-16 h-[400px] flex flex-col justify-center items-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-slate-500 dark:text-slate-400">Aucune dépense à analyser pour ce mois.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Répartition des Dépenses</h2>
      <div style={{ width: '100%', height: 350 }} className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%)] text-center pointer-events-none">
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
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
          {chartData.map((entry, index) => {
            const percentage = totalExpenses > 0 ? (entry.value / totalExpenses) * 100 : 0;
            return (
              <div key={`detail-${index}`} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex items-center w-8 h-8 justify-center mr-4 text-xl">
                  {CategoryEmojiMap[entry.name] || '❓'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}</p>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1">
                     <div 
                        className="h-2 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                     ></div>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0 w-24">
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