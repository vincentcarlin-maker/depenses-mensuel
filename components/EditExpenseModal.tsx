import React, { useState, useEffect, useMemo } from 'react';
import { type Expense, type Category, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';

interface EditExpenseModalProps {
    expense: Expense;
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
    onClose: () => void;
    categories: Category[];
    groceryStores: string[];
    cars: string[];
    heatingTypes: string[];
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
    const [description, setDescription] = useState(expense.description);
    const [amount, setAmount] = useState(Math.abs(expense.amount).toString());
    const [category, setCategory] = useState<Category>(expense.category);
    const [user, setUser] = useState<User>(expense.user);
    const [date, setDate] = useState(toDatetimeLocal(expense.date));
    const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(expense.amount >= 0 ? 'expense' : 'refund');
    const [store, setStore] = useState('');
    const [customStore, setCustomStore] = useState('');
    const [heatingType, setHeatingType] = useState('');
    const [error, setError] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    useEffect(() => {
        if (expense.category === 'Courses') {
            const storeRegex = /\s\(([^)]+)\)$/;
            const match = expense.description.match(storeRegex);
            if (match) {
                const storeName = match[1];
                const desc = expense.description.replace(storeRegex, '').trim();
                setDescription(desc);

                if (groceryStores.includes(storeName)) {
                    setStore(storeName);
                } else {
                    setStore('Autres');
                    setCustomStore(storeName);
                }
            } else {
                setDescription(expense.description);
                setStore(groceryStores[0] || '');
            }
        } else if (expense.category === 'Chauffage') {
            const typeRegex = /\s\(([^)]+)\)$/;
            const match = expense.description.match(typeRegex);
            if (match) {
                const typeName = match[1];
                const desc = expense.description.replace(typeRegex, '').trim();
                setDescription(desc);
                setHeatingType(typeName);
            } else {
                setDescription(expense.description);
                setHeatingType(heatingTypes[0] || '');
            }
        }
        else {
            setDescription(expense.description);
        }
    }, [expense, groceryStores, heatingTypes]);

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
        
        let finalDescription = description.trim();

        if (category === 'Courses') {
            const selectedStore = store === 'Autres' ? customStore.trim() : store;
            if (!selectedStore) {
                setError('Veuillez sélectionner un magasin ou en spécifier un.');
                return;
            }
            if (finalDescription === '') {
                finalDescription = 'Courses';
            }
            finalDescription = `${finalDescription} (${selectedStore})`;
        }

        if (category === 'Chauffage') {
            if (!heatingType) {
                setError('Veuillez sélectionner un type de chauffage.');
                return;
            }
            if (finalDescription === '') {
                finalDescription = 'Chauffage';
            }
            finalDescription = `${finalDescription} (${heatingType})`;
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
        });
    };

    const handleDelete = () => {
        onDeleteExpense(expense.id);
        onClose();
    };

    const heatingOptions = useMemo(() => {
        const options = new Set(heatingTypes);
        if (heatingType) {
            options.add(heatingType);
        }
        return Array.from(options);
    }, [heatingTypes, heatingType]);

    const baseInputStyle = "mt-1 block w-full py-2.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm";
    const placeholderStyle = "placeholder-slate-400 dark:placeholder-slate-500";

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm z-40 flex justify-center items-center" aria-modal="true" role="dialog">
                <div 
                    className="fixed inset-0"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl z-50 w-full max-w-md m-4 animate-fade-in">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Détails de la Transaction</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Qui a payé ?</label>
                           <div className="relative flex w-full bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                            <span
                              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out
                                ${user === User.Vincent ? 'translate-x-full' : 'translate-x-0'}
                              `}
                              aria-hidden="true"
                            />
                            <button type="button" onClick={() => setUser(User.Sophie)} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Sophie ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                              Sophie
                            </button>
                            <button type="button" onClick={() => setUser(User.Vincent)} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Vincent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'}`}>
                              Vincent
                            </button>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="edit-category" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Catégorie</label>
                          <select id="edit-category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className={`${baseInputStyle} pl-3 pr-10`}>
                            {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                          </select>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="edit-store-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Magasin</label>
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
                        )}

                        {category === 'Chauffage' && (
                            <div>
                                <label htmlFor="edit-heating-type-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Type de Chauffage</label>
                                <select 
                                    id="edit-heating-type-select" 
                                    value={heatingType} 
                                    onChange={e => setHeatingType(e.target.value)} 
                                    className={`${baseInputStyle} pl-3 pr-10`}
                                >
                                    {heatingOptions.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                          <label htmlFor="edit-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                            {category === "Carburant" ? 'Véhicule' : 'Description'}
                          </label>
                          {category === "Carburant" ? (
                            <select id="edit-car-select" value={description} onChange={(e) => setDescription(e.target.value)} className={`${baseInputStyle} pl-3 pr-10`}>
                                {cars.map(car => <option key={car} value={car}>{car}</option>)}
                            </select>
                          ) : (
                            <input type="text" id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} className={`${baseInputStyle} px-3 ${placeholderStyle}`} />
                          )}
                        </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type de transaction</label>
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
                                Remboursement
                              </button>
                            </div>
                        </div>
                        <div>
                          <label htmlFor="edit-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Montant (€)</label>
                          <input type="text" inputMode="decimal" id="edit-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${baseInputStyle} px-3 ${placeholderStyle}`} />
                        </div>
                        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                        <div className="flex justify-between items-center pt-2">
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
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </form>
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