
import React, { useState, useEffect, useRef } from 'react';
import { type Reminder, type Category, User } from '../types';
import { 
    MandatoryIcon, 
    FuelIcon, 
    HeatingIcon, 
    GroceriesIcon, 
    RestaurantIcon, 
    CarRepairsIcon, 
    MiscIcon,
    GiftIcon,
    ClothingIcon,
    PalmTreeIcon,
    PillIcon
} from './icons/CategoryIcons';

interface EditReminderModalProps {
    reminder: Reminder;
    onUpdateReminder: (reminder: Reminder) => void;
    onClose: () => void;
    categories: Category[];
}

const CategoryVisuals: { [key: string]: { icon: React.FC<{ className?: string }>; color: string; bgColor: string } } = {
  "Dép. récurrentes": { icon: MandatoryIcon, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700' },
  "Dép. recurentes": { icon: MandatoryIcon, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-100 dark:bg-slate-700' },
  "Dépenses obligatoires": { icon: MandatoryIcon, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/60' },
  "Carburant": { icon: FuelIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/60' },
  "Chauffage": { icon: HeatingIcon, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/60' },
  "Courses": { icon: GroceriesIcon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/60' },
  "Restaurant": { icon: RestaurantIcon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/60' },
  "Vacances": { icon: PalmTreeIcon, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-950/60' },
  "Réparation voitures": { icon: CarRepairsIcon, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/60' },
  "Vêtements": { icon: ClothingIcon, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/60' },
  "Cadeau": { icon: GiftIcon, color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/60' },
  "Complément alimentaire": { icon: PillIcon, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/60' },
  "Divers": { icon: MiscIcon, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-950/60' },
};

const EditReminderModal: React.FC<EditReminderModalProps> = ({ reminder, onUpdateReminder, onClose, categories }) => {
    const [description, setDescription] = useState(reminder.description);
    const [amount, setAmount] = useState(reminder.amount.toString());
    const [category, setCategory] = useState<Category>(reminder.category);
    const [user, setUser] = useState<User>(reminder.user);
    const [dayOfMonth, setDayOfMonth] = useState(reminder.day_of_month.toString());
    const [error, setError] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
           window.removeEventListener('keydown', handleEsc);
           document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount.replace(',', '.'));
        const parsedDay = parseInt(dayOfMonth, 10);

        if (!description.trim() || !amount || !dayOfMonth) {
            setError('Tous les champs sont requis.');
            return;
        }
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Veuillez entrer un montant valide.');
            return;
        }
        if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
            setError('Le jour du mois doit être entre 1 et 31.');
            return;
        }
        
        onUpdateReminder({
            ...reminder,
            description: description.trim(),
            amount: parsedAmount,
            category,
            user,
            day_of_month: parsedDay,
        });
    };

    const selectedCategoryVisual = CategoryVisuals[category] || CategoryVisuals["Divers"];
    const SelectedCategoryIcon = selectedCategoryVisual.icon;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div 
                className="fixed inset-0"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-[28px] shadow-2xl z-50 w-full max-w-md border border-slate-100 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0d9488] dark:text-teal-400 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                Modifier le rappel
                            </h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Ajustez les paramètres de votre récurrence
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User */}
                    <div>
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            <svg className="w-4 h-4 text-slate-400 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Personne concernée
                        </label>
                        <div className="bg-[#f1f5f9] dark:bg-slate-700/50 p-1 rounded-full flex gap-1">
                            <button
                                type="button"
                                onClick={() => setUser(User.Sophie)}
                                className={`flex-1 py-2 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    user === User.Sophie
                                        ? 'bg-white dark:bg-slate-800 text-[#e11d48] dark:text-rose-400 shadow-xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <svg className={`w-4 h-4 ${user === User.Sophie ? 'fill-[#e11d48] text-[#e11d48]' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                Sophie
                            </button>
                            <button
                                type="button"
                                onClick={() => setUser(User.Vincent)}
                                className={`flex-1 py-2 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    user === User.Vincent
                                        ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-400 shadow-xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <svg className={`w-4 h-4 ${user === User.Vincent ? 'fill-[#0284c7] text-[#0284c7]' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                Vincent
                            </button>
                        </div>
                    </div>

                    {/* Category with existing icons */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            <svg className="w-4 h-4 text-slate-400 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Catégorie
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-left text-slate-900 dark:text-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg ${selectedCategoryVisual.bgColor} ${selectedCategoryVisual.color} flex items-center justify-center shrink-0`}>
                                    <SelectedCategoryIcon className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                    {category}
                                </span>
                            </div>
                            <svg className={`w-5 h-5 text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isCategoryOpen && (
                            <div className="absolute z-40 mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-52 overflow-y-auto p-1.5 space-y-1">
                                {categories.map((cat) => {
                                    const visual = CategoryVisuals[cat] || CategoryVisuals["Divers"];
                                    const Icon = visual.icon;
                                    const isSelected = cat === category;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setCategory(cat);
                                                setIsCategoryOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left font-semibold text-sm transition-colors cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-[#f0fdfa] dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg ${visual.bgColor} ${visual.color} flex items-center justify-center shrink-0`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="truncate">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="edit-reminder-description" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            <svg className="w-4 h-4 text-slate-400 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Description
                        </label>
                        <input 
                            type="text" 
                            id="edit-reminder-description" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-medium text-sm sm:text-base transition-all" 
                        />
                    </div>

                    {/* Amount & Day */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="edit-reminder-amount" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                <span className="text-slate-400 font-extrabold text-sm">€</span>
                                Montant (€)
                            </label>
                            <input 
                                type="text" 
                                inputMode="decimal" 
                                id="edit-reminder-amount" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-medium text-sm sm:text-base transition-all" 
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-reminder-day" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                <svg className="w-4 h-4 text-slate-400 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Jour du mois
                            </label>
                            <input 
                                type="number" 
                                id="edit-reminder-day" 
                                value={dayOfMonth} 
                                onChange={(e) => setDayOfMonth(e.target.value)} 
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-medium text-sm sm:text-base transition-all" 
                                min="1" 
                                max="31" 
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 px-4 text-sm font-extrabold text-white bg-[#14b8a6] hover:bg-[#0d9488] active:scale-[0.99] rounded-2xl transition-all shadow-sm cursor-pointer"
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditReminderModal;

