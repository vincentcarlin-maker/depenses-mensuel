
import React, { useState, useRef, useEffect } from 'react';
import { type Reminder, type Category, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import EditReminderModal from './EditReminderModal';
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
    ShieldIcon,
    WifiIcon,
    MusicNoteIcon,
    SfrIcon,
    CeoIcon,
    TotalEnergiesIcon,
    TrashBinIcon,
    PillIcon
} from './icons/CategoryIcons';

interface RemindersTabProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
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

export const getReminderVisual = (reminder: { description: string; category: string }) => {
    const lower = reminder.description.toLowerCase();
    
    if (lower.includes('netflix')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-500 dark:text-pink-400 flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="2" y="4" width="20" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4" />
                    </svg>
                </div>
            )
        };
    }
    if (lower.includes('assurance') || lower.includes('voiture') || lower.includes('auto') || reminder.category === 'Réparation voitures') {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="hidden" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 114 0 2 2 0 01-4 0zM4 17V9a2 2 0 012-2h12a2 2 0 012 2v8M6 7l2-3h8l2 3" />
                    </svg>
                </div>
            )
        };
    }
    if (lower.includes('loyer') || lower.includes('habitation') || lower.includes('maison')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
            )
        };
    }
    if (lower.includes('deezer') || lower.includes('spotify') || lower.includes('musique')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center">
                    <MusicNoteIcon className="w-6 h-6" />
                </div>
            )
        };
    }
    if (lower.includes('sfr')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center">
                    <SfrIcon className="w-6 h-6" />
                </div>
            )
        };
    }
    if (lower.includes('internet') || lower.includes('box') || lower.includes('fibre') || lower.includes('wifi')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <WifiIcon className="w-6 h-6" />
                </div>
            )
        };
    }
    if (lower.includes('mutuelle') || lower.includes('santé') || lower.includes('secu')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                    <ShieldIcon className="w-6 h-6" />
                </div>
            )
        };
    }
    if (lower.includes('ceo') || lower.includes('eau')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                    <CeoIcon className="w-6 h-6" />
                </div>
            )
        };
    }
    if (lower.includes('total energies') || lower.includes('edf') || lower.includes('electricité') || lower.includes('électricité')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                    <TotalEnergiesIcon className="w-6 h-6" />
                </div>
            )
        };
    }
    if (lower.includes('poubelle') || lower.includes('ordures')) {
        return {
            icon: () => (
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                    <TrashBinIcon className="w-6 h-6" />
                </div>
            )
        };
    }

    // Default to category visual
    const visual = CategoryVisuals[reminder.category] || CategoryVisuals["Divers"];
    const IconCmp = visual.icon;
    return {
        icon: () => (
            <div className={`w-10 h-10 rounded-2xl ${visual.bgColor} ${visual.color} flex items-center justify-center`}>
                <IconCmp className="w-5 h-5" />
            </div>
        )
    };
};

