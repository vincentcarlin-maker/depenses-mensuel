import React, { useState, useRef } from 'react';
import { type Category, type SubtractedItem } from '../types';
import TrashIcon from './icons/TrashIcon';
import { 
  ShoppingBagOutlineIcon, 
  ClothingIcon, 
  GamingIcon, 
  GiftOutlineIcon, 
  BooksIcon
} from './icons/CategoryIcons';

interface ItemDeductionSectionProps {
  showSubtractions: boolean;
  setShowSubtractions: (show: boolean) => void;
  subtractedItems: SubtractedItem[];
  setSubtractedItems: React.Dispatch<React.SetStateAction<SubtractedItem[]>>;
  receiptTotal: string;
  setReceiptTotal: (val: string) => void;
  categories: Category[];
  currentCategory?: Category;
}

// Helper to guess item icon based on name or category
export const getItemIcon = (description: string, targetCategory?: string): React.FC<{ className?: string }> => {
  const lower = description.toLowerCase();
  
  if (targetCategory === 'Vêtements' || /sweat|t-shirt|chemise|pantalon|pull|manteau|veste|jean|robe|jupe|chaussure|basket|chaussette|sape|habit|vetement/i.test(lower)) {
    return ClothingIcon;
  }
  if (targetCategory === 'Loisirs' || /jeu|game|playstation|ps5|xbox|switch|console|jouet|figurine/i.test(lower)) {
    return GamingIcon;
  }
  if (targetCategory === 'Cadeau' || /cadeau|offert|anniversaire|noel/i.test(lower)) {
    return GiftOutlineIcon;
  }
  if (/livre|bd|manga|roman|bouquin/i.test(lower)) {
    return BooksIcon;
  }
  return ShoppingBagOutlineIcon;
};

