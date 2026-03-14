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
  history: ItemPriceHistory[];
  latestPrice: number;
  previousPrice: number | null;
  variationAmount: number | null;
  variationPercentage: number | null;
}

interface StoreData {
  storeName: string;
  products: ProductData[];
}

const PriceTrackerTab: React.FC<PriceTrackerTabProps> = ({ expenses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | 'All'>('All');

  const storeData = useMemo(() => {
    const storeMap = new Map<string, Map<string, ItemPriceHistory[]>>();

    expenses.forEach(expense => {
      if (expense.category === 'Courses' && expense.subtracted_items && expense.subtracted_items.length > 0) {
        const storeName = expense.description.trim();
        if (!storeMap.has(storeName)) {
          storeMap.set(storeName, new Map());
        }
        const productMap = storeMap.get(storeName)!;
        
        expense.subtracted_items.forEach(item => {
          const normalizedName = item.description.trim().toLowerCase();
          if (!productMap.has(normalizedName)) {
            productMap.set(normalizedName, []);
          }
          productMap.get(normalizedName)!.push({
            date: expense.date,
            amount: item.amount,
            expenseId: expense.id,
            originalName: item.description.trim()
          });
        });
      }
    });

    const result: StoreData[] = [];

    storeMap.forEach((productMap, storeName) => {
      const products: ProductData[] = [];
      
      productMap.forEach((history, normalizedName) => {
        // Sort history by date descending (newest first)
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
          originalName: sortedHistory[0].originalName,
          history: sortedHistory,
          latestPrice,
          previousPrice,
          variationAmount,
          variationPercentage
        });
      });

      // Sort products: those with variations first, then alphabetically
      products.sort((a, b) => {
        if (a.variationAmount !== null && b.variationAmount === null) return -1;
        if (a.variationAmount === null && b.variationAmount !== null) return 1;
        return a.originalName.localeCompare(b.originalName);
      });

      result.push({
        storeName,
        products
      });
    });

    // Sort stores alphabetically
    result.sort((a, b) => a.storeName.localeCompare(b.storeName));

    return result;
  }, [expenses]);

  const allStores = useMemo(() => storeData.map(s => s.storeName), [storeData]);

  const filteredData = useMemo(() => {
    return storeData
      .filter(store => selectedStore === 'All' || store.storeName === selectedStore)
      .map(store => ({
        ...store,
        products: store.products.filter(p => 
          p.originalName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
      .filter(store => store.products.length > 0);
  }, [storeData, selectedStore, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Suivez l'évolution des prix des articles scannés sur vos tickets de caisse.
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
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
          >
            <option value="All">Tous les magasins</option>
            {allStores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <TrendingUpIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun article trouvé.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Scannez des tickets de caisse pour commencer à suivre les prix.
            </p>
          </div>
        ) : (
          filteredData.map(store => (
            <div key={store.storeName} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                  {store.storeName}
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {store.products.map(product => (
                  <div key={product.normalizedName} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
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
                          <span className="text-xs opacity-75">
                            ({product.variationPercentage > 0 ? '+' : ''}{product.variationPercentage.toFixed(1)}%)
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
    </div>
  );
};

export default PriceTrackerTab;
