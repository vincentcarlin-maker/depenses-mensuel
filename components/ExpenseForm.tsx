
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { type Expense, type Category, User, type SubtractedItem } from '../types';
import SegmentedControl from './SegmentedControl';
import ConfirmationModal from './ConfirmationModal';
import PiggyBankIcon from './icons/PiggyBankIcon';
import ScissorsIcon from './icons/ScissorsIcon';
import TrashIcon from './icons/TrashIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
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
    PalmTreeIcon
} from './icons/CategoryIcons';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; bgColor: string; borderColor: string } } = {
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700', borderColor: 'border-slate-200 dark:border-slate-600' },
  "Carburant": { icon: FuelIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/10', borderColor: 'border-orange-100 dark:border-orange-500/20' },
  "Chauffage": { icon: HeatingIcon, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-100 dark:border-red-500/20' },
  "Courses": { icon: GroceriesIcon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-500/10', borderColor: 'border-green-100 dark:border-green-500/20' },
  "Restaurant": { icon: RestaurantIcon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-100 dark:border-purple-500/20' },
  "Vacances": { icon: PalmTreeIcon, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-500/10', borderColor: 'border-teal-100 dark:border-teal-500/20' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-500/10', borderColor: 'border-yellow-100 dark:border-yellow-500/20' },
  "Vêtements": { icon: ClothingIcon, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10', borderColor: 'border-indigo-100 dark:border-indigo-500/20' },
  "Cadeau": { icon: GiftIcon, color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', borderColor: 'border-fuchsia-100 dark:border-fuchsia-500/20' },
  "Divers": { icon: MiscIcon, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20' },
};

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  expenses: Expense[];
  initialData?: Omit<Expense, 'id' | 'date' | 'created_at'> | null;
  loggedInUser: User;
  onlineUsers: User[];
  disabled?: boolean;
  categories: Category[];
  groceryStores: string[];
  cars: string[];
  heatingTypes: string[];
}

const toDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, expenses, initialData, loggedInUser, onlineUsers, disabled = false, categories, groceryStores, cars, heatingTypes }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData ? String(Math.abs(initialData.amount)) : '');
  const [category, setCategory] = useState<Category>(initialData?.category || categories[0] || '');
  const [user, setUser] = useState<User>(initialData?.user || loggedInUser);
  const [date, setDate] = useState(toDatetimeLocal(new Date()));
  const [isDateManuallySet, setIsDateManuallySet] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(initialData && initialData.amount < 0 ? 'refund' : 'expense');
  const [store, setStore] = useState(groceryStores[0] || '');
  const [customStore, setCustomStore] = useState('');
  const [heatingType, setHeatingType] = useState(heatingTypes[0] || '');
  const [repairedCar, setRepairedCar] = useState(cars[0] || '');
  
  const [showSubtractions, setShowSubtractions] = useState(false);
  const [receiptTotal, setReceiptTotal] = useState('');
  const [subtractedItems, setSubtractedItems] = useState<SubtractedItem[]>([]);
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const itemDescriptionInputRef = useRef<HTMLInputElement>(null);

  const [clothingPerson, setClothingPerson] = useState('Nathan');
  const [giftPerson, setGiftPerson] = useState('Nathan');
  const [giftOccasion, setGiftOccasion] = useState('Noël');
  
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [duplicateConfirmationOpen, setDuplicateConfirmationOpen] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState<Omit<Expense, 'id' | 'created_at'> | null>(null);
  const [detectedDuplicates, setDetectedDuplicates] = useState<Expense[]>([]);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const nonSpecialCategoryDescriptionRef = useRef(
      (initialData && !['Carburant', 'Courses'].includes(initialData.category))
      ? (initialData.description || '')
      : ''
  );

  const childrenOptions = ['Nathan', 'Chloé'];
  const occasionOptions = ['Noël', 'Anniversaire'];

  useEffect(() => {
    if (isDateManuallySet || initialData) {
        return;
    }
    const timer = setInterval(() => {
      setDate(toDatetimeLocal(new Date()));
    }, 10000);
    return () => clearInterval(timer);
  }, [isDateManuallySet, initialData]);

  const uniqueDescriptions = useMemo(() => {
    const tagRegex = /(#\w+)/g;
    const storeRegex = /\s\(([^)]+)\)$/;
    const allDescriptions = expenses.map(e => e.description.replace(tagRegex, '').replace(storeRegex, '').trim());
    return [...new Set<string>(allDescriptions)].filter(d => d.length > 0);
  }, [expenses]);
  
  const finalCalculatedAmount = useMemo(() => {
    const total = parseFloat(receiptTotal.replace(',', '.')) || 0;
    const subtractions = subtractedItems.reduce((sum, item) => sum + item.amount, 0);
    const currentItemAmount = parseFloat(itemAmount.replace(',', '.')) || 0;
    const intentionalSubtraction = itemDescription.trim() ? currentItemAmount : 0;
    return total - subtractions - intentionalSubtraction;
  }, [receiptTotal, subtractedItems, itemAmount, itemDescription]);


  useEffect(() => {
    if (initialData) {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }
  }, [initialData]); 

  useEffect(() => {
    if (category === "Carburant") {
      if (!cars.includes(description)) {
        nonSpecialCategoryDescriptionRef.current = description;
        setDescription(cars[0] || '');
      }
    } else if (category === "Courses") {
        if(cars.includes(description)) {
            setDescription(nonSpecialCategoryDescriptionRef.current);
        }
    } else {
      if (cars.includes(description)) {
        setDescription(nonSpecialCategoryDescriptionRef.current);
      }
    }
  }, [category, cars]);

  useEffect(() => {
    if (!showSubtractions) {
        setSubtractedItems([]);
        setReceiptTotal('');
        setItemDescription('');
        setItemAmount('');
    }
  }, [showSubtractions]);


  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);

    if (value.trim().length > 1) {
      const lowerValue = value.toLowerCase();
      const filteredSuggestions = uniqueDescriptions
        .filter(d => 
            d.toLowerCase().includes(lowerValue) && 
            d.toLowerCase() !== lowerValue
        )
        .slice(0, 5);
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
      const expenseDate = new Date(newExpense.date);
      const currentMonth = expenseDate.getMonth();
      const currentYear = expenseDate.getFullYear();
      const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const newDescNormalized = normalize(newExpense.description);
      return expenses.filter(e => {
          const eDate = new Date(e.date);
          if (eDate.getMonth() !== currentMonth || eDate.getFullYear() !== currentYear) return false;
          if (e.user !== newExpense.user) return false;
          if (e.category !== newExpense.category) return false;
          const isSameAmount = Math.abs(e.amount - newExpense.amount) < 0.01; 
          if (!isSameAmount) return false;
          return normalize(e.description) === newDescNormalized;
      });
  };

  const handleConfirmDuplicate = () => {
      if (pendingExpenseData) {
          submitExpense(pendingExpenseData);
          setDuplicateConfirmationOpen(false);
          setPendingExpenseData(null);
          setDetectedDuplicates([]);
      }
  };

  const submitExpense = (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
    onAddExpense(expenseData);
    if (!initialData) {
        setDescription(category === "Carburant" ? (cars[0] || '') : '');
        setAmount('');
        setStore(groceryStores[0] || '');
        setCustomStore('');
        setHeatingType(heatingTypes[0] || '');
        setCategory(categories[0] || '');
        setTransactionType('expense');
        setError('');
        setSuggestions([]);
        setRepairedCar(cars[0] || '');
        setClothingPerson('Nathan');
        setGiftPerson('Nathan');
        setGiftOccasion('Noël');
        setDate(toDatetimeLocal(new Date()));
        setIsDateManuallySet(false);
        setShowSubtractions(false);
        setReceiptTotal('');
        setSubtractedItems([]);
    }
  };
  
   const handleAddSubtractedItem = () => {
    const parsedAmount = parseFloat(itemAmount.replace(',', '.'));
    if (itemDescription.trim() && !isNaN(parsedAmount) && parsedAmount > 0) {
        setSubtractedItems([...subtractedItems, { description: itemDescription.trim(), amount: parsedAmount }]);
        setItemDescription('');
        setItemAmount('');
        itemDescriptionInputRef.current?.focus();
    }
  };

  const handleRemoveSubtractedItem = (index: number) => {
    setSubtractedItems(subtractedItems.filter((_, i) => i !== index));
  };
  
  const handleItemInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtractedItem();
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalAmount;
    let finalSubtractedItems: SubtractedItem[] | undefined = undefined;

    if (category === 'Courses' && showSubtractions) {
      const currentSubtractedItems = [...subtractedItems];
      const parsedPendingAmount = parseFloat(itemAmount.replace(',', '.'));
      if (itemDescription.trim() && !isNaN(parsedPendingAmount) && parsedPendingAmount > 0) {
          currentSubtractedItems.push({ description: itemDescription.trim(), amount: parsedPendingAmount });
      }
      const parsedTotal = parseFloat(receiptTotal.replace(',', '.'));
      if (isNaN(parsedTotal) || parsedTotal <= 0) {
        setError('Le montant du ticket est requis.');
        return;
      }
      const subtractions = currentSubtractedItems.reduce((sum, item) => sum + item.amount, 0);
      finalAmount = parsedTotal - subtractions;
      finalSubtractedItems = currentSubtractedItems;
    } else {
      if (!amount) {
        setError('Le montant est requis.');
        return;
      }
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Veuillez entrer un montant positif.');
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
        finalDescription = `${trimmedDescription} (${repairedCar})`;
    } else if (category === 'Vêtements') {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            setError('La description est requise.');
            return;
        }
        finalDescription = `${trimmedDescription} (${clothingPerson})`;
    } else if (category === 'Cadeau') {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            setError('La description est requise.');
            return;
        }
        finalDescription = `${trimmedDescription} (${giftPerson} - ${giftOccasion})`;
    }
    else {
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

  const getUserSliderPosition = () => {
      switch (user) {
          case User.Sophie: return 'translate-x-0';
          case User.Vincent: return 'translate-x-[100%]';
          case User.Commun: return 'translate-x-[200%]';
          default: return 'translate-x-0';
      }
  };

  const partnerName = loggedInUser === User.Sophie ? User.Vincent : User.Sophie;
  const isPartnerOnline = onlineUsers.includes(partnerName);

  let sophieButtonClass = '';
  if (isPartnerOnline && partnerName === User.Sophie) {
      sophieButtonClass = 'text-green-500 dark:text-green-400 animate-pulse';
  } else if (user === User.Sophie) {
      sophieButtonClass = 'text-pink-600 dark:text-pink-400';
  } else {
      sophieButtonClass = 'text-slate-600 dark:text-slate-300';
  }

  let vincentButtonClass = '';
  if (isPartnerOnline && partnerName === User.Vincent) {
      vincentButtonClass = 'text-green-500 dark:text-green-400 animate-pulse';
  } else if (user === User.Vincent) {
      vincentButtonClass = 'text-sky-600 dark:text-sky-400';
  } else {
      vincentButtonClass = 'text-slate-600 dark:text-slate-300';
  }

  return (
    <>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-brand-100 dark:border-slate-700">
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Ajouter une Transaction</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Qui a payé ?</label>
            <div className="relative flex w-full bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                <span
                className={`absolute top-1 bottom-1 left-1 w-[calc(33.33%-4px)] rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out ${getUserSliderPosition()}`}
                aria-hidden="true"
                />
                <button type="button" onClick={() => setUser(User.Sophie)} className={`relative z-10 w-1/3 p-2 rounded-full text-sm font-semibold transition-colors ${sophieButtonClass}`}>
                Sophie
                </button>
                <button type="button" onClick={() => setUser(User.Vincent)} className={`relative z-10 w-1/3 p-2 rounded-full text-sm font-semibold transition-colors ${vincentButtonClass}`}>
                Vincent
                </button>
                <button type="button" onClick={() => setUser(User.Commun)} className={`relative z-10 w-1/3 p-2 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${user === User.Commun ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    <PiggyBankIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Cagnotte</span>
                </button>
            </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                    Catégorie
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {categories.map((cat) => {
                        const visual = CategoryVisuals[cat] || CategoryVisuals["Divers"];
                        const Icon = visual.icon;
                        const isSelected = category === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 ${
                                    isSelected 
                                    ? `${visual.borderColor} ${visual.bgColor} ring-2 ring-brand-500/20 shadow-sm scale-105` 
                                    : 'border-transparent bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <div className={`mb-1.5 ${isSelected ? visual.color : 'text-slate-400 dark:text-slate-500'}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className={`text-[10px] text-center font-bold leading-tight ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {cat}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {category === 'Courses' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="store-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Magasin</label>
                            <select id="store-select" value={store} onChange={e => setStore(e.target.value)} className="block w-full pl-3 pr-10 py-2.5 text-base bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm rounded-lg">
                                {groceryStores.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value="Autres">Autres</option>
                            </select>
                        </div>
                        {store === 'Autres' && (
                            <div>
                                <label htmlFor="custom-store" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Magasin personnalisé</label>
                                <input type="text" id="custom-store" value={customStore} onChange={e => setCustomStore(e.target.value)} className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm" placeholder="Nom du magasin" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                        <label htmlFor="toggle-subtractions" className="font-medium text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2">
                            <ScissorsIcon />
                            <span>Déduire des articles personnels ?</span>
                        </label>
                        <button
                            type="button"
                            id="toggle-subtractions"
                            onClick={() => setShowSubtractions(!showSubtractions)}
                            className={`${showSubtractions ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
                            role="switch"
                            aria-checked={showSubtractions}
                        >
                            <span className={`${showSubtractions ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                        </button>
                    </div>
                </div>
            )}
            
            {category === 'Courses' && showSubtractions ? (
              <div className="animate-fade-in space-y-4">
                 <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <ScissorsIcon />
                      <h4 className="font-semibold">Articles à déduire</h4>
                    </div>

                     {subtractedItems.length > 0 && (
                      <div className="space-y-2 max-h-28 overflow-y-auto pr-2">
                        {subtractedItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-600 p-2 rounded-md">
                            <span className="text-sm text-slate-700 dark:text-slate-200">{item.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.amount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span>
                              <button type="button" onClick={() => handleRemoveSubtractedItem(index)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                          <label className="text-xs font-medium text-slate-500">Article</label>
                          <input ref={itemDescriptionInputRef} type="text" value={itemDescription} onChange={e => setItemDescription(e.target.value)} onKeyDown={handleItemInputKeyDown} placeholder="Ex: Shampoing" className="block w-full px-2 py-1.5 bg-white dark:bg-slate-600 text-sm rounded-md border-slate-300 dark:border-slate-500"/>
                      </div>
                      <div className="w-24">
                          <label className="text-xs font-medium text-slate-500">Montant</label>
                          <input type="text" inputMode="decimal" value={itemAmount} onChange={e => setItemAmount(e.target.value)} onKeyDown={handleItemInputKeyDown} placeholder="0.00" className="block w-full px-2 py-1.5 bg-white dark:bg-slate-600 text-sm rounded-md border-slate-300 dark:border-slate-500"/>
                      </div>
                      <button type="button" onClick={handleAddSubtractedItem} className="px-3 py-1.5 bg-brand-500 text-white text-sm font-semibold rounded-md hover:bg-brand-600">+</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Ticket (€)</label>
                        <input type="text" inputMode="decimal" value={receiptTotal} onChange={e => setReceiptTotal(e.target.value)} className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg font-semibold"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Montant final</label>
                        <input type="text" value={finalCalculatedAmount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})} readOnly className="block w-full px-3 py-2.5 bg-slate-200 dark:bg-slate-600 text-brand-600 dark:text-brand-400 border-transparent rounded-lg font-bold"/>
                    </div>
                </div>
              </div>
            ) : (
                <div className="animate-fade-in space-y-4">
                  {category === 'Chauffage' && (
                      <div className="animate-fade-in">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type de Chauffage</label>
                          <SegmentedControl
                              options={heatingTypes}
                              value={heatingType}
                              onChange={setHeatingType}
                              colorClass="text-brand-600 dark:text-brand-400"
                          />
                      </div>
                  )}

                  {category === 'Réparation voitures' && (
                      <div className="animate-fade-in">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Véhicule</label>
                          <SegmentedControl
                              options={cars}
                              value={repairedCar}
                              onChange={setRepairedCar}
                              colorClass="text-brand-600 dark:text-brand-400"
                          />
                      </div>
                  )}

                  {category === 'Vêtements' && (
                      <div className="animate-fade-in">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pour qui ?</label>
                          <SegmentedControl
                              options={childrenOptions}
                              value={clothingPerson}
                              onChange={setClothingPerson}
                              colorClass="text-brand-600 dark:text-brand-400"
                          />
                      </div>
                  )}

                  {category === 'Cadeau' && (
                      <div className="space-y-4 animate-fade-in">
                          <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pour qui ?</label>
                              <SegmentedControl
                                  options={childrenOptions}
                                  value={giftPerson}
                                  onChange={setGiftPerson}
                                  colorClass="text-brand-600 dark:text-brand-400"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Occasion</label>
                              <SegmentedControl
                                  options={occasionOptions}
                                  value={giftOccasion}
                                  onChange={setGiftOccasion}
                                  colorClass="text-brand-600 dark:text-brand-400"
                              />
                          </div>
                      </div>
                  )}
                  
                  { !['Chauffage', 'Courses'].includes(category) && (
                      <div>
                      {category === "Carburant" ? (
                          <div className="animate-fade-in">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Véhicule</label>
                          <SegmentedControl
                              options={cars}
                              value={description}
                              onChange={(val) => setDescription(val)}
                              colorClass="text-brand-600 dark:text-brand-400"
                          />
                          </div>
                      ) : (
                          <>
                          <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Description</label>
                          <div className="relative">
                              <input
                              type="text"
                              id="description"
                              value={description}
                              onChange={handleDescriptionChange}
                              onFocus={(e) => handleDescriptionChange(e)}
                              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                              className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm"
                              placeholder={category === 'Vêtements' ? "Ex: Pantalon, Manteau..." : category === 'Cadeau' ? "Ex: Lego, Poupée..." : "Ex: McDo, Cinéma..."}
                              autoComplete="off"
                              />
                              {suggestions.length > 0 && (
                              <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                  {suggestions.map((suggestion, index) => (
                                  <li
                                      key={index}
                                      className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm"
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
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type</label>
                      <div className="relative flex w-full bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                          <span
                          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out
                              ${transactionType === 'refund' ? 'translate-x-full' : 'translate-x-0'}
                          `}
                          aria-hidden="true"
                          />
                          <button type="button" onClick={() => setTransactionType('expense')} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${transactionType === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          Dépense
                          </button>
                          <button type="button" onClick={() => setTransactionType('refund')} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${transactionType === 'refund' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          Remb.
                          </button>
                      </div>
                  </div>
                  <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                      Montant (€)
                      </label>
                      <input
                      ref={amountInputRef}
                      type="text"
                      inputMode="decimal"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm"
                      placeholder="0.00"
                      />
                  </div>
                  </div>
                </div>
            )}

            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Date : <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                    </div>
                    <label htmlFor="expense-date" className="text-sm font-semibold text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
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
                <button
                type="submit"
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-slate-800 transition-all duration-200 ease-in-out transform hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Ajouter</span>
                    </>
                )}
                </button>
            </div>
        </form>
        </div>
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
                                <span className="block truncate">{d.description}</span>
                                <span className="block font-medium text-slate-800 dark:text-slate-100">{Math.abs(d.amount)} €</span>
                            </li>
                        ))}
                    </ul>
                    <p>Voulez-vous vraiment ajouter cette dépense à nouveau ?</p>
                </div>
            ) : "Une dépense très similaire existe déjà ce mois-ci. Voulez-vous confirmer l'ajout ?"}
        />
    </>
  );
};

export default ExpenseForm;