export const ReceiptIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 3h6" />
  </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ItemDeductionSection: React.FC<ItemDeductionSectionProps> = ({
  showSubtractions,
  setShowSubtractions,
  subtractedItems,
  setSubtractedItems,
  receiptTotal,
  setReceiptTotal,
  categories
}) => {
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Form states for adding new item
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemTargetCategory, setItemTargetCategory] = useState<string>('');
  const [createExpenseForItem, setCreateExpenseForItem] = useState<boolean>(true);
  
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  // Available categories for reattribution (excluding current main expense category if wanted)
  const reattributionCategories = categories;

  const totalSubtracted = subtractedItems
    .filter(i => i.is_subtracted !== false)
    .reduce((sum, i) => sum + i.amount, 0);

  const parsedReceipt = parseFloat(receiptTotal.replace(',', '.')) || 0;
  const calculatedFinalAmount = Math.max(0, parsedReceipt - totalSubtracted);

  const handleAddSubtractedItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(itemAmount.replace(',', '.'));
    if (itemDescription.trim() && !isNaN(parsedAmount) && parsedAmount > 0) {
      setSubtractedItems(prev => [
        ...prev,
        {
          description: itemDescription.trim(),
          amount: parsedAmount,
          is_subtracted: true,
          target_category: itemTargetCategory || undefined,
          create_expense: itemTargetCategory ? createExpenseForItem : false
        }
      ]);
      setItemDescription('');
      setItemAmount('');
      setItemTargetCategory('');
      setCreateExpenseForItem(true);
      setIsAddFormOpen(false);
    }
  };

  const handleRemoveSubtractedItem = (index: number) => {
    setSubtractedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemTargetCategory = (index: number, newTargetCategory: string) => {
    setSubtractedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        target_category: newTargetCategory || undefined,
        create_expense: newTargetCategory ? true : false
      };
      return updated;
    });
  };

  const handleUpdateItemCreateExpense = (index: number, createExpense: boolean) => {
    setSubtractedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        create_expense: createExpense
      };
      return updated;
    });
  };

  return (
    <div className="space-y-4 my-2 animate-fade-in">
      {/* 1. Toggle Switch Header Card */}
      <div className="bg-blue-50/60 dark:bg-slate-800/80 border border-blue-100/90 dark:border-slate-700 p-4 sm:p-5 rounded-3xl flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <UserCircleIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
              Déduire des achats personnels ?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Retirez du total les achats qui ne concernent pas le foyer.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !showSubtractions;
            setShowSubtractions(next);
            if (next && !receiptTotal) {
              setReceiptTotal('');
            }
          }}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showSubtractions ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
          role="switch"
          aria-checked={showSubtractions}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              showSubtractions ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 2. Subtracted Items & Summary (Visible when enabled) */}
      {showSubtractions && (
        <div className="space-y-4 animate-fade-in">
          {/* Card: Articles personnels */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            {/* Header / Accordion trigger */}
            <div 
              onClick={() => setIsSectionExpanded(!isSectionExpanded)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShoppingBagOutlineIcon className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Articles personnels
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-600 shadow-2xs">
                  {subtractedItems.length} article{subtractedItems.length > 1 ? 's' : ''} · {totalSubtracted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <svg 
                    className={`w-5 h-5 transform transition-transform duration-200 ${isSectionExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded List of Items */}
            {isSectionExpanded && (
              <div className="space-y-3 pt-1">
                {subtractedItems.length > 0 ? (
                  <div className="space-y-2.5">
                    {subtractedItems.map((item, index) => {
                      const ItemIcon = getItemIcon(item.description, item.target_category);
                      return (
                        <div
                          key={index}
                          className="bg-white dark:bg-slate-700/90 border border-slate-200/80 dark:border-slate-600/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs transition-all hover:border-blue-200 dark:hover:border-slate-500"
                        >
                          {/* Item Header Line */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <ItemIcon className="w-5 h-5" />
                              </div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                {item.description}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                                {item.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubtractedItem(index)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
                                title="Supprimer cet article"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Reattribution Category Bar ("n'oublie pas la partie pour reatribuer à une catégorie") */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-600/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] shrink-0 flex items-center gap-1">
                                <span>➡️ Réattribuer :</span>
                              </span>
                              <select
                                value={item.target_category || ''}
                                onChange={(e) => handleUpdateItemTargetCategory(index, e.target.value)}
                                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-[200px]"
                              >
                                <option value="">Aucune (déduction seule)</option>
                                {reattributionCategories.map(cat => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {item.target_category && (
                              <label className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={item.create_expense !== false}
                                  onChange={(e) => handleUpdateItemCreateExpense(index, e.target.checked)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                />
                                <span>Créer la dépense séparée</span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {/* Dashed Button "+ Ajouter un article" */}
                {!isAddFormOpen ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddFormOpen(true);
                      setTimeout(() => descriptionInputRef.current?.focus(), 100);
                    }}
                    className="w-full border-2 border-dashed border-blue-200 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-700 bg-white/70 dark:bg-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center font-black text-xs">
                      +
                    </div>
                    <span>Ajouter un article</span>
                  </button>
                ) : (
                  /* Expanded Inline Add Item Form */
                  <div 
                    className="bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 shadow-md space-y-3.5 animate-fade-in"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-600">
                      <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        Ajouter un article à déduire
                      </h5>
                      <button
                        type="button"
                        onClick={() => setIsAddFormOpen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Annuler
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nom de l'article
                        </label>
                        <input
                          ref={descriptionInputRef}
                          type="text"
                          value={itemDescription}
                          onChange={(e) => setItemDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtractedItem(e);
                            }
                          }}
                          placeholder="Ex: Sweat Nathan, Jeu vidéo..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Montant (€)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={itemAmount}
                          onChange={(e) => setItemAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtractedItem(e);
                            }
                          }}
                          placeholder="25.00"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Reattribution Category Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Réattribuer à une catégorie (optionnel)
                      </label>
                      <select
                        value={itemTargetCategory}
                        onChange={(e) => setItemTargetCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Aucune (déduction seule)</option>
                        {reattributionCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {itemTargetCategory && (
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                        <input
                          type="checkbox"
                          id="createExpenseForItemToggle"
                          checked={createExpenseForItem}
                          onChange={(e) => setCreateExpenseForItem(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="createExpenseForItemToggle" className="cursor-pointer">
                          Créer automatiquement une dépense de ce montant dans la catégorie "{itemTargetCategory}"
                        </label>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddFormOpen(false)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSubtractedItem}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors"
                      >
                        + Ajouter l'article
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Card: Récapitulatif */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ReceiptIcon className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Récapitulatif
              </h4>
            </div>

            <div className="space-y-2 pt-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Total du ticket
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={receiptTotal}
                    onChange={(e) => setReceiptTotal(e.target.value)}
                    placeholder="0,00"
                    className="w-24 px-2.5 py-1 text-right bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">€</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Achats personnels
                </span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  - {totalSubtracted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-2">
              <div className="bg-blue-100/70 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-900/50 rounded-2xl p-3.5 flex items-center justify-between text-blue-950 dark:text-blue-100 shadow-2xs">
                <span className="font-extrabold text-sm sm:text-base">
                  Montant comptabilisé
                </span>
                <span className="font-black text-lg sm:text-xl">
                  {calculatedFinalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDeductionSection;
