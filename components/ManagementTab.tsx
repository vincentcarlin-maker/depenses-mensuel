import React, { useState } from 'react';
import { User, type Category } from '../types';
import { type Profile } from '../hooks/useAuth';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import EyeIcon from './icons/EyeIcon';
import ConfirmationModal from './ConfirmationModal';

// --- Section Header Component ---
const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
);

// --- User Management ---
const UserManagement: React.FC<{
    profiles: Profile[];
    loggedInUser: User;
    onAddProfile: (profile: Profile) => boolean;
    onUpdateProfilePassword: (username: string, newPassword: string) => boolean;
    onDeleteProfile: (username: string) => boolean;
}> = ({ profiles, loggedInUser, onAddProfile, onUpdateProfilePassword, onDeleteProfile }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [selectedUser, setSelectedUser] = useState<User>(User.Sophie);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [editingPassword, setEditingPassword] = useState('');
    const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
    const [error, setError] = useState('');

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || !newPassword.trim()) {
            setError("Le nom d'utilisateur et le mot de passe sont requis.");
            return;
        }
        const success = onAddProfile({ username: newUsername, password: newPassword, user: selectedUser });
        if (success) {
            setNewUsername('');
            setNewPassword('');
            setError('');
        } else {
            setError(`L'utilisateur "${newUsername}" existe déjà.`);
        }
    };

    const handleUpdatePassword = () => {
        if (editingUser && editingPassword.trim()) {
            onUpdateProfilePassword(editingUser.username, editingPassword);
            setEditingUser(null);
            setEditingPassword('');
        }
    };
    
    const handleDeleteUser = () => {
        if(deletingUser) {
            onDeleteProfile(deletingUser.username);
            setDeletingUser(null);
        }
    }

    return (
        <div className="space-y-6">
            <SectionHeader title="Gestion des Utilisateurs" description="Ajouter, modifier ou supprimer des profils utilisateurs." />
            <div className="space-y-4">
                {profiles.map(p => (
                    <div key={p.username} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{p.username} ({p.user})</span>
                        <div className="flex items-center gap-2">
                           <button onClick={() => setEditingUser(p)} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-full transition-colors"><EditIcon /></button>
                           <button onClick={() => setDeletingUser(p)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddUser} className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Ajouter un utilisateur</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Nom d'utilisateur" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="input-style" />
                    <div className="relative">
                        <input type={isPasswordVisible ? "text" : "password"} placeholder="Mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-style w-full pr-10" />
                        <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500"><EyeIcon /></button>
                    </div>
                </div>
                 <select value={selectedUser} onChange={e => setSelectedUser(e.target.value as User)} className="input-style w-full">
                    {Object.values(User).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" className="btn-primary w-full sm:w-auto">Ajouter</button>
            </form>

            {/* Edit Modal */}
            {editingUser && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
                        <h4 className="font-bold text-lg">Modifier le mot de passe de "{editingUser.username}"</h4>
                        <input type="password" placeholder="Nouveau mot de passe" value={editingPassword} onChange={e => setEditingPassword(e.target.value)} className="input-style w-full"/>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingUser(null)} className="btn-secondary">Annuler</button>
                            <button onClick={handleUpdatePassword} className="btn-primary">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={handleDeleteUser}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${deletingUser?.username}" ? Cette action est irréversible.`}
            />
        </div>
    );
};

// --- Category Management ---
const CategoryManagement: React.FC<{
    categories: Category[];
    onAddCategory: (name: string) => boolean;
    onUpdateCategory: (oldName: string, newName: string) => boolean;
    onDeleteCategory: (name: string) => void;
}> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (onAddCategory(newCategory)) {
            setNewCategory('');
        }
    };
    
    const handleUpdateCategory = () => {
        if(editingCategory && onUpdateCategory(editingCategory, editingName)) {
            setEditingCategory(null);
            setEditingName('');
        }
    }

    const handleDeleteCategory = () => {
        if (deletingCategory) {
            onDeleteCategory(deletingCategory);
            setDeletingCategory(null);
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="Gestion des Catégories" description="Personnalisez la liste des catégories de dépenses." />
            <div className="space-y-2">
                {categories.map(c => (
                     <div key={c} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{c}</span>
                        <div className="flex items-center gap-2">
                           <button onClick={() => { setEditingCategory(c); setEditingName(c); }} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-full transition-colors"><EditIcon /></button>
                           <button onClick={() => setDeletingCategory(c)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
             <form onSubmit={handleAddCategory} className="flex gap-2 items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <input type="text" placeholder="Nouvelle catégorie" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-style flex-grow" />
                <button type="submit" className="btn-primary">Ajouter</button>
            </form>

            {/* Edit Modal */}
            {editingCategory && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
                        <h4 className="font-bold text-lg">Renommer "{editingCategory}"</h4>
                        <input type="text" value={editingName} onChange={e => setEditingName(e.target.value)} className="input-style w-full"/>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingCategory(null)} className="btn-secondary">Annuler</button>
                            <button onClick={handleUpdateCategory} className="btn-primary">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={!!deletingCategory}
                onClose={() => setDeletingCategory(null)}
                onConfirm={handleDeleteCategory}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer la catégorie "${deletingCategory}" ? Les dépenses existantes ne seront pas affectées.`}
            />
        </div>
    );
};

// --- List Management ---
interface ListManagerProps {
    title: string;
    list: string[];
    setList: React.Dispatch<React.SetStateAction<string[]>>;
    itemNoun: string;
    setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}

const ListManager: React.FC<ListManagerProps> = ({ title, list, setList, itemNoun, setToastInfo }) => {
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<{ old: string; new: string } | null>(null);
    const [deletingItem, setDeletingItem] = useState<string | null>(null);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedItem = newItem.trim();
        if (!trimmedItem) return;
        if (list.find(i => i.toLowerCase() === trimmedItem.toLowerCase())) {
            setToastInfo({ message: `Cet élément existe déjà.`, type: 'error' });
            return;
        }
        setList(prev => [...prev, trimmedItem]);
        setNewItem('');
    };

    const handleUpdateItem = () => {
        if (!editingItem) return;
        const trimmedNewName = editingItem.new.trim();
        if (!trimmedNewName || trimmedNewName === editingItem.old) {
            setEditingItem(null);
            return;
        }
        if (list.find(i => i.toLowerCase() === trimmedNewName.toLowerCase())) {
            setToastInfo({ message: `Cet élément existe déjà.`, type: 'error' });
            return;
        }
        setList(prev => prev.map(i => i === editingItem.old ? trimmedNewName : i));
        setEditingItem(null);
    };

    const handleDeleteItem = () => {
        if (deletingItem) {
            if (list.length <= 1) {
                 setToastInfo({ message: `Vous devez conserver au moins un ${itemNoun}.`, type: 'error' });
                 setDeletingItem(null);
                 return;
            }
            setList(prev => prev.filter(i => i !== deletingItem));
            setDeletingItem(null);
        }
    };

    return (
        <div className="space-y-6">
            <h4 className="text-md font-bold text-slate-800 dark:text-slate-100">{title}</h4>
            <div className="space-y-2">
                {list.map(item => (
                    <div key={item} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{item}</span>
                        <div className="flex items-center gap-2">
                           <button onClick={() => setEditingItem({ old: item, new: item })} className="p-2 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-full transition-colors"><EditIcon /></button>
                           <button onClick={() => setDeletingItem(item)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddItem} className="flex gap-2 items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <input type="text" placeholder={`Nouveau ${itemNoun}`} value={newItem} onChange={e => setNewItem(e.target.value)} className="input-style flex-grow" />
                <button type="submit" className="btn-primary">Ajouter</button>
            </form>

            {editingItem && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
                        <h4 className="font-bold text-lg">Renommer "{editingItem.old}"</h4>
                        <input type="text" value={editingItem.new} onChange={e => setEditingItem({ ...editingItem, new: e.target.value })} className="input-style w-full"/>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingItem(null)} className="btn-secondary">Annuler</button>
                            <button onClick={handleUpdateItem} className="btn-primary">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleDeleteItem}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer "${deletingItem}" ?`}
            />
        </div>
    );
};


const ListManagement: React.FC<{
    groceryStores: string[];
    setGroceryStores: React.Dispatch<React.SetStateAction<string[]>>;
    cars: string[];
    setCars: React.Dispatch<React.SetStateAction<string[]>>;
    heatingTypes: string[];
    setHeatingTypes: React.Dispatch<React.SetStateAction<string[]>>;
    setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}> = ({ groceryStores, setGroceryStores, cars, setCars, heatingTypes, setHeatingTypes, setToastInfo }) => {
    return (
        <div className="space-y-12">
            <SectionHeader title="Gestion des Listes" description="Personnalisez les options pour certaines catégories." />
            <ListManager title="Magasins (Courses)" list={groceryStores} setList={setGroceryStores} itemNoun="magasin" setToastInfo={setToastInfo} />
            <ListManager title="Véhicules (Carburant)" list={cars} setList={setCars} itemNoun="véhicule" setToastInfo={setToastInfo} />
            <ListManager title="Types de Chauffage" list={heatingTypes} setList={setHeatingTypes} itemNoun="type de chauffage" setToastInfo={setToastInfo} />
        </div>
    );
};

// --- Main Tab Component ---
interface ManagementTabProps {
    profiles: Profile[];
    loggedInUser: User;
    onAddProfile: (profile: Profile) => boolean;
    onUpdateProfilePassword: (username: string, newPassword: string) => boolean;
    onDeleteProfile: (username: string) => boolean;
    categories: Category[];
    onAddCategory: (name: string) => boolean;
    onUpdateCategory: (oldName: string, newName: string) => boolean;
    onDeleteCategory: (name: string) => void;
    groceryStores: string[];
    setGroceryStores: React.Dispatch<React.SetStateAction<string[]>>;
    cars: string[];
    setCars: React.Dispatch<React.SetStateAction<string[]>>;
    heatingTypes: string[];
    setHeatingTypes: React.Dispatch<React.SetStateAction<string[]>>;
    setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}

const ManagementTab: React.FC<ManagementTabProps> = (props) => {
    return (
        <div className="space-y-12">
            <style>{`
                .input-style {
                    display: block;
                    padding: 0.5rem 0.75rem;
                    background-color: rgb(241 245 249 / 1); /* bg-slate-100 */
                    color: rgb(30 41 59 / 1); /* text-slate-800 */
                    border-radius: 0.5rem; /* rounded-lg */
                    border: 1px solid transparent;
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                }
                .dark .input-style {
                    background-color: rgb(51 65 85 / 1); /* dark:bg-slate-700 */
                    color: rgb(241 245 249 / 1); /* dark:text-slate-100 */
                }
                .input-style:focus {
                    border-color: rgb(6 182 212 / 1); /* focus:border-cyan-500 */
                    --tw-ring-color: rgb(6 182 212 / 1); /* focus:ring-cyan-500 */
                    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                }
                .btn-primary {
                    padding: 0.5rem 1rem;
                    font-weight: 600;
                    color: white;
                    background-color: rgb(6 182 212 / 1); /* bg-cyan-600 */
                    border-radius: 0.5rem; /* rounded-lg */
                    transition: background-color 0.2s;
                }
                .btn-primary:hover {
                    background-color: rgb(8 145 178 / 1); /* hover:bg-cyan-700 */
                }
                .btn-secondary {
                    padding: 0.5rem 1rem;
                    font-weight: 600;
                    color: rgb(51 65 85 / 1); /* text-slate-700 */
                    background-color: rgb(226 232 240 / 1); /* bg-slate-200 */
                    border-radius: 0.5rem; /* rounded-lg */
                    transition: background-color 0.2s;
                }
                .dark .btn-secondary {
                    color: rgb(226 232 240 / 1); /* dark:text-slate-200 */
                    background-color: rgb(51 65 85 / 1); /* dark:bg-slate-700 */
                }
                .btn-secondary:hover {
                    background-color: rgb(203 213 225 / 1); /* hover:bg-slate-300 */
                }
                 .dark .btn-secondary:hover {
                    background-color: rgb(71 85 105 / 1); /* dark:hover:bg-slate-600 */
                }
                .btn-danger {
                     padding: 0.5rem 1rem;
                    font-weight: 600;
                    color: white;
                    background-color: rgb(220 38 38 / 1); /* bg-red-600 */
                    border-radius: 0.5rem; /* rounded-lg */
                    transition: background-color 0.2s;
                }
                .btn-danger:hover {
                    background-color: rgb(185 28 28 / 1); /* hover:bg-red-700 */
                }
            `}</style>
            <UserManagement {...props} />
            <CategoryManagement {...props} />
            <ListManagement 
                groceryStores={props.groceryStores}
                setGroceryStores={props.setGroceryStores}
                cars={props.cars}
                setCars={props.setCars}
                heatingTypes={props.heatingTypes}
                setHeatingTypes={props.setHeatingTypes}
                setToastInfo={props.setToastInfo}
            />
        </div>
    );
};

export default ManagementTab;