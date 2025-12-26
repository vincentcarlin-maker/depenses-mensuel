
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { type Expense, type Category, User } from '../types';
import SegmentedControl from './SegmentedControl';
import ConfirmationModal from './ConfirmationModal';
import PiggyBankIcon from './icons/PiggyBankIcon';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => void;
  expenses: Expense[];
  initialData?: Omit<Expense, 'id' | 'date' | 'created_at'> | null;
  loggedInUser: User;
  disabled?: boolean;
  categories: Category[];
  groceryStores: string[];
  cars: string[];
  heatingTypes: string[];
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, expenses, initialData, loggedInUser, disabled = false, categories, groceryStores, cars, heatingTypes }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData ? String(Math.abs(initialData.amount)) : '');
  const [category, setCategory] = useState<Category>(initialData?.category || categories[0] || '');
  const [user, setUser] = useState<User>(initialData?.user || loggedInUser);
  const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(initialData && initialData.amount < 0 ? 'refund' : 'expense');
  const [store, setStore] = useState(groceryStores[0] || '');
  const [customStore, setCustomStore] = useState('');
  const [heatingType, setHeatingType] = useState(heatingTypes[0] || '');
  const [repairedCar, setRepairedCar] = useState(cars[0] || '');
  
  // Specific states for new categories
  const [clothingPerson, setClothingPerson] = useState('Nathan');
  const [giftPerson, setGiftPerson] = useState('Nathan');
  const [giftOccasion, setGiftOccasion] = useState('Noël');
  
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Duplicate Detection States
  const [duplicateConfirmationOpen, setDuplicateConfirmationOpen] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState<Omit<Expense, 'id' | 'date' | 'created_at'> | null>(null);
  const [detectedDuplicates, setDetectedDuplicates] = useState<Expense[]>([]);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const nonSpecialCategoryDescriptionRef = useRef(
      (initialData && !['Carburant', 'Courses'].includes(initialData.category))
      ? (initialData.description || '')
      : ''
  );

  const childrenOptions = ['Nathan', 'Chloé'];
  const occasionOptions = ['Noël', 'Anniversaire'];

  const uniqueDescriptions = useMemo(() => {
    const tagRegex = /(#\w+)/g;
    const storeRegex = /\s\(([^)]+)\)$/;
    const allDescriptions = expenses.map(e => e.description.replace(tagRegex, '').replace(storeRegex, '').trim());
    return [...new Set<string>(allDescriptions)].filter(d => d.length > 0);
  }, [expenses]);

  useEffect(() => {
    if (initialData) {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }
  }, []); // Run only on mount, since we are keying the component

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, cars]);


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

  const findPossibleDuplicates = (newExpense: Omit<Expense, 'id' | 'date' | 'created_at'>): Expense[] => {
      // Nous comparons avec le mois en cours (date d'ajout par défaut)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const newDescNormalized = normalize(newExpense.description);

      return expenses.filter(e => {
          const eDate = new Date(e.date);
          
          // 1. Check same month and year
          const isSameMonth = eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
          if (!isSameMonth) return false;

          // 2. Check same User
          if (e.user !== newExpense.user) return false;

          // 3. Check same Category
          if (e.category !== newExpense.category) return false;

          // 4. Check same Amount
          const isSameAmount = Math.abs(e.amount - newExpense.amount) < 0.01; 
          if (!isSameAmount) return false;

          // 5. Check same Description
          const isSameDescription = normalize(e.description) === newDescNormalized;
          
          return isSameDescription;
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

  const submitExpense = (expenseData: Omit<Expense, 'id' | 'date' | 'created_at'>) => {
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setError('Le montant est requis.');
      return;
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Veuillez entrer un montant positif.');
      return;
    }

    const finalAmount = transactionType === 'expense' ? parsedAmount : -parsedAmount;
    
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

    const newExpensePayload = {
      description: finalDescription,
      amount: finalAmount,
      category,
      user,
    };

    // Check for duplicates before submitting
    const duplicates = findPossibleDuplicates(newExpensePayload);
    if (duplicates.length > 0) {
        setPendingExpenseData(newExpensePayload);
        setDetectedDuplicates(duplicates);
        setDuplicateConfirmationOpen(true);
    } else {
        submitExpense(newExpensePayload);
    }
  };

  // Helper to calculate slider position
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
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
                <button type="button" onClick={() => setUser(User.Sophie)} className={`relative z-10 w-1/3 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Sophie ? 'text-pink-600 dark:text-pink-400' : 'text-slate-600 dark:text-slate-300'}`}>
                Sophie
                </button>
                <button type="button" onClick={() => setUser(User.Vincent)} className={`relative z-10 w-1/3 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Vincent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'}`}>
                Vincent
                </button>
                <button type="button" onClick={() => setUser(User.Commun)} className={`relative z-10 w-1/3 p-2 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${user === User.Commun ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    <PiggyBankIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Cagnotte</span>
                </button>
            </div>
            </div>
            <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Catégorie
            </label>
            <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="block w-full pl-3 pr-10 py-2.5 text-base bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent sm:text-sm rounded-lg"
            >
                {categories.map((cat) => (
                <option key={cat} value={cat}>
                    {cat}
                </option>
                ))}
            </select>
            </div>
            
            {category === 'Courses' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="store-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Magasin</label>
                        <select id="store-select" value={store} onChange={e => setStore(e.target.value)} className="block w-full pl-3 pr-10 py-2.5 text-base bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent sm:text-sm rounded-lg">
                            {groceryStores.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="Autres">Autres</option>
                        </select>
                    </div>
                    {store === 'Autres' && (
                        <div>
                            <label htmlFor="custom-store" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Magasin personnalisé</label>
                            <input type="text" id="custom-store" value={customStore} onChange={e => setCustomStore(e.target.value)} className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm" placeholder="Nom du magasin" />
                        </div>
                    )}
                </div>
            )}

            {category === 'Chauffage' && (
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type de Chauffage</label>
                    <SegmentedControl
                        options={heatingTypes}
                        value={heatingType}
                        onChange={setHeatingType}
                    />
                </div>
            )}

            {category === 'Réparation voitures' && (
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Véhicule</label>
                    <SegmentedControl
                        options={cars}
                        value={repairedCar}
                        onChange={setRepairedCar}
                    />
                </div>
            )}

            {category === 'Vêtements' && (
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pour qui ?</label>
                    <SegmentedControl
                        options={childrenOptions}
                        value={clothingPerson}
                        onChange={setClothingPerson}
                    />
                </div>
            )}

            {category === 'Cadeau' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pour qui ?</label>
                        <SegmentedControl
                            options={childrenOptions}
                            value={giftPerson}
                            onChange={setGiftPerson}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Occasion</label>
                        <SegmentedControl
                            options={occasionOptions}
                            value={giftOccasion}
                            onChange={setGiftOccasion}
                        />
                    </div>
                </div>
            )}
            
            { !['Courses', 'Chauffage'].includes(category) && (
                <div>
                {category === "Carburant" ? (
                    <>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Véhicule</label>
                    <SegmentedControl
                        options={cars}
                        value={description}
                        onChange={(val) => setDescription(val)}
                    />
                    </>
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
                        className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                        placeholder={category === 'Vêtements' ? "Ex: Pantalon, Manteau..." : category === 'Cadeau' ? "Ex: Lego, Poupée..." : "Ex: McDo, Courses Leclerc..."}
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
                className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                placeholder="0.00"
                />
            </div>
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
            <button
            type="submit"
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800 transition-all duration-200 ease-in-out transform hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
