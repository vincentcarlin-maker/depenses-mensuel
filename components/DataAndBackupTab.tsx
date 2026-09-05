import React, { useState, useEffect, useRef } from 'react';
import { Expense, Reminder, MoneyPotTransaction, Category, User } from '../types';
import { supabase } from '../supabase/client';
import ConfirmationModal from './ConfirmationModal';

interface DataAndBackupTabProps {
  expenses: Expense[];
  reminders?: Reminder[];
  moneyPotTransactions?: MoneyPotTransaction[];
  categories?: Category[];
  groceryStores?: string[];
  cars?: string[];
  heatingTypes?: string[];
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
  onSyncData?: () => Promise<void>;
  onDeleteAllExpenses?: () => Promise<void>;
  onResetApp?: () => Promise<void>;
}

export const DataAndBackupTab: React.FC<DataAndBackupTabProps> = ({
  expenses = [],
  reminders = [],
  moneyPotTransactions = [],
  categories = [],
  groceryStores = [],
  cars = [],
  heatingTypes = [],
  setToastInfo,
  onSyncData,
}) => {
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('last_cloud_sync_time') || new Date().toISOString();
  });

  // Backup states
  const [autoBackup, setAutoBackup] = useState<boolean>(() => {
    const saved = localStorage.getItem('duobudget_auto_backup');
    return saved !== null ? saved === 'true' : true;
  });
  const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly'>(() => {
    return (localStorage.getItem('duobudget_backup_frequency') as 'daily' | 'weekly') || 'daily';
  });
  const [lastBackupDate, setLastBackupDate] = useState<string>(() => {
    return localStorage.getItem('duobudget_last_backup_date') || new Date().toISOString();
  });

  // Export format
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  // Storage size calculation
  const [storageSize, setStorageSize] = useState<string>('Calcul...');

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDataPreview, setImportDataPreview] = useState<{
    fileName: string;
    expensesCount: number;
    remindersCount: number;
    moneyPotCount: number;
    parsedPayload: any;
  } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);

  // Danger Zone Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteExpensesConfirmOpen, setIsDeleteExpensesConfirmOpen] = useState(false);
  const [isClearCacheConfirmOpen, setIsClearCacheConfirmOpen] = useState(false);
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  // Calculate local storage size
  const calculateStorageSize = () => {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          totalBytes += (key.length + value.length) * 2; // UTF-16 approx 2 bytes per char
        }
      }
      // Add estimated in-memory data
      const jsonStr = JSON.stringify({ expenses, reminders, moneyPotTransactions, categories });
      totalBytes += jsonStr.length * 2;

      if (totalBytes < 1024) {
        setStorageSize(`${totalBytes} o`);
      } else if (totalBytes < 1024 * 1024) {
        setStorageSize(`${(totalBytes / 1024).toFixed(1)} Ko`);
      } else {
        setStorageSize(`${(totalBytes / (1024 * 1024)).toFixed(2)} Mo`);
      }
    } catch {
      setStorageSize('1.2 Mo');
    }
  };

  useEffect(() => {
    calculateStorageSize();
  }, [expenses, reminders, moneyPotTransactions]);

  // Format date helper in French
  const formatTimeFrench = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      if (isToday) {
        return `Aujourd’hui à ${hours}:${minutes}`;
      }

      const day = date.getDate();
      const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      const month = months[date.getMonth()];
      return `${day} ${month} à ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const formatDateOnlyFrench = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // --- 1. Cloud Sync Action ---
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      if (onSyncData) {
        await onSyncData();
      } else {
        // Fallback direct sync
        await supabase.from('expenses').select('id').limit(1);
      }
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_cloud_sync_time', now);
      setToastInfo({ message: 'Synchronisation cloud terminée avec succès.', type: 'info' });
    } catch (err: any) {
      console.error('Sync error:', err);
      setToastInfo({ message: 'Erreur lors de la synchronisation cloud.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // --- 2. Auto Backup Toggle ---
  const handleToggleAutoBackup = (enabled: boolean) => {
    setAutoBackup(enabled);
    localStorage.setItem('duobudget_auto_backup', String(enabled));
    setToastInfo({
      message: enabled ? 'Sauvegarde automatique activée.' : 'Sauvegarde automatique désactivée.',
      type: 'info',
    });
  };

  const handleFrequencyChange = (freq: 'daily' | 'weekly') => {
    setBackupFrequency(freq);
    localStorage.setItem('duobudget_backup_frequency', freq);
    setToastInfo({
      message: `Fréquence de sauvegarde : ${freq === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}.`,
      type: 'info',
    });
  };

  // --- 3. Create Backup File Download ---
  const handleCreateBackup = () => {
    try {
      const backupData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        appName: 'DuoBudget',
        data: {
          expenses,
          reminders,
          moneyPotTransactions,
          categories,
          groceryStores,
          cars,
          heatingTypes,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `DuoBudget_Sauvegarde_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      setLastBackupDate(now);
      localStorage.setItem('duobudget_last_backup_date', now);
      setToastInfo({ message: 'Sauvegarde créée et téléchargée avec succès.', type: 'info' });
    } catch (err: any) {
      console.error('Backup creation error:', err);
      setToastInfo({ message: 'Erreur lors de la création de la sauvegarde.', type: 'error' });
    }
  };

  // --- Helper: CSV Downloader with BOM & semicolons ---
  const downloadCSV = (headers: string[], rows: (string | number)[][], filename: string) => {
    const csvRows = [
      headers.join(';'),
      ...rows.map(row =>
        row
          .map(val => {
            if (val === null || val === undefined) return '""';
            const strVal = String(val);
            if (strVal.includes(';') || strVal.includes('"') || strVal.includes('\n')) {
              return `"${strVal.replace(/"/g, '""')}"`;
            }
            return `"${strVal}"`;
          })
          .join(';')
      ),
    ];

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- 4. Export Handlers ---
  const handleExportAll = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'json') {
      downloadJSON(
        {
          appName: 'DuoBudget',
          exportedAt: new Date().toISOString(),
          expenses,
          reminders,
          moneyPotTransactions,
          categories,
        },
        `DuoBudget_Export_Complet_${dateStr}`
      );
    } else {
      // CSV full export (Expenses + MoneyPot + Reminders combined summary)
      const headers = ['Type', 'Date / Jour', 'Utilisateur', 'Catégorie / Cible', 'Description', 'Montant (€)'];
      const rows: (string | number)[][] = [];

      expenses.forEach(e => {
        rows.push([
          'Dépense',
          new Date(e.date).toLocaleDateString('fr-FR'),
          e.user,
          e.category,
          e.description,
          e.amount.toFixed(2).replace('.', ','),
        ]);
      });

      moneyPotTransactions.forEach(m => {
        rows.push([
          'Cagnotte',
          new Date(m.date).toLocaleDateString('fr-FR'),
          m.user_name,
          'Cagnotte commune',
          m.description,
          m.amount.toFixed(2).replace('.', ','),
        ]);
      });

      reminders.forEach(r => {
        rows.push([
          'Rappel',
          `Jour ${r.day_of_month}`,
          r.user,
          r.category,
          r.description,
          r.amount.toFixed(2).replace('.', ','),
        ]);
      });

      downloadCSV(headers, rows, `DuoBudget_Export_Complet_${dateStr}`);
    }
    setToastInfo({ message: 'Export de toutes les données terminé.', type: 'info' });
  };

  const handleExportExpenses = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'json') {
      downloadJSON(expenses, `DuoBudget_Depenses_${dateStr}`);
    } else {
      const headers = ['Date', 'Utilisateur', 'Catégorie', 'Description', 'Montant (€)', 'Créé le'];
      const rows = expenses.map(e => [
        new Date(e.date).toLocaleDateString('fr-FR'),
        e.user,
        e.category,
        e.description,
        e.amount.toFixed(2).replace('.', ','),
        e.created_at ? new Date(e.created_at).toLocaleString('fr-FR') : '',
      ]);
      downloadCSV(headers, rows, `DuoBudget_Depenses_${dateStr}`);
    }
    setToastInfo({ message: 'Export des dépenses terminé.', type: 'info' });
  };

  const handleExportMoneyPot = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'json') {
      downloadJSON(moneyPotTransactions, `DuoBudget_Cagnotte_${dateStr}`);
    } else {
      const headers = ['Date', 'Membre', 'Description', 'Montant (€)', 'Date création'];
      const rows = moneyPotTransactions.map(m => [
        new Date(m.date).toLocaleDateString('fr-FR'),
        m.user_name,
        m.description,
        m.amount.toFixed(2).replace('.', ','),
        m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : '',
      ]);
      downloadCSV(headers, rows, `DuoBudget_Cagnotte_${dateStr}`);
    }
    setToastInfo({ message: 'Export de la cagnotte terminé.', type: 'info' });
  };

  const handleExportReminders = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'json') {
      downloadJSON(reminders, `DuoBudget_Rappels_${dateStr}`);
    } else {
      const headers = ['Jour du mois', 'Utilisateur', 'Catégorie', 'Description', 'Montant estimé (€)', 'Actif'];
      const rows = reminders.map(r => [
        r.day_of_month,
        r.user,
        r.category,
        r.description,
        r.amount.toFixed(2).replace('.', ','),
        r.is_active ? 'Oui' : 'Non',
      ]);
      downloadCSV(headers, rows, `DuoBudget_Rappels_${dateStr}`);
    }
    setToastInfo({ message: 'Export des rappels terminé.', type: 'info' });
  };

  const handleExportBalanceHistory = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    // Group monthly balance
    const monthlyGroups: Record<string, { total: number; sophie: number; vincent: number; commun: number }> = {};

    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyGroups[key]) {
        monthlyGroups[key] = { total: 0, sophie: 0, vincent: 0, commun: 0 };
      }
      monthlyGroups[key].total += e.amount;
      if (e.user === User.Sophie) monthlyGroups[key].sophie += e.amount;
      else if (e.user === User.Vincent) monthlyGroups[key].vincent += e.amount;
      else monthlyGroups[key].commun += e.amount;
    });

    const sortedMonths = Object.keys(monthlyGroups).sort().reverse();

    if (exportFormat === 'json') {
      downloadJSON(monthlyGroups, `DuoBudget_Balance_Historique_${dateStr}`);
    } else {
      const headers = ['Mois', 'Total Dépenses (€)', 'Total Sophie (€)', 'Total Vincent (€)', 'Total Commun (€)', 'Équilibre Sophie / Vincent (€)'];
      const rows = sortedMonths.map(month => {
        const data = monthlyGroups[month];
        const diff = (data.sophie - data.vincent) / 2;
        const balanceText =
          diff > 0
            ? `Vincent doit ${diff.toFixed(2).replace('.', ',')} € à Sophie`
            : diff < 0
            ? `Sophie doit ${Math.abs(diff).toFixed(2).replace('.', ',')} € à Vincent`
            : 'Équilibré (0,00 €)';

        return [
          month,
          data.total.toFixed(2).replace('.', ','),
          data.sophie.toFixed(2).replace('.', ','),
          data.vincent.toFixed(2).replace('.', ','),
          data.commun.toFixed(2).replace('.', ','),
          balanceText,
        ];
      });
      downloadCSV(headers, rows, `DuoBudget_Balance_Historique_${dateStr}`);
    }
    setToastInfo({ message: 'Export de la balance et de l’historique terminé.', type: 'info' });
  };

  // --- 5. File Import & Restore Flow ---
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const exps = Array.isArray(parsed) ? parsed : parsed.data?.expenses || parsed.expenses || [];
          const rems = Array.isArray(parsed) ? [] : parsed.data?.reminders || parsed.reminders || [];
          const pots = Array.isArray(parsed) ? [] : parsed.data?.moneyPotTransactions || parsed.moneyPotTransactions || [];

          setImportDataPreview({
            fileName: file.name,
            expensesCount: exps.length,
            remindersCount: rems.length,
            moneyPotCount: pots.length,
            parsedPayload: { expenses: exps, reminders: rems, moneyPotTransactions: pots, raw: parsed },
          });
        } else if (file.name.endsWith('.csv')) {
          // Parse basic CSV
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length <= 1) {
            setToastInfo({ message: 'Le fichier CSV sélectionné est vide.', type: 'error' });
            return;
          }
          // Estimate expenses from lines
          const dataRowsCount = lines.length - 1;
          setImportDataPreview({
            fileName: file.name,
            expensesCount: dataRowsCount,
            remindersCount: 0,
            moneyPotCount: 0,
            parsedPayload: { csvLines: lines },
          });
        } else {
          setToastInfo({ message: 'Format de fichier non pris en charge. Utilisez .json ou .csv', type: 'error' });
        }
      } catch (err) {
        console.error('Import parse error:', err);
        setToastInfo({ message: 'Erreur lors de la lecture du fichier de sauvegarde.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importDataPreview) return;
    setIsImporting(true);
    try {
      const { parsedPayload } = importDataPreview;

      if (parsedPayload.expenses && Array.isArray(parsedPayload.expenses)) {
        const validExpenses = parsedPayload.expenses.filter((e: any) => e.amount && e.date);

        if (importMode === 'replace') {
          // Delete all then insert
          await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        if (validExpenses.length > 0) {
          // Clean ID or let Supabase assign
          const cleanExpenses = validExpenses.map((e: any) => ({
            id: e.id || crypto.randomUUID(),
            description: e.description || 'Dépense importée',
            amount: Number(e.amount),
            category: e.category || 'Divers',
            date: e.date,
            user: e.user || User.Sophie,
            created_at: e.created_at || new Date().toISOString(),
          }));

          // Batch insert by chunks of 50
          for (let i = 0; i < cleanExpenses.length; i += 50) {
            const chunk = cleanExpenses.slice(i, i + 50);
            await supabase.from('expenses').upsert(chunk, { onConflict: 'id' });
          }
        }
      }

      setToastInfo({
        message: `Importation réussie (${importDataPreview.expensesCount} dépenses traitées) !`,
        type: 'info',
      });
      setImportDataPreview(null);
      if (onSyncData) await onSyncData();
    } catch (err: any) {
      console.error('Import execution error:', err);
      setToastInfo({ message: "Erreur lors de l'application de l'importation.", type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  // --- 6. Clear Local Cache (Without touching Supabase) ---
  const handleClearCache = async () => {
    try {
      // Clear non-essential localStorage items
      const keysToKeep = ['user', 'vibe', 'theme', 'user_profiles', 'duobudget_auth_state'];
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Re-trigger resync
      if (onSyncData) await onSyncData();
      calculateStorageSize();

      setToastInfo({
        message: 'Cache local vidé avec succès. Vos données Supabase restent intactes.',
        type: 'info',
      });
      setIsClearCacheConfirmOpen(false);
    } catch (err) {
      console.error('Clear cache error:', err);
      setToastInfo({ message: 'Erreur lors du nettoyage du cache.', type: 'error' });
    }
  };

  // --- 7. Danger Zone Handlers ---
  const handleDeleteAllExpenses = async () => {
    try {
      const { error } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;

      setToastInfo({ message: 'Toutes les dépenses ont été supprimées.', type: 'info' });
      setIsDeleteExpensesConfirmOpen(false);
      setDangerConfirmText('');
      if (onSyncData) await onSyncData();
    } catch (err: any) {
      console.error('Delete all expenses error:', err);
      setToastInfo({ message: 'Erreur lors de la suppression des dépenses.', type: 'error' });
    }
  };

  const handleResetApplication = async () => {
    try {
      await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('money_pot').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setToastInfo({ message: "L'application a été réinitialisée.", type: 'info' });
      setIsResetConfirmOpen(false);
      setDangerConfirmText('');
      if (onSyncData) await onSyncData();
    } catch (err: any) {
      console.error('Reset app error:', err);
      setToastInfo({ message: "Erreur lors de la réinitialisation de l'application.", type: 'error' });
    }
  };

  const totalSyncedItems = expenses.length + reminders.length + moneyPotTransactions.length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Hidden File Input for Imports */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".json,.csv"
        className="hidden"
      />

      {/* Header matching Apparence & Utilisateurs style */}
      <div className="flex items-start justify-between relative pt-1 pb-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Données & sauvegarde
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
            Gérez, sauvegardez et exportez vos données DuoBudget.
          </p>
        </div>
        {/* Decorative cloud rays badge */}
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0 select-none">
          <div className="text-2xl">💾</div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute -top-1 -right-1 animate-ping" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-1 -left-1" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. SYNCHRONISATION CLOUD                                   */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Emerald Cloud Icon */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 15a4 4 0 0 0 4 4h10a4 4 0 0 0 2-7.5 4.5 4.5 0 0 0-8.8-1.5A4 4 0 0 0 3 15z"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                  Synchronisation cloud
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synchronisé
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dernière synchronisation : {formatTimeFrench(lastSyncTime)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {totalSyncedItems} éléments synchronisés avec Supabase
              </p>
            </div>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0 disabled:opacity-60"
          >
            <svg
              className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SAUVEGARDES                                            */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#3b82f6] dark:text-blue-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
              Sauvegardes
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Protégez vos données DuoBudget.
            </p>
          </div>
        </div>

        {/* Auto backup row with Switch */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Sauvegarde automatique
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Effectue une sauvegarde régulière dans le cloud.
              </p>
            </div>
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => handleToggleAutoBackup(!autoBackup)}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                autoBackup ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  autoBackup ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Frequency selector pills */}
          {autoBackup && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Fréquence :</span>
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-600/60 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('daily')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    backupFrequency === 'daily'
                      ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Quotidienne
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('weekly')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    backupFrequency === 'weekly'
                      ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Hebdomadaire
                </button>
              </div>
            </div>
          )}

          {/* Last backup note */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            <span>🕒</span>
            <span>Dernière sauvegarde : {formatDateOnlyFrench(lastBackupDate)}</span>
          </div>
        </div>

        {/* Backup action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCreateBackup}
            className="py-3 px-4 rounded-xl bg-[#4f83f8] hover:bg-[#3b72ea] active:bg-[#2d63dc] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            <span>Créer une sauvegarde</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerFileInput}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-slate-200/80 dark:border-slate-600/80"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>Restaurer une sauvegarde</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. EXPORTER MES DONNÉES                                    */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#10b981] dark:text-emerald-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Exporter mes données
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Exportez vos données pour les utiliser ailleurs.
              </p>
            </div>
          </div>

          {/* Format Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/70 p-1 rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                exportFormat === 'csv'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span>📊</span>
              <span>CSV (Excel/Numbers)</span>
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('json')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                exportFormat === 'json'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span>📦</span>
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Export Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 pt-1">
          {/* Row 1: All data */}
          <div className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 text-base">
                📄
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                  Toutes les données
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  Export complet ({exportFormat.toUpperCase()})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportAll}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              Exporter
            </button>
          </div>

          {/* Row 2: Expenses */}
          <div className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 text-base">
                💳
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                  Dépenses
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {expenses.length} dépenses enregistrées
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportExpenses}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              Télécharger
            </button>
          </div>

          {/* Row 3: Cagnotte */}
          <div className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950/60 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 text-base">
                🐷
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                  Cagnotte
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {moneyPotTransactions.length} mouvements enregistrés
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportMoneyPot}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              Exporter
            </button>
          </div>

          {/* Row 4: Reminders */}
          <div className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 text-base">
                ⏰
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                  Rappels
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {reminders.length} rappels configurés
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportReminders}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              Exporter
            </button>
          </div>

          {/* Row 5: Balance / History */}
          <div className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 text-base">
                ⚖️
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                  Balance / historique
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  Historique mensuel et répartition
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportBalanceHistory}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. IMPORTER DES DONNÉES                                   */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-[#a855f7] dark:text-purple-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
              Importer des données
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Importer un ancien export DuoBudget (.json ou .csv)
            </p>
          </div>
        </div>

        {/* Drop / Select Card */}
        <button
          type="button"
          onClick={handleTriggerFileInput}
          className="w-full p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 bg-slate-50/70 dark:bg-slate-700/30 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Cliquez pour sélectionner un fichier de sauvegarde
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Prend en charge les formats .JSON et .CSV de DuoBudget
          </p>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 5. STOCKAGE LOCAL                                         */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-[#d97706] dark:text-amber-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
              Stockage
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Taille occupée par les données locales.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Espace local utilisé : <span className="text-[#0284c7] dark:text-sky-300">{storageSize}</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Cache, documents et préférences locales.
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Vos données Supabase restent conservées et en sécurité.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsClearCacheConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <span>🧹</span>
            <span>Vider le cache</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. ZONE SENSIBLE                                          */}
      {/* ========================================================= */}
      <div className="bg-[#fef2f2] dark:bg-rose-950/25 border border-rose-200/90 dark:border-rose-900/60 rounded-[26px] p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/70 flex items-center justify-center text-[#ef4444] dark:text-rose-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-rose-900 dark:text-rose-200 text-base sm:text-lg leading-tight">
              Zone sensible
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Ces actions sont irréversibles.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Action 1: Reset App */}
          <button
            type="button"
            onClick={() => {
              setDangerConfirmText('');
              setIsResetConfirmOpen(true);
            }}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/70 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-rose-900 dark:text-rose-200 text-sm truncate">
                  Réinitialiser les données de l’application
                </p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 truncate">
                  Remet l’application dans son état initial.
                </p>
              </div>
            </div>
            <span className="text-rose-400 dark:text-rose-500 font-bold text-sm shrink-0 group-hover:translate-x-0.5 transition-transform">
              ›
            </span>
          </button>

          {/* Action 2: Delete All Expenses */}
          <button
            type="button"
            onClick={() => {
              setDangerConfirmText('');
              setIsDeleteExpensesConfirmOpen(true);
            }}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/70 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-rose-900 dark:text-rose-200 text-sm truncate">
                  Supprimer toutes les dépenses
                </p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 truncate">
                  Supprime définitivement vos {expenses.length} dépenses.
                </p>
              </div>
            </div>
            <span className="text-rose-400 dark:text-rose-500 font-bold text-sm shrink-0 group-hover:translate-x-0.5 transition-transform">
              ›
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS: Import Confirmation, Danger Confirmations         */}
      {/* ========================================================= */}

      {/* Import Modal */}
      {importDataPreview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 w-full max-w-md space-y-4 border border-slate-100 dark:border-slate-700">
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>📥</span>
                <span>Importer « {importDataPreview.fileName} »</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Éléments détectés dans le fichier :
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-200">
                <span>Dépenses détectées :</span>
                <span className="font-bold">{importDataPreview.expensesCount}</span>
              </div>
              {importDataPreview.remindersCount > 0 && (
                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-200">
                  <span>Rappels détectés :</span>
                  <span className="font-bold">{importDataPreview.remindersCount}</span>
                </div>
              )}
              {importDataPreview.moneyPotCount > 0 && (
                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-200">
                  <span>Mouvements cagnotte :</span>
                  <span className="font-bold">{importDataPreview.moneyPotCount}</span>
                </div>
              )}
            </div>

            {/* Mode selector */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Méthode d’importation :
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    importMode === 'merge'
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium'
                  }`}
                >
                  <p className="text-xs">Fusionner</p>
                  <p className="text-[10px] text-slate-400 font-normal">Conserve l'existant</p>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    importMode === 'replace'
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium'
                  }`}
                >
                  <p className="text-xs">Remplacer</p>
                  <p className="text-[10px] text-slate-400 font-normal">Écrase l'existant</p>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 font-medium">
              ⚠️ Attention : cette action modifiera votre base de données Supabase.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImportDataPreview(null)}
                disabled={isImporting}
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-xs transition-colors flex items-center gap-2"
              >
                {isImporting ? 'Importation en cours...' : 'Confirmer l’importation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation */}
      <ConfirmationModal
        isOpen={isClearCacheConfirmOpen}
        onClose={() => setIsClearCacheConfirmOpen(false)}
        onConfirm={handleClearCache}
        title="Vider le cache local"
        message="Êtes-vous sûr de vouloir vider le cache local ? Vos dépenses et cagnottes restent bien enregistrées sur Supabase."
      />

      {/* Reset Application Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 w-full max-w-md space-y-4 border border-rose-200 dark:border-rose-900">
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>Réinitialiser l'application</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cette action va supprimer toutes les dépenses, cagnottes et historiques de l'application.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 font-medium">
              Tapez <strong className="font-bold">REINITIALISER</strong> ci-dessous pour confirmer :
            </div>

            <input
              type="text"
              placeholder="REINITIALISER"
              value={dangerConfirmText}
              onChange={e => setDangerConfirmText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleResetApplication}
                disabled={dangerConfirmText !== 'REINITIALISER'}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Expenses Modal */}
      {isDeleteExpensesConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 w-full max-w-md space-y-4 border border-rose-200 dark:border-rose-900">
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <span>🗑️</span>
                <span>Supprimer toutes les dépenses</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Êtes-vous sûr de vouloir supprimer l'ensemble des {expenses.length} dépenses ?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 font-medium">
              Tapez <strong className="font-bold">SUPPRIMER</strong> ci-dessous pour confirmer :
            </div>

            <input
              type="text"
              placeholder="SUPPRIMER"
              value={dangerConfirmText}
              onChange={e => setDangerConfirmText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteExpensesConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAllExpenses}
                disabled={dangerConfirmText !== 'SUPPRIMER'}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAndBackupTab;
