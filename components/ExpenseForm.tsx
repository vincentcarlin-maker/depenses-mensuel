
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { type Expense, type Category, User, type SubtractedItem, PRODUCT_CATEGORIES, type FoyerMember } from '../types';
import { DEFAULT_FOYER } from '../utils/foyerService';
import SegmentedControl from './SegmentedControl';
import ConfirmationModal from './ConfirmationModal';
import PiggyBankIcon from './icons/PiggyBankIcon';
import ScissorsIcon from './icons/ScissorsIcon';
import TrashIcon from './icons/TrashIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import ItemDeductionSection from './ItemDeductionSection';
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
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; bgColor: string; borderColor: string } } = {
  "Dépenses récurrentes": { icon: MandatoryIcon, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700', borderColor: 'border-slate-200 dark:border-slate-600' },
  "Dép. récurrentes": { icon: MandatoryIcon, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700', borderColor: 'border-slate-200 dark:border-slate-600' },
  "Dép. recurentes": { icon: MandatoryIcon, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700', borderColor: 'border-slate-200 dark:border-slate-600' },
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700', borderColor: 'border-slate-200 dark:border-slate-600' },
  "Carburant": { icon: FuelIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/10', borderColor: 'border-orange-100 dark:border-orange-500/20' },
  "Chauffage": { icon: HeatingIcon, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-100 dark:border-red-500/20' },
  "Courses": { icon: GroceriesIcon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-500/10', borderColor: 'border-green-100 dark:border-green-500/20' },
  "Restaurant": { icon: RestaurantIcon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-100 dark:border-purple-500/20' },
  "Vacances": { icon: PalmTreeIcon, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-500/10', borderColor: 'border-teal-100 dark:border-teal-500/20' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-500/10', borderColor: 'border-yellow-100 dark:border-yellow-500/20' },
  "Vêtements": { icon: ClothingIcon, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10', borderColor: 'border-indigo-100 dark:border-indigo-500/20' },
  "Cadeau": { icon: GiftIcon, color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', borderColor: 'border-fuchsia-100 dark:border-fuchsia-500/20' },
  "Complément alimentaire": { icon: PillIcon, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-100 dark:border-emerald-500/20' },
  "Divers": { icon: MiscIcon, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-500/10', borderColor: 'border-cyan-100 dark:border-cyan-500/20' },
};

const TICKET_RESTAURANT_KEYWORDS = [
  't restaurant', 't restau', 't.rest', 'cb rest', 'ticket rest', 't. restaurant', 'restau'
];

const SUPPLEMENT_STORES = ['Nutripure', 'GreenWhey', 'Nutri&co', 'Autres'];
const SUPPLEMENT_TYPES = ['Oméga 3', 'Vitamine D', 'Vitamine C', 'Magnésium', 'Autres'];

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
}

const toDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, expenses, initialData, loggedInUser, onlineUsers, disabled = false, categories, groceryStores, cars, heatingTypes, foyerMembers }) => {
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

  useEffect(() => {
    if (categories.length > 0 && (!category || !categories.includes(category))) {
      setCategory(categories[0]);
    }
  }, [categories, category]);
  
  const [showSubtractions, setShowSubtractions] = useState(false);
  const [receiptTotal, setReceiptTotal] = useState('');
  const [subtractedItems, setSubtractedItems] = useState<SubtractedItem[]>([]);
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemCategory, setItemCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [itemTargetCategory, setItemTargetCategory] = useState<string>('');
  const [createExpenseForItem, setCreateExpenseForItem] = useState<boolean>(true);
  const itemDescriptionInputRef = useRef<HTMLInputElement>(null);

  const [clothingPerson, setClothingPerson] = useState('Nathan');
  const [giftPerson, setGiftPerson] = useState('Nathan');
  const [giftOccasion, setGiftOccasion] = useState('Noël');
  
  const [supplementStore, setSupplementStore] = useState('Nutripure');
  const [customSupplementStore, setCustomSupplementStore] = useState('');
  const [supplementTypes, setSupplementTypes] = useState<string[]>([]);
  const [customSupplementType, setCustomSupplementType] = useState('');
  
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [duplicateConfirmationOpen, setDuplicateConfirmationOpen] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState<Omit<Expense, 'id' | 'created_at'> | null>(null);
  const [detectedDuplicates, setDetectedDuplicates] = useState<Expense[]>([]);

  const knownProducts = useMemo(() => {
    const products = new Set<string>();
    expenses.forEach(e => {
      if (e.subtracted_items) {
        e.subtracted_items.forEach(item => {
          products.add(item.description.trim());
        });
      }
    });
    return Array.from(products);
  }, [expenses]);

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
    const subtractions = subtractedItems.filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0);
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
      const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const newDescNormalized = normalize(newExpense.description);
      
      return expenses.filter(e => {
          const eDate = new Date(e.date);
          const timeDiff = Math.abs(eDate.getTime() - expenseDate.getTime());
          const daysDiff = timeDiff / (1000 * 3600 * 24);
          
          const isSameMonth = eDate.getMonth() === expenseDate.getMonth() && eDate.getFullYear() === expenseDate.getFullYear();
          if (!isSameMonth && daysDiff > 7) return false;

          const isSameAmount = Math.abs(e.amount - newExpense.amount) < 0.01; 
          const isSameCategory = e.category === newExpense.category;
          
          const eDescNormalized = normalize(e.description);
          const isDescriptionSimilar = eDescNormalized === newDescNormalized || 
                                       (eDescNormalized.length > 3 && newDescNormalized.includes(eDescNormalized)) || 
                                       (newDescNormalized.length > 3 && eDescNormalized.includes(newDescNormalized));

          if (isSameAmount && (isSameCategory || isDescriptionSimilar)) {
              return true;
          }
          
          return false;
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
    let finalSubtractedItems = expenseData.subtracted_items;

    // Automatically create separate expenses for subtracted items that have a target category assigned
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
        setSupplementStore('Nutripure');
        setCustomSupplementStore('');
        setSupplementTypes([]);
        setCustomSupplementType('');
        setDate(toDatetimeLocal(new Date()));
        setIsDateManuallySet(false);
        setShowSubtractions(false);
        setReceiptTotal('');
        setSubtractedItems([]);
        setItemTargetCategory('');
        setCreateExpenseForItem(true);
    }
  };
  
   const handleAddSubtractedItem = () => {
    const parsedAmount = parseFloat(itemAmount.replace(',', '.'));
    if (itemDescription.trim() && !isNaN(parsedAmount) && parsedAmount > 0) {
        setSubtractedItems([...subtractedItems, { 
            description: itemDescription.trim(), 
            amount: parsedAmount, 
            is_subtracted: true,
            category: itemCategory,
            target_category: itemTargetCategory || undefined,
            create_expense: itemTargetCategory ? createExpenseForItem : false
        }]);
        setItemDescription('');
        setItemAmount('');
        setItemTargetCategory('');
        setCreateExpenseForItem(true);
        itemDescriptionInputRef.current?.focus();
    }
  };

  const handleRemoveSubtractedItem = (index: number) => {
    setSubtractedItems(subtractedItems.filter((_, i) => i !== index));
  };

  const handleToggleSubtractedItem = (index: number) => {
    const newItems = [...subtractedItems];
    newItems[index].is_subtracted = newItems[index].is_subtracted === false ? true : false;
    setSubtractedItems(newItems);
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
        finalDescription = `${trimmedDescription} (${clothingPerson})`;
    } else if (category === 'Cadeau') {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            setError('La description est requise.');
            return;
        }
        finalDescription = `${trimmedDescription} (${giftPerson} - ${giftOccasion})`;
    } else if (category === 'Complément alimentaire') {
        const selectedStore = supplementStore === 'Autres' ? customSupplementStore.trim() : supplementStore;
        if (!selectedStore) {
            setError('Veuillez sélectionner une boutique ou en spécifier une.');
            return;
        }
        
        if (supplementTypes.length === 0) {
            setError('Veuillez sélectionner au moins un complément.');
            return;
        }
        
        let types = [...supplementTypes];
        if (types.includes('Autres')) {
            if (!customSupplementType.trim()) {
                setError('Veuillez spécifier le complément "Autres".');
                return;
            }
            types = types.map(t => t === 'Autres' ? customSupplementType.trim() : t);
        }
        
        finalDescription = `${types.join(', ')} (${selectedStore})`;
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

  const getUserSliderPosition = () => {
      switch (user) {
          case User.Sophie: return 'translate-x-0';
          case User.Vincent: return 'translate-x-[100%]';
          case User.Commun: return 'translate-x-[200%]';
          default: return 'translate-x-0';
      }
  };

  return (
    <>
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-7 border-b border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100/80 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Ajouter une transaction</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enregistrez une dépense ou un remboursement.</p>
                </div>
            </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-7 space-y-5 sm:space-y-6">
            <div>
              <div className="mb-2 sm:mb-2.5">
                <label className="block text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Qui a payé ?</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sélectionnez la personne qui a effectué le paiement.</p>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                {members.map((m) => {
                  const isSelected = user === m.name;
                  const userColor = m.color || (m.name === User.Sophie ? '#ec4899' : '#0ea5e9');

                  const isOnline = (onlineUsers || []).some(
                    u => String(u).trim().toLowerCase() === String(m.name).trim().toLowerCase()
                  ) || (loggedInUser && String(loggedInUser).trim().toLowerCase() === String(m.name).trim().toLowerCase());

                  return (
                    <button
                      key={m.id || m.name}
                      type="button"
                      onClick={() => setUser(m.name)}
                      style={isSelected ? { borderColor: userColor, backgroundColor: `${userColor}15` } : {}}
                      className={`p-1.5 sm:p-3 rounded-2xl font-bold text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer min-w-0 ${
                        isSelected
                          ? 'border-2 shadow-xs'
                          : 'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <span 
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-2xs"
                          style={{ backgroundColor: userColor }}
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        {isOnline ? (
                          <span 
                            title={`${m.name} est en ligne`}
                            className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center"
                          >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 border-2 border-white dark:border-slate-800 shadow-xs shadow-emerald-500" />
                          </span>
                        ) : (
                          <span 
                            title={`${m.name} est hors ligne`}
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white dark:border-slate-800 absolute -bottom-0.5 -right-0.5 bg-slate-300 dark:bg-slate-600 transition-colors" 
                          />
                        )}
                      </div>
                      <span className="truncate" style={isSelected ? { color: userColor } : {}}>{m.name}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setUser(User.Commun)}
                  className={`p-1.5 sm:p-3 rounded-2xl font-bold text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer min-w-0 ${
                    user === User.Commun
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0">
                    €
                  </div>
                  <span className="truncate">Cagnotte</span>
                </button>
              </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Catégorie
                </label>
                {categories.length === 0 ? (
                    <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 rounded-2xl text-xs sm:text-sm text-sky-800 dark:text-sky-300 flex items-center justify-between gap-3">
                        <span>Vous n'avez pas encore de catégorie dans ce foyer. Vous pouvez créer vos propres catégories dans les <strong>Réglages &gt; Catégories</strong>.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                        {categories.map((cat) => {
                            const visual = getVisual(cat);
                            const Icon = visual.icon;
                            const isSelected = category === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all duration-200 ${
                                        isSelected 
                                        ? `${visual.borderColor || 'border-blue-200'} ${visual.badgeBg} ring-1 ring-brand-500/20 shadow-sm scale-105` 
                                        : 'border-transparent bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <div className={`mb-1 ${isSelected ? visual.textColor : 'text-slate-400 dark:text-slate-500'}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-[9px] text-center font-bold leading-tight ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {cat}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {category === 'Courses' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="store-select" className="block text-sm font-bold text-slate-900 dark:text-slate-100">Magasin</label>
                            </div>
                            <select id="store-select" value={store} onChange={e => setStore(e.target.value)} className="block w-full px-4 py-2.5 text-base bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm font-semibold rounded-2xl">
                                {groceryStores.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value="Autres">Autres</option>
                            </select>
                        </div>
                        {store === 'Autres' && (
                            <div>
                                <label htmlFor="custom-store" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Magasin personnalisé</label>
                                <input type="text" id="custom-store" value={customStore} onChange={e => setCustomStore(e.target.value)} className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm font-semibold" placeholder="Nom du magasin" />
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
                <div className="animate-fade-in space-y-4">
                  {category === 'Chauffage' && (
                      <div className="animate-fade-in">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type de Chauffage</label>
                          <SegmentedControl
                              options={effectiveHeatingTypes}
                              value={heatingType}
                              onChange={setHeatingType}
                              colorClass="text-brand-600 dark:text-brand-400"
                          />
                      </div>
                  )}

                  {category === 'Réparation voitures' && (
                      <div className="animate-fade-in space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Véhicule</label>
                              <SegmentedControl
                                  options={effectiveCars}
                                  value={repairedCar}
                                  onChange={setRepairedCar}
                                  colorClass="text-brand-600 dark:text-brand-400"
                              />
                          </div>
                          <div>
                              <label htmlFor="car-garage" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Garage</label>
                              <input
                                  type="text"
                                  id="car-garage"
                                  value={carGarage}
                                  onChange={(e) => setCarGarage(e.target.value)}
                                  className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm"
                                  placeholder="Ex: Renault, Norauto..."
                              />
                          </div>
                          <div>
                              <label htmlFor="car-mileage" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Kilométrage</label>
                              <div className="relative">
                                  <input
                                      type="text"
                                      inputMode="numeric"
                                      id="car-mileage"
                                      value={carMileage}
                                      onChange={(e) => setCarMileage(e.target.value)}
                                      className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm pr-10"
                                      placeholder="Ex: 120000"
                                  />
                                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                      <span className="text-slate-500 sm:text-sm">km</span>
                                  </div>
                              </div>
                          </div>
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
                  
                  {category === 'Complément alimentaire' && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Boutique</label>
                                  <select value={supplementStore} onChange={e => setSupplementStore(e.target.value)} className="block w-full pl-3 pr-10 py-2.5 text-base bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm rounded-lg">
                                      {SUPPLEMENT_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                              {supplementStore === 'Autres' && (
                                  <div>
                                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Boutique personnalisée</label>
                                      <input type="text" value={customSupplementStore} onChange={e => setCustomSupplementStore(e.target.value)} className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm" placeholder="Nom de la boutique" />
                                  </div>
                              )}
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Compléments achetés</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {SUPPLEMENT_TYPES.map(type => (
                                      <label key={type} className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                                          <input
                                              type="checkbox"
                                              checked={supplementTypes.includes(type)}
                                              onChange={(e) => {
                                                  if (e.target.checked) {
                                                      setSupplementTypes([...supplementTypes, type]);
                                                  } else {
                                                      setSupplementTypes(supplementTypes.filter(t => t !== type));
                                                  }
                                              }}
                                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                          />
                                          <span className="text-sm text-slate-700 dark:text-slate-200">{type}</span>
                                      </label>
                                  ))}
                              </div>
                          </div>
                          {supplementTypes.includes('Autres') && (
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Complément personnalisé</label>
                                  <input type="text" value={customSupplementType} onChange={e => setCustomSupplementType(e.target.value)} className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm" placeholder="Nom du complément" />
                              </div>
                          )}
                      </div>
                  )}
                  
                  { !['Chauffage', 'Courses', 'Complément alimentaire'].includes(category) && (
                      <div>
                      {category === "Carburant" ? (
                          <div className="animate-fade-in">
                          <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Véhicule</label>
                          <SegmentedControl
                              options={effectiveCars}
                              value={description}
                              onChange={(val) => setDescription(val)}
                              colorClass="text-brand-600 dark:text-brand-400"
                          />
                          </div>
                      ) : (
                          <>
                          <label htmlFor="description" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                            {category === 'Restaurant' ? 'Restaurant' : category === 'Réparation voitures' ? 'Réparation effectuée' : 'Description'}
                          </label>
                          <div className="relative z-50">
                              <input
                              type="text"
                              id="description"
                              value={description}
                              onChange={handleDescriptionChange}
                              onFocus={(e) => handleDescriptionChange(e)}
                              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-semibold"
                              placeholder={category === 'Restaurant' ? "Ex: La Pizzaiola, McDo..." : category === 'Vêtements' ? "Ex: Pantalon, Manteau..." : category === 'Cadeau' ? "Ex: Lego, Poupée..." : category === 'Réparation voitures' ? "Ex: Vidange, Pneus..." : "Ex: McDo, Cinéma..."}
                              autoComplete="off"
                              />
                              {suggestions.length > 0 && (
                              <ul className="absolute z-[100] w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md mt-1 shadow-xl max-h-48 overflow-y-auto">
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
                  <div className="space-y-4 pt-1">
                    {/* Type Section */}
                    <div>
                        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Type</label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                            <button
                              type="button"
                              onClick={() => setTransactionType('expense')}
                              className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-center gap-2 sm:gap-2.5 transition-all cursor-pointer ${
                                transactionType === 'expense'
                                  ? 'bg-pink-50/90 dark:bg-rose-950/60 border border-pink-300 dark:border-rose-800/60 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full bg-[#f43f5e] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">-</span>
                              <div className="flex flex-col text-left min-w-0">
                                <span className="font-extrabold text-xs sm:text-sm text-[#e11d48] dark:text-rose-300 leading-tight">Dépense</span>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5 whitespace-nowrap">- Argent sortant</span>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTransactionType('refund')}
                              className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-center gap-2 sm:gap-2.5 transition-all cursor-pointer ${
                                transactionType === 'refund'
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">+</span>
                              <div className="flex flex-col text-left min-w-0">
                                <span className="font-extrabold text-xs sm:text-sm text-[#059669] dark:text-emerald-400 leading-tight">Remboursement</span>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5 whitespace-nowrap">+ Argent entrant</span>
                              </div>
                            </button>
                        </div>
                    </div>

                    {/* Montant Section */}
                    <div>
                        <label htmlFor="amount" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Montant (€)
                        </label>
                        <div className="relative flex items-center bg-[#f4f8ff] dark:bg-slate-800/90 border border-[#dbeafe] dark:border-blue-900/50 rounded-2xl px-4 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <input
                              ref={amountInputRef}
                              type="text"
                              inputMode="decimal"
                              id="amount"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full bg-transparent text-xl sm:text-2xl font-black text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none tracking-tight"
                              placeholder="0,00"
                            />
                            <span className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 ml-1.5 shrink-0 select-none">€</span>
                        </div>
                    </div>
                  </div>
                </div>
            )}

            {error && <p className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>}
            
            {/* Date de l'opération Section */}
            <div className="space-y-3.5 pt-1">
                <div className="bg-[#f8fafc] dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#e0edff] dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <CalendarDaysIcon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">Date de l'opération</span>
                            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                                    {(() => {
                                        const d = new Date(date);
                                        if (isNaN(d.getTime())) return '';
                                        const day = d.getDate().toString().padStart(2, '0');
                                        const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
                                        const month = monthNames[d.getMonth()];
                                        const year = d.getFullYear();
                                        return `${day} ${month} ${year}`;
                                    })()}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600 font-normal">·</span>
                                <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {(() => {
                                        const d = new Date(date);
                                        if (isNaN(d.getTime())) return '';
                                        const hours = d.getHours().toString().padStart(2, '0');
                                        const minutes = d.getMinutes().toString().padStart(2, '0');
                                        return `${hours}:${minutes}`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <label htmlFor="expense-date" className="bg-[#e0edff] hover:bg-[#d0e2ff] dark:bg-blue-950/80 dark:hover:bg-blue-900/80 text-[#2563eb] dark:text-blue-300 font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs">
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
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.99] text-white font-bold py-3 px-5 rounded-2xl shadow-md shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
                        <div className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            +
                        </div>
                        <span>{transactionType === 'refund' ? 'Ajouter le remboursement' : 'Ajouter la dépense'}</span>
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
                                <span className="block break-words">{d.description}</span>
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
