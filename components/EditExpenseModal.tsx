
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type Expense, type Category, User, type SubtractedItem, PRODUCT_CATEGORIES, type FoyerMember } from '../types';
import { DEFAULT_FOYER } from '../utils/foyerService';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import SegmentedControl from './SegmentedControl';
import PiggyBankIcon from './icons/PiggyBankIcon';
import ScissorsIcon from './icons/ScissorsIcon';
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

const SUPPLEMENT_STORES = ['Nutripure', 'Nutri&co', 'Greenwhey', 'Prozis', 'Autres'] as const;
const SUPPLEMENT_TYPES = ['Oméga 3', 'Vitamine C', 'Vitamine D', 'Magnésium', 'Autres'] as const;

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
    loggedInUser: User | string;
    onlineUsers?: (User | string)[];
    onAddExpense?: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
    foyerMembers?: FoyerMember[];
    isMainFoyer?: boolean;
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

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, expenses, onUpdateExpense, onDeleteExpense, onClose, categories, groceryStores, cars, heatingTypes, loggedInUser, onlineUsers = [], onAddExpense, foyerMembers, isMainFoyer = true }) => {
    const { getVisual } = useCategoryVisuals();
    const members = useMemo(() => foyerMembers && foyerMembers.length > 0 ? foyerMembers : DEFAULT_FOYER.members, [foyerMembers]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(Math.abs(expense.amount).toString());
    const [category, setCategory] = useState<Category>(expense.category);
    const [user, setUser] = useState<User | string>(expense.user);
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
    const [supplementStore, setSupplementStore] = useState<typeof SUPPLEMENT_STORES[number]>(SUPPLEMENT_STORES[0]);
    const [customSupplementStore, setCustomSupplementStore] = useState('');
    const [supplementType, setSupplementType] = useState<typeof SUPPLEMENT_TYPES[number]>(SUPPLEMENT_TYPES[0]);
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
            if (match) {
                setHeatingType(match[1]);
            } else {
                setHeatingType(heatingTypes && heatingTypes.length > 0 ? heatingTypes[0] : 'Chauffage');
            }
        } else if (expense.category === 'Réparation voitures') {
            const carRegex = /\s\(([^)]+)\)$/;
            const match = expense.description.match(carRegex);
            const effectiveCars = cars && cars.length > 0 ? cars : ["Voiture"];
            if (match && (effectiveCars.includes(match[1]) || match[1] === 'Voiture')) {
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
            const supplementRegex = /^(.+)\s\(([^)]+)\)$/;
            const match = expense.description.match(supplementRegex);
            if (match && isMainFoyer) {
                const suppType = match[1];
                const suppStore = match[2];
                if (SUPPLEMENT_TYPES.includes(suppType as any)) {
                    setSupplementType(suppType as any);
                    setCustomSupplementType('');
                } else {
                    setSupplementType('Autres');
                    setCustomSupplementType(suppType);
                }
                if (SUPPLEMENT_STORES.includes(suppStore as any)) {
                    setSupplementStore(suppStore as any);
                    setCustomSupplementStore('');
                } else {
                    setSupplementStore('Autres');
                    setCustomSupplementStore(suppStore);
                }
                setDescription('');
            } else {
                setSupplementType('Autres');
                setCustomSupplementType(expense.description);
                setSupplementStore(SUPPLEMENT_STORES[0]);
                setCustomSupplementStore('');
                setDescription(expense.description);
            }
        } else {
            setDescription(expense.description);
        }
    }, [expense, groceryStores, heatingTypes, cars, isMainFoyer]);

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
        const options = new Set(heatingTypes && heatingTypes.length > 0 ? heatingTypes : ["Chauffage"]);
        if (heatingType && !options.has(heatingType)) {
            options.add(heatingType);
        }
        return Array.from(options);
    }, [heatingTypes, heatingType]);
    
    const carOptions = useMemo(() => {
        const options = new Set(cars && cars.length > 0 ? cars : ["Voiture"]);
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

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                                Catégorie
                            </label>
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
                                                ? `${visual.borderColor || 'border-blue-200'} ${visual.badgeBg} ring-1 ring-blue-500/20 shadow-sm scale-105` 
                                                : 'border-transparent bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <div className={`mb-0.5 ${isSelected ? visual.textColor : 'text-slate-400 dark:text-slate-500'}`}>
                                                <Icon className="h-3.5 w-3.5" />
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

                        {['Courses', 'Divers'].includes(category) && showSubtractions && category === 'Divers' && (
                            <div className="mt-3">
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

                        {!showSubtractions && (
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
                                {category === 'Vêtements' && isMainFoyer && (
                                    <div className="animate-fade-in"><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Pour qui ?</label><SegmentedControl options={childrenOptions} value={clothingPerson} onChange={setClothingPerson} className="mt-1"/></div>
                                )}
                                {category === 'Cadeau' && isMainFoyer && (
                                     <div className="space-y-4 animate-fade-in"><div><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Pour qui ?</label><SegmentedControl options={childrenOptions} value={giftPerson} onChange={setGiftPerson} className="mt-1"/></div><div><label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Occasion</label><SegmentedControl options={occasionOptions} value={giftOccasion} onChange={setGiftOccasion} className="mt-1"/></div></div>
                                )}
                                {category === 'Complément alimentaire' && isMainFoyer && (
                                     <div className="space-y-5 animate-fade-in">
                                         <div>
                                             <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2.5">Boutique</label>
                                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                 {SUPPLEMENT_STORES.map((storeOption) => {
                                                     const isSelected = supplementStore === storeOption;
                                                     return (
                                                         <button
                                                             key={storeOption}
                                                             type="button"
                                                             onClick={() => setSupplementStore(storeOption)}
                                                             className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all font-semibold text-xs sm:text-sm cursor-pointer min-w-0 ${
                                                                 isSelected
                                                                     ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                                                                     : 'border-slate-200/80 dark:border-slate-700/85 bg-white dark:bg-slate-800/95 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                             }`}
                                                         >
                                                             <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                                                 isSelected
                                                                     ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                     : 'border-slate-300 dark:border-slate-600'
                                                             }`}>
                                                                 {isSelected && (
                                                                     <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                         <polyline points="20 6 9 17 4 12" />
                                                                     </svg>
                                                                 )}
                                                             </div>
                                                             <span className="truncate">{storeOption}</span>
                                                         </button>
                                                     );
                                                 })}
                                             </div>
                                             {supplementStore === 'Autres' && (
                                                 <input
                                                     type="text"
                                                     value={customSupplementStore}
                                                     onChange={(e) => setCustomSupplementStore(e.target.value)}
                                                     className="mt-3 block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl font-semibold sm:text-base placeholder-slate-400 animate-fade-in"
                                                     placeholder="Nom de la boutique..."
                                                 />
                                             )}
                                         </div>
                                         <div>
                                             <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2.5">Complément</label>
                                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                 {SUPPLEMENT_TYPES.map((typeOption) => {
                                                     const isSelected = supplementType === typeOption;
                                                     return (
                                                         <button
                                                             key={typeOption}
                                                             type="button"
                                                             onClick={() => setSupplementType(typeOption)}
                                                             className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all font-semibold text-xs sm:text-sm cursor-pointer min-w-0 ${
                                                                 isSelected
                                                                     ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                                                                     : 'border-slate-200/80 dark:border-slate-700/85 bg-white dark:bg-slate-800/95 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                             }`}
                                                         >
                                                             <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                                                 isSelected
                                                                     ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                     : 'border-slate-300 dark:border-slate-600'
                                                             }`}>
                                                                 {isSelected && (
                                                                     <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                         <polyline points="20 6 9 17 4 12" />
                                                                     </svg>
                                                                 )}
                                                             </div>
                                                             <span className="truncate">{typeOption}</span>
                                                         </button>
                                                     );
                                                 })}
                                             </div>
                                             {supplementType === 'Autres' && (
                                                 <input
                                                     type="text"
                                                     value={customSupplementType}
                                                     onChange={(e) => setCustomSupplementType(e.target.value)}
                                                     className="mt-3 block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-2xl font-semibold sm:text-base placeholder-slate-400 animate-fade-in"
                                                     placeholder="Nom du complément..."
                                                 />
                                             )}
                                         </div>
                                     </div>
                                )}
                                
                                { !['Chauffage', 'Courses', ...(isMainFoyer ? ['Complément alimentaire'] : [])].includes(category) && (
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
                                                placeholder={category === 'Restaurant' ? "Ex: La Pizzaiola, McDo..." : category === 'Vêtements' ? "Ex: Pantalon, Manteau..." : category === 'Cadeau' ? "Ex: Lego, Poupée..." : category === 'Complément alimentaire' ? "Ex: Oméga 3, Vitamines, Magnésium..." : category === 'Réparation voitures' ? "Ex: Vidange, Pneus..." : "Ex: McDo, Cinéma..."}
                                              />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Type & Montant */}
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
