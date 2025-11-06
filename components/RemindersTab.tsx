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

        await onAddReminder({ 
            description, 
            amount: parsedAmount, 
            category, 
            user, 
            day_of_month: parsedDay,
            is_active: true // Les nouveaux rappels sont actifs par défaut
        });

        setDescription('');
        setAmount('');
        setDayOfMonth('');
        setCategory(Category.Mandatory);
        setError('');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Ajouter un Rappel</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Personne concernée</label>
                    <div className="flex w-full bg-slate-100 rounded-lg p-1">
                        <button type="button" onClick={() => setUser(User.Sophie)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${user === User.Sophie ? 'bg-pink-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Sophie</button>
                        <button type="button" onClick={() => setUser(User.Vincent)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${user === User.Vincent ? 'bg-blue-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Vincent</button>
                    </div>
                </div>
                <div>
                    <label htmlFor="reminder-category" className="block text-sm font-medium text-slate-600">Catégorie</label>
                    <select id="reminder-category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md">
                        {Object.values(Category).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="reminder-description" className="block text-sm font-medium text-slate-600">Description</label>
                    <input type="text" id="reminder-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Ex: Loyer, Netflix..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="reminder-amount" className="block text-sm font-medium text-slate-600">Montant (€)</label>
                        <input type="number" id="reminder-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="50.00" step="0.01" />
                    </div>
                    <div>
                        <label htmlFor="reminder-day" className="block text-sm font-medium text-slate-600">Jour du mois</label>
                        <input type="number" id="reminder-day" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Ex: 5" min="1" max="31" />
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors">Ajouter le rappel</button>
            </form>
        </div>
    );
};

const OfflineIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.66 16.99a8.902 8.902 0 01-1.16-1.32A4 4 0 003 15a4 4 0 004 4h9a5 5 0 001.38-9.77M19 10a5 5 0 00-9.77-1.38" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

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
            <div className={`relative p-3 rounded-lg border ${reminder.is_active ? 'bg-slate-50 border-slate-200' : 'bg-slate-200 border-slate-300 opacity-60'}`}>
                {reminder.isOffline && (
                    <div className="absolute top-2 right-2" title="En attente de synchronisation">
                        <OfflineIcon />
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{reminder.description}</p>
                        <p className="text-sm text-slate-600">
                            {reminder.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} - Le {reminder.day_of_month} de chaque mois
                        </p>
                    </div>
                    <div className="flex items-center space-x-1">
                        <label htmlFor={`toggle-${reminder.id}`} className="flex items-center cursor-pointer" title={reminder.is_active ? 'Désactiver' : 'Activer'}>
                            <div className="relative">
                                <input type="checkbox" id={`toggle-${reminder.id}`} className="sr-only peer" checked={reminder.is_active} onChange={handleToggleActive} />
                                <div className="block bg-slate-300 w-10 h-6 rounded-full peer-checked:bg-cyan-600 transition-colors"></div>
                                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                            </div>
                        </label>
                        <button onClick={() => onEditReminder(reminder)} className="p-2 text-slate-400 hover:text-cyan-600 rounded-full" aria-label="Modifier le rappel"><EditIcon /></button>
                        <button onClick={handleDeleteClick} className="p-2 text-slate-400 hover:text-red-600 rounded-full" aria-label="Supprimer le rappel"><TrashIcon /></button>
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
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Liste des Rappels</h2>
            {reminders.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Aucun rappel configuré.</p>
            ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {reminders.map(reminder => (
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
        setReminderToEdit(null); // Close modal on success
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