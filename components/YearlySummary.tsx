
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Expense, type Category } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import CloseIcon from './icons/CloseIcon';
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

interface BreakdownItem {
    label: string;
    total: number;
    count: number;
}

interface YearlySummaryProps {
    expenses: Expense[];
    previousYearExpenses: Expense[];
    year: number;
}

const YearlySummary: React.FC<YearlySummaryProps> = ({ expenses, previousYearExpenses, year }) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (selectedCategory) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedCategory]);

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

  // --- Breakdown Logic ---
  const breakdownData = useMemo(() => {
      if (!selectedCategory) return [];

      const categoryExpenses = expenses.filter(e => e.category === selectedCategory);
      const breakdownMap = new Map<string, { total: number, count: number }>();

      categoryExpenses.forEach(expense => {
          let label = "Autre";

          if (selectedCategory === 'Courses') {
              // Extract store name from "Courses (Leclerc)" or just "Leclerc"
              const storeRegex = /\s\(([^)]+)\)$/;
              const match = expense.description.match(storeRegex);
              if (match && expense.description.startsWith('Courses')) {
                  label = match[1];
              } else {
                  // If it's just the store name or doesn't have brackets
                  label = expense.description; 
              }
          } 
          else if (selectedCategory === 'Cadeau') {
              // Extract "Person - Occasion"
              const detailsRegex = /\s\(([^)]+)\s-\s([^)]+)\)$/;
              const match = expense.description.match(detailsRegex);
              if (match) {
                  label = `${match[1]} - ${match[2]}`; // "Nathan - Noël"
              } else {
                  label = expense.description;
              }
          }
          else if (selectedCategory === 'Carburant') {
              // Usually the description is the car name directly
              label = expense.description;
          }
          else if (selectedCategory === 'Vêtements') {
              // Extract Person from "Description (Person)"
              const personRegex = /\s\(([^)]+)\)$/;
              const match = expense.description.match(personRegex);
              if (match) {
                  label = match[1];
              } else {
                  label = expense.description;
              }
          }
          else if (selectedCategory === 'Réparation voitures') {
              // Extract Car from "Repair (Car)"
              const carRegex = /\s\(([^)]+)\)$/;
              const match = expense.description.match(carRegex);
              if (match) {
                  label = match[1];
              } else {
                   // Fallback: try to see if the description *is* a car name if simpler format used
                   label = expense.description;
              }
          }
          else {
              // Pour "Dépenses obligatoires" et autres : on groupe par description exacte
              label = expense.description;
          }

          // Clean up label
          label = label.trim();
          if (!label) label = "Autre";

          const current = breakdownMap.get(label) || { total: 0, count: 0 };
          breakdownMap.set(label, {
              total: current.total + expense.amount,
              count: current.count + 1
          });
      });

      return Array.from(breakdownMap.entries())
          .map(([label, data]) => ({ label, ...data }))
          .sort((a, b) => b.total - a.total);

  }, [selectedCategory, expenses]);

  const categoriesWithDetails = ['Courses', 'Cadeau', 'Carburant', 'Vêtements', 'Réparation voitures', 'Dépenses obligatoires'];

  const handleCategoryClick = (category: Category) => {
      if (categoriesWithDetails.includes(category)) {
          setSelectedCategory(category);
      }
  };

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
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 -mt-3 italic">Cliquez sur les catégories (Courses, Cadeaux, Dépenses obligatoires...) pour voir le détail.</p>
        
        <div className="space-y-3">
            {categoryData.map((entry) => {
                const visual = CategoryVisuals[entry.name as Category] || CategoryVisuals["Divers"];
                const IconComponent = visual.icon;
                const percentage = maxAverage > 0 ? (entry.average / maxAverage) * 100 : 0;
                const isClickable = categoriesWithDetails.includes(entry.name);
                
                return (
                    <div 
                        key={entry.name} 
                        onClick={() => handleCategoryClick(entry.name)}
                        className={`p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl transition-all duration-200 ${isClickable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-600' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${visual.color}`}>
                                <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={entry.name}>{entry.name}</p>
                                        {isClickable && (
                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded-full">Détails</span>
                                        )}
                                    </div>
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

        {/* Breakdown Modal */}
        {selectedCategory && createPortal(
            <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
                <div 
                    className="fixed inset-0"
                    onClick={() => setSelectedCategory(null)}
                ></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${CategoryVisuals[selectedCategory]?.color || 'bg-slate-500'}`}>
                                {CategoryVisuals[selectedCategory]?.icon && React.createElement(CategoryVisuals[selectedCategory].icon, { className: "h-5 w-5 text-white" })}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Détail : {selectedCategory}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Année {year}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto">
                        <div className="space-y-3">
                            {breakdownData.length > 0 ? (
                                breakdownData.map((item, idx) => {
                                    // Calculate bar width based on the largest item
                                    const maxTotal = breakdownData[0].total;
                                    const percentage = (item.total / maxTotal) * 100;

                                    return (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-700/20 p-3 rounded-lg">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                    {item.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mb-1">
                                                <div 
                                                    className="h-1.5 rounded-full transition-all duration-500"
                                                    style={{ 
                                                        width: `${percentage}%`, 
                                                        backgroundColor: CategoryVisuals[selectedCategory!]?.pieColor || '#64748b'
                                                    }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
                                                {item.count} dépense{item.count > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-4">Aucune donnée disponible.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Total Catégorie</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                {breakdownData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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

export default YearlySummary;
