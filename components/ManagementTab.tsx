
import React, { useState } from 'react';
import { User, type Category, type Expense, type CustomCategoryIcon } from '../types';
import { type Profile, type LoginEvent } from '../hooks/useAuth';
import ConfirmationModal from './ConfirmationModal';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import SupabaseInstructionsModal from './SupabaseInstructionsModal';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import DataAndBackupTab from './DataAndBackupTab';
import { CategoryEditModal } from './CategoryEditModal';
import { useCategoryVisuals, resolveCategoryVisual } from '../hooks/useCategoryVisuals';

// --- Section Header Component ---
const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
);

// --- Database Management ---
const DatabaseManagement: React.FC = () => {
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

    return (
        <div className="space-y-6">
            <SectionHeader title="Base de Données" description="Configuration et maintenance de la base de données Supabase." />
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Configuration SQL</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Créer ou mettre à jour les tables (Cagnotte, etc.)</p>
                </div>
                <button 
                    onClick={() => setIsInstructionsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
                >
                    <WrenchScrewdriverIcon />
                    <span>Afficher les instructions</span>
                </button>
            </div>
            <SupabaseInstructionsModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />
        </div>
    );
};

// --- Helper for French date format matching screenshot (e.g., 5 sept. à 23:58) ---
const formatDateFrench = (timestamp: string) => {
    try {
        const d = new Date(timestamp);
        const day = d.getDate();
        const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
        const month = months[d.getMonth()];
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${month} à ${hours}:${minutes}`;
    } catch {
        return timestamp;
    }
};

// --- History Management ---
const HistoryManagement: React.FC<{ loginHistory: LoginEvent[] }> = ({ loginHistory }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                            Historique des connexions
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            30 derniers jours
                        </p>
                    </div>
                </div>
                {/* Right decorative mini bars */}
                <div className="flex items-end gap-1 shrink-0 opacity-80">
                    <div className="w-1.5 h-3.5 bg-pink-200 dark:bg-pink-900/60 rounded-full" />
                    <div className="w-1.5 h-6 bg-cyan-200 dark:bg-cyan-900/60 rounded-full" />
                    <div className="w-1.5 h-4.5 bg-emerald-200 dark:bg-emerald-900/60 rounded-full" />
                </div>
            </div>
            
            {loginHistory.length === 0 ? (
                <div className="text-center py-5 bg-slate-50/60 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Aucun historique disponible pour le moment.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100/80 dark:divide-slate-700/50 pt-1">
                    {loginHistory.slice(0, 8).map((event, index) => {
                        const isSophie = event.user === User.Sophie;
                        const dotColor = isSophie ? 'bg-[#f43f5e]' : 'bg-[#0ea5e9]';
                        const formattedDate = formatDateFrench(event.timestamp);

                        return (
                            <div key={index} className="flex items-center justify-between py-2.5 sm:py-3 first:pt-1 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`} />
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                                        {event.user}
                                    </span>
                                </div>
                                <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">
                                    {formattedDate}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Data Management ---
const DataManagement: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
    const handleExportCSV = () => {
        const headers = ['Date', 'Utilisateur', 'Catégorie', 'Description', 'Montant'];
        const rows = expenses.map(e => [
            new Date(e.date).toLocaleDateString('fr-FR'),
            e.user,
            e.category,
            `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
            e.amount.toString().replace('.', ',') // French format
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(r => r.join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `depenses_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
             <SectionHeader title="Données" description="Exportez vos données pour les utiliser ailleurs." />
             <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Exporter les dépenses</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Format CSV (Excel, Numbers...)</p>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
                >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span>Télécharger</span>
                </button>
             </div>
        </div>
    );
}

// --- User Management ---
const UserManagement: React.FC<{
    profiles: Profile[];
    loggedInUser: User;
    onAddProfile: (profile: Profile) => boolean;
    onUpdateProfilePassword: (username: string, newPassword: string) => boolean;
    onDeleteProfile: (username: string) => boolean;
}> = ({ profiles, onAddProfile, onUpdateProfilePassword, onDeleteProfile }) => {
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
            setError(`L'utilisateur « ${newUsername} » existe déjà.`);
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
        <div className="space-y-5 sm:space-y-6">
            {/* Card 1: Gestion des utilisateurs */}
            <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#3b82f6] dark:text-blue-400 shrink-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                                Gestion des utilisateurs
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Ajouter, modifier ou supprimer des profils.
                            </p>
                        </div>
                    </div>
                    {/* Cute overlapping user avatars badge */}
                    <div className="flex -space-x-1.5 opacity-80">
                        <div className="w-5 h-5 rounded-full bg-pink-200 dark:bg-pink-900/60 border-2 border-white dark:border-slate-800" />
                        <div className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-900/60 border-2 border-white dark:border-slate-800" />
                    </div>
                </div>

                <div className="space-y-2.5 pt-1">
                    {profiles.map(p => {
                        const isSophie = p.user === User.Sophie;
                        const avatarBg = isSophie 
                            ? 'bg-[#fce7f3] dark:bg-pink-950/70 text-[#ec4899] dark:text-pink-300' 
                            : 'bg-[#e0f2fe] dark:bg-sky-950/70 text-[#0284c7] dark:text-sky-300';
                        const initial = (p.username.charAt(0) || (isSophie ? 'S' : 'V')).toUpperCase();

                        return (
                            <div key={p.username} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className={`w-10 h-10 rounded-full ${avatarBg} font-extrabold flex items-center justify-center text-sm shrink-0`}>
                                        {initial}
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                        {p.username} ({p.user})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                        type="button"
                                        onClick={() => { setEditingUser(p); setEditingPassword(''); }} 
                                        className="w-10 h-10 rounded-xl bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-100/60 dark:border-blue-800/40 flex items-center justify-center text-[#2563eb] dark:text-blue-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                        title={`Modifier le mot de passe de ${p.username}`}
                                        aria-label={`Modifier le mot de passe de ${p.username}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setDeletingUser(p)} 
                                        className="w-10 h-10 rounded-xl bg-[#fee2e2] dark:bg-rose-950/60 hover:bg-[#fecaca] dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-[#ef4444] dark:text-rose-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                        title={`Supprimer le profil ${p.username}`}
                                        aria-label={`Supprimer le profil ${p.username}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Card 2: Ajouter un utilisateur */}
            <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <svg className="w-6 h-6 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                                Ajouter un utilisateur
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Créez un nouveau profil pour DuoBudget.
                            </p>
                        </div>
                    </div>
                    {/* Cute pastel dots on top right */}
                    <div className="flex gap-1 opacity-80">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-200 dark:bg-cyan-900/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-200 dark:bg-purple-900/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-200 dark:bg-pink-900/60" />
                    </div>
                </div>

                <form onSubmit={handleAddUser} className="space-y-3 pt-1">
                    {/* Input 1: Username */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Nom d'utilisateur" 
                            value={newUsername} 
                            onChange={e => setNewUsername(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" 
                        />
                    </div>

                    {/* Input 2: Password */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input 
                            type={isPasswordVisible ? "text" : "password"} 
                            placeholder="Mot de passe" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" 
                        />
                        <button 
                            type="button" 
                            onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        >
                            {isPasswordVisible ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Input 3: Select Sophie / Vincent */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <select 
                            value={selectedUser} 
                            onChange={e => setSelectedUser(e.target.value as User)} 
                            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none transition-all cursor-pointer"
                        >
                            {Object.values(User).map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {error && <p className="text-xs text-rose-500 font-bold px-1">{error}</p>}

                    {/* Submit button: Vibrant cyan button matching screenshot */}
                    <button 
                        type="submit" 
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#00c5eb] hover:bg-[#00b4d8] active:bg-[#0096c7] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer mt-2"
                    >
                        <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center font-extrabold text-xs">
                            +
                        </div>
                        <span>Ajouter</span>
                    </button>
                </form>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4 border border-slate-100 dark:border-slate-700">
                        <div className="space-y-1">
                            <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Modifier le mot de passe</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Pour le compte de « {editingUser.username} ».</p>
                        </div>
                        <input 
                            type="password" 
                            placeholder="Nouveau mot de passe" 
                            value={editingPassword} 
                            onChange={e => setEditingPassword(e.target.value)} 
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button 
                                type="button"
                                onClick={() => setEditingUser(null)} 
                                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                type="button"
                                onClick={handleUpdatePassword} 
                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#00c5eb] hover:bg-[#00b4d8] text-white shadow-xs transition-colors"
                            >
                                Enregistrer
                            </button>
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
                message={`Êtes-vous sûr de vouloir supprimer l'utilisateur « ${deletingUser?.username} » ? Cette action est irréversible.`}
            />
        </div>
    );
};

const formatCategoryDisplayName = (cat: string) => {
    const norm = cat.toLowerCase().trim();
    if (norm.includes('obligatoire') || norm.includes('dépenses récurrentes') || norm.includes('depenses recurrentes') || norm.includes('dép. recurentes')) {
        return 'Dép. récurrentes';
    }
    return cat;
};

// --- Category Management ---
const CategoryManagement: React.FC<{
    categories: Category[];
    onAddCategory: (name: string) => boolean;
    onUpdateCategory: (oldName: string, newName: string) => boolean;
    onDeleteCategory: (name: string) => void;
}> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const { customIcons, saveCategoryIconMapping } = useCategoryVisuals();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (cat: Category) => {
        setEditingCategory(cat);
    };

    const handleSaveAdd = (newName: string, iconId: string, color: string) => {
        if (onAddCategory(newName)) {
            saveCategoryIconMapping(newName, iconId, color);
            setIsAddModalOpen(false);
        }
    };

    const handleSaveEdit = (newName: string, iconId: string, color: string) => {
        if (editingCategory) {
            if (onUpdateCategory(editingCategory, newName)) {
                saveCategoryIconMapping(newName, iconId, color);
                setEditingCategory(null);
            }
        }
    };

    const handleDeleteCategory = () => {
        if (deletingCategory) {
            onDeleteCategory(deletingCategory);
            setDeletingCategory(null);
        }
    };

    // Resolve initial icon & color for edit modal so real icon is displayed
    const resolveEditInitialVisual = (categoryName: string) => {
        const mapping = customIcons.find(ci => ci.category?.toLowerCase() === categoryName.toLowerCase());
        if (mapping) {
            return {
                iconId: mapping.name,
                color: mapping.color || 'bg-[#3b82f6]'
            };
        }
        const norm = categoryName.toLowerCase().trim();
        if (norm.includes('obligatoire') || norm.includes('dépenses récurrentes') || norm.includes('depenses recurrentes') || norm.includes('dép. recurentes') || norm.includes('dép. récurrentes')) {
            return { iconId: 'mandatory', color: 'bg-[#3b82f6]' };
        }
        if (norm.includes('essence') || norm.includes('gasoil') || norm.includes('carburant') || norm.includes('diesel')) {
            return { iconId: 'fuel', color: 'bg-[#f97316]' };
        }
        if (norm.includes('course') || norm.includes('supermarch') || norm.includes('hyper')) {
            return { iconId: 'groceries', color: 'bg-[#3b82f6]' };
        }
        if (norm.includes('restaurant') || norm.includes('resto') || norm.includes('bar') || norm.includes('brasserie')) {
            return { iconId: 'restaurant', color: 'bg-[#a855f7]' };
        }
        if (norm.includes('chauffage') || norm.includes('bois') || norm.includes('gaz') || norm.includes('pellet') || norm.includes('fioul')) {
            return { iconId: 'heating', color: 'bg-[#10b981]' };
        }
        if (norm.includes('voiture') || norm.includes('garage') || norm.includes('auto') || norm.includes('reparation') || norm.includes('réparation')) {
            return { iconId: 'carrepairs', color: 'bg-[#0ea5e9]' };
        }
        if (norm.includes('vacance') || norm.includes('voyage') || norm.includes('hotel') || norm.includes('hôtel')) {
            return { iconId: 'vacation', color: 'bg-[#10b981]' };
        }
        if (norm.includes('vêtement') || norm.includes('vetement') || norm.includes('habit') || norm.includes('mode')) {
            return { iconId: 'clothing', color: 'bg-[#ec4899]' };
        }
        if (norm.includes('cadeau') || norm.includes('anniversaire') || norm.includes('fête')) {
            return { iconId: 'gift', color: 'bg-[#ec4899]' };
        }
        if (norm.includes('complément') || norm.includes('complement') || norm.includes('santé') || norm.includes('pharmacie') || norm.includes('pill')) {
            return { iconId: 'pill', color: 'bg-[#10b981]' };
        }
        if (norm.includes('sfr')) return { iconId: 'sfr', color: 'bg-[#ef4444]' };
        if (norm.includes('netflix')) return { iconId: 'streaming', color: 'bg-black' };
        if (norm.includes('total')) return { iconId: 'energy', color: 'bg-[#f59e0b]' };
        if (norm.includes('deezer') || norm.includes('musique') || norm.includes('spotify')) return { iconId: 'music', color: 'bg-[#a855f7]' };
        if (norm.includes('poubelle') || norm.includes('dechet')) return { iconId: 'trash', color: 'bg-[#ef4444]' };
        if (norm.includes('wifi') || norm.includes('internet')) return { iconId: 'wifi', color: 'bg-[#6366f1]' };
        if (norm.includes('téléphone') || norm.includes('mobile')) return { iconId: 'phone', color: 'bg-[#0ea5e9]' };
        if (norm.includes('eau') || norm.includes('ceo')) return { iconId: 'water', color: 'bg-[#0ea5e9]' };
        if (norm.includes('assurance')) return { iconId: 'shield', color: 'bg-[#10b981]' };

        return { iconId: 'misc', color: 'bg-[#3b82f6]' };
    };

    const initialEditVisual = editingCategory ? resolveEditInitialVisual(editingCategory) : { iconId: 'misc', color: 'bg-[#3b82f6]' };

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Header with Title, Subtitle, and Decorative Sparkles */}
            <div className="flex items-start justify-between relative pt-1 pb-1">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Gestion des catégories
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                        Personnalisez vos catégories de dépenses.
                    </p>
                </div>

                {/* Decorative festive rays in top right matching mockup */}
                <div className="relative w-10 h-10 shrink-0 pointer-events-none select-none opacity-85">
                    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <path d="M12 28L6 34" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
                        <path d="M22 18L18 8" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" />
                        <path d="M34 22L42 16" stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M38 34L46 38" stroke="#FDA4AF" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* Primary Action Button: + Ajouter une catégorie */}
            <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
                <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Ajouter une catégorie</span>
            </button>

            {/* List of Category Cards */}
            <div className="space-y-2.5 sm:space-y-3 pt-1">
                {categories.map(c => {
                    const visual = resolveCategoryVisual(c, customIcons);
                    const displayName = formatCategoryDisplayName(c);
                    const VisualIcon = visual.icon;

                    return (
                        <div 
                            key={c} 
                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/90 dark:border-slate-700/60 shadow-2xs p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all hover:shadow-xs"
                        >
                            {/* Left: Icon badge + Label & Subtitle */}
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${visual.badgeBg} ${visual.textColor} transition-colors shadow-2xs`}>
                                    <VisualIcon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                        {displayName}
                                    </h4>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                        Visible dans les dépenses
                                    </p>
                                </div>
                            </div>

                            {/* Right: Edit & Delete Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    type="button"
                                    onClick={() => handleOpenEditModal(c)} 
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer shadow-2xs"
                                    title={`Modifier la catégorie ${c}`}
                                    aria-label={`Modifier la catégorie ${c}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setDeletingCategory(c)} 
                                    className="w-10 h-10 rounded-xl bg-[#fee2e2] dark:bg-rose-950/60 hover:bg-[#fecaca] dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-[#ef4444] dark:text-rose-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                    title={`Supprimer la catégorie ${c}`}
                                    aria-label={`Supprimer la catégorie ${c}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Category Modal (Modal matching user specification & IMG_3186) */}
            <CategoryEditModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveAdd}
                isCreateMode={true}
            />

            {/* Edit Category Modal (Modal matching user specification & IMG_3186) */}
            {editingCategory && (
                <CategoryEditModal
                    isOpen={!!editingCategory}
                    onClose={() => setEditingCategory(null)}
                    categoryName={editingCategory}
                    initialIconId={initialEditVisual.iconId}
                    initialColor={initialEditVisual.color}
                    onSave={handleSaveEdit}
                    isCreateMode={false}
                />
            )}
            
            {/* Delete Confirmation Modal */}
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

// --- List Manager (Generic) ---
interface ListManagerProps {
    title: string;
    description: string;
    list: string[];
    setList: React.Dispatch<React.SetStateAction<string[]>>;
    itemNoun: string;
    iconType: 'store' | 'car' | 'heating';
    setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}

const getListIcon = (iconType: 'store' | 'car' | 'heating') => {
    if (iconType === 'store') {
        return {
            bg: 'bg-[#dbeafe] dark:bg-sky-950/70',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0284c7] dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
            )
        };
    }
    if (iconType === 'car') {
        return {
            bg: 'bg-[#e0f2fe] dark:bg-cyan-950/70',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0891b2] dark:text-cyan-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                </svg>
            )
        };
    }
    return {
        bg: 'bg-[#fef3c7] dark:bg-amber-950/70',
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#d97706] dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
            </svg>
        )
    };
};

const ListManager: React.FC<ListManagerProps> = ({ title, description, list, setList, itemNoun, iconType, setToastInfo }) => {
    const [newItem, setNewItem] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addError, setAddError] = useState('');
    const [editingItem, setEditingItem] = useState<{ old: string; new: string } | null>(null);
    const [deletingItem, setDeletingItem] = useState<string | null>(null);

    const { bg, icon } = getListIcon(iconType);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedItem = newItem.trim();
        if (!trimmedItem) {
            setAddError(`Le nom du ${itemNoun} est requis.`);
            return;
        }
        if (list.find(i => i.toLowerCase() === trimmedItem.toLowerCase())) {
            setAddError(`« ${trimmedItem} » existe déjà.`);
            return;
        }
        setList(prev => [...prev, trimmedItem]);
        setNewItem('');
        setAddError('');
        setIsAddModalOpen(false);
        setToastInfo({ message: `${itemNoun.charAt(0).toUpperCase() + itemNoun.slice(1)} « ${trimmedItem} » ajouté.`, type: 'info' });
    };

    const handleUpdateItem = () => {
        if (!editingItem) return;
        const trimmedNewName = editingItem.new.trim();
        if (!trimmedNewName || trimmedNewName === editingItem.old) {
            setEditingItem(null);
            return;
        }
        if (list.find(i => i.toLowerCase() === trimmedNewName.toLowerCase() && i.toLowerCase() !== editingItem.old.toLowerCase())) {
            setToastInfo({ message: `Cet élément existe déjà.`, type: 'error' });
            return;
        }
        setList(prev => prev.map(i => i === editingItem.old ? trimmedNewName : i));
        setEditingItem(null);
        setToastInfo({ message: `Modifié en « ${trimmedNewName} ».`, type: 'info' });
    };

    const handleDeleteItem = () => {
        if (deletingItem) {
            if (list.length <= 1) {
                 setToastInfo({ message: `Vous devez conserver au moins un ${itemNoun}.`, type: 'error' });
                 setDeletingItem(null);
                 return;
            }
            setList(prev => prev.filter(i => i !== deletingItem));
            setToastInfo({ message: `« ${deletingItem} » supprimé.`, type: 'info' });
            setDeletingItem(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {description} ({list.length})
                    </p>
                </div>
            </div>

            {/* Main Add Button */}
            <button
                type="button"
                onClick={() => {
                    setNewItem('');
                    setAddError('');
                    setIsAddModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#4f83f8] hover:bg-[#3b72ea] active:bg-[#2d63dc] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
                <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Ajouter un {itemNoun}</span>
            </button>

            {/* List Cards */}
            <div className="space-y-2.5 sm:space-y-3 pt-1">
                {list.map(item => (
                    <div 
                        key={item} 
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/90 dark:border-slate-700/60 shadow-2xs p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all hover:shadow-xs"
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            {/* Icon Badge */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bg}`}>
                                {icon}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                    {item}
                                </h4>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                                    Option disponible dans les dépenses
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons: Pencil & Trash */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button 
                                type="button"
                                onClick={() => setEditingItem({ old: item, new: item })} 
                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer shadow-2xs"
                                title={`Modifier ${item}`}
                                aria-label={`Modifier ${item}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setDeletingItem(item)} 
                                className="w-10 h-10 rounded-xl bg-[#fee2e2] dark:bg-rose-950/60 hover:bg-[#fecaca] dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-[#ef4444] dark:text-rose-400 transition-all active:scale-95 cursor-pointer shadow-2xs"
                                title={`Supprimer ${item}`}
                                aria-label={`Supprimer ${item}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4 border border-slate-100 dark:border-slate-700">
                        <div className="space-y-1">
                            <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Ajouter un {itemNoun}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Entrez le nom du nouveau {itemNoun}.</p>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <input 
                                type="text" 
                                placeholder={`Nom du ${itemNoun}`} 
                                value={newItem} 
                                onChange={e => setNewItem(e.target.value)} 
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                autoFocus
                            />
                            {addError && <p className="text-xs text-rose-500 font-bold">{addError}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => { setIsAddModalOpen(false); setAddError(''); }} 
                                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#4f83f8] hover:bg-[#3b72ea] text-white shadow-xs transition-colors"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4 border border-slate-100 dark:border-slate-700">
                        <div className="space-y-1">
                            <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Modifier {itemNoun}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Renommer « {editingItem.old} ».</p>
                        </div>
                        <input 
                            type="text" 
                            value={editingItem.new} 
                            onChange={e => setEditingItem({ ...editingItem, new: e.target.value })} 
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setEditingItem(null)} 
                                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                type="button" 
                                onClick={handleUpdateItem} 
                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#4f83f8] hover:bg-[#3b72ea] text-white shadow-xs transition-colors"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleDeleteItem}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer « ${deletingItem} » ?`}
            />
        </div>
    );
};

// --- List Management Section ---
interface ListManagementProps {
    groceryStores: string[];
    setGroceryStores: React.Dispatch<React.SetStateAction<string[]>>;
    cars: string[];
    setCars: React.Dispatch<React.SetStateAction<string[]>>;
    heatingTypes: string[];
    setHeatingTypes: React.Dispatch<React.SetStateAction<string[]>>;
    setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}

const ListManagement: React.FC<ListManagementProps> = ({
    groceryStores,
    setGroceryStores,
    cars,
    setCars,
    heatingTypes,
    setHeatingTypes,
    setToastInfo,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'stores' | 'cars' | 'heating'>('stores');

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Header matching category header style */}
            <div className="flex items-start justify-between relative pt-1 pb-1">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Contenu des listes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                        Personnalisez les options disponibles pour vos dépenses.
                    </p>
                </div>
                {/* Festive rays decorative header */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <div className="text-2xl select-none">📋</div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute -top-1 -right-1 animate-ping" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-1 -left-1" />
                    </div>
                </div>
            </div>

            {/* List selector pill tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-700/60 rounded-2xl">
                <button
                    type="button"
                    onClick={() => setActiveSubTab('stores')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeSubTab === 'stores'
                            ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    <span>🛒</span>
                    <span>Magasins</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold ml-0.5">
                        {groceryStores.length}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSubTab('cars')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeSubTab === 'cars'
                            ? 'bg-white dark:bg-slate-800 text-[#0891b2] dark:text-cyan-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    <span>🚗</span>
                    <span>Véhicules</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold ml-0.5">
                        {cars.length}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSubTab('heating')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeSubTab === 'heating'
                            ? 'bg-white dark:bg-slate-800 text-[#d97706] dark:text-amber-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    <span>🔥</span>
                    <span>Chauffage</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold ml-0.5">
                        {heatingTypes.length}
                    </span>
                </button>
            </div>

            {/* Active List Manager */}
            {activeSubTab === 'stores' && (
                <div className="animate-fade-in">
                    <ListManager 
                        title="Magasins & Supermarchés" 
                        description="Magasins disponibles pour les courses"
                        list={groceryStores} 
                        setList={setGroceryStores} 
                        itemNoun="magasin" 
                        iconType="store"
                        setToastInfo={setToastInfo} 
                    />
                </div>
            )}
            {activeSubTab === 'cars' && (
                <div className="animate-fade-in">
                    <ListManager 
                        title="Véhicules" 
                        description="Véhicules pour le carburant et les réparations"
                        list={cars} 
                        setList={setCars} 
                        itemNoun="véhicule" 
                        iconType="car"
                        setToastInfo={setToastInfo} 
                    />
                </div>
            )}
            {activeSubTab === 'heating' && (
                <div className="animate-fade-in">
                    <ListManager 
                        title="Types de Chauffage" 
                        description="Énergies et chauffages pour l'habitation"
                        list={heatingTypes} 
                        setList={setHeatingTypes} 
                        itemNoun="type de chauffage" 
                        iconType="heating"
                        setToastInfo={setToastInfo} 
                    />
                </div>
            )}
        </div>
    );
};

// --- Main Tab Component ---
interface ManagementTabProps {
    expenses: Expense[];
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
    loginHistory: LoginEvent[];
    focusSection?: 'all' | 'users' | 'categories' | 'lists' | 'data';
}

const ManagementTab: React.FC<ManagementTabProps> = (props) => {
    const { focusSection = 'all' } = props;

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
            {focusSection === 'data' && (
                <DataAndBackupTab 
                    expenses={props.expenses}
                    categories={props.categories}
                    groceryStores={props.groceryStores}
                    cars={props.cars}
                    heatingTypes={props.heatingTypes}
                    setToastInfo={props.setToastInfo}
                />
            )}
            {focusSection === 'all' && <DatabaseManagement />}
            {focusSection === 'users' && (
                <div className="space-y-1 pt-1 pb-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Utilisateurs
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                        Gérez les membres du compte DuoBudget
                    </p>
                </div>
            )}
            {(focusSection === 'all' || focusSection === 'users') && <HistoryManagement loginHistory={props.loginHistory} />}
            {focusSection === 'all' && <DataManagement expenses={props.expenses} />}
            {(focusSection === 'all' || focusSection === 'users') && <UserManagement {...props} />}
            {(focusSection === 'all' || focusSection === 'categories') && <CategoryManagement {...props} />}
            {(focusSection === 'all' || focusSection === 'lists' || focusSection === 'categories') && (
                <ListManagement 
                    groceryStores={props.groceryStores}
                    setGroceryStores={props.setGroceryStores}
                    cars={props.cars}
                    setCars={props.setCars}
                    heatingTypes={props.heatingTypes}
                    setHeatingTypes={props.setHeatingTypes}
                    setToastInfo={props.setToastInfo}
                />
            )}
        </div>
    );
};

export default ManagementTab;
