import React, { useMemo, useState } from 'react';
import { type Expense } from '../types';
import SearchIcon from './icons/SearchIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';

interface PriceTrackerTabProps {
  expenses: Expense[];
}

interface ItemPriceHistory {
  date: string;
  amount: number;
  expenseId: string;
  originalName: string;
}

interface ProductData {
  normalizedName: string;
  originalName: string;
  category: string;
  history: ItemPriceHistory[];
  latestPrice: number;
  previousPrice: number | null;
  variationAmount: number | null;
  variationPercentage: number | null;
}

interface CategoryData {
  categoryName: string;
  products: ProductData[];
}

const PriceTrackerTab: React.FC<PriceTrackerTabProps> = ({ expenses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, Map<string, ItemPriceHistory[]>>();

    expenses.forEach(expense => {
      if (expense.category === 'Courses' && expense.subtracted_items && expense.subtracted_items.length > 0) {
        const storeName = expense.description.trim();
        
        expense.subtracted_items.forEach(item => {
          const categoryName = item.category || 'Autre';
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, new Map());
          }
          const productMap = categoryMap.get(categoryName)!;
          
          const normalizedName = item.description.trim().toLowerCase();
          if (!productMap.has(normalizedName)) {
            productMap.set(normalizedName, []);
          }
          productMap.get(normalizedName)!.push({
            date: expense.date,
            amount: item.amount,
            expenseId: expense.id,
            originalName: `${item.description.trim()} (${storeName})`
          });
        });
      }
    });

    const result: CategoryData[] = [];

    categoryMap.forEach((productMap, categoryName) => {
      const products: ProductData[] = [];
      
      productMap.forEach((history, normalizedName) => {
        const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const latestPrice = sortedHistory[0].amount;
        let previousPrice = null;
        let variationAmount = null;
        let variationPercentage = null;

        if (sortedHistory.length > 1) {
          previousPrice = sortedHistory[1].amount;
          variationAmount = latestPrice - previousPrice;
          variationPercentage = previousPrice > 0 ? (variationAmount / previousPrice) * 100 : 0;
        }

        products.push({
          normalizedName,
          originalName: sortedHistory[0].originalName.split(' (')[0],
          category: categoryName,
          history: sortedHistory,
          latestPrice,
          previousPrice,
          variationAmount,
          variationPercentage
        });
      });

      products.sort((a, b) => a.originalName.localeCompare(b.originalName));

      result.push({
        categoryName,
        products
      });
    });

    result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    return result;
  }, [expenses]);

  const allCategories = useMemo(() => categoryData.map(c => c.categoryName), [categoryData]);

  const filteredData = useMemo(() => {
    return categoryData
      .filter(cat => selectedCategory === 'All' || cat.categoryName === selectedCategory)
      .map(cat => ({
        ...cat,
        products: cat.products.filter(p => 
          p.originalName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
      .filter(cat => cat.products.length > 0);
  }, [categoryData, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Suivez l'évolution des prix des articles par catégorie. Cliquez sur un article pour voir son historique.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
          >
            <option value="All">Toutes les catégories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <TrendingUpIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun article trouvé.</p>
          </div>
        ) : (
          filteredData.map(cat => (
            <div key={cat.categoryName} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                  {cat.categoryName}
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {cat.products.map(product => (
                  <div 
                    key={product.normalizedName} 
                    onClick={() => setSelectedProduct(product)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 pr-4">
                        {product.originalName}
                      </h4>
                      <div className="text-right whitespace-nowrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {product.latestPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end text-sm">
                      <div className="text-slate-500 dark:text-slate-400 text-xs">
                        {product.history.length} achat{product.history.length > 1 ? 's' : ''} • Dernier le {new Date(product.history[0].date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      
                      {product.variationAmount !== null && product.variationPercentage !== null && (
                        <div className={`flex items-center gap-1 font-medium ${
                          product.variationAmount > 0 ? 'text-red-500 dark:text-red-400' : 
                          product.variationAmount < 0 ? 'text-emerald-500 dark:text-emerald-400' : 
                          'text-slate-400 dark:text-slate-500'
                        }`}>
                          {product.variationAmount > 0 ? (
                            <TrendingUpIcon className="w-4 h-4" />
                          ) : product.variationAmount < 0 ? (
                            <TrendingUpIcon className="w-4 h-4 transform rotate-180" />
                          ) : null}
                          <span>
                            {product.variationAmount > 0 ? '+' : ''}
                            {product.variationAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* History Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedProduct.originalName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedProduct.category}</p>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {selectedProduct.history.map((entry, idx) => {
                  const prevEntry = selectedProduct.history[idx + 1];
                  const diff = prevEntry ? entry.amount - prevEntry.amount : null;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {entry.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                          {entry.originalName.split(' (')[1]?.replace(')', '') || 'Magasin inconnu'}
                        </span>
                      </div>
                      
                      {diff !== null && (
                        <div className={`flex items-center gap-1 text-sm font-bold ${
                          diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceTrackerTab;
