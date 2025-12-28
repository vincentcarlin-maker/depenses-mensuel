
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { type Expense, User, type Category } from '../types';
import GroupedExpenseList from './GroupedExpenseList';
import CloseIcon from './icons/CloseIcon';
import SearchIcon from './icons/SearchIcon';
import FunnelIcon from './icons/FunnelIcon';
import { type ModificationType } from '../App';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allExpenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  highlightedIds: Set<string>;
  modifiedInfo?: Map<string, ModificationType[]>;
  categories: Category[];
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, allExpenses, onEditExpense, highlightedIds, modifiedInfo = new Map(), categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterUser, setFilterUser] = useState<User | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchedExpenses = useMemo(() => {
    // Filter by text first
    let result = allExpenses;
    
    if (searchTerm.trim()) {
        const lowercasedTerm = searchTerm.toLowerCase();
        result = result.filter(e =>
          e.description.toLowerCase().includes(lowercasedTerm) ||
          e.amount.toString().includes(lowercasedTerm) ||
          e.category.toLowerCase().includes(lowercasedTerm) ||
          e.user.toLowerCase().includes(lowercasedTerm)
        );
    }

    // Apply specific filters
    if (filterUser !== 'All') {
        result = result.filter(e => e.user === filterUser);
    }
    if (filterCategory !== 'All') {
        result = result.filter(e => e.category === filterCategory);
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpenses, searchTerm, filterUser, filterCategory]);

  useEffect(() => {
    if (isOpen) {
      // Focus the input when the modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Reset search term when modal closes
  useEffect(() => {
      if (!isOpen) {
          const timer = setTimeout(() => {
              setSearchTerm('');
              setShowFilters(false);
              setFilterUser('All');
              setFilterCategory('All');
          }, 300); // Reset after transition
          return () => clearTimeout(timer);
      }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-50 dark:bg-slate-900 z-50 animate-slide-in-up"
      aria-modal="true"
      role="dialog"
    >
      <header className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:px-8 flex items-center gap-2 md:gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
            />
          </div>
          <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-shrink-0 p-2.5 rounded-lg border transition-colors ${showFilters || filterUser !== 'All' || filterCategory !== 'All' ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400' : 'bg-slate-100 dark:bg-slate-700 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              aria-label="Filtres"
          >
              <FunnelIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Fermer la recherche"
          >
            <CloseIcon />
          </button>
        </div>
      </header>
      <main className="p-4 md:p-8 overflow-y-auto h-[calc(100%-60px)] container mx-auto">
        {showFilters && (
           <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in shadow-sm">
               <div>
                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Par personne</label>
                   <div className="flex gap-2">
                       <button 
                           onClick={() => setFilterUser('All')}
                           className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors border ${filterUser === 'All' ? 'bg-slate-100 dark:bg-slate-700 border-transparent text-slate-800 dark:text-slate-100' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                       >
                           Tous
                       </button>
                       <button 
                           onClick={() => setFilterUser(User.Sophie)}
                           className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors border ${filterUser === User.Sophie ? 'bg-pink-500 border-pink-600 text-white' : 'bg-white dark:bg-slate-800 border-pink-200 dark:border-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10'}`}
                       >
                           Sophie
                       </button>
                       <button 
                           onClick={() => setFilterUser(User.Vincent)}
                           className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors border ${filterUser === User.Vincent ? 'bg-sky-500 border-sky-600 text-white' : 'bg-white dark:bg-slate-800 border-sky-200 dark:border-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10'}`}
                       >
                           Vincent
                       </button>
                   </div>
               </div>
               <div>
                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Par catégorie</label>
                   <select
                       value={filterCategory}
                       onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}
                       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                   >
                       <option value="All">Toutes les catégories</option>
                       {categories.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                       ))}
                   </select>
               </div>
           </div>
        )}

        {searchedExpenses.length > 0 ? (
            <div className="animate-fade-in-up">
                <div className="mb-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {searchedExpenses.length} résultat{searchedExpenses.length > 1 ? 's' : ''}
                </div>
                <GroupedExpenseList
                    expenses={searchedExpenses}
                    onExpenseClick={onEditExpense}
                    highlightedIds={highlightedIds}
                    modifiedInfo={modifiedInfo}
                />
            </div>
        ) : (
            <div className="text-center py-16">
                 {searchTerm || filterUser !== 'All' || filterCategory !== 'All' ? (
                     <p className="text-slate-500 dark:text-slate-400">Aucun résultat pour cette recherche.</p>
                 ) : (
                    <div className="flex flex-col items-center">
                        <SearchIcon className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Recherchez dans tout l'historique.</p>
                    </div>
                 )}
            </div>
        )}
      </main>
    </div>
  );
};

export default GlobalSearchModal;
