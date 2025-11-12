import React, { useState, useEffect } from 'react';
import { type Reminder, type Category, User } from '../types';

interface EditReminderModalProps {
    reminder: Reminder;
    onUpdateReminder: (reminder: Reminder) => void;
    onClose: () => void;
    categories: Category[];
}

const EditReminderModal: React.FC<EditReminderModalProps> = ({ reminder, onUpdateReminder, onClose, categories }) => {
    const [description, setDescription] = useState(reminder.description);
    const [amount, setAmount] = useState(reminder.amount.toString());
    const [category, setCategory] = useState<Category>(reminder.category);
    const [user, setUser] = useState<User>(reminder.user);
    const [dayOfMonth, setDayOfMonth] = useState(reminder.day_of_month.toString());
    const [error, setError] = useState('');

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
            description,
            amount: parsedAmount,
            category,
            user,
            day_of_month: parsedDay,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div 
                className="fixed inset-0"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl z-50 w-full max-w-md m-4 animate-fade-in">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Modifier le Rappel</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Personne concernée</label>
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
                      <label htmlFor="edit-reminder-category" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Catégorie</label>
                      <select id="edit-reminder-category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                        {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                     <div>
                      <label htmlFor="edit-reminder-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
                      <input type="text" id="edit-reminder-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="edit-reminder-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Montant (€)</label>
                          <input type="text" inputMode="decimal" id="edit-reminder-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="edit-reminder-day" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Jour du mois</label>
                            <input type="number" id="edit-reminder-day" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm" min="1" max="31" />
                        </div>
                    </div>
                    {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
                            Annuler
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditReminderModal;
