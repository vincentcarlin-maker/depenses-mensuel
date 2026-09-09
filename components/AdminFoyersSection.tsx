import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Foyer, FoyerMember, Expense, Reminder } from '../types';
import { supabase } from '../supabase/client';
import {
  DEFAULT_FOYER_ID,
  DEFAULT_FOYER,
  fetchAllFoyers,
  updateFoyer,
  deleteFoyer,
  addMemberToFoyer,
  removeMemberFromFoyer,
  updateMemberRole,
  generateFoyerCode,
  createNewFoyer,
  setStoredActiveFoyerId,
  getStoredActiveFoyerId
} from '../utils/foyerService';
import ConfirmationModal from './ConfirmationModal';

interface AdminFoyersSectionProps {
  expenses?: Expense[];
  reminders?: Reminder[];
  currentFoyer?: Foyer;
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
  onSwitchFoyer?: (foyerId: string) => void;
}

const COLOR_OPTIONS = [
  { label: 'Bleu ciel', hex: '#0ea5e9' },
  { label: 'Rose', hex: '#ec4899' },
  { label: 'Émeraude', hex: '#10b981' },
  { label: 'Violet', hex: '#8b5cf6' },
  { label: 'Orange', hex: '#f97316' },
  { label: 'Ambre', hex: '#f59e0b' },
  { label: 'Indigo', hex: '#6366f1' },
  { label: 'Gris ardoise', hex: '#64748b' },
];

