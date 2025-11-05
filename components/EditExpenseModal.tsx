import React, { useState, useEffect } from 'react';
import { type Expense, Category, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';

interface EditExpenseModalProps {
    expense: Expense;
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
    onClose: () => void;
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

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, onUpdateExpense, onDeleteExpense, onClose }) => {
    const [description, setDescription] = useState(expense.description);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [category, setCategory] = useState<Category>(expense.category);
    const [user, setUser] = useState<User>(expense.user);
    const [date, setDate] = useState(toDatetimeLocal(expense.date));
    const [comment, setComment] = useState(expense.comment || '');
    const [error, setError] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
        if (!description.trim() || !amount) {
            setError('La description et le montant sont requis.');
            return;
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Veuillez entrer un montant valide.');
            return;
        }

        onUpdateExpense({
            ...expense,
            description,
            amount: parsedAmount,
            category,
            user,
            date: new Date(date).toISOString(),
            comment,
        });
    };

    const handleDelete = () => {
        onDeleteExpense(expense.id);
        onClose();
    };


    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
                <div 
                    className="fixed inset-0"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>
                <div className="bg-white p-6 rounded-2xl shadow-xl z-50 w-full max-w-md m-4">
                    <h2 className="text-xl font-bold mb-4">Détails de la Dépense</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">Qui a payé ?</label>
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
                          <label htmlFor="edit-category" className="block text-sm font-medium text-slate-600">Catégorie</label>
                          <select id="edit-category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                            {Object.values(Category).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                          </select>
                        </div>
                        <div>
                            <label htmlFor="edit-date" className="block text-sm font-medium text-slate-600">Date et Heure</label>
                            <input
                                type="datetime-local"
                                id="edit-date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                            />
                        </div>
                        <div>
                          <label htmlFor="edit-description" className="block text-sm font-medium text-slate-600">Description</label>
                          <input type="text" id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" />
                        </div>
                        <div>
                          <label htmlFor="edit-amount" className="block text-sm font-medium text-slate-600">Montant (€)</label>
                          <input type="number" id="edit-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" step="0.01" />
                        </div>
                        <div>
                            <label htmlFor="edit-comment" className="block text-sm font-medium text-slate-600">Commentaire</label>
                            <textarea
                                id="edit-comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                                rows={3}
                                placeholder="Aucun commentaire"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-between items-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsConfirmOpen(true)}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                aria-label="Supprimer la dépense"
                            >
                                <TrashIcon />
                            </button>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none">
                                    Annuler
                                </button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none">
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
                message={`Êtes-vous sûr de vouloir supprimer la dépense "${expense.description}" ? Cette action est irréversible.`}
            />
        </>
    );
};

export default EditExpenseModal;
