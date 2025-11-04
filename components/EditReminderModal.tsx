import React, { useState, useEffect } from 'react';
import { type Reminder, Category, User } from '../types';

interface EditReminderModalProps {
    reminder: Reminder;
    onUpdateReminder: (reminder: Reminder) => void;
    onClose: () => void;
}

const EditReminderModal: React.FC<EditReminderModalProps> = ({ reminder, onUpdateReminder, onClose }) => {
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
        const parsedAmount = parseFloat(amount);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div 
                className="fixed inset-0"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div className="bg-white p-6 rounded-2xl shadow-xl z-50 w-full max-w-md m-4 animate-slide-in-right">
                <h2 className="text-xl font-bold mb-4">Modifier le Rappel</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Personne concernée</label>
                      <div className="flex w-full bg-slate-100 rounded-lg p-1">
                        <button type="button" onClick={() => setUser(User.Sophie)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${user === User.Sophie ? 'bg-pink-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                          Sophie
                        </button>
                        <button type="button" onClick={() => setUser(User.Vincent)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${user === User.Vincent ? 'bg-blue-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                          Vincent
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="edit-reminder-category" className="block text-sm font-medium text-slate-600">Catégorie</label>
                      <select id="edit-reminder-category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                        {Object.values(Category).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                     <div>
                      <label htmlFor="edit-reminder-description" className="block text-sm font-medium text-slate-600">Description</label>
                      <input type="text" id="edit-reminder-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="edit-reminder-amount" className="block text-sm font-medium text-slate-600">Montant (€)</label>
                          <input type="number" id="edit-reminder-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" step="0.01" />
                        </div>
                        <div>
                            <label htmlFor="edit-reminder-day" className="block text-sm font-medium text-slate-600">Jour du mois</label>
                            <input type="number" id="edit-reminder-day" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" min="1" max="31" />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none">
                            Annuler
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none">
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditReminderModal;
