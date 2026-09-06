
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type Expense, type Category, User, type SubtractedItem, PRODUCT_CATEGORIES } from '../types';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import SegmentedControl from './SegmentedControl';
import PiggyBankIcon from './icons/PiggyBankIcon';
import ScissorsIcon from './icons/ScissorsIcon';
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

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; bgColor: string; borderColor: string } } = {
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

interface EditExpenseModalProps {
    expense: Expense;
    expenses: Expense[];
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
    onClose: () => void;
    categories: Category[];
    groceryStores: string[];
    cars: string[];
    heatingTypes: string[];
    loggedInUser: User;
    onAddExpense?: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
}

const toDatetimeLocal = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, expenses, onUpdateExpense, onDeleteExpense, onClose, categories, groceryStores, cars, heatingTypes, onAddExpense }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(Math.abs(expense.amount).toString());
    const [category, setCategory] = useState<Category>(expense.category);
    const [user, setUser] = useState<User>(expense.user);
    const [date, setDate] = useState(toDatetimeLocal(expense.date));
    const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(expense.amount >= 0 ? 'expense' : 'refund');
    
    // State for "Courses" subtractions toggle
    const initialShowSubtractions = ['Courses', 'Divers'].includes(expense.category) && Array.isArray(expense.subtracted_items) && expense.subtracted_items.length > 0;
    const [showSubtractions, setShowSubtractions] = useState(initialShowSubtractions);
    
    const initialReceiptTotal = initialShowSubtractions ? (expense.amount + (expense.subtracted_items || []).filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0)).toString() : '';
    const [receiptTotal, setReceiptTotal] = useState(initialReceiptTotal);
    
    const initialSubtractedItemsList = (expense.subtracted_items || []).map(item => ({
        ...item,
        create_expense: item.expense_created ? false : (item.create_expense ?? false)
    }));
    const [subtractedItems, setSubtractedItems] = useState<SubtractedItem[]>(initialShowSubtractions ? initialSubtractedItemsList : []);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [itemDescription, setItemDescription] = useState('');
    const [itemAmount, setItemAmount] = useState('');
    const [itemCategory, setItemCategory] = useState(PRODUCT_CATEGORIES[0]);
    const [itemTargetCategory, setItemTargetCategory] = useState<string>('');
    const [createExpenseForItem, setCreateExpenseForItem] = useState<boolean>(true);
    const itemDescriptionInputRef = useRef<HTMLInputElement>(null);

    const [store, setStore] = useState('');
    const [customStore, setCustomStore] = useState('');
    const [heatingType, setHeatingType] = useState('');
    const [repairedCar, setRepairedCar] = useState('');
    const [carMileage, setCarMileage] = useState('');
    const [carGarage, setCarGarage] = useState('');
    
    const [clothingPerson, setClothingPerson] = useState('Nathan');
    const [giftPerson, setGiftPerson] = useState('Nathan');
    const [giftOccasion, setGiftOccasion] = useState('Noël');
    
    const [supplementStore, setSupplementStore] = useState('Nutripure');
    const [customSupplementStore, setCustomSupplementStore] = useState('');
    const [supplementTypes, setSupplementTypes] = useState<string[]>([]);
    const [customSupplementType, setCustomSupplementType] = useState('');

    const [error, setError] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const childrenOptions = ['Nathan', 'Chloé'];
    const occasionOptions = ['Noël', 'Anniversaire'];

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
    
    const finalCalculatedAmount = useMemo(() => {
        const total = parseFloat(receiptTotal.replace(',', '.')) || 0;
        const subtractions = subtractedItems.filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0);
        const currentItemAmount = parseFloat(itemAmount.replace(',', '.')) || 0;
        const intentionalSubtraction = itemDescription.trim() ? currentItemAmount : 0;
        return total - subtractions - intentionalSubtraction;
    }, [receiptTotal, subtractedItems, itemAmount, itemDescription]);


    useEffect(() => {
        if (expense.category === 'Courses') {
            const storeName = expense.description;
            if (groceryStores.includes(storeName)) {
                setStore(storeName);
                setCustomStore('');
            } else if (storeName) {
                setStore('Autres');
                setCustomStore(storeName);
            }
        } else if (expense.category === 'Chauffage') {
            const typeRegex = /\s\(([^)]+)\)$/;
            const match = expense.description.match(typeRegex);
            if (match) setHeatingType(match[1]);
        } else if (expense.category === 'Réparation voitures') {
            const carRegex = /\s\(([^)]+)\)$/;
            const match = expense.description.match(carRegex);
            if (match && cars.includes(match[1])) {
                setRepairedCar(match[1]);
                let remaining = expense.description.replace(carRegex, '').trim();
                
                const mileageRegex = /\sà\s(\d+)\skm$/;
                const mileageMatch = remaining.match(mileageRegex);
                if (mileageMatch) {
                    setCarMileage(mileageMatch[1]);
                    remaining = remaining.replace(mileageRegex, '').trim();
                } else {
                    setCarMileage('');
                }

                const garageRegex = /\schez\s(.+)$/;
                const garageMatch = remaining.match(garageRegex);
                if (garageMatch) {
                    setCarGarage(garageMatch[1]);
                    remaining = remaining.replace(garageRegex, '').trim();
                } else {
                    setCarGarage('');
                }

                setDescription(remaining);
            } else {
                setDescription(expense.description);
                setCarMileage('');
                setCarGarage('');
            }
        } else if (expense.category === 'Vêtements') {
            const personRegex = /\s\(([^)]+)\)$/;
            const match = expense.description.match(personRegex);
            if (match) {
                setClothingPerson(match[1]);
                setDescription(expense.description.replace(personRegex, '').trim());
            } else {
                setDescription(expense.description);
            }
        } else if (expense.category === 'Cadeau') {
            const detailsRegex = /\s\(([^)]+)\s-\s([^)]+)\)$/;
            const match = expense.description.match(detailsRegex);
            if (match) {
                setGiftPerson(match[1]);
                setGiftOccasion(match[2]);
                setDescription(expense.description.replace(detailsRegex, '').trim());
            } else {
                setDescription(expense.description);
            }
        } else if (expense.category === 'Complément alimentaire') {
            const storeRegex = /\s\(([^)]+)\)$/;
            const match = expense.description.match(storeRegex);
            if (match) {
                const storeName = match[1];
                if (SUPPLEMENT_STORES.includes(storeName)) {
                    setSupplementStore(storeName);
                    setCustomSupplementStore('');
                } else {
                    setSupplementStore('Autres');
                    setCustomSupplementStore(storeName);
                }
                
                const typesStr = expense.description.replace(storeRegex, '').trim();
                const typesArr = typesStr.split(',').map(t => t.trim());
                
                const standardTypes: string[] = [];
                let customType = '';
                
                typesArr.forEach(t => {
                    if (SUPPLEMENT_TYPES.includes(t)) {
                        standardTypes.push(t);
                    } else {
                        standardTypes.push('Autres');
                        customType = t;
                    }
                });
                
                setSupplementTypes(standardTypes);
                setCustomSupplementType(customType);
            } else {
                setDescription(expense.description);
            }
        }
        else {
            setDescription(expense.description);
        }
    }, [expense, groceryStores, heatingTypes, cars]);

    useEffect(() => {
        if (['Courses', 'Divers'].includes(category) && !showSubtractions) {
            setSubtractedItems([]);
            setReceiptTotal('');
        } else if (['Courses', 'Divers'].includes(category) && showSubtractions && receiptTotal === '') {
            setReceiptTotal(amount);
        }
    }, [showSubtractions, category, amount]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

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

        let processedSubtractedItems = finalSubtractedItems;

        // Automatically create separate expenses for subtracted items that have a target category assigned and create_expense === true
        if (onAddExpense && finalSubtractedItems && finalSubtractedItems.length > 0) {
            processedSubtractedItems = finalSubtractedItems.map(item => {
                if (item.is_subtracted !== false && item.target_category && item.create_expense === true) {
                    onAddExpense({
                        description: `${item.description} (déduit de ${finalDescription})`,
                        amount: item.amount,
                        category: item.target_category,
                        user,
                        date: new Date(date).toISOString(),
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

        onUpdateExpense({
            ...expense,
            description: finalDescription,
            amount: finalAmount,
            category,
            user,
            date: new Date(date).toISOString(),
            subtracted_items: processedSubtractedItems,
        });

        onClose();
    };
    
    const handleAddSubtractedItem = () => {
        const parsedItemAmount = parseFloat(itemAmount.replace(',', '.'));
        if (itemDescription.trim() && !isNaN(parsedItemAmount) && parsedItemAmount > 0) {
            setSubtractedItems([...subtractedItems, { 
                description: itemDescription.trim(), 
                amount: parsedItemAmount, 
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


    const handleDelete = () => {
        onDeleteExpense(expense.id);
        onClose();
    };

    const heatingOptions = useMemo(() => {
        const options = new Set(heatingTypes);
        if (heatingType && !options.has(heatingType)) {
            options.add(heatingType);
        }
        return Array.from(options);
    }, [heatingTypes, heatingType]);
    
    const carOptions = useMemo(() => {
        const options = new Set(cars);
        if (category === 'Réparation voitures' && repairedCar && !options.has(repairedCar)) {
            options.add(repairedCar);
        }
        if (category === 'Carburant' && description && !options.has(description)) {
            options.add(description);
        }
        return Array.from(options);
    }, [cars, category, repairedCar, description]);

    const baseInputStyle = "mt-1 block w-full py-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm";
    const placeholderStyle = "placeholder-slate-400 dark:placeholder-slate-500";

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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[160] flex justify-center items-center p-4 sm:p-6" aria-modal="true" role="dialog">
                <div 
                    className="fixed inset-0"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl z-[161] w-full max-w-lg animate-fade-in relative overflow-hidden flex flex-col max-h-[90vh] p-6 sm:p-7 border border-slate-100 dark:border-slate-800">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-blue-100/80 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Modifier la dépense</h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Modifiez les détails de cette transaction.</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            type="button"
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 custom-scrollbar flex-1">
                        {/* Qui a payé ? */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2.5">Qui a payé ?</label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                                <button
                                    type="button"
                                    onClick={() => setUser(User.Sophie)}
                                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                                        user === User.Sophie
                                            ? 'bg-pink-100/90 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 border border-pink-200/80 dark:border-pink-900/50 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Sophie</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUser(User.Vincent)}
                                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                                        user === User.Vincent
                                            ? 'bg-blue-100/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Vincent</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUser(User.Commun)}
                                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                                        user === User.Commun
                                            ? 'bg-purple-100/90 dark:bg-indigo-950/50 text-purple-600 dark:text-indigo-400 border border-purple-200/80 dark:border-indigo-900/50 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <PiggyBankIcon className="w-4 h-4 shrink-0" />
                                    <span>Cagnotte</span>
                                </button>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                                Catégorie
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                                {categories.map((cat) => {
                                    const visual = CategoryVisuals[cat] || CategoryVisuals["Divers"];
                                    const Icon = visual.icon;
                                    const isSelected = category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all duration-200 ${
                                                isSelected 
                                                ? `${visual.borderColor} ${visual.bgColor} ring-1 ring-blue-500/20 shadow-sm scale-105` 
                                                : 'border-transparent bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <div className={`mb-1 ${isSelected ? visual.color : 'text-slate-400 dark:text-slate-500'}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className={`text-[9px] text-center font-bold leading-tight ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {cat}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category Specific Inputs */}
                        {category === 'Courses' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edit-store-select" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Magasin</label>
                                        <select id="edit-store-select" value={store} onChange={e => setStore(e.target.value)} className="block w-full px-4 py-2.5 text-base bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm font-semibold rounded-2xl">
                                            {groceryStores.map(s => <option key={s} value={s}>{s}</option>)}
                                            <option value="Autres">Autres</option>
                                        </select>
                                    </div>
                                    {store === 'Autres' && (
                                        <div>
                                            <label htmlFor="edit-custom-store" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Magasin personnalisé</label>
                                            <input type="text" id="edit-custom-store" value={customStore} onChange={e => setCustomStore(e.target.value)} className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm font-semibold" placeholder="Nom du magasin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {['Courses', 'Divers'].includes(category) && (
                            <div className="animate-fade-in mt-4">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                                    <label htmlFor="edit-toggle-sub" className="font-bold text-sm text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2">
                                        <ScissorsIcon />
                                        <span>Déduire des articles ?</span>
                                    </label>
                                    <button
                                        type="button"
                                        id="edit-toggle-sub"
                                        onClick={() => setShowSubtractions(!showSubtractions)}
                                        className={`${showSubtractions ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                                        role="switch"
                                        aria-checked={showSubtractions}
                                    >
                                        <span className={`${showSubtractions ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {['Courses', 'Divers'].includes(category) && showSubtractions ? (
                            <div className="animate-fade-in space-y-4">
                                 <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-4">
                                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                                      <ScissorsIcon />
                                      <h4>Articles à déduire</h4>
                                    </div>
                                     {subtractedItems.length > 0 && (
                                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                        <div className="flex justify-between items-center text-xs text-slate-500 pb-1">
                                          <button type="button" onClick={() => setSelectedItems(selectedItems.length === subtractedItems.length ? [] : subtractedItems.map((_, i) => i))} className="hover:text-blue-600 font-semibold">
                                            {selectedItems.length === subtractedItems.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                                          </button>
                                          {selectedItems.length > 0 && (
                                            <button type="button" onClick={() => {
                                              setSubtractedItems(subtractedItems.filter((_, i) => !selectedItems.includes(i)));
                                              setSelectedItems([]);
                                            }} className="text-red-500 hover:text-red-700 font-semibold">
                                              Supprimer la sélection ({selectedItems.length})
                                            </button>
                                          )}
                                        </div>
                                        {subtractedItems.map((item, index) => (
                                          <div key={index} 
                                               className={`p-3 rounded-xl border transition-colors space-y-2 ${item.is_subtracted !== false ? 'bg-red-50/70 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                  <input type="checkbox" checked={selectedItems.includes(index)} onChange={(e) => {
                                                    if (e.target.checked) setSelectedItems([...selectedItems, index]);
                                                    else setSelectedItems(selectedItems.filter(i => i !== index));
                                                  }} className="rounded text-blue-600 focus:ring-blue-500" />
                                                  <div className="flex flex-col cursor-pointer" onClick={() => handleToggleSubtractedItem(index)}>
                                                      <span className={`text-sm ${item.is_subtracted !== false ? 'text-red-700 dark:text-red-300 font-medium line-through opacity-70' : 'text-slate-800 dark:text-slate-100'}`}>{item.description}</span>
                                                      {item.category && <span className="text-[10px] text-slate-400 dark:text-slate-400">{item.category}</span>}
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${item.is_subtracted !== false ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>{item.amount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span>
                                                <button type="button" onClick={() => handleRemoveSubtractedItem(index)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                                  <TrashIcon />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Destination category config */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-600/60">
                                              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">➡️ Réattribuer dans :</span>
                                                <select 
                                                  value={item.target_category || ''} 
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    const updated = [...subtractedItems];
                                                    updated[index].target_category = val || undefined;
                                                    updated[index].create_expense = (val && !updated[index].expense_created) ? true : false;
                                                    setSubtractedItems(updated);
                                                  }}
                                                  className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg text-xs text-slate-800 dark:text-slate-100 font-semibold focus:ring-1 focus:ring-blue-500"
                                                >
                                                  <option value="">Aucune (déduction seule)</option>
                                                  {categories.filter(c => c !== category).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                  ))}
                                                </select>
                                              </div>

                                              {item.target_category && (
                                                <div className="flex items-center gap-2">
                                                  {item.expense_created && (
                                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                                                      ✓ Dépense créée
                                                    </span>
                                                  )}
                                                  <label className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                                                    <input 
                                                      type="checkbox" 
                                                      checked={item.create_expense === true} 
                                                      onChange={(e) => {
                                                        const updated = [...subtractedItems];
                                                        updated[index].create_expense = e.target.checked;
                                                        setSubtractedItems(updated);
                                                      }}
                                                      className="rounded text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span>{item.expense_created ? 'Recréer la dépense' : 'Créer la dépense'}</span>
                                                  </label>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                     )}

                                     <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                       <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Ajouter un article à déduire :</span>
                                       <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                         <div className="sm:col-span-4">
                                             <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Article</label>
                                             <input ref={itemDescriptionInputRef} type="text" value={itemDescription} onChange={e => setItemDescription(e.target.value)} onKeyDown={handleItemInputKeyDown} placeholder="Ex: Sweat Nathan" className="block w-full px-3 py-2 bg-white dark:bg-slate-700 text-sm rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-semibold"/>
                                         </div>
                                         <div className="sm:col-span-3">
                                             <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Montant (€)</label>
                                             <input type="text" inputMode="decimal" value={itemAmount} onChange={e => setItemAmount(e.target.value)} onKeyDown={handleItemInputKeyDown} placeholder="0,00" className="block w-full px-3 py-2 bg-white dark:bg-slate-700 text-sm rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-semibold"/>
                                         </div>
                                         <div className="sm:col-span-4">
                                             <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Nouvelle Catégorie</label>
                                             <select value={itemTargetCategory} onChange={e => setItemTargetCategory(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-700 text-sm rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-semibold">
                                                 <option value="">Déduction seule</option>
                                                 {categories.filter(c => c !== category).map(cat => (
                                                     <option key={cat} value={cat}>{cat}</option>
                                                 ))}
                                             </select>
                                         </div>
                                         <div className="sm:col-span-1 flex justify-end">
                                             <button type="button" onClick={handleAddSubtractedItem} className="w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1 shadow-sm">+</button>
                                         </div>
                                       </div>
                                     </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">Ticket (€)</label><input type="text" inputMode="decimal" value={receiptTotal} onChange={e => setReceiptTotal(e.target.value)} className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl font-bold sm:text-base"/></div>
                                    <div><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">Montant final</label><input type="text" value={finalCalculatedAmount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})} readOnly className="block w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl font-extrabold sm:text-base"/></div>
                                </div>
                                {category === 'Divers' && (
                                    <div>
                                        <label htmlFor="edit-divers-subtraction-description" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Description de la dépense</label>
                                        <input
                                            type="text"
                                            id="edit-divers-subtraction-description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl font-semibold sm:text-base"
                                            placeholder="Ex: Action, Leroy Merlin..."
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {category === 'Chauffage' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Type de Chauffage</label>
                                        <SegmentedControl options={heatingOptions} value={heatingType} onChange={setHeatingType} className="mt-1" />
                                    </div>
                                )}
                                {category === 'Réparation voitures' && (
                                    <div className="animate-fade-in space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Véhicule</label>
                                            <SegmentedControl options={carOptions} value={repairedCar} onChange={setRepairedCar} className="mt-1"/>
                                        </div>
                                        <div>
                                            <label htmlFor="edit-car-garage" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Garage</label>
                                            <input
                                                type="text"
                                                id="edit-car-garage"
                                                value={carGarage}
                                                onChange={(e) => setCarGarage(e.target.value)}
                                                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl font-semibold sm:text-base placeholder-slate-400"
                                                placeholder="Ex: Renault, Norauto..."
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="edit-car-mileage" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Kilométrage</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    id="edit-car-mileage"
                                                    value={carMileage}
                                                    onChange={(e) => setCarMileage(e.target.value)}
                                                    className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl font-semibold sm:text-base pr-10 placeholder-slate-400"
                                                    placeholder="Ex: 120000"
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <span className="text-slate-500 font-bold sm:text-sm">km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {category === 'Vêtements' && (
                                    <div className="animate-fade-in"><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Pour qui ?</label><SegmentedControl options={childrenOptions} value={clothingPerson} onChange={setClothingPerson} className="mt-1"/></div>
                                )}
                                {category === 'Cadeau' && (
                                     <div className="space-y-4 animate-fade-in"><div><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Pour qui ?</label><SegmentedControl options={childrenOptions} value={giftPerson} onChange={setGiftPerson} className="mt-1"/></div><div><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Occasion</label><SegmentedControl options={occasionOptions} value={giftOccasion} onChange={setGiftOccasion} className="mt-1"/></div></div>
                                )}
                                
                                {category === 'Complément alimentaire' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Boutique</label>
                                                <select value={supplementStore} onChange={e => setSupplementStore(e.target.value)} className="block w-full px-4 py-2.5 text-base bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm font-semibold rounded-2xl">
                                                    {SUPPLEMENT_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            {supplementStore === 'Autres' && (
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Boutique personnalisée</label>
                                                    <input type="text" value={customSupplementStore} onChange={e => setCustomSupplementStore(e.target.value)} className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm font-semibold" placeholder="Nom de la boutique" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Compléments achetés</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {SUPPLEMENT_TYPES.map(type => (
                                                    <label key={type} className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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
                                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{type}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        {supplementTypes.includes('Autres') && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Complément personnalisé</label>
                                                <input type="text" value={customSupplementType} onChange={e => setCustomSupplementType(e.target.value)} className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm font-semibold" placeholder="Nom du complément" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                { !['Chauffage', 'Courses', 'Complément alimentaire'].includes(category) && (
                                    <div>
                                        {category === "Carburant" ? (
                                            <div className="animate-fade-in">
                                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Véhicule</label>
                                                <SegmentedControl options={carOptions} value={description} onChange={(val) => setDescription(val)} className="mt-1"/>
                                            </div>
                                        ) : (
                                            <>
                                              <label htmlFor="edit-description" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                                                {category === 'Restaurant' ? 'Restaurant' : category === 'Réparation voitures' ? 'Réparation effectuée' : 'Description'}
                                              </label>
                                              <input 
                                                type="text" 
                                                id="edit-description" 
                                                value={description} 
                                                onChange={(e) => setDescription(e.target.value)} 
                                                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-semibold" 
                                                placeholder={category === 'Restaurant' ? "Ex: La Pizzaiola, McDo..." : category === 'Réparation voitures' ? "Ex: Vidange, Pneus..." : "Ex: McDo, Cinéma..."}
                                              />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Type & Montant */}
                                <div className="space-y-4 pt-1">
                                    {/* Type Section */}
                                    <div>
                                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                                        <div className="grid grid-cols-2 gap-2 bg-[#f8fafc] dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                                            <button
                                                type="button"
                                                onClick={() => setTransactionType('expense')}
                                                className={`py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    transactionType === 'expense'
                                                        ? 'bg-[#fdeef3] dark:bg-rose-950/70 text-[#d91b5c] dark:text-rose-300 border border-[#fbcfe0] dark:border-rose-900/60 shadow-2xs'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
                                                }`}
                                            >
                                                <span className="w-5 h-5 rounded-full bg-[#e60067] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">-</span>
                                                <span className="truncate">Dépense</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTransactionType('refund')}
                                                className={`py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    transactionType === 'refund'
                                                        ? 'bg-[#edf5ff] dark:bg-blue-950/70 text-[#2563eb] dark:text-blue-300 border border-[#bfdbfe] dark:border-blue-900/60 shadow-2xs'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
                                                }`}
                                            >
                                                <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">+</span>
                                                <span className="truncate">Remboursement</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Montant Section */}
                                    <div>
                                        <label htmlFor="edit-amount" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Montant (€)
                                        </label>
                                        <div className="relative flex items-center bg-[#f4f8ff] dark:bg-slate-800/90 border border-[#dbeafe] dark:border-blue-900/50 rounded-2xl px-4 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                            <input 
                                                type="text" 
                                                inputMode="decimal" 
                                                id="edit-amount" 
                                                value={amount} 
                                                onChange={(e) => setAmount(e.target.value)} 
                                                className="w-full bg-transparent text-xl sm:text-2xl font-black text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none tracking-tight" 
                                                placeholder="0,00" 
                                            />
                                            <span className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 ml-1.5 shrink-0 select-none">€</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Date & Time Field */}
                                <div className="bg-[#f8fafc] dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-[#e0edff] dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
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
                                    <label htmlFor="edit-expense-date-input" className="bg-[#e0edff] hover:bg-[#d0e2ff] dark:bg-blue-950/80 dark:hover:bg-blue-900/80 text-[#2563eb] dark:text-blue-300 font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs">
                                        Modifier
                                        <input
                                            type="datetime-local"
                                            id="edit-expense-date-input"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="sr-only"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                        
                        {error && <p className="text-red-500 dark:text-red-400 text-sm font-bold">{error}</p>}
                    </form>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-2xl transition-colors border border-red-100 dark:border-red-900/30 flex items-center justify-center shrink-0"
                            title="Supprimer la dépense"
                            aria-label="Supprimer la dépense"
                        >
                            <TrashIcon />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-5 py-3 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                type="button" 
                                onClick={(e) => handleSubmit(e as any)} 
                                className="px-6 py-3 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md shadow-blue-500/20"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer la transaction "${expense.description}" ? Cette action est irréversible.`}
            />
        </>
    );
};

export default EditExpenseModal;