export const AdminFoyersSection: React.FC<AdminFoyersSectionProps> = ({
  expenses = [],
  reminders = [],
  currentFoyer,
  setToastInfo,
  onSwitchFoyer
}) => {
  const [foyers, setFoyers] = useState<Foyer[]>([DEFAULT_FOYER]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedFoyerId, setCopiedFoyerId] = useState<string | null>(null);

  // Active Foyer Tracking
  const activeFoyerId = currentFoyer?.id || getStoredActiveFoyerId() || DEFAULT_FOYER_ID;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFoyerName, setNewFoyerName] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminColor, setNewAdminColor] = useState('#0ea5e9');
  const [customCode, setCustomCode] = useState('');

  const [editingFoyer, setEditingFoyer] = useState<Foyer | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  const [addingMemberFoyerId, setAddingMemberFoyerId] = useState<string | null>(null);
  const [memberDisplayName, setMemberDisplayName] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [memberColor, setMemberColor] = useState('#10b981');
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member');

  const [foyerToDelete, setFoyerToDelete] = useState<Foyer | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ foyerId: string; member: FoyerMember } | null>(null);

  const [isDeletingFoyer, setIsDeletingFoyer] = useState(false);

  // Load all foyers from Cloud & Local
  const loadFoyers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllFoyers();
      setFoyers(data);
    } catch (e) {
      console.error('Erreur chargement foyers:', e);
      setToastInfo({ message: 'Erreur lors du chargement des foyers.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [setToastInfo]);

  useEffect(() => {
    loadFoyers();

    // Subscribe to real-time foyer changes across channels
    const syncChannel = supabase.channel('foyer_sync_channel')
      .on('broadcast', { event: 'foyer_updated' }, () => {
        loadFoyers();
      })
      .on('broadcast', { event: 'foyer_deleted' }, () => {
        loadFoyers();
      })
      .subscribe();

    const adminChannel = supabase.channel('foyer_admin_channel')
      .on('broadcast', { event: 'foyer_updated' }, () => {
        loadFoyers();
      })
      .on('broadcast', { event: 'foyer_deleted' }, () => {
        loadFoyers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(syncChannel);
      supabase.removeChannel(adminChannel);
    };
  }, [loadFoyers]);

  // Copy code helper
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setToastInfo({ message: `Code « ${code} » copié dans le presse-papier !`, type: 'info' });
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedFoyerId(id);
    setToastInfo({ message: `Identifiant du foyer copié !`, type: 'info' });
    setTimeout(() => setCopiedFoyerId(null), 2500);
  };

  // Switch Active Foyer
  const handleSwitchFoyer = async (targetFoyer: Foyer) => {
    try {
      setStoredActiveFoyerId(targetFoyer.id);
      try {
        const raw = window.localStorage.getItem('expense-app-session-v2') || window.localStorage.getItem('expense-app-session');
        if (raw) {
          const sess = JSON.parse(raw);
          sess.foyer_id = targetFoyer.id;
          window.localStorage.setItem('expense-app-session-v2', JSON.stringify(sess));
        }
      } catch {}

      if (onSwitchFoyer) {
        onSwitchFoyer(targetFoyer.id);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }

      setToastInfo({
        message: `Foyer actif changé pour « ${targetFoyer.name} ». Les données affichées correspondent désormais à ce foyer.`,
        type: 'info'
      });
    } catch {
      setToastInfo({ message: 'Erreur lors du changement de foyer.', type: 'error' });
    }
  };

  // Create new Foyer
  const handleCreateFoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoyerName.trim()) {
      setToastInfo({ message: 'Veuillez saisir un nom pour le foyer.', type: 'error' });
      return;
    }
    if (!newAdminName.trim() || !newAdminUsername.trim()) {
      setToastInfo({ message: 'Veuillez renseigner le nom et l’identifiant du créateur.', type: 'error' });
      return;
    }

    try {
      const res = await createNewFoyer(newFoyerName.trim(), {
        name: newAdminName.trim(),
        username: newAdminUsername.toLowerCase().trim(),
        color: newAdminColor
      });

      if (res.success && res.foyer) {
        // If custom code provided and differs
        if (customCode.trim()) {
          await updateFoyer(res.foyer.id, { code: customCode.trim().toUpperCase() });
        }
        setToastInfo({ message: `Le foyer « ${newFoyerName} » a été créé avec succès !`, type: 'info' });
        setIsCreateModalOpen(false);
        setNewFoyerName('');
        setNewAdminName('');
        setNewAdminUsername('');
        setCustomCode('');
        await loadFoyers();
      } else {
        setToastInfo({ message: res.error || 'Erreur lors de la création.', type: 'error' });
      }
    } catch {
      setToastInfo({ message: 'Une erreur imprévue est survenue.', type: 'error' });
    }
  };

  // Update Foyer (Rename / Change Code)
  const handleUpdateFoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFoyer) return;

    if (!editName.trim()) {
      setToastInfo({ message: 'Le nom du foyer ne peut pas être vide.', type: 'error' });
      return;
    }
    if (!editCode.trim()) {
      setToastInfo({ message: 'Le code d’invitation ne peut pas être vide.', type: 'error' });
      return;
    }

    try {
      const res = await updateFoyer(editingFoyer.id, {
        name: editName.trim(),
        code: editCode.toUpperCase().trim()
      });

      if (res.success) {
        setToastInfo({ message: `Le foyer a été mis à jour avec succès !`, type: 'info' });
        setEditingFoyer(null);
        await loadFoyers();
      } else {
        setToastInfo({ message: res.error || 'Erreur lors de la mise à jour.', type: 'error' });
      }
    } catch {
      setToastInfo({ message: 'Erreur lors de la mise à jour.', type: 'error' });
    }
  };

  // Regenerate Code
  const handleRegenerateCode = async (foyer: Foyer) => {
    const freshCode = generateFoyerCode(foyer.name);
    const res = await updateFoyer(foyer.id, { code: freshCode });
    if (res.success) {
      setToastInfo({ message: `Nouveau code généré : « ${freshCode} » !`, type: 'info' });
      await loadFoyers();
    } else {
      setToastInfo({ message: 'Erreur lors de la génération du code.', type: 'error' });
    }
  };

  // Delete Foyer
  const handleConfirmDeleteFoyer = async () => {
    if (!foyerToDelete || isDeletingFoyer) return;
    setIsDeletingFoyer(true);
    try {
      const res = await deleteFoyer(foyerToDelete.id);
      if (res.success) {
        setToastInfo({ message: `Le foyer « ${foyerToDelete.name} » et tous ses utilisateurs rattachés ont été définitivement supprimés.`, type: 'info' });
        setFoyerToDelete(null);
        await loadFoyers();
      } else {
        setToastInfo({ message: res.error || 'Impossible de supprimer ce foyer.', type: 'error' });
      }
    } catch {
      setToastInfo({ message: 'Erreur lors de la suppression.', type: 'error' });
    } finally {
      setIsDeletingFoyer(false);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingMemberFoyerId) return;

    if (!memberDisplayName.trim() || !memberUsername.trim()) {
      setToastInfo({ message: 'Veuillez saisir le nom et l’identifiant du membre.', type: 'error' });
      return;
    }

    try {
      const res = await addMemberToFoyer(addingMemberFoyerId, {
        name: memberDisplayName.trim(),
        username: memberUsername.toLowerCase().trim(),
        color: memberColor,
        role: memberRole
      });

      if (res.success) {
        setToastInfo({ message: `Membre « ${memberDisplayName} » ajouté avec succès !`, type: 'info' });
        setAddingMemberFoyerId(null);
        setMemberDisplayName('');
        setMemberUsername('');
        await loadFoyers();
      } else {
        setToastInfo({ message: res.error || 'Erreur lors de l’ajout du membre.', type: 'error' });
      }
    } catch {
      setToastInfo({ message: 'Erreur lors de l’ajout du membre.', type: 'error' });
    }
  };

  // Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      const res = await removeMemberFromFoyer(memberToRemove.foyerId, memberToRemove.member.username);
      if (res.success) {
        setToastInfo({ message: `Membre « ${memberToRemove.member.name} » retiré du foyer.`, type: 'info' });
        setMemberToRemove(null);
        await loadFoyers();
      } else {
        setToastInfo({ message: res.error || 'Impossible de retirer ce membre.', type: 'error' });
      }
    } catch {
      setToastInfo({ message: 'Erreur lors du retrait du membre.', type: 'error' });
    }
  };

  // Toggle Member Role
  const handleToggleMemberRole = async (foyerId: string, member: FoyerMember) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    try {
      const res = await updateMemberRole(foyerId, member.username, newRole);
      if (res.success) {
        setToastInfo({
          message: `Le rôle de ${member.name} a été changé en « ${newRole === 'admin' ? 'Administrateur' : 'Membre'} ».`,
          type: 'info'
        });
        await loadFoyers();
      } else {
        setToastInfo({ message: res.error || 'Erreur lors du changement de rôle.', type: 'error' });
      }
    } catch {
      setToastInfo({ message: 'Erreur lors de la mise à jour du rôle.', type: 'error' });
    }
  };

  // Compute stats per foyer
  const foyerStats = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number; reminderCount: number }> = {};
    for (const f of foyers) {
      const isDef = f.id === DEFAULT_FOYER_ID;
      const fExpenses = expenses.filter(e => {
        if (isDef) return !e.foyer_id || e.foyer_id === DEFAULT_FOYER_ID;
        return e.foyer_id === f.id;
      });
      const fReminders = reminders.filter(r => {
        if (isDef) return !r.foyer_id || r.foyer_id === DEFAULT_FOYER_ID;
        return r.foyer_id === f.id;
      });
      const total = fExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      map[f.id] = {
        count: fExpenses.length,
        totalAmount: total,
        reminderCount: fReminders.length
      };
    }
    return map;
  }, [foyers, expenses, reminders]);

  // Filtered Foyers
  const filteredFoyers = useMemo(() => {
    if (!searchQuery.trim()) return foyers;
    const q = searchQuery.toLowerCase().trim();
    return foyers.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q) ||
      f.members.some(m => m.name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q))
    );
  }, [foyers, searchQuery]);

  // Overall counts
  const totalMembersCount = useMemo(() => {
    return foyers.reduce((acc, curr) => acc + (curr.members?.length || 0), 0);
  }, [foyers]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight flex items-center gap-2">
              <span>Administration des foyers</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                {foyers.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
              Superviser, configurer les codes d’invitation et administrer les foyers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={loadFoyers}
            disabled={isLoading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Actualiser la liste des foyers"
          >
            <span className={isLoading ? 'animate-spin inline-block' : ''}>🔄</span>
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewFoyerName('');
              setNewAdminName('');
              setNewAdminUsername('');
              setCustomCode('');
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
          >
            <span>➕</span>
            <span>Nouveau foyer</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
        <div className="text-center sm:text-left">
          <p className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400 uppercase tracking-wider">
            Foyers
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-amber-900 dark:text-amber-200">
            {foyers.length}
          </p>
        </div>

        <div className="text-center sm:text-left border-x border-amber-200/60 dark:border-amber-900/40 px-2 sm:px-4">
          <p className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400 uppercase tracking-wider">
            Membres
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-amber-900 dark:text-amber-200">
            {totalMembersCount}
          </p>
        </div>

        <div className="text-center sm:text-left">
          <p className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400 uppercase tracking-wider">
            Foyer actif
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-200 truncate mt-0.5">
            {currentFoyer?.name || 'Foyer Vincent & Sophie'}
          </p>
        </div>
      </div>

      {/* Search Input */}
      {foyers.length > 2 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un foyer par nom, code ou membre..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Foyers List */}
      <div className="space-y-4 pt-1">
        {filteredFoyers.map((f) => {
          const isDefault = f.id === DEFAULT_FOYER_ID;
          const isActive = f.id === activeFoyerId;
          const stats = foyerStats[f.id] || { count: 0, totalAmount: 0, reminderCount: 0 };
          const formattedDate = f.created_at
            ? new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Origine';

          return (
            <div
              key={f.id}
              className={`rounded-2xl border transition-all p-4 sm:p-5 space-y-3.5 ${
                isActive
                  ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-amber-950/20 border-amber-300 dark:border-amber-700 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-700/20 border-slate-200/80 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Card Top: Name, Badges & Global Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-snug">
                      {f.name}
                    </h4>

                    {isDefault && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        ⭐ Foyer Principal
                      </span>
                    )}

                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Actif
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchFoyer(f)}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        title="Basculer sur ce foyer pour afficher et tester ses dépenses"
                      >
                        Basculer ici
                      </button>
                    )}
                  </div>

                  {/* ID & Date */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 flex-wrap">
                    <span>Créé le {formattedDate}</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => copyId(f.id)}
                      className="font-mono text-[11px] hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                      title="Copier l'ID unique"
                    >
                      <span>ID: {f.id.length > 22 ? `${f.id.substring(0, 20)}…` : f.id}</span>
                      <span>{copiedFoyerId === f.id ? '✓' : '📋'}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Card Buttons */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFoyer(f);
                      setEditName(f.name);
                      setEditCode(f.code);
                    }}
                    className="p-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Modifier le nom ou le code du foyer"
                  >
                    <span>✏️</span>
                    <span>Modifier</span>
                  </button>

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => setFoyerToDelete(f)}
                      className="p-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      title="Supprimer ce foyer"
                    >
                      <span>🗑️</span>
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Code Bar & Metrics Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                {/* Code d'invitation */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                    Code d’invitation :
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 tracking-wider">
                      {f.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(f.code, f.id)}
                      className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copier le code pour le partenaire"
                    >
                      <span>{copiedCodeId === f.id ? '✅ Copié !' : '📋 Copier'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRegenerateCode(f)}
                      className="p-1 px-2 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold cursor-pointer transition-colors"
                      title="Régénérer un nouveau code d'invitation aléatoire"
                    >
                      🔄 Changer
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 flex-wrap">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white mr-1">{stats.count}</span>
                    <span>dépense(s)</span>
                    {stats.totalAmount > 0 && (
                      <span className="ml-1 text-slate-400">
                        ({stats.totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white mr-1">{stats.reminderCount}</span>
                    <span>rappel(s)</span>
                  </div>
                </div>
              </div>

              {/* Members Section */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👥</span>
                    <span>Membres du foyer ({f.members?.length || 0})</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setAddingMemberFoyerId(f.id);
                      setMemberDisplayName('');
                      setMemberUsername('');
                      setMemberRole('member');
                      setMemberColor('#10b981');
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <span>➕ Ajouter un membre</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {f.members?.map((m, mIdx) => {
                    const isAdmin = m.role === 'admin';
                    const canDeleteMember = (f.members?.length || 0) > 1;

                    return (
                      <div
                        key={`${f.id}-${m.username}-${m.id || mIdx}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl font-black text-xs text-white flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: m.color || '#0ea5e9' }}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {m.name}
                              </p>
                              <span
                                className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                  isAdmin
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {isAdmin ? 'Admin' : 'Membre'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                              @{m.username}
                            </p>
                          </div>
                        </div>

                        {/* Member Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleMemberRole(f.id, m)}
                            className="p-1 px-1.5 rounded-lg text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title={isAdmin ? 'Rétrograder en membre' : 'Promouvoir en administrateur'}
                          >
                            {isAdmin ? '👤 Rétrograder' : '👑 Promouvoir'}
                          </button>

                          {canDeleteMember && (
                            <button
                              type="button"
                              onClick={() => setMemberToRemove({ foyerId: f.id, member: m })}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                              title="Retirer ce membre du foyer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {filteredFoyers.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
            Aucun foyer ne correspond à votre recherche.
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: NOUVEAU FOYER                                     */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>➕</span>
                <span>Créer un nouveau foyer</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFoyer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom du foyer *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Foyer Martin & Léa"
                  value={newFoyerName}
                  onChange={(e) => setNewFoyerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom du créateur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Martin"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Identifiant / Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: martin"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Code d’invitation personnalisé (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: MAR-789 (laisser vide pour auto)"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Couleur du profil créateur
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewAdminColor(c.hex)}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                        newAdminColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold">✨ Initialisation automatique :</p>
                <p>Ce nouveau foyer sera automatiquement initialisé avec les 3 catégories standards : <strong>Dépenses récurrentes</strong>, <strong>Courses</strong> et <strong>Carburant</strong>.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-xs cursor-pointer"
                >
                  Créer le foyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MODIFIER UN FOYER                                  */}
      {/* ========================================================= */}
      {editingFoyer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>✏️</span>
                <span>Modifier le foyer</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingFoyer(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateFoyer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom du foyer *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Code d’invitation *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setEditCode(generateFoyerCode(editName))}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold shrink-0 cursor-pointer"
                    title="Générer un nouveau code aléatoire"
                  >
                    🔄 Auto
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFoyer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-xs cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AJOUTER UN MEMBRE                                  */}
      {/* ========================================================= */}
      {addingMemberFoyerId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>👥</span>
                <span>Ajouter un membre au foyer</span>
              </h3>
              <button
                type="button"
                onClick={() => setAddingMemberFoyerId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom affiché *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Julie"
                  value={memberDisplayName}
                  onChange={(e) => setMemberDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Identifiant / Login (unique) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: julie"
                  value={memberUsername}
                  onChange={(e) => setMemberUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rôle dans le foyer
                </label>
                <div className="flex items-center gap-3 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      checked={memberRole === 'member'}
                      onChange={() => setMemberRole('member')}
                      className="text-indigo-600"
                    />
                    <span>Membre standard</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={memberRole === 'admin'}
                      onChange={() => setMemberRole('admin')}
                      className="text-indigo-600"
                    />
                    <span>Administrateur</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Couleur du badge
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setMemberColor(c.hex)}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                        memberColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddingMemberFoyerId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-xs cursor-pointer"
                >
                  Ajouter le membre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Supprimer Foyer */}
      <ConfirmationModal
        isOpen={!!foyerToDelete}
        onClose={() => setFoyerToDelete(null)}
        onConfirm={handleConfirmDeleteFoyer}
        title="Supprimer définitivement ce foyer et ses utilisateurs ?"
        message={
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              Êtes-vous certain de vouloir supprimer le foyer <strong>« {foyerToDelete?.name} »</strong> (Code: {foyerToDelete?.code}) ?
            </p>
            <p className="text-rose-600 dark:text-rose-400 font-bold">
              Attention : Cette opération est irréversible. Tous les utilisateurs et comptes rattachés à ce foyer ainsi que leurs dépenses, rappels et données seront définitivement supprimés.
            </p>
          </div>
        }
      />

      {/* Confirmation Retirer Membre */}
      <ConfirmationModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemoveMember}
        title="Retirer ce membre du foyer ?"
        message={
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Confirmez-vous le retrait de <strong>« {memberToRemove?.member.name} »</strong> (@{memberToRemove?.member.username}) de ce foyer ?
          </p>
        }
      />
    </div>
  );
};

export default AdminFoyersSection;
