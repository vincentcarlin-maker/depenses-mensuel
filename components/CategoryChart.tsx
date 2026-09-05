
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Expense, type Category } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { 
    MandatoryIcon, 
    FuelIcon, 
    HeatingIcon, 
    GroceriesIcon, 
    RestaurantIcon, 
    CarRepairsIcon, 
    MiscIcon,
    ClothingIcon,
    GiftIcon,
    PalmTreeIcon,
    PillIcon
} from './icons/CategoryIcons';
import ExpenseListItem from './ExpenseListItem';
import CloseIcon from './icons/CloseIcon';

const WalletIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3" />
  </svg>
);

const BarChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zM16.2 13h2.8v6h-2.8z" />
  </svg>
);

const ListIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z" />
  </svg>
);

const TrendArrowIcon = ({ isUp, className = "w-6 h-6" }: { isUp: boolean; className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    {isUp ? (
      <path d="M7 17L17 7M17 7H9M17 7V15" />
    ) : (
      <path d="M7 7L17 17M17 17H9M17 17V9" />
    )}
  </svg>
);

const getCategoryDisplayName = (name: string): string => {
  if (name === 'Dépenses obligatoires' || name === 'Dép. récurrentes' || name === 'Dép. recurentes') {
    return 'Dép. récurrentes';
  }
  return name;
};

const ChevronRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string } } = {
  "Dép. récurrentes": { icon: MandatoryIcon, color: 'bg-slate-600' },
  "Dép. recurentes": { icon: MandatoryIcon, color: 'bg-slate-600' },
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'bg-slate-600' },
  "Courses": { icon: GroceriesIcon, color: 'bg-emerald-500' },
  "Divers": { icon: MiscIcon, color: 'bg-cyan-500' },
  "Restaurant": { icon: RestaurantIcon, color: 'bg-purple-500' },
  "Carburant": { icon: FuelIcon, color: 'bg-orange-500' },
  "Complément alimentaire": { icon: PillIcon, color: 'bg-emerald-500' },
  "Chauffage": { icon: HeatingIcon, color: 'bg-red-500' },
  "Vacances": { icon: PalmTreeIcon, color: 'bg-teal-500' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'bg-amber-500' },
  "Vêtements": { icon: ClothingIcon, color: 'bg-indigo-500' },
  "Cadeau": { icon: GiftIcon, color: 'bg-fuchsia-500' },
};

interface CategoryTotalsProps {
  expenses: Expense[];
  previousMonthExpenses: Expense[];
  previousYearMonthExpenses: Expense[];
  last3MonthsExpenses: Expense[];
  onExpenseClick: (expense: Expense) => void;
}

