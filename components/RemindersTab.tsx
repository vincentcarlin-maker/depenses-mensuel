import React, { useState } from 'react';
import { type Reminder, Category, User } from '../types';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import ConfirmationModal from './ConfirmationModal';
import EditReminderModal from './EditReminderModal';

interface RemindersTabProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void>;
  onUpdateReminder: (reminder: Reminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

const ReminderForm: React.FC<{ onAddReminder: (reminder: Omit<Reminder, 'id' | 'created_at'>) => Promise<void> }> = ({ onAddReminder }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Category>(Category.Mandatory);
    const [user, setUser] = useState<User>(User.Sophie);
    const [dayOfMonth, setDayOfMonth] = useState('');
    const [error, setError] = useState('');

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

        await onAddReminder({ 
            description, 
            amount: parsedAmount, 
            category, 
            user, 
            day_of_month: parsedDay,
            is_active: true
        });

        setDescription('');
        setAmount('');
        setDayOfMonth('');
        setCategory(Category.Mandatory);
        setError('');
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Ajouter un Rappel</h2>
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
                        <button type="button" onClick={() => setUser(User.Sophie)} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Sophie ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>Sophie</button>
                        <button type="button" onClick={() => setUser(User.Vincent)} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Vincent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'}`}>Vincent</button>
                    </div>
                </div>
                <div>
                    <label htmlFor="reminder-category" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Catégorie</label>
                    <select id="reminder-category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                        {Object.values(Category).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="reminder-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
                    <input type="text" id="reminder-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md" placeholder="Ex: Loyer, Netflix..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="reminder-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Montant (€)</label>
                        <input type="text" inputMode="decimal" id="reminder-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md" placeholder="50.00" />
                    </div>
                    <div>
                        <label htmlFor="reminder-day" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Jour du mois</label>
                        <input type="number" id="reminder-day" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md" placeholder="Ex: 5" min="1" max="31" />
                    </div>
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors">Ajouter le rappel</button>
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
        onUpdateReminder({ ...reminder, is_active: !reminder.is_active });
    };

    const handleDeleteClick = () => {
        setIsConfirmModalOpen(true);
    };

    const executeDelete = () => {
        onDeleteReminder(reminder.id);
        setIsConfirmModalOpen(false);
    };

    return (
        <>
            <div className={`p-4 rounded-xl border ${reminder.is_active ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-700 opacity-60'}`}>
                <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{reminder.description}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {reminder.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} - Le {reminder.day_of_month} de chaque mois
                        </p>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 pl-2">
                        <label htmlFor={`toggle-${reminder.id}`} className="flex items-center cursor-pointer" title={reminder.is_active ? 'Désactiver' : 'Activer'}>
                            <div className="relative">
                                <input type="checkbox" id={`toggle-${reminder.id}`} className="sr-only peer" checked={reminder.is_active} onChange={handleToggleActive} />
                                <div className="block bg-slate-300 dark:bg-slate-600 w-10 h-6 rounded-full peer-checked:bg-cyan-600 transition-colors"></div>
                                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                            </div>
                        </label>
                        <button onClick={() => onEditReminder(reminder)} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-full transition-colors" aria-label="Modifier le rappel"><EditIcon /></button>
                        <button onClick={handleDeleteClick} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors" aria-label="Supprimer le rappel"><TrashIcon /></button>
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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Liste des Rappels</h2>
            {reminders.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">Aucun rappel configuré.</p>
            ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {reminders
                        // FIX: Filter out malformed reminders to prevent crashes when accessing properties like 'amount'.
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


const RemindersTab: React.FC<RemindersTabProps> = ({ reminders, onAddReminder, onUpdateReminder, onDeleteReminder }) => {
    const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);

    const handleUpdateReminder = async (updatedReminder: Reminder) => {
        await onUpdateReminder(updatedReminder);
        setReminderToEdit(null);
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <ReminderForm onAddReminder={onAddReminder} />
                </div>
                <div className="space-y-8">
                    <ReminderList 
                        reminders={reminders} 
                        onUpdateReminder={onUpdateReminder} 
                        onDeleteReminder={onDeleteReminder}
                        onEditReminder={setReminderToEdit}
                    />
                </div>
            </div>
            {reminderToEdit && (
                <EditReminderModal
                    reminder={reminderToEdit}
                    onUpdateReminder={handleUpdateReminder}
                    onClose={() => setReminderToEdit(null)}
                />
            )}
        </>
    );
};

export default RemindersTab;