import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Expense, type Category } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Area } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import CloseIcon from './icons/CloseIcon';
import { useCategoryVisuals, PRESET_CATEGORY_VISUALS } from '../hooks/useCategoryVisuals';
const WalletIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3" />
  </svg>
);

const TrendUpLineIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const BarChartHeaderIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zM16.2 13h2.8v6h-2.8z" />
  </svg>
);

const PieChartHeaderIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const LineChartHeaderIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const getCategoryDisplayName = (name: string): string => {
  if (name === 'Dépenses obligatoires' || name === 'Dép. récurrentes' || name === 'Dép. recurentes') {
    return 'Dép. récurrentes';
  }
  return name;
};

interface YearlySummaryProps {
    expenses: Expense[];
    previousYearExpenses: Expense[];
    year: number;
    onExpenseClick?: (expense: Expense) => void;
}

const CustomTooltip = ({ active, payload, label, year }: any) => {
    if (active && payload && payload.length) {
        const currentYearVal = payload.find((p: any) => p.name === year.toString())?.value || 0;
        const prevYearVal = payload.find((p: any) => p.name === (year - 1).toString())?.value || 0;
        const delta = currentYearVal - prevYearVal;
        
        const uniquePayloads = payload.filter((v: any, i: number, a: any[]) => a.findIndex(t => (t.name === v.name)) === i);

        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                <p className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-xs">{label}</p>
                {uniquePayloads.map((p: any, index: number) => (
                    <p key={index} style={{ color: p.stroke || p.fill }} className="text-xs font-semibold">
                        {p.name}: {p.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                ))}
                {prevYearVal > 0 && (
                    <p className={`text-[11px] font-medium mt-1 ${delta >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {delta >= 0 ? '+' : ''}{delta.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} vs {year - 1}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const YearlySummary: React.FC<YearlySummaryProps> = ({ expenses, previousYearExpenses, year, onExpenseClick }) => {
  const { theme } = useTheme();
  const { getVisual } = useCategoryVisuals();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [chartCategoryFilter, setChartCategoryFilter] = useState<Category | 'all'>('all');
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);

  const filteredCurrentExpenses = useMemo(() => {
    if (chartCategoryFilter === 'all') return expenses;
    return expenses.filter(e => e.category === chartCategoryFilter);
  }, [expenses, chartCategoryFilter]);

  const filteredPreviousExpenses = useMemo(() => {
    if (chartCategoryFilter === 'all') return previousYearExpenses;
    return previousYearExpenses.filter(e => e.category === chartCategoryFilter);
  }, [previousYearExpenses, chartCategoryFilter]);

  const activeColor = useMemo(() => {
    if (chartCategoryFilter === 'all') return '#06b6d4';
    return getVisual(chartCategoryFilter).pieColor || '#06b6d4';
  }, [chartCategoryFilter, getVisual]);

  useEffect(() => {
    if (selectedCategory || isChartExpanded) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedCategory, isChartExpanded]);

  const { categoryData, totalYearlyExpense, monthlyAverage, numberOfMonthsWithData } = useMemo(() => {
    if (expenses.length === 0) {
      return { categoryData: [], totalYearlyExpense: 0, monthlyAverage: 0, numberOfMonthsWithData: 0 };
    }

    const categoryTotals = new Map<Category, number>();

    let total = 0;
    const monthsWithData = new Set<number>();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (const expense of expenses) {
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + expense.amount);
      total += expense.amount;
      
      const expenseMonth = new Date(expense.date).getMonth();
      if (year < currentYear || (year === currentYear && expenseMonth <= currentMonth)) {
        monthsWithData.add(expenseMonth);
      }
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
  }, [expenses, year]);

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

    for (const expense of filteredCurrentExpenses) {
      const monthIndex = new Date(expense.date).getMonth();
      data[monthIndex][year] += expense.amount;
    }

    for (const expense of filteredPreviousExpenses) {
      const monthIndex = new Date(expense.date).getMonth();
      data[monthIndex][year - 1] += expense.amount;
    }
    
    const hasCurrentYearData = filteredCurrentExpenses.length > 0;
    const hasPreviousYearData = filteredPreviousExpenses.length > 0;

    if (!hasCurrentYearData && !hasPreviousYearData) {
        return [];
    }

    return data.map(monthData => ({
        ...monthData,
        [year]: parseFloat(monthData[year].toFixed(2)),
        [year - 1]: parseFloat(monthData[year - 1].toFixed(2)),
    }));
  }, [filteredCurrentExpenses, filteredPreviousExpenses, year]);

  const breakdownData = useMemo(() => {
      if (!selectedCategory) return [];

      const categoryExpenses = expenses.filter(e => e.category === selectedCategory);
      const breakdownMap = new Map<string, { total: number, count: number, items: Expense[] }>();

      categoryExpenses.forEach(expense => {
          let label = "Autre";

          if (selectedCategory === 'Courses') {
              const storeRegex = /\s\(([^)]+)\)$/;
              const match = expense.description.match(storeRegex);
              if (match && expense.description.startsWith('Courses')) {
                  label = match[1];
              } else {
                  label = expense.description; 
              }
          } 
          else if (selectedCategory === 'Cadeau') {
              const detailsRegex = /\s\(([^)]+)\s-\s([^)]+)\)$/;
              const match = expense.description.match(detailsRegex);
              if (match) {
                  label = `${match[1]} - ${match[2]}`;
              } else {
                  label = expense.description;
              }
          }
          else if (selectedCategory === 'Carburant') {
              label = expense.description;
          }
          else if (selectedCategory === 'Vêtements') {
              const personRegex = /\s\(([^)]+)\)$/;
              const match = expense.description.match(personRegex);
              if (match) {
                  label = match[1];
              } else {
                  label = expense.description;
              }
          }
          else if (selectedCategory === 'Réparation voitures') {
              const carRegex = /\s\(([^)]+)\)$/;
              const match = expense.description.match(carRegex);
              if (match) {
                  label = match[1];
              } else {
                   label = expense.description;
              }
          }
          else {
              label = expense.description;
          }

          label = label.trim();
          if (!label) label = "Autre";

          const current = breakdownMap.get(label) || { total: 0, count: 0, items: [] };
          breakdownMap.set(label, {
              total: current.total + expense.amount,
              count: current.count + 1,
              items: [...current.items, expense]
          });
      });

      return Array.from(breakdownMap.entries())
          .map(([label, data]) => ({ label, ...data }))
          .sort((a, b) => b.total - a.total);

  }, [selectedCategory, expenses]);

  const handleCategoryClick = (category: Category) => {
      setSelectedCategory(category);
      setExpandedLabel(null);
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 text-center py-16 h-full flex flex-col justify-center items-center">
        <p className="text-4xl mb-2">🗓️</p>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune dépense enregistrée pour l'année {year}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-100/90 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <BarChartHeaderIcon className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Résumé de l'Année {year}
                </h1>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-500 dark:text-pink-300 text-[11px] sm:text-xs font-medium italic border border-pink-100/80 dark:border-pink-900/40 shrink-0">
                ✨ Une année plus sereine ♡
            </div>
        </div>
        
        {/* Top 2 KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            {/* Card 1: Total Annuel */}
            <div className="bg-[#f0f6ff] dark:bg-blue-950/30 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-blue-100/80 dark:border-blue-900/40 flex items-center gap-2.5 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#dbeafe] dark:bg-blue-900/60 text-[#2563eb] dark:text-blue-300 flex items-center justify-center shrink-0">
                    <WalletIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Total annuel</p>
                    <p className="text-sm xs:text-base sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight break-normal">
                        {totalYearlyExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Card 2: Moyenne Mensuelle */}
            <div className="bg-[#fdf0f7] dark:bg-pink-950/30 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-pink-100/80 dark:border-pink-900/40 flex items-center gap-2.5 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#fce7f3] dark:bg-pink-900/60 text-[#c026d3] dark:text-pink-300 flex items-center justify-center shrink-0">
                    <TrendUpLineIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-tight">Moy. mensuelle</p>
                    <p className="text-sm xs:text-base sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 tracking-tight break-normal">
                        {monthlyAverage.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-[9.5px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                        sur {numberOfMonthsWithData} mois
                    </p>
                </div>
            </div>
        </div>

        {/* Section: Moyenne mensuelle par catégorie */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100/90 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <PieChartHeaderIcon className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        Moyenne mensuelle par catégorie
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Cliquez sur une catégorie pour voir le détail.
                    </p>
                </div>
            </div>

            {/* Category Gauges - Full-width stacked layout for mobile & desktop */}
            <div className="space-y-2.5 sm:space-y-3 pt-1">
                {categoryData.map((entry) => {
                    const visual = getVisual(entry.name);
                    const IconComponent = visual.icon;
                    const barWidthPercent = maxAverage > 0 ? Math.min(100, Math.max(4, (entry.average / maxAverage) * 100)) : 0;
                    const displayName = getCategoryDisplayName(entry.name);

                    return (
                        <div 
                            key={entry.name} 
                            onClick={() => handleCategoryClick(entry.name as Category)}
                            className="w-full p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-700/30 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border border-slate-100/80 dark:border-slate-700/60 rounded-2xl transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-2.5 sm:gap-3.5">
                                {/* Left Category Icon */}
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${visual.isFullBadge ? '' : visual.color} text-white shadow-2xs mt-0.5 overflow-hidden`}>
                                    <IconComponent className={visual.isFullBadge ? "w-full h-full" : "w-4 h-4 sm:w-5 sm:h-5"} />
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 min-w-0">
                                    {/* Top Row: Category Title & Monthly Amount + Chevron */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate block" title={displayName}>
                                                {displayName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-right">
                                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                                                {entry.average.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400"> / mo</span>
                                            </span>
                                            <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
                                        </div>
                                    </div>

                                    {/* Gauge Progress Bar (Full width of the column) */}
                                    <div className="w-full relative h-2 sm:h-2.5 bg-slate-200/80 dark:bg-slate-700/50 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${visual.color}`}
                                            style={{ width: `${barWidthPercent}%` }}
                                        />
                                    </div>

                                    {/* Bottom Row: Total Annual */}
                                    <div className="flex justify-end mt-1">
                                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            Total {year}: {entry.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* Section: Évolution des dépenses mensuelles */}
        <div id="yearly-trend-chart-section" className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100/90 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <LineChartHeaderIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {chartCategoryFilter === 'all' 
                                ? 'Évolution des dépenses mensuelles' 
                                : `Évolution : ${getCategoryDisplayName(chartCategoryFilter)}`}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {chartCategoryFilter === 'all' 
                                ? 'Toutes catégories confondues' 
                                : `Suivi temporel de la catégorie ${getCategoryDisplayName(chartCategoryFilter)}`}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsChartExpanded(true)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
                    title="Agrandir le graphique"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
            </div>

            {/* Filter Pills */}
            <div className="pt-1">
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                        onClick={() => setChartCategoryFilter('all')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                            chartCategoryFilter === 'all'
                                ? 'bg-slate-900 text-white border-transparent shadow-xs dark:bg-slate-100 dark:text-slate-900'
                                : 'bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        📊 Toutes
                    </button>
                    {Object.keys(PRESET_CATEGORY_VISUALS).map((catName) => {
                        const visual = getVisual(catName);
                        const IconComponent = visual.icon;
                        const hasExpenses = expenses.some(e => e.category === catName) || previousYearExpenses.some(e => e.category === catName);
                        if (!hasExpenses) return null;
                        
                        const isSelected = chartCategoryFilter === catName;
                        const displayName = getCategoryDisplayName(catName);

                        return (
                            <button
                                key={catName}
                                onClick={() => setChartCategoryFilter(catName as Category)}
                                style={isSelected ? {
                                    backgroundColor: visual.pieColor,
                                    color: '#ffffff',
                                    borderColor: 'transparent',
                                } : {}}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border ${
                                    isSelected 
                                        ? 'shadow-xs' 
                                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <div className={`h-3.5 w-3.5 flex items-center justify-center shrink-0 ${visual.isFullBadge ? 'rounded-full overflow-hidden' : ''}`}>
                                    <IconComponent className={`h-full w-full ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                </div>
                                {displayName}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Recharts Line/Composed Chart */}
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="month" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} />
                        <YAxis stroke={tickColor} tickFormatter={(value) => `${value.toLocaleString('fr-FR')} €`} tick={{ fill: tickColor, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip year={year} />} />
                        <Legend wrapperStyle={{ color: tickColor, paddingTop: '10px' }} />
                        <Area type="monotone" dataKey={year.toString()} fill={activeColor} stroke="none" fillOpacity={0.12} name={`${year}`} legendType="none" />
                        <Line type="monotone" dataKey={year.toString()} stroke={activeColor} strokeWidth={3} name={`${year}`} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                        {previousYearExpenses.length > 0 && (
                            <Line type="monotone" dataKey={(year - 1).toString()} stroke="#f97316" strokeWidth={2} name={`${year - 1}`} strokeDasharray="5 5" dot={{ r: 3 }} />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Expanded Chart Modal */}
        {isChartExpanded && createPortal(
            <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
                <div 
                    className="absolute inset-0"
                    onClick={() => setIsChartExpanded(false)}
                />
                
                <div className="relative flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex flex-col p-5 animate-scale-up max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {chartCategoryFilter === 'all' 
                                ? 'Évolution des dépenses mensuelles' 
                                : `Évolution : ${getCategoryDisplayName(chartCategoryFilter)}`}
                        </h2>
                        <button 
                            onClick={() => setIsChartExpanded(false)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="month" stroke={tickColor} tick={{ fill: tickColor, fontSize: 14 }} />
                                <YAxis stroke={tickColor} tickFormatter={(value) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`} tick={{ fill: tickColor, fontSize: 14 }} width={80} />
                                <Tooltip content={<CustomTooltip year={year} />} />
                                <Legend wrapperStyle={{ color: tickColor, paddingTop: '20px' }} iconSize={14} />
                                <Area type="monotone" dataKey={year.toString()} fill={activeColor} stroke="none" fillOpacity={0.12} name={`${year}`} legendType="none" />
                                <Line type="monotone" dataKey={year.toString()} stroke={activeColor} strokeWidth={4} name={`${year}`} dot={{ r: 6 }} activeDot={{ r: 10 }} />
                                {previousYearExpenses.length > 0 && (
                                    <Line type="monotone" dataKey={(year - 1).toString()} stroke="#f97316" strokeWidth={3} name={`${year - 1}`} strokeDasharray="5 5" dot={{ r: 4 }} />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Breakdown Modal */}
        {selectedCategory && createPortal(
            <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
                <div 
                    className="fixed inset-0"
                    onClick={() => setSelectedCategory(null)}
                ></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                        <div className="flex items-center gap-3">
                            {(() => {
                                const mVisual = getVisual(selectedCategory);
                                const MIcon = mVisual.icon;
                                return (
                                    <div className={`w-9 h-9 flex items-center justify-center rounded-2xl ${mVisual.isFullBadge ? '' : mVisual.color} text-white overflow-hidden`}>
                                        <MIcon className={mVisual.isFullBadge ? "w-full h-full" : "h-5 w-5"} />
                                    </div>
                                );
                            })()}
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Détail : {getCategoryDisplayName(selectedCategory)}</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Année {year}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            {breakdownData.length > 0 ? (
                                breakdownData.map((item, idx) => {
                                    const maxTotal = breakdownData[0].total;
                                    const percentage = (item.total / maxTotal) * 100;
                                    const isExpanded = expandedLabel === item.label;

                                    return (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-2xl transition-all border border-slate-100/80 dark:border-slate-700/60">
                                            <div 
                                                onClick={() => setExpandedLabel(isExpanded ? null : item.label)}
                                                className="flex justify-between items-start mb-1 cursor-pointer hover:opacity-85"
                                            >
                                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{item.label}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                                                        ({item.count} {item.count > 1 ? 'dépenses' : 'dépense'})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                                                        {item.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                    </span>
                                                    <svg 
                                                        xmlns="http://www.w3.org/2000/svg" 
                                                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                                        fill="none" 
                                                        viewBox="0 0 24 24" 
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-200/80 dark:bg-slate-600/60 rounded-full h-1.5 mb-1">
                                                <div 
                                                    className="h-1.5 rounded-full transition-all duration-500"
                                                    style={{ 
                                                        width: `${percentage}%`, 
                                                        backgroundColor: getVisual(selectedCategory!).pieColor || '#64748b'
                                                    }}
                                                ></div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 space-y-2 animate-fade-in">
                                                    {item.items.map((expense) => {
                                                        const dateObj = new Date(expense.date);
                                                        const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short'
                                                        });
                                                        
                                                        const userBadgeColor = expense.user === 'Sophie'
                                                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                                                            : expense.user === 'Vincent'
                                                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

                                                        return (
                                                            <div 
                                                                key={expense.id}
                                                                onClick={() => {
                                                                    if (onExpenseClick) {
                                                                        onExpenseClick(expense);
                                                                    }
                                                                }}
                                                                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
                                                            >
                                                                <div className="flex flex-col min-w-0 pr-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{formattedDate}</span>
                                                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${userBadgeColor}`}>{expense.user}</span>
                                                                    </div>
                                                                    <span className="text-xs text-slate-700 dark:text-slate-300 break-words mt-0.5" title={expense.description}>
                                                                        {expense.description}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                                        {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                                    </span>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-4">Aucune donnée disponible.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Total Catégorie</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                                {breakdownData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                setChartCategoryFilter(selectedCategory);
                                setSelectedCategory(null);
                                setTimeout(() => {
                                    const element = document.getElementById('yearly-trend-chart-section');
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-bold shadow-xs hover:shadow-md transition-all duration-200"
                            style={{ backgroundColor: getVisual(selectedCategory).pieColor || '#06b6d4' }}
                        >
                            📊 Voir l'évolution temporelle
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};

export default YearlySummary;