const ReminderForm: React.FC<{ 
    onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
    categories: Category[];
}> = ({ onAddReminder, categories }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Category>(
        categories.includes("Dép. récurrentes" as Category) 
            ? ("Dép. récurrentes" as Category) 
            : categories.includes("Dépenses obligatoires" as Category) 
            ? ("Dépenses obligatoires" as Category) 
            : categories[0]
    );
    const [user, setUser] = useState<User>(User.Sophie);
    const [dayOfMonth, setDayOfMonth] = useState('');
    const [error, setError] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
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

        try {
            setIsSubmitting(true);
            await onAddReminder({ 
                description: description.trim(), 
                amount: parsedAmount, 
                category, 
                user, 
                day_of_month: parsedDay,
                is_active: true
            });

            setDescription('');
            setAmount('');
            setDayOfMonth('');
            setError('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCategoryVisual = CategoryVisuals[category] || CategoryVisuals["Divers"];
    const SelectedCategoryIcon = selectedCategoryVisual.icon;

    return (
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[28px] shadow-xs border border-slate-100 dark:border-slate-700/60">
            {/* Header: Green circular + badge */}
            <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        Ajouter un rappel
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">
                        Programmez une dépense récurrente
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Field 1: Personne concernée */}
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
                            className={`flex-1 py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
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
                            className={`flex-1 py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
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

                {/* Field 2: Catégorie with existing icons */}
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
                        className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-left text-slate-900 dark:text-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 transition-all"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg ${selectedCategoryVisual.bgColor} ${selectedCategoryVisual.color} flex items-center justify-center shrink-0`}>
                                <SelectedCategoryIcon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                                {category}
                            </span>
                        </div>
                        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isCategoryOpen && (
                        <div className="absolute z-40 mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto p-1.5 space-y-1">
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
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left font-semibold text-sm transition-colors ${
                                            isSelected 
                                                ? 'bg-[#f0fdfa] dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg ${visual.bgColor} ${visual.color} flex items-center justify-center shrink-0`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="truncate">{cat}</span>
                                        {isSelected && (
                                            <svg className="w-4 h-4 text-[#0d9488] ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Field 3: Description */}
                <div>
                    <label htmlFor="reminder-description" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        <svg className="w-4 h-4 text-slate-400 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description
                    </label>
                    <input 
                        type="text" 
                        id="reminder-description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-medium text-sm sm:text-base transition-all" 
                        placeholder="Ex: Loyer, Netflix..." 
                    />
                </div>

                {/* Field 4 & 5: Montant (€) and Jour du mois */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label htmlFor="reminder-amount" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            <span className="text-slate-400 font-extrabold text-sm">€</span>
                            Montant (€)
                        </label>
                        <input 
                            type="text" 
                            inputMode="decimal" 
                            id="reminder-amount" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-medium text-sm sm:text-base transition-all" 
                            placeholder="50,00" 
                        />
                    </div>
                    <div>
                        <label htmlFor="reminder-day" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            <svg className="w-4 h-4 text-slate-400 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Jour du mois
                        </label>
                        <input 
                            type="number" 
                            id="reminder-day" 
                            value={dayOfMonth} 
                            onChange={(e) => setDayOfMonth(e.target.value)} 
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-medium text-sm sm:text-base transition-all" 
                            placeholder="Ex: 5" 
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

                {/* Submit button: Teal / Emerald large button */}
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#14b8a6] hover:bg-[#0d9488] active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 mt-2 cursor-pointer"
                >
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Ajouter le rappel
                </button>
            </form>
        </div>
    );
};

const ReminderItem: React.FC<{
    reminder: Reminder;
    onUpdateReminder: (reminder: Reminder) => void;
    onDeleteReminder: (id: string) => void;
    onEditReminder: (reminder: Reminder) => void;
}> = ({ reminder, onUpdateReminder, onDeleteReminder, onEditReminder }) => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const handleToggleActive = () => {
        onUpdateReminder({ ...reminder, is_active: reminder.is_active === false ? true : false });
    };

    const handleDeleteClick = () => {
        setIsConfirmModalOpen(true);
    };

    const executeDelete = () => {
        onDeleteReminder(reminder.id);
        setIsConfirmModalOpen(false);
    };

    const isActive = reminder.is_active !== false;
    const visual = getReminderVisual(reminder);
    const IconComponent = visual.icon;

    return (
        <>
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                isActive 
                    ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 shadow-xs hover:border-slate-200' 
                    : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/40 opacity-70'
            }`}>
                <div className="flex items-center justify-between gap-3">
                    {/* Left: Dynamic existing icon matching category or description */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="shrink-0">
                            <IconComponent />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold text-sm sm:text-base truncate ${
                                    isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 line-through'
                                }`}>
                                    {reminder.description}
                                </span>
                                {isActive ? (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] dark:bg-emerald-950/60 text-[#10b981] dark:text-emerald-400 shrink-0">
                                        Actif
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 shrink-0">
                                        Inactif
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                {reminder.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € • le {reminder.day_of_month} de chaque mois
                            </p>
                        </div>
                    </div>

                    {/* Right actions: Toggle, Edit, Delete */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={handleToggleActive}
                            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                                isActive ? 'bg-[#14b8a6]' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                        >
                            <span 
                                className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-xs transition-transform ${
                                    isActive ? 'translate-x-5' : 'translate-x-0'
                                }`} 
                            />
                        </button>

                        <button 
                            type="button"
                            onClick={() => onEditReminder(reminder)} 
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg cursor-pointer" 
                            aria-label="Modifier le rappel"
                        >
                            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                        </button>

                        <button 
                            type="button"
                            onClick={handleDeleteClick} 
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer" 
                            aria-label="Supprimer le rappel"
                        >
                            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer le rappel "${reminder.description}" ? Cette action est irréversible.`}
            />
        </>
    );
};

const ReminderList: React.FC<{ 
    reminders: Reminder[], 
    onUpdateReminder: RemindersTabProps['onUpdateReminder'], 
    onDeleteReminder: RemindersTabProps['onDeleteReminder'],
    onEditReminder: (reminder: Reminder) => void,
}> = ({ reminders, onUpdateReminder, onDeleteReminder, onEditReminder }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[28px] shadow-xs border border-slate-100 dark:border-slate-700/60">
            {/* Header: Blue circular list badge */}
            <div className="flex items-center gap-3.5 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        Liste des rappels
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">
                        Vos dépenses récurrentes
                    </p>
                </div>
            </div>

            {reminders.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                        Aucun rappel configuré pour le moment.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {reminders
                        .filter(reminder => reminder && typeof reminder.amount === 'number')
                        .map(reminder => (
                            <ReminderItem
                                key={reminder.id}
                                reminder={reminder}
                                onUpdateReminder={onUpdateReminder}
                                onDeleteReminder={onDeleteReminder}
                                onEditReminder={onEditReminder}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};

const RemindersTab: React.FC<RemindersTabProps> = ({ reminders, onAddReminder, onUpdateReminder, onDeleteReminder, categories }) => {
    const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);

    const handleUpdateReminder = async (updatedReminder: Reminder) => {
        await onUpdateReminder(updatedReminder);
        setReminderToEdit(null);
    };

    return (
        <div className="space-y-6">
            <ReminderForm onAddReminder={onAddReminder} categories={categories} />
            <ReminderList 
                reminders={reminders} 
                onUpdateReminder={onUpdateReminder} 
                onDeleteReminder={onDeleteReminder}
                onEditReminder={setReminderToEdit}
            />
            {reminderToEdit && (
                <EditReminderModal
                    reminder={reminderToEdit}
                    onUpdateReminder={handleUpdateReminder}
                    onClose={() => setReminderToEdit(null)}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default RemindersTab;