const CategoryTotals: React.FC<CategoryTotalsProps> = ({ expenses, previousMonthExpenses, last3MonthsExpenses, onExpenseClick }) => {
  const flags = useFeatureFlags();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (selectedCategory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedCategory]);

  const { totalExpenses, trend } = useMemo(() => {
    const currentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    let percentageChange = 0;
    if (previousTotal > 0.01) {
      percentageChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    } else if (currentTotal > 0.01) {
      percentageChange = 100;
    }
    
    return {
      totalExpenses: currentTotal,
      trend: {
        previousTotal,
        percentageChange,
      }
    };
  }, [expenses, previousMonthExpenses]);

  const { chartData, niceMax, ticks } = useMemo(() => {
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

    const maxVal = Math.max(...data.map(d => d.value), 100);
    let calculatedNiceMax = 1500;
    if (maxVal <= 100) calculatedNiceMax = 100;
    else if (maxVal <= 500) calculatedNiceMax = 500;
    else if (maxVal <= 1000) calculatedNiceMax = 1000;
    else if (maxVal <= 1500) calculatedNiceMax = 1500;
    else if (maxVal <= 2500) calculatedNiceMax = 2500;
    else if (maxVal <= 5000) calculatedNiceMax = 5000;
    else calculatedNiceMax = Math.ceil(maxVal / 1000) * 1000;

    const step = calculatedNiceMax / 3;
    const generatedTicks = [0, Math.round(step), Math.round(step * 2), calculatedNiceMax];

    return { chartData: data, niceMax: calculatedNiceMax, ticks: generatedTicks };
  }, [expenses, last3MonthsExpenses]);

  const filteredCategoryExpenses = useMemo(() => {
    if (!selectedCategory) return [];
    return expenses.filter(e => e.category === selectedCategory);
  }, [selectedCategory, expenses]);

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-900 dark:text-slate-100 tracking-tight">Analyse des dépenses</h2>
        <div className="text-center py-16 h-[300px] flex flex-col justify-center items-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune dépense à analyser pour ce mois.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        Analyse des dépenses
      </h1>

      {/* Top 2 KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100/90 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <WalletIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              <span className="sm:hidden">Dépense totale</span>
              <span className="hidden sm:inline">Dépense totale du mois</span>
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {expenses.length} transaction{expenses.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Card 2: Trend */}
        <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border flex items-center gap-3 sm:gap-4 ${
          trend.percentageChange <= 0 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/80 dark:border-emerald-900/40' 
            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100/80 dark:border-rose-900/40'
        }`}>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            trend.percentageChange <= 0 
              ? 'bg-emerald-100/90 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-100/90 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
          }`}>
            <TrendArrowIcon isUp={trend.percentageChange > 0} className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              <span className="sm:hidden">Tendance (M-1)</span>
              <span className="hidden sm:inline">Tendance mensuelle (M-1)</span>
            </p>
            {trend.previousTotal > 0.01 ? (
              <>
                <p className={`text-base sm:text-2xl font-extrabold mt-0.5 truncate ${
                  trend.percentageChange <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {Math.abs(trend.percentageChange).toFixed(0)}%
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {trend.percentageChange <= 0 ? 'de moins' : 'de plus'} que M-1
                </p>
              </>
            ) : (
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">Mois dernier : 0 €</p>
            )}
          </div>
        </div>
      </div>

      {/* Exp V2: Graphique v2 Insights */}
      {flags.graphV2 && chartData.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50/60 dark:from-violet-950/40 dark:to-indigo-950/30 border border-violet-100 dark:border-violet-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white uppercase tracking-wider">
                GRAPHIQUE V2
              </span>
              <h3 className="text-sm font-bold text-violet-950 dark:text-violet-200">
                Top Poste & Rythme Journalier
              </h3>
            </div>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              Métriques v2
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-violet-100/60 dark:border-violet-900/20">
              <p className="text-slate-500 dark:text-slate-400 font-medium">1er Poste de dépense</p>
              <p className="text-sm font-extrabold text-violet-950 dark:text-violet-100 mt-0.5 truncate">
                {chartData[0]?.name || 'N/A'}
              </p>
              <p className="text-violet-600 dark:text-violet-400 font-bold mt-0.5">
                {chartData[0]?.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>

            <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-violet-100/60 dark:border-violet-900/20">
              <p className="text-slate-500 dark:text-slate-400 font-medium">Moyenne journalière</p>
              <p className="text-sm font-extrabold text-violet-950 dark:text-violet-100 mt-0.5 truncate">
                {(totalExpenses / Math.max(new Date().getDate(), 1)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} / jour
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">
                Basé sur {new Date().getDate()} jours écoulés
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Répartition par catégorie */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100/90 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BarChartIcon className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Répartition par catégorie
          </h2>
        </div>

        {/* Horizontal Bar Chart Container */}
        <div className="space-y-4 pt-1">
          {chartData.map((entry) => {
            const visual = CategoryVisuals[entry.name as Category] || { icon: MiscIcon, color: 'bg-slate-500' };
            const IconComponent = visual.icon;
            const percentage = totalExpenses > 0 ? (entry.value / totalExpenses) * 100 : 0;
            const widthPercent = Math.min(100, Math.max(3, (entry.value / niceMax) * 100));

            return (
              <div key={entry.name} className="flex items-center gap-2 sm:gap-4 text-sm">
                {/* Left Category Name + Icon */}
                <div className="w-28 sm:w-44 shrink-0 flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${visual.color} text-white`}>
                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate" title={getCategoryDisplayName(entry.name)}>
                    {getCategoryDisplayName(entry.name)}
                  </span>
                </div>

                {/* Middle Progress Bar + Centered Percentage */}
                <div className="flex-1 relative h-5 sm:h-7 bg-slate-100/80 dark:bg-slate-700/40 rounded-lg sm:rounded-xl flex items-center overflow-hidden">
                  {/* Vertical grid lines */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none px-0.5">
                    {ticks.map((t, idx) => (
                      <div 
                        key={idx} 
                        className="h-full border-r border-slate-200/80 dark:border-slate-600/50" 
                        style={{ left: `${(t / niceMax) * 100}%` }} 
                      />
                    ))}
                  </div>

                  {/* Filled category bar */}
                  <div 
                    className={`h-full rounded-lg sm:rounded-xl transition-all duration-500 relative z-10 ${visual.color}`}
                    style={{ width: `${widthPercent}%` }}
                  />

                  {/* Centered Percentage in Middle of Gauge */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <span className="text-[10px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-100 bg-white/85 dark:bg-slate-900/85 px-1.5 sm:px-2.5 py-0.5 rounded-full backdrop-blur-xs shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Right Amount */}
                <div className="shrink-0 flex items-center justify-end min-w-[65px] sm:min-w-[90px]">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                    {entry.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Détails par catégorie */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100/90 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ListIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Détails par catégorie
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            TENDANCE (Y/Y)
          </span>
        </div>

        <div className="space-y-3">
          {chartData.map((entry) => {
            const visual = CategoryVisuals[entry.name as Category] || { icon: MiscIcon, color: 'bg-slate-500' };
            const IconComponent = visual.icon;
            const percentage = totalExpenses > 0 ? (entry.value / totalExpenses) * 100 : 0;

            return (
              <button 
                key={`detail-${entry.name}`} 
                onClick={() => setSelectedCategory(entry.name as Category)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/60 dark:bg-slate-700/30 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border border-slate-100/80 dark:border-slate-700/60 rounded-2xl transition-all text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${visual.color} text-white shadow-2xs`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                      {getCategoryDisplayName(entry.name)}
                    </p>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                      Moyenne 3 mois : {entry.average.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right ml-3">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {entry.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Expense Detail Modal */}
      {selectedCategory && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
          <div 
            className="fixed inset-0"
            onClick={() => setSelectedCategory(null)}
          ></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-2xl ${CategoryVisuals[selectedCategory]?.color || 'bg-slate-500'} text-white`}>
                  {CategoryVisuals[selectedCategory]?.icon && React.createElement(CategoryVisuals[selectedCategory].icon, { className: "h-5 w-5" })}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Dépenses : {getCategoryDisplayName(selectedCategory)}</h3>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Pour le mois en cours</p>
                </div>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-3 pb-4">
                {filteredCategoryExpenses.length > 0 ? (
                  filteredCategoryExpenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(expense => (
                      <ExpenseListItem 
                        key={expense.id} 
                        expense={expense} 
                        onExpenseClick={(e) => {
                          onExpenseClick(e);
                          setSelectedCategory(null);
                        }} 
                        isHighlighted={false}
                      />
                    ))
                ) : (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8 font-medium">Aucune dépense trouvée.</p>
                )}
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total de la catégorie</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xl">
                  {filteredCategoryExpenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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

export default CategoryTotals;

