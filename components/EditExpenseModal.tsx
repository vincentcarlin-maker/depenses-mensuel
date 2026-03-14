
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type Expense, type Category, User, type SubtractedItem, PRODUCT_CATEGORIES } from '../types';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import CameraIcon from './icons/CameraIcon';
import SegmentedControl from './SegmentedControl';
import PiggyBankIcon from './icons/PiggyBankIcon';
import ScissorsIcon from './icons/ScissorsIcon';
import { parseReceiptImage } from '../src/services/geminiService';
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

const TICKET_RESTAURANT_KEYWORDS = [
  't restaurant', 't restau', 't.rest', 'cb rest', 'ticket rest', 't. restaurant', 'restau'
];

interface EditExpenseModalProps {
    expense: Expense;
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
    onClose: () => void;
    categories: Category[];
    groceryStores: string[];
    cars: string[];
    heatingTypes: string[];
    loggedInUser: User;
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

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, onUpdateExpense, onDeleteExpense, onClose, categories, groceryStores, cars, heatingTypes }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(Math.abs(expense.amount).toString());
    const [category, setCategory] = useState<Category>(expense.category);
    const [user, setUser] = useState<User>(expense.user);
    const [date, setDate] = useState(toDatetimeLocal(expense.date));
    const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(expense.amount >= 0 ? 'expense' : 'refund');
    const [isScanning, setIsScanning] = useState(false);
    
    // State for "Courses" subtractions toggle
    const initialShowSubtractions = expense.category === 'Courses' && Array.isArray(expense.subtracted_items) && expense.subtracted_items.length > 0;
    const [showSubtractions, setShowSubtractions] = useState(initialShowSubtractions);
    
    const initialReceiptTotal = initialShowSubtractions ? (expense.amount + (expense.subtracted_items || []).filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0)).toString() : '';
    const [receiptTotal, setReceiptTotal] = useState(initialReceiptTotal);
    
    const [subtractedItems, setSubtractedItems] = useState<SubtractedItem[]>(initialShowSubtractions ? (expense.subtracted_items || []) : []);
    const [itemDescription, setItemDescription] = useState('');
    const [itemAmount, setItemAmount] = useState('');
    const [itemCategory, setItemCategory] = useState(PRODUCT_CATEGORIES[0]);
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

    const [error, setError] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const childrenOptions = ['Nathan', 'Chloé'];
    const occasionOptions = ['Noël', 'Anniversaire'];
    
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
        }
        else {
            setDescription(expense.description);
        }
    }, [expense, groceryStores, heatingTypes, cars]);

    useEffect(() => {
        if (category === 'Courses' && !showSubtractions) {
            setSubtractedItems([]);
            setReceiptTotal('');
        }
    }, [showSubtractions, category]);

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

          const subtractions = currentSubtractedItems.filter(i => i.is_subtracted !== false).reduce((sum, item) => sum + item.amount, 0);
          const calculatedAmount = parsedTotal - subtractions;
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
        }
        else {
            finalDescription = description.trim();
        }
        
        if (!finalDescription) {
            setError('La description est requise.');
            return;
        }

        onUpdateExpense({
            ...expense,
            description: finalDescription,
            amount: finalAmount,
            category,
            user,
            date: new Date(date).toISOString(),
            subtracted_items: finalSubtractedItems,
        });
    };
    
    const handleAddSubtractedItem = () => {
        const parsedItemAmount = parseFloat(itemAmount.replace(',', '.'));
        if (itemDescription.trim() && !isNaN(parsedItemAmount) && parsedItemAmount > 0) {
            setSubtractedItems([...subtractedItems, { 
                description: itemDescription.trim(), 
                amount: parsedItemAmount, 
                is_subtracted: true,
                category: itemCategory
            }]);
            setItemDescription('');
            setItemAmount('');
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

    const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setError('');
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                try {
                    const parsed = await parseReceiptImage(base64String, file.type);
                    
                    if (parsed.total) {
                        setReceiptTotal(parsed.total.toString());
                        setShowSubtractions(true);
                    }

                    if (parsed.store) {
                        const matchedStore = groceryStores.find(s => 
                            parsed.store!.toLowerCase().includes(s.toLowerCase())
                        );
                        if (matchedStore) {
                            setStore(matchedStore);
                            setCustomStore('');
                        } else {
                            setStore('Autres');
                            setCustomStore(parsed.store);
                        }
                    }

                    if (parsed.date) {
                        try {
                            const parsedDate = new Date(parsed.date);
                            if (!isNaN(parsedDate.getTime())) {
                                setDate(toDatetimeLocal(parsedDate.toISOString()));
                            }
                        } catch (e) {
                            console.error("Error parsing date from receipt:", e);
                        }
                    }
                    
                    if (parsed.items && parsed.items.length > 0) {
                        const newItems = parsed.items.map(item => {
                            const isTicketResto = TICKET_RESTAURANT_KEYWORDS.some(kw => 
                                item.description.toLowerCase().includes(kw)
                            );
                            
                            // Si c'est Sophie qui paye et que c'est un ticket resto, on le soustrait par défaut
                            const shouldSubtract = isTicketResto && user === User.Sophie;

                            return {
                                description: item.description,
                                amount: item.amount,
                                is_subtracted: shouldSubtract,
                                category: isTicketResto ? 'Autre' : PRODUCT_CATEGORIES[0]
                            };
                        });
                        setSubtractedItems(newItems);
                        setShowSubtractions(true);
                    }
                } catch (err: any) {
                    setError(err.message || 'Erreur lors de l\'analyse du ticket. Veuillez réessayer.');
                    console.error(err);
                } finally {
                    setIsScanning(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setIsScanning(false);
            setError('Erreur lors de la lecture du fichier.');
        }
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
            <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm z-[60] flex justify-center items-center" aria-modal="true" role="dialog">
                <div 
                    className="fixed inset-0"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl z-[70] w-full max-w-md m-4 animate-fade-in flex flex-col max-h-[90vh]">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 flex-shrink-0">Modifier la Transaction</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
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
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                                Catégorie
                            </label>
                            <div className="grid grid-cols-3 gap-2">
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
                                                ? `${visual.borderColor} ${visual.bgColor} ring-2 ring-cyan-500/20 shadow-sm` 
                                                : 'border-transparent bg-slate-50 dark:bg-slate-700/30 opacity-70'
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

                        <div>
                            <label htmlFor="edit-date" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Date et Heure</label>
                            <input
                                type="datetime-local"
                                id="edit-date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={`${baseInputStyle} px-3`}
                            />
                        </div>

                        {category === 'Courses' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label htmlFor="edit-store-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Magasin</label>
                                            <label className={`cursor-pointer ${isScanning ? 'text-slate-400' : 'text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300'} flex items-center justify-center p-1.5 rounded-full hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors bg-brand-50/50 dark:bg-brand-900/10`} title="Scanner un ticket">
                                                {isScanning ? (
                                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <>
                                                        <CameraIcon className="w-5 h-5" />
                                                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptScan} disabled={isScanning} />
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                        <select id="edit-store-select" value={store} onChange={e => setStore(e.target.value)} className={`${baseInputStyle} pl-3 pr-10`}>
                                            {groceryStores.map(s => <option key={s} value={s}>{s}</option>)}
                                            <option value="Autres">Autres</option>
                                        </select>
                                    </div>
                                    {store === 'Autres' && (
                                        <div>
                                            <label htmlFor="edit-custom-store" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Magasin personnalisé</label>
                                            <input type="text" id="edit-custom-store" value={customStore} onChange={e => setCustomStore(e.target.value)} className={`${baseInputStyle} px-3`} />
                                        </div>
                                    )}
                                </div>
                                


                                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <label htmlFor="edit-toggle-sub" className="font-medium text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2">
                                        <ScissorsIcon />
                                        <span>Déduire des articles ?</span>
                                    </label>
                                    <button
                                        type="button"
                                        id="edit-toggle-sub"
                                        onClick={() => setShowSubtractions(!showSubtractions)}
                                        className={`${showSubtractions ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
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
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {subtractedItems.map((item, index) => (
                                          <div key={index} 
                                               onClick={() => handleToggleSubtractedItem(index)}
                                               className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors border ${item.is_subtracted !== false ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-600 border-slate-200 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-500'}`}>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={item.is_subtracted !== false} readOnly className="rounded text-brand-500 focus:ring-brand-500" />
                                                <div className="flex flex-col">
                                                    <span className={`text-sm ${item.is_subtracted !== false ? 'text-red-700 dark:text-red-300 font-medium line-through opacity-70' : 'text-slate-700 dark:text-slate-200'}`}>{item.description}</span>
                                                    {item.category && <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.category}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`text-sm font-medium ${item.is_subtracted !== false ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>{item.amount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span>
                                              <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveSubtractedItem(index); }} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                                <TrashIcon />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 items-end">
                                      <div className="flex-1 min-w-[120px]"><label className="text-xs font-medium text-slate-500">Article</label><input ref={itemDescriptionInputRef} type="text" value={itemDescription} onChange={e => setItemDescription(e.target.value)} onKeyDown={handleItemInputKeyDown} placeholder="Ex: Shampoing" className="block w-full px-2 py-1.5 bg-white dark:bg-slate-600 text-sm rounded-md border-slate-300 dark:border-slate-500"/></div>
                                      <div className="w-24"><label className="text-xs font-medium text-slate-500">Montant</label><input type="text" inputMode="decimal" value={itemAmount} onChange={e => setItemAmount(e.target.value)} onKeyDown={handleItemInputKeyDown} placeholder="0.00" className="block w-full px-2 py-1.5 bg-white dark:bg-slate-600 text-sm rounded-md border-slate-300 dark:border-slate-500"/></div>
                                      <div className="w-32">
                                          <label className="text-xs font-medium text-slate-500">Catégorie</label>
                                          <select value={itemCategory} onChange={e => setItemCategory(e.target.value)} className="block w-full px-2 py-1.5 bg-white dark:bg-slate-600 text-sm rounded-md border-slate-300 dark:border-slate-500">
                                              {PRODUCT_CATEGORIES.map(cat => (
                                                  <option key={cat} value={cat}>{cat}</option>
                                              ))}
                                          </select>
                                      </div>
                                      <button type="button" onClick={handleAddSubtractedItem} className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-semibold rounded-md hover:bg-cyan-600">+</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Ticket (€)</label><input type="text" inputMode="decimal" value={receiptTotal} onChange={e => setReceiptTotal(e.target.value)} className={`${baseInputStyle} px-3 font-semibold`}/></div>
                                    <div><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Montant final</label><input type="text" value={finalCalculatedAmount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})} readOnly className={`${baseInputStyle} px-3 bg-slate-100 dark:bg-slate-600 text-cyan-600 dark:text-cyan-400 font-bold`}/></div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-4">
                                {category === 'Chauffage' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Type de Chauffage</label>
                                        <SegmentedControl options={heatingOptions} value={heatingType} onChange={setHeatingType} className="mt-1" />
                                    </div>
                                )}
                                {category === 'Réparation voitures' && (
                                    <div className="animate-fade-in space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Véhicule</label>
                                            <SegmentedControl options={carOptions} value={repairedCar} onChange={setRepairedCar} className="mt-1"/>
                                        </div>
                                        <div>
                                            <label htmlFor="edit-car-garage" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Garage</label>
                                            <input
                                                type="text"
                                                id="edit-car-garage"
                                                value={carGarage}
                                                onChange={(e) => setCarGarage(e.target.value)}
                                                className={`${baseInputStyle} px-3 ${placeholderStyle}`}
                                                placeholder="Ex: Renault, Norauto..."
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="edit-car-mileage" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Kilométrage</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    id="edit-car-mileage"
                                                    value={carMileage}
                                                    onChange={(e) => setCarMileage(e.target.value)}
                                                    className={`${baseInputStyle} px-3 pr-10 ${placeholderStyle}`}
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
                                    <div className="animate-fade-in"><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pour qui ?</label><SegmentedControl options={childrenOptions} value={clothingPerson} onChange={setClothingPerson} className="mt-1"/></div>
                                )}
                                {category === 'Cadeau' && (
                                     <div className="space-y-4 animate-fade-in"><div><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pour qui ?</label><SegmentedControl options={childrenOptions} value={giftPerson} onChange={setGiftPerson} className="mt-1"/></div><div><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Occasion</label><SegmentedControl options={occasionOptions} value={giftOccasion} onChange={setGiftOccasion} className="mt-1"/></div></div>
                                )}
                                
                                { !['Chauffage', 'Courses'].includes(category) && (
                                    <div className="animate-fade-in">
                                        {category === "Carburant" ? (
                                            <><label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Véhicule</label><SegmentedControl options={carOptions} value={description} onChange={(val) => setDescription(val)} className="mt-1"/></>
                                        ) : (
                                            <>
                                              <label htmlFor="edit-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {category === 'Restaurant' ? 'Restaurant' : category === 'Réparation voitures' ? 'Réparation effectuée' : 'Description'}
                                              </label>
                                              <input 
                                                type="text" 
                                                id="edit-description" 
                                                value={description} 
                                                onChange={(e) => setDescription(e.target.value)} 
                                                className={`${baseInputStyle} px-3 ${placeholderStyle}`} 
                                                placeholder={category === 'Restaurant' ? "Ex: La Pizzaiola, McDo..." : category === 'Réparation voitures' ? "Ex: Vidange, Pneus..." : "Ex: McDo, Cinéma..."}
                                              />
                                            </>
                                        )}
                                    </div>
                                )}
                                <div>
                                   <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type de transaction</label>
                                    <div className="relative flex w-full bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                                      <span className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out ${transactionType === 'refund' ? 'translate-x-full' : 'translate-x-0'}`} aria-hidden="true"/>
                                      <button type="button" onClick={() => setTransactionType('expense')} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${transactionType === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>Dépense</button>
                                      <button type="button" onClick={() => setTransactionType('refund')} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${transactionType === 'refund' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>Remboursement</button>
                                    </div>
                                </div>
                                <div>
                                  <label htmlFor="edit-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Montant (€)</label>
                                  <input type="text" inputMode="decimal" id="edit-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${baseInputStyle} px-3 ${placeholderStyle}`} />
                                </div>
                            </div>
                         )}
                        
                        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                    </form>
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-full transition-colors"
                            aria-label="Supprimer la dépense"
                        >
                            <TrashIcon />
                        </button>
                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
                                Annuler
                            </button>
                            <button type="button" onClick={(e) => handleSubmit(e as any)} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
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
