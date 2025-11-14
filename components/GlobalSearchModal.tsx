import React, { useState, useMemo, useEffect, useRef } from 'react';
import { type Expense } from '../types';
import GroupedExpenseList from './GroupedExpenseList';
import CloseIcon from './icons/CloseIcon';
import SearchIcon from './icons/SearchIcon';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allExpenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  highlightedIds: Set<string>;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, allExpenses, onEditExpense, highlightedIds }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchedExpenses = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return allExpenses.filter(e =>
      e.description.toLowerCase().includes(lowercasedTerm) ||
      e.amount.toString().includes(lowercasedTerm) ||
      e.category.toLowerCase().includes(lowercasedTerm) ||
      e.user.toLowerCase().includes(lowercasedTerm)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpenses, searchTerm]);

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
          const timer = setTimeout(() => setSearchTerm(''), 300); // Reset after transition
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
        <div className="container mx-auto px-4 py-3 md:px-8 flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher par description, montant, catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
            />
          </div>
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
        {searchTerm.trim() ? (
            searchedExpenses.length > 0 ? (
                <div className="animate-fade-in-up">
                    <GroupedExpenseList
                        expenses={searchedExpenses}
                        onEditExpense={onEditExpense}
                        highlightedIds={highlightedIds}
                    />
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-slate-500 dark:text-slate-400">Aucun résultat trouvé pour "{searchTerm}".</p>
                </div>
            )
        ) : (
            <div className="text-center py-16">
                 <p className="text-slate-500 dark:text-slate-400">Commencez à taper pour rechercher dans toutes vos dépenses.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default GlobalSearchModal;
