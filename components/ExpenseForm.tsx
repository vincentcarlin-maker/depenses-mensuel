import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Expense, type Category, User, type SubtractedItem, PRODUCT_CATEGORIES, type FoyerMember } from '../types';
import { DEFAULT_FOYER } from '../utils/foyerService';
import SegmentedControl from './SegmentedControl';
import ConfirmationModal from './ConfirmationModal';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import ItemDeductionSection from './ItemDeductionSection';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';

const SUPPLEMENT_STORES = ['Nutripure', 'Nutri&co', 'Greenwhey', 'Prozis', 'Autres'] as const;
const SUPPLEMENT_TYPES = ['Oméga 3', 'Vitamine C', 'Vitamine D', 'Magnésium', 'Autres'] as const;

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  expenses: Expense[];
  initialData?: Omit<Expense, 'id' | 'date' | 'created_at'> | null;
  loggedInUser: User | string;
  onlineUsers: (User | string)[];
  disabled?: boolean;
  categories: Category[];
  groceryStores: string[];
  cars: string[];
  heatingTypes: string[];
  foyerMembers?: FoyerMember[];
  isMainFoyer?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const toDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatOperationDate = (dateString: string) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatOperationTime = (dateString: string) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  onAddExpense, 
  expenses, 
  initialData, 
  loggedInUser, 
  onlineUsers, 
  disabled = false, 
  categories, 
  groceryStores, 
  cars, 
  heatingTypes, 
  foyerMembers, 
  isMainFoyer = true,
  isOpen,
  onClose
}) => {
  const { getVisual } = useCategoryVisuals();
  const members = useMemo(() => foyerMembers && foyerMembers.length > 0 ? foyerMembers : DEFAULT_FOYER.members, [foyerMembers]);
  
  const effectiveCars = useMemo(() => cars && cars.length > 0 ? cars : ["Voiture"], [cars]);
  const effectiveHeatingTypes = useMemo(() => heatingTypes && heatingTypes.length > 0 ? heatingTypes : ["Chauffage"], [heatingTypes]);

  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData ? String(Math.abs(initialData.amount)) : '');
  const [category, setCategory] = useState<Category>(initialData?.category || categories[0] || '');
  const [user, setUser] = useState<User | string>(initialData?.user || loggedInUser || members[0]?.name || User.Sophie);
  const [date, setDate] = useState(toDatetimeLocal(new Date()));
  const [isDateManuallySet, setIsDateManuallySet] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(initialData && initialData.amount < 0 ? 'refund' : 'expense');
  const [store, setStore] = useState(groceryStores[0] || '');
  const [customStore, setCustomStore] = useState('');
  const [heatingType, setHeatingType] = useState(initialData?.category === 'Chauffage' ? (initialData.description.replace('Chauffage (', '').replace(')', '')) : (effectiveHeatingTypes[0] || 'Chauffage'));
  const [repairedCar, setRepairedCar] = useState(initialData?.category === 'Réparation voitures' ? initialData.description : (effectiveCars[0] || 'Voiture'));
  const [carMileage, setCarMileage] = useState('');
  const [carGarage, setCarGarage] = useState('');

  const [clothingPerson, setClothingPerson] = useState('Nathan');
  const [giftPerson, setGiftPerson] = useState('Nathan');
  const [giftOccasion, setGiftOccasion] = useState('Noël');

  const [supplementStore, setSupplementStore] = useState<(typeof SUPPLEMENT_STORES)[number]>(SUPPLEMENT_STORES[0]);
  const [customSupplementStore, setCustomSupplementStore] = useState('');
  const [supplementType, setSupplementType] = useState<(typeof SUPPLEMENT_TYPES)[number]>(SUPPLEMENT_TYPES[0]);
  const [customSupplementType, setCustomSupplementType] = useState('');

  const [showSubtractions, setShowSubtractions] = useState(false);
  const [receiptTotal, setReceiptTotal] = useState('');
  const [subtractedItems, setSubtractedItems] = useState<SubtractedItem[]>([]);
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [itemTargetCategory, setItemTargetCategory] = useState<Category | ''>('');
  const [createExpenseForItem, setCreateExpenseForItem] = useState(true);

  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [duplicateConfirmationOpen, setDuplicateConfirmationOpen] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState<Omit<Expense, 'id' | 'created_at'> | null>(null);
  const [detectedDuplicates, setDetectedDuplicates] = useState<Expense[]>([]);

  // Gestes tactiles pour glisser vers le bas (swipe down)
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const nonSpecialCategoryDescriptionRef = useRef(
      (initialData && !['Carburant', 'Courses'].includes(initialData.category))
      ? (initialData.description || '')
      : ''
  );

  const childrenOptions = ['Nathan', 'Chloé'];
  const occasionOptions = ['Noël', 'Anniversaire'];

  // Mise à jour de la catégorie si elle devient invalide
  useEffect(() => {
    if (categories.length > 0 && (!category || !categories.includes(category))) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // Initialisation lors de l'ouverture ou chargement de données initiales
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setAmount(String(Math.abs(initialData.amount)));
      setCategory(initialData.category);
      setUser(initialData.user);
      setTransactionType(initialData.amount < 0 ? 'refund' : 'expense');
    }
  }, [initialData]);

  // Horloge pour garder la date à jour si non modifiée manuellement
  useEffect(() => {
    if (isDateManuallySet || initialData) {
        return;
    }
    const timer = setInterval(() => {
      setDate(toDatetimeLocal(new Date()));
    }, 10000);
    return () => clearInterval(timer);
  }, [isDateManuallySet, initialData]);

  // Verrouillage du scroll d'arrière-plan quand le Bottom Sheet est ouvert
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const uniqueDescriptions = useMemo(() => {
    const tagRegex = /(#\w+)/g;
    const storeRegex = /\s\(([^)]+)\)$/;
    const allDescriptions = expenses
      .filter(e => {
        if (e.category === 'Complément alimentaire') {
          const lower = e.description.toLowerCase().trim();
          if (lower === 'boutique' || lower === 'complément acheté' || lower === 'complement achete') {
            return false;
          }
        }
        return true;
      })
      .map(e => e.description.replace(tagRegex, '').replace(storeRegex, '').trim());
    return [...new Set<string>(allDescriptions)].filter(d => d.length > 0);
  }, [expenses]);

  useEffect(() => {
    if (category === "Carburant") {
      if (!effectiveCars.includes(description)) {
        nonSpecialCategoryDescriptionRef.current = description;
        setDescription(effectiveCars[0] || 'Voiture');
      }
    } else if (category === "Courses") {
        if(effectiveCars.includes(description)) {
            setDescription(nonSpecialCategoryDescriptionRef.current);
        }
    } else {
      if (effectiveCars.includes(description)) {
        setDescription(nonSpecialCategoryDescriptionRef.current);
      }
    }
  }, [category, effectiveCars]);

  useEffect(() => {
    if (!showSubtractions) {
        setSubtractedItems([]);
        setReceiptTotal('');
        setItemDescription('');
        setItemAmount('');
    } else if (receiptTotal === '') {
        setReceiptTotal(amount);
    }
  }, [showSubtractions]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);

    if (value.trim().length > 1) {
      const lowerValue = value.toLowerCase();
      let filteredSuggestions = uniqueDescriptions
        .filter(d => 
            d.toLowerCase().includes(lowerValue) && 
            d.toLowerCase() !== lowerValue
        );

      if (category === 'Complément alimentaire') {
        filteredSuggestions = filteredSuggestions.filter(s => {
          const sLower = s.toLowerCase().trim();
          return sLower !== 'boutique' && sLower !== 'complément acheté' && sLower !== 'complement achete';
        });
      }

      filteredSuggestions = filteredSuggestions.slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDescription(suggestion);
    setSuggestions([]);
  };

  const findPossibleDuplicates = (newExpense: Omit<Expense, 'id' | 'created_at'>): Expense[] => {
    const newDate = new Date(newExpense.date);
    const newMonth = newDate.getMonth();
    const newYear = newDate.getFullYear();

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNewDesc = normalize(newExpense.description);

    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      if (expDate.getMonth() !== newMonth || expDate.getFullYear() !== newYear) {
        return false;
      }
      if (Math.abs(exp.amount - newExpense.amount) > 0.01) {
        return false;
      }
      const cleanExpDesc = normalize(exp.description);
      const isDescMatch = cleanExpDesc === cleanNewDesc || 
                          cleanExpDesc.includes(cleanNewDesc) || 
                          cleanNewDesc.includes(cleanExpDesc);

      const isCategoryMatch = exp.category === newExpense.category;
      return isDescMatch && isCategoryMatch;
    });
  };

  const handleConfirmDuplicate = () => {
    if (pendingExpenseData) {
        submitExpense(pendingExpenseData);
        setPendingExpenseData(null);
        setDuplicateConfirmationOpen(false);
        setDetectedDuplicates([]);
    }
  };

  const submitExpense = (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
    let finalSubtractedItems: SubtractedItem[] = [];

    if (expenseData.subtracted_items && expenseData.subtracted_items.length > 0) {
        finalSubtractedItems = expenseData.subtracted_items.map(item => {
            if (item.is_subtracted !== false && item.target_category && item.create_expense === true) {
                onAddExpense({
                    description: `${item.description} (déduit de ${expenseData.description})`,
                    amount: item.amount,
                    category: item.target_category,
                    user: expenseData.user,
                    date: expenseData.date,
                    subtracted_items: []
                });
                return {
                    ...item,
                    expense_created: true,
                    create_expense: false
                };
            }
            return item;
        });
    }

    onAddExpense({
        ...expenseData,
        subtracted_items: finalSubtractedItems
    });

    // Réinitialisation propre
    if (!initialData) {
        setDescription(category === "Carburant" ? (effectiveCars[0] || 'Voiture') : '');
        setAmount('');
        setStore(groceryStores[0] || '');
        setCustomStore('');
        setHeatingType(effectiveHeatingTypes[0] || 'Chauffage');
        setCategory(categories[0] || '');
        setTransactionType('expense');
        setError('');
        setSuggestions([]);
        setRepairedCar(effectiveCars[0] || 'Voiture');
        setCarMileage('');
        setCarGarage('');
        setClothingPerson('Nathan');
        setGiftPerson('Nathan');
        setGiftOccasion('Noël');
        setSupplementStore(SUPPLEMENT_STORES[0]);
        setCustomSupplementStore('');
        setSupplementType(SUPPLEMENT_TYPES[0]);
        setCustomSupplementType('');
        setDate(toDatetimeLocal(new Date()));
        setIsDateManuallySet(false);
        setShowSubtractions(false);
        setReceiptTotal('');
        setSubtractedItems([]);
        setItemTargetCategory('');
        setCreateExpenseForItem(true);
    }

    // Fermeture du bottom sheet après enregistrement
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalAmount;
    let finalSubtractedItems: SubtractedItem[] = [];

    if (['Courses', 'Divers'].includes(category) && showSubtractions) {
      const currentSubtractedItems = [...subtractedItems];
      const parsedPendingAmount = parseFloat(itemAmount.replace(',', '.'));
      if (itemDescription.trim() && !isNaN(parsedPendingAmount) && parsedPendingAmount > 0) {
          currentSubtractedItems.push({ 
              description: itemDescription.trim(), 
              amount: parsedPendingAmount, 
              is_subtracted: true,
              category: itemCategory,
              target_category: itemTargetCategory || undefined,
              create_expense: itemTargetCategory ? createExpenseForItem : false
          });
      }
      const parsedTotal = parseFloat(receiptTotal.replace(',', '.'));
      if (isNaN(parsedTotal) || parsedTotal <= 0) {
        setError('Le montant du ticket est requis.');
        return;
      }
      const subtractions = currentSubtractedItems.filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0);
      const calculatedAmount = Math.max(0, parsedTotal - subtractions);
      finalAmount = transactionType === 'expense' ? calculatedAmount : -calculatedAmount;
      finalSubtractedItems = currentSubtractedItems;
    } else {
      if (!amount) {
        setError('Le montant est requis.');
        return;
      }
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Veuillez entrer un montant supérieur à 0.');
        return;
      }
      finalAmount = transactionType === 'expense' ? parsedAmount : -parsedAmount;
    }
    
    let finalDescription = '';
    if (category === 'Courses') {
        const selectedStore = store === 'Autres' ? customStore.trim() : store;
        if (!selectedStore) {
            setError('Veuillez sélectionner un magasin ou en spécifier un.');
            return;
        }
        finalDescription = selectedStore;
    } else if (category === 'Chauffage') {
        if (!heatingType) {
            setError('Veuillez sélectionner un type de chauffage.');
            return;
        }
        finalDescription = `Chauffage (${heatingType})`;
    } else if (category === 'Réparation voitures') {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            setError('La description de la réparation est requise.');
            return;
        }
        if (!repairedCar) {
            setError('Veuillez sélectionner un véhicule.');
            return;
        }
        
        let repairDetails = trimmedDescription;
        if (carGarage.trim()) {
            repairDetails += ` chez ${carGarage.trim()}`;
        }
        if (carMileage.trim()) {
            repairDetails += ` à ${carMileage.trim()} km`;
        }
        
        finalDescription = `${repairDetails} (${repairedCar})`;
    } else if (category === 'Vêtements') {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            setError('La description est requise.');
            return;
        }
        finalDescription = isMainFoyer ? `${trimmedDescription} (${clothingPerson})` : trimmedDescription;
    } else if (category === 'Cadeau') {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            setError('La description est requise.');
            return;
        }
        finalDescription = isMainFoyer ? `${trimmedDescription} (${giftPerson} - ${giftOccasion})` : trimmedDescription;
    } else if (category === 'Complément alimentaire') {
        if (isMainFoyer) {
            const finalStore = supplementStore === 'Autres' ? customSupplementStore.trim() : supplementStore;
            const finalType = supplementType === 'Autres' ? customSupplementType.trim() : supplementType;
            if (!finalStore) {
                setError('Veuillez spécifier la boutique.');
                return;
            }
            if (!finalType) {
                setError('Veuillez spécifier le complément.');
                return;
            }
            finalDescription = `${finalType} (${finalStore})`;
        } else {
            const trimmedDescription = description.trim();
            if (!trimmedDescription) {
                setError('La description est requise.');
                return;
            }
            finalDescription = trimmedDescription;
        }
    } else {
        finalDescription = description.trim();
    }

    if (!finalDescription) {
        setError('La description est requise.');
        return;
    }

    const finalDate = isDateManuallySet ? new Date(date).toISOString() : new Date().toISOString();

    const newExpensePayload = {
      description: finalDescription,
      amount: finalAmount,
      category,
      user,
      date: finalDate,
      subtracted_items: finalSubtractedItems
    };

    const duplicates = findPossibleDuplicates(newExpensePayload);
    if (duplicates.length > 0) {
        setPendingExpenseData(newExpensePayload);
        setDetectedDuplicates(duplicates);
        setDuplicateConfirmationOpen(true);
    } else {
        submitExpense(newExpensePayload);
    }
  };

  // Fermeture sécurisée pour éviter les pertes accidentelles
  const handleAttemptClose = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const hasData = (!isNaN(parsedAmount) && parsedAmount > 0) || (description && description.trim().length > 3);
    if (hasData) {
      if (window.confirm("Voulez-vous fermer sans enregistrer la dépense en cours ?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Gestion du glissement vers le bas (swipe down / drag) pour fermer instantanément
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleScrollTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 5) {
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchStartY(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY;
      if (deltaY > 0) {
        setDragOffset(deltaY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 55) {
      // Fermeture immédiate par descente vers le bas demandée par l'utilisateur
      onClose();
    }
    setTouchStartY(null);
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      if (deltaY > 0) {
        setDragOffset(deltaY);
      }
    };
    const handleMouseUp = (upEvent: MouseEvent) => {
      if (upEvent.clientY - startY > 55) {
        onClose();
      }
      setDragOffset(0);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[120] flex flex-col justify-end"
      aria-modal="true"
      role="dialog"
    >
      {/* 1. Arrière-plan légèrement assombri avec flou doux */}
      <div 
        className="fixed inset-0 bg-slate-900/50 dark:bg-black/65 backdrop-blur-xs transition-opacity duration-300 animate-backdrop-in"
        onClick={handleAttemptClose}
        aria-hidden="true"
      />

      {/* 2. Panneau coulissant depuis le bas (Bottom Sheet) */}
      <div 
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
        className="relative z-10 w-full max-w-2xl mx-auto bg-white dark:bg-slate-850 rounded-t-[32px] sm:rounded-t-[36px] shadow-2xl border-t border-x border-slate-100 dark:border-slate-700/70 flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-bottomsheet-up overflow-hidden transition-transform duration-150"
      >
        {/* Poignée et En-tête Sticky */}
        <div 
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="sticky top-0 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md z-30 px-5 sm:px-6 pt-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/60 select-none cursor-grab active:cursor-grabbing"
        >
          {/* Poignée horizontale bien visible */}
          <div className="w-14 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-3 hover:bg-slate-400 transition-colors" />

          {/* Ligne d'en-tête */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Icône de transaction dans un petit carré bleu très clair */}
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100/80 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                  Ajouter une transaction
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  Enregistrez une dépense ou un remboursement.
                </p>
              </div>
            </div>

            {/* Bouton « × » agrandi pour fermer */}
            <button
              type="button"
              onClick={handleAttemptClose}
              className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 shadow-2xs"
              aria-label="Fermer"
              title="Fermer"
            >
              <svg className="w-6 h-6 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corps scrollable du formulaire */}
        <div 
          ref={scrollContainerRef}
          onTouchStart={handleScrollTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="overflow-y-auto px-5 sm:px-6 py-5 space-y-6 flex-1 overscroll-contain"
        >
          <form id="bottom-sheet-expense-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 3. QUI A PAYÉ ? */}
            <div>
              <div className="mb-2.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Qui a payé ?
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sélectionnez la personne qui a effectué le paiement.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {members.map((m) => {
                  const isSelected = user === m.name;
                  const isSophie = m.name === User.Sophie;
                  const userColor = m.color || (isSophie ? '#ec4899' : '#0ea5e9');

                  const isOnline = (onlineUsers || []).some(
                    u => String(u).trim().toLowerCase() === String(m.name).trim().toLowerCase()
                  ) || (loggedInUser && String(loggedInUser).trim().toLowerCase() === String(m.name).trim().toLowerCase());

                  return (
                    <button
                      key={m.id || m.name}
                      type="button"
                      onClick={() => setUser(m.name)}
                      className={`p-2 sm:p-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer min-w-0 ${
                        isSelected
                          ? isSophie 
                            ? 'bg-pink-50/90 dark:bg-pink-950/40 border-2 border-pink-500 text-pink-600 dark:text-pink-300 shadow-xs scale-[1.02]' 
                            : 'bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-500 text-blue-600 dark:text-blue-300 shadow-xs scale-[1.02]'
                          : 'bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <span 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-2xs text-xs font-bold"
                          style={{ backgroundColor: userColor }}
                        >
                          {m.name.charAt(0)}
                        </span>
                        {isOnline ? (
                          <span 
                            title={`${m.name} est en ligne`}
                            className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center"
                          >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-white dark:border-slate-850" />
                          </span>
                        ) : (
                          <span 
                            title={`${m.name} est hors ligne`}
                            className="w-2 h-2 rounded-full border border-white dark:border-slate-850 absolute -bottom-0.5 -right-0.5 bg-slate-300 dark:bg-slate-600" 
                          />
                        )}
                      </div>
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
                
                {/* Cagnotte */}
                <button
                  type="button"
                  onClick={() => setUser(User.Commun)}
                  className={`p-2 sm:p-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer min-w-0 ${
                    user === User.Commun
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs scale-[1.02]'
                      : 'bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    €
                  </div>
                  <span className="truncate">Cagnotte</span>
                </button>
              </div>
            </div>

            {/* 4. CATÉGORIE */}
            <div>
              <div className="mb-2.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Catégorie
                </label>
              </div>
              
              {categories.length === 0 ? (
                <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 rounded-2xl text-xs text-sky-800 dark:text-sky-300">
                  Aucune catégorie configurée.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
                  {categories.map((cat) => {
                    const visual = getVisual(cat);
                    const Icon = visual?.icon;
                    const isSelected = category === cat;
                    const isHovered = hoveredCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        onMouseEnter={() => setHoveredCategory(cat)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`aspect-square w-full rounded-2xl border transition-all duration-150 cursor-pointer p-1 flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? `${visual?.borderColor || 'border-blue-400'} ${visual?.badgeBg || 'bg-blue-50'} ring-2 ring-current/25 ${visual?.textColor || 'text-blue-600'} shadow-xs scale-[1.03]`
                            : isHovered
                              ? `${visual?.borderColor || 'border-blue-200'} ${visual?.badgeBg || 'bg-blue-50/80'} ${visual?.textColor || 'text-blue-600'} shadow-xs scale-[1.02]`
                              : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                        }`}
                        title={cat}
                      >
                        <div className={`w-6 h-6 flex items-center justify-center shrink-0 transition-transform ${isHovered || isSelected ? 'scale-110' : ''} ${visual?.textColor || 'text-slate-600 dark:text-slate-400'}`}>
                          {Icon && <Icon className="w-5 h-5 shrink-0" />}
                        </div>
                        <span className={`text-[10px] leading-tight text-center px-0.5 line-clamp-2 transition-colors ${
                          isSelected 
                            ? 'font-black text-slate-950 dark:text-white' 
                            : isHovered 
                              ? `font-bold ${visual?.textColor || 'text-slate-900 dark:text-white'}` 
                              : 'font-semibold text-slate-600 dark:text-slate-300'
                        }`}>
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Options spécifiques aux catégories */}
            {category === 'Courses' && (
              <div className="space-y-4 animate-fade-in bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="store-select" className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">Magasin</label>
                    <select id="store-select" value={store} onChange={e => setStore(e.target.value)} className="block w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold rounded-xl">
                      {groceryStores.map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="Autres">Autres</option>
                    </select>
                  </div>
                  {store === 'Autres' && (
                    <div>
                      <label htmlFor="custom-store" className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">Magasin personnalisé</label>
                      <input type="text" id="custom-store" value={customStore} onChange={e => setCustomStore(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold" placeholder="Nom du magasin" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {['Courses', 'Divers'].includes(category) && (
              <ItemDeductionSection
                showSubtractions={showSubtractions}
                setShowSubtractions={setShowSubtractions}
                subtractedItems={subtractedItems}
                setSubtractedItems={setSubtractedItems}
                receiptTotal={receiptTotal}
                setReceiptTotal={setReceiptTotal}
                categories={categories}
                currentCategory={category}
              />
            )}

            {!showSubtractions && (
              <div className="space-y-4">
                {category === 'Chauffage' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Type de Chauffage</label>
                    <SegmentedControl
                      options={effectiveHeatingTypes}
                      value={heatingType}
                      onChange={setHeatingType}
                      colorClass="text-brand-600 dark:text-brand-400"
                    />
                  </div>
                )}

                {category === 'Réparation voitures' && (
                  <div className="animate-fade-in space-y-3 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Véhicule</label>
                      <SegmentedControl
                        options={effectiveCars}
                        value={repairedCar}
                        onChange={setRepairedCar}
                        colorClass="text-brand-600 dark:text-brand-400"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="car-garage" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Garage</label>
                        <input
                          type="text"
                          id="car-garage"
                          value={carGarage}
                          onChange={(e) => setCarGarage(e.target.value)}
                          className="block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                          placeholder="Ex: Renault, Norauto..."
                        />
                      </div>
                      <div>
                        <label htmlFor="car-mileage" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kilométrage</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            id="car-mileage"
                            value={carMileage}
                            onChange={(e) => setCarMileage(e.target.value)}
                            className="block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold pr-10"
                            placeholder="Ex: 120000"
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 font-semibold pointer-events-none">km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {category === 'Vêtements' && isMainFoyer && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pour qui ?</label>
                    <SegmentedControl
                      options={childrenOptions}
                      value={clothingPerson}
                      onChange={setClothingPerson}
                      colorClass="text-brand-600 dark:text-brand-400"
                    />
                  </div>
                )}

                {category === 'Cadeau' && isMainFoyer && (
                  <div className="space-y-3 animate-fade-in bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pour qui ?</label>
                      <SegmentedControl
                        options={childrenOptions}
                        value={giftPerson}
                        onChange={setGiftPerson}
                        colorClass="text-brand-600 dark:text-brand-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Occasion</label>
                      <SegmentedControl
                        options={occasionOptions}
                        value={giftOccasion}
                        onChange={setGiftOccasion}
                        colorClass="text-brand-600 dark:text-brand-400"
                      />
                    </div>
                  </div>
                )}

                {category === 'Complément alimentaire' && isMainFoyer && (
                  <div className="space-y-3 animate-fade-in bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">Boutique</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SUPPLEMENT_STORES.map((storeOption) => {
                          const isSelected = supplementStore === storeOption;
                          return (
                            <button
                              key={storeOption}
                              type="button"
                              onClick={() => setSupplementStore(storeOption)}
                              className={`px-3 py-2 rounded-xl border text-left transition-all font-semibold text-xs cursor-pointer truncate ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {storeOption}
                            </button>
                          );
                        })}
                      </div>
                      {supplementStore === 'Autres' && (
                        <input
                          type="text"
                          value={customSupplementStore}
                          onChange={(e) => setCustomSupplementStore(e.target.value)}
                          className="mt-2 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold placeholder-slate-400"
                          placeholder="Nom de la boutique..."
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">Complément</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SUPPLEMENT_TYPES.map((typeOption) => {
                          const isSelected = supplementType === typeOption;
                          return (
                            <button
                              key={typeOption}
                              type="button"
                              onClick={() => setSupplementType(typeOption)}
                              className={`px-3 py-2 rounded-xl border text-left transition-all font-semibold text-xs cursor-pointer truncate ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {typeOption}
                            </button>
                          );
                        })}
                      </div>
                      {supplementType === 'Autres' && (
                        <input
                          type="text"
                          value={customSupplementType}
                          onChange={(e) => setCustomSupplementType(e.target.value)}
                          className="mt-2 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold placeholder-slate-400"
                          placeholder="Nom du complément..."
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* 5. DESCRIPTION */}
                {!['Chauffage', 'Courses', ...(isMainFoyer ? ['Complément alimentaire'] : [])].includes(category) && (
                  <div>
                    {category === "Carburant" ? (
                      <div className="animate-fade-in">
                        <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                          Véhicule
                        </label>
                        <SegmentedControl
                          options={effectiveCars}
                          value={description}
                          onChange={(val) => setDescription(val)}
                          colorClass="text-brand-600 dark:text-brand-400"
                        />
                      </div>
                    ) : (
                      <>
                        <label htmlFor="description" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                          {category === 'Restaurant' ? 'Restaurant' : category === 'Réparation voitures' ? 'Réparation effectuée' : 'Description'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={handleDescriptionChange}
                            onFocus={(e) => handleDescriptionChange(e)}
                            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                            className="block w-full px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-semibold transition-all"
                            placeholder={category === 'Restaurant' ? "Ex: La Pizzaiola, McDo..." : category === 'Vêtements' ? "Ex: Pantalon, Manteau..." : category === 'Cadeau' ? "Ex: Lego, Poupée..." : "Ex : McDo, Cinéma…"}
                            autoComplete="off"
                          />
                          {suggestions.length > 0 && (
                            <ul className="absolute z-[60] w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl mt-1 shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-600">
                              {suggestions.map((suggestion, index) => (
                                <li
                                  key={index}
                                  className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-medium"
                                  onMouseDown={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 6. TYPE (Dépense / Remb.) */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTransactionType('expense')}
                      className={`py-2.5 sm:py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-sm ${
                        transactionType === 'expense'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs ring-2 ring-rose-500/10'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0">−</span>
                      <span>Dépense</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionType('refund')}
                      className={`py-2.5 sm:py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-sm ${
                        transactionType === 'refund'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs ring-2 ring-emerald-500/10'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">+</span>
                      <span>Remb.</span>
                    </button>
                  </div>
                </div>

                {/* 7. MONTANT (€) */}
                <div>
                  <label htmlFor="amount" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    Montant (€)
                  </label>
                  <div className="relative flex items-center bg-[#f4f8ff] dark:bg-slate-800/90 border border-[#dbeafe] dark:border-blue-900/50 rounded-2xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <input
                      ref={amountInputRef}
                      type="text"
                      inputMode="decimal"
                      id="amount"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                      }}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-black text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none tracking-tight"
                      placeholder="0,00"
                    />
                    <span className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 ml-2 shrink-0 select-none">€</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold animate-shake">
                {error}
              </div>
            )}

            {/* 8. DATE DE L'OPÉRATION */}
            <div>
              <div className="bg-[#f8fafc] dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                    <CalendarDaysIcon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">Date de l’opération</span>
                    <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {formatOperationDate(date)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 font-normal">·</span>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatOperationTime(date)}
                      </span>
                    </div>
                  </div>
                </div>
                <label htmlFor="expense-date" className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95 border border-blue-200/60 dark:border-blue-800/60">
                  Modifier
                  <input
                    type="datetime-local"
                    id="expense-date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setIsDateManuallySet(true);
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* 9. BOUTON PRINCIPAL (Zone Sticky en bas du Bottom Sheet) */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 pb-[calc(env(safe-area-inset-bottom)+12px)] z-30">
          <button
            type="submit"
            form="bottom-sheet-expense-form"
            disabled={disabled || (!showSubtractions && (!amount || parseFloat(amount.replace(',', '.')) <= 0))}
            className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold py-3.5 sm:py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg cursor-pointer select-none"
          >
            {disabled ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Synchronisation...</span>
              </>
            ) : (
              <>
                <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                  +
                </span>
                <span>{transactionType === 'refund' ? 'Ajouter le remboursement' : 'Ajouter la dépense'}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Modal de doublons */}
      <ConfirmationModal 
        isOpen={duplicateConfirmationOpen}
        onClose={() => {
          setDuplicateConfirmationOpen(false);
          setPendingExpenseData(null);
          setDetectedDuplicates([]);
        }}
        onConfirm={handleConfirmDuplicate}
        title="Doublon potentiel détecté"
        message={detectedDuplicates.length > 0 ? (
          <div className="text-left">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Attention, {detectedDuplicates.length} dépense{detectedDuplicates.length > 1 ? 's' : ''} identique{detectedDuplicates.length > 1 ? 's' : ''} trouvée{detectedDuplicates.length > 1 ? 's' : ''} pour ce mois :
            </p>
            <ul className="list-disc pl-4 mb-4 space-y-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-xs sm:text-sm max-h-40 overflow-y-auto custom-scrollbar">
              {detectedDuplicates.map(d => (
                <li key={d.id} className="text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 last:border-0 pb-1 last:pb-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{new Date(d.date).toLocaleDateString()}</span>
                  <span className="block break-words">{d.description}</span>
                  <span className="block font-medium text-slate-800 dark:text-slate-100">{Math.abs(d.amount)} €</span>
                </li>
              ))}
            </ul>
            <p>Voulez-vous vraiment ajouter cette dépense à nouveau ?</p>
          </div>
        ) : "Une dépense très similaire existe déjà ce mois-ci. Voulez-vous confirmer l'ajout ?"}
      />
    </div>,
    document.body
  );
};

export default ExpenseForm;
