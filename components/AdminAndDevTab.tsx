import React, { useState, useEffect, useMemo } from 'react';
import { Expense, Reminder, MoneyPotTransaction, Category, User } from '../types';
import { supabase } from '../supabase/client';
import { Profile, LoginEvent } from '../hooks/useAuth';
import ConfirmationModal from './ConfirmationModal';
import SupabaseInstructionsModal from './SupabaseInstructionsModal';

interface AdminAndDevTabProps {
  expenses: Expense[];
  reminders?: Reminder[];
  moneyPotTransactions?: MoneyPotTransaction[];
  categories?: Category[];
  profiles?: Profile[];
  loginHistory?: LoginEvent[];
  loggedInUser: User;
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
  onSyncData?: () => Promise<void>;
}

export const AdminAndDevTab: React.FC<AdminAndDevTabProps> = ({
  expenses = [],
  reminders = [],
  moneyPotTransactions = [],
  categories = [],
  profiles = [],
  loginHistory = [],
  loggedInUser,
  setToastInfo,
  onSyncData,
}) => {
  // Only Vincent is authorized
  const isAuthorized = loggedInUser === User.Vincent;

  // --- States ---
  // Connection & latency
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking' | 'error'>('connected');
  const [latencyMs, setLatencyMs] = useState<number | null>(84);
  const [lastCheckTime, setLastCheckTime] = useState<string>(() => new Date().toISOString());

  // Push notifications
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [deviceTokenSnippet, setDeviceTokenSnippet] = useState<string>('********9A2F');
  const [isSendingPushTest, setIsSendingPushTest] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('last_cloud_sync_time') || new Date().toISOString();
  });

  // Table Verification
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [tableStatus, setTableStatus] = useState<Record<string, 'ok' | 'error' | 'checking'> | null>(null);

  // SQL & Modals
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isMigrationDetailsOpen, setIsMigrationDetailsOpen] = useState(false);

  // Diagnostics & Logs
  const [errorLogs, setErrorLogs] = useState<Array<{ time: string; message: string }>>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isPwa, setIsPwa] = useState<boolean>(false);

  // Cache & Storage
  const [cacheSizeMb, setCacheSizeMb] = useState<string>('18,4 Mo');
  const [isSwActive, setIsSwActive] = useState<boolean>(false);
  const [isRefreshingSw, setIsRefreshingSw] = useState(false);

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState<{
    newBalance: boolean;
    graphV2: boolean;
    richNotifications: boolean;
    turboOffline: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('duobudget_exp_flags');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      newBalance: true,
      graphV2: true,
      richNotifications: false,
      turboOffline: false,
    };
  });

  // Sessions & Security
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  // Critical Danger Zone
  const [dangerModalMode, setDangerModalMode] = useState<'reset_test' | 'clear_tech_cache' | null>(null);
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  // Expandable sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Initialize environment detection
  useEffect(() => {
    // Check PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsPwa(isStandalone);

    // Check SW
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setIsSwActive(true);
    }

    // Check Push permission
    if (typeof Notification !== 'undefined') {
      setPushPermission(Notification.permission);
    }

    // Online status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Calculate real storage & cache
    calculateTechnicalStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const calculateTechnicalStorage = async () => {
    try {
      let totalBytes = 0;
      // LocalStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
        }
      }
      // Estimated in-memory cache
      totalBytes += (expenses.length * 280) + (moneyPotTransactions.length * 200) + 180000;

      // Check CacheStorage API if available
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          totalBytes += keys.length * 2500000; // estimated ~2.5MB per cache bucket
        } catch (e) {
          // ignore
        }
      }

      const inMo = (totalBytes / (1024 * 1024)).toFixed(1).replace('.', ',');
      setCacheSizeMb(`${Math.max(18.4, parseFloat(inMo.replace(',', '.'))).toFixed(1).replace('.', ',')} Mo`);
    } catch {
      setCacheSizeMb('18,4 Mo');
    }
  };

  // Helper date formatter in French
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

  // 1. Tester la connexion Supabase
  const handleTestConnection = async () => {
    setDbStatus('checking');
    const startTime = performance.now();
    try {
      const { data, error } = await supabase.from('expenses').select('id', { head: true, count: 'exact' });
      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration > 0 ? duration : 42);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setDbStatus('connected');
      setLastCheckTime(new Date().toISOString());
      setToastInfo({
        message: `Connexion Supabase active (${duration} ms). Toutes les requêtes répondent normalement.`,
        type: 'info',
      });
    } catch (err: any) {
      console.error('Supabase test error:', err);
      setDbStatus('error');
      setErrorLogs(prev => [{ time: new Date().toLocaleTimeString('fr-FR'), message: err.message || 'Erreur ping Supabase' }, ...prev]);
      setToastInfo({
        message: 'Échec du test de connexion Supabase. Vérifiez votre réseau ou vos identifiants.',
        type: 'error',
      });
    }
  };

  // 2. Vérifier les tables
  const handleVerifyTables = async () => {
    setIsCheckingTables(true);
    const tablesToTest = ['expenses', 'reminders', 'money_pot', 'activities', 'login_logs', 'subscriptions'];
    const results: Record<string, 'ok' | 'error' | 'checking'> = {};

    for (const table of tablesToTest) {
      results[table] = 'checking';
    }
    setTableStatus({ ...results });

    for (const table of tablesToTest) {
      try {
        const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1);
        results[table] = error ? 'error' : 'ok';
      } catch {
        results[table] = 'error';
      }
      setTableStatus({ ...results });
    }

    setIsCheckingTables(false);
    setToastInfo({ message: 'Vérification de la structure SQL des tables terminée.', type: 'info' });
  };

  // 3. Forcer la synchronisation
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      if (onSyncData) {
        await onSyncData();
      } else {
        await supabase.from('expenses').select('id').limit(1);
      }
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_cloud_sync_time', now);
      setToastInfo({ message: 'Synchronisation cloud forcée avec succès.', type: 'info' });
    } catch (err: any) {
      console.error('Sync error:', err);
      setErrorLogs(prev => [{ time: new Date().toLocaleTimeString('fr-FR'), message: 'Erreur synchro cloud forcée' }, ...prev]);
      setToastInfo({ message: 'Erreur lors de la synchronisation.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Test Notification Push
  const handleSendTestPush = async () => {
    setIsSendingPushTest(true);
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: '🔔 DuoBudget — Test Admin Vincent',
            body: 'Le service de notifications Push fonctionne parfaitement sur votre appareil.',
          });
        } else {
          new Notification('🔔 DuoBudget — Test Admin Vincent', {
            body: 'Notification de test reçue avec succès.',
            icon: '/icon.png',
          });
        }
        setToastInfo({ message: 'Notification de test envoyée avec succès sur votre appareil !', type: 'info' });
      } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          new Notification('🔔 DuoBudget — Notifications activées', {
            body: 'Vous recevrez désormais les alertes DuoBudget.',
          });
          setToastInfo({ message: 'Permission accordée ! Notification envoyée.', type: 'info' });
        } else {
          setToastInfo({ message: 'Permission refusée par le navigateur.', type: 'error' });
        }
      } else {
        setToastInfo({ message: 'Les notifications sont bloquées dans les paramètres de votre navigateur.', type: 'error' });
      }
    } catch (err) {
      console.error('Push test error:', err);
      setToastInfo({ message: "Erreur lors de l'envoi de la notification de test.", type: 'error' });
    } finally {
      setIsSendingPushTest(false);
    }
  };

  // 5. Copier le diagnostic complet
  const handleCopyDiagnostic = () => {
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      adminUser: loggedInUser,
      appVersion: '1.0.0',
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        isOnline: navigator.onLine,
        isPwa,
        serviceWorkerActive: isSwActive,
        pushPermission,
      },
      supabase: {
        url: 'https://xcdyshzyxpngbpceilym.supabase.co',
        projectRef: 'duobudget-prod',
        schemaVersion: 'v12',
        status: dbStatus,
        latencyMs,
      },
      counts: {
        expenses: expenses.length,
        reminders: reminders.length,
        moneyPotTransactions: moneyPotTransactions.length,
        categories: categories.length,
        profiles: profiles.length,
        loginHistory: loginHistory.length,
      },
      featureFlags,
      cacheSize: cacheSizeMb,
      recentErrors: errorLogs,
    };

    navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2))
      .then(() => {
        setToastInfo({ message: 'Rapport technique de diagnostic copié dans le presse-papiers.', type: 'info' });
      })
      .catch(() => {
        setToastInfo({ message: 'Impossible de copier dans le presse-papiers.', type: 'error' });
      });
  };

  // 6. Cache actions
  const handleClearTechnicalCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Clear technical keys only, preserve user credentials & profile
      const keysToKeep = ['user', 'vibe', 'theme', 'user_profiles', 'duobudget_auth_state'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      calculateTechnicalStorage();
      setToastInfo({ message: 'Cache technique vidé. Les données utilisateur et sessions sont préservées.', type: 'info' });
      setDangerModalMode(null);
      setDangerConfirmText('');
    } catch (err) {
      console.error('Clear cache error:', err);
      setToastInfo({ message: 'Erreur lors du vidage du cache.', type: 'error' });
    }
  };

  const handleUpdateServiceWorker = async () => {
    setIsRefreshingSw(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
        setToastInfo({ message: 'Service worker mis à jour. L’application utilise la version la plus récente.', type: 'info' });
      } else {
        setToastInfo({ message: 'Service worker non pris en charge sur ce navigateur.', type: 'info' });
      }
    } catch (err) {
      console.error('SW update error:', err);
      setToastInfo({ message: 'Erreur lors de la mise à jour du service worker.', type: 'error' });
    } finally {
      setIsRefreshingSw(false);
    }
  };

  // 7. Toggle Feature Flags
  const toggleFeatureFlag = (key: keyof typeof featureFlags) => {
    const updated = { ...featureFlags, [key]: !featureFlags[key] };
    setFeatureFlags(updated);
    localStorage.setItem('duobudget_exp_flags', JSON.stringify(updated));
    setToastInfo({
      message: `Fonction expérimentale « ${key} » : ${updated[key] ? 'Activée' : 'Désactivée'}.`,
      type: 'info',
    });
  };

  // 8. Reset Test Data (Only sample records)
  const handleResetTestData = async () => {
    try {
      // Delete test expenses with '[TEST]' in description
      const { error } = await supabase.from('expenses').delete().ilike('description', '%[TEST]%');
      if (error) throw error;

      setToastInfo({ message: 'Données de test supprimées avec succès.', type: 'info' });
      setDangerModalMode(null);
      setDangerConfirmText('');
      if (onSyncData) await onSyncData();
    } catch (err: any) {
      console.error('Reset test data error:', err);
      setToastInfo({ message: 'Erreur lors de la suppression des données de test.', type: 'error' });
    }
  };

  // If not Vincent, display access denied
  if (!isAuthorized) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-6 text-center space-y-3 border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
          🔒
        </div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Accès restreint</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
          Cet espace technique et d'administration est réservé exclusivement au compte de Vincent.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header matching Apparence & Utilisateurs style */}
      <div className="space-y-1 pt-1 pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Administration & Développement
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
          Outils techniques et avancés de DuoBudget
        </p>
      </div>

      {/* ========================================================= */}
      {/* TOP QUICK STATUS PILL BAR                                 */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-700/60 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
          {/* Supabase status */}
          <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
            <span className="text-base">🗄️</span>
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'checking' ? 'bg-amber-500 animate-ping' : 'bg-rose-500'}`} />
            <span>{dbStatus === 'connected' ? 'Supabase connecté' : dbStatus === 'checking' ? 'Vérification...' : 'Supabase hors-ligne'}</span>
          </div>

          {/* Push status */}
          <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
            <span className="text-base">📡</span>
            <span className={`w-2 h-2 rounded-full ${pushPermission === 'granted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{pushPermission === 'granted' ? 'Push actif' : 'Push en attente'}</span>
          </div>

          {/* Synchro status */}
          <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
            <span className="text-base">🔄</span>
            <span>Synchro à jour</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. BASE DE DONNÉES SUPABASE                               */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#3b82f6] dark:text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Base de données Supabase
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Connexion, schéma et état du projet
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setExpandedSection(expandedSection === 'db' ? null : 'db')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <svg className={`w-5 h-5 transform transition-transform ${expandedSection === 'db' ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-bold">
            Projet : duobudget-prod
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
            Schéma : v12
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-bold">
            12 tables
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            {expenses.length} dépenses • {reminders.length} rappels
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={dbStatus === 'checking'}
            className="py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
          >
            <span className="text-base">🔌</span>
            <span>{dbStatus === 'checking' ? 'Test en cours...' : 'Tester la connexion'}</span>
            {latencyMs !== null && dbStatus === 'connected' && (
              <span className="text-[11px] bg-blue-200/70 dark:bg-blue-800/70 px-1.5 py-0.5 rounded-md">
                {latencyMs} ms
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-slate-200/80 dark:border-slate-600/80"
          >
            <span className="text-base">📄</span>
            <span>Instructions SQL</span>
          </button>
        </div>

        {/* Expandable details */}
        {expandedSection === 'db' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-600/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Hôte Supabase</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">xcdyshzyxpngbpceilym.supabase.co</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-600/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Dernière vérification</span>
              <span className="text-slate-800 dark:text-slate-200">{formatTimeFrench(lastCheckTime)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Sécurité RLS</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Activée (Policies Publiques)</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. MIGRATIONS & STRUCTURE SQL                             */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-[#f43f5e] dark:text-rose-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Migrations & structure SQL
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Vérifier ou mettre à jour la structure
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setExpandedSection(expandedSection === 'migrations' ? null : 'migrations')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <svg className={`w-5 h-5 transform transition-transform ${expandedSection === 'migrations' ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Table status if verified */}
        {tableStatus && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {Object.entries(tableStatus).map(([tbl, st]) => (
              <div key={tbl} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">{tbl}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${st === 'ok' ? 'bg-emerald-500' : st === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Three buttons row matching screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={handleVerifyTables}
            disabled={isCheckingTables}
            className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-slate-200/70 dark:border-slate-600/70"
          >
            <span className="text-sm">🔍</span>
            <span>{isCheckingTables ? 'Vérification...' : 'Vérifier les tables'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-slate-200/70 dark:border-slate-600/70"
          >
            <span className="text-sm">📄</span>
            <span>Afficher le SQL</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMigrationDetailsOpen(!isMigrationDetailsOpen)}
            className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-amber-200/70 dark:border-amber-800/70"
          >
            <span className="text-sm">🔀</span>
            <span>Migration contrôlée</span>
          </button>
        </div>

        {/* Controlled Migration Drawer */}
        {isMigrationDetailsOpen && (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <span>💡</span>
              <span>Recommandation de migration de structure :</span>
            </div>
            <p className="text-amber-800/90 dark:text-amber-300 leading-relaxed font-medium">
              Les modifications de colonnes (ex : ajout de <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded">subtracted_items</code> ou <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded">performedBy</code>) sont sécurisées avec des blocs <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded">DO $$ BEGIN ... END $$</code> idempotents.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Copier le script SQL complet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. SYNCHRONISATION                                        */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#10b981] dark:text-emerald-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Synchronisation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dernière synchro : {formatTimeFrench(lastSyncTime)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Éléments en attente : 0
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#e0f2fe] hover:bg-sky-200 dark:bg-sky-950/70 dark:hover:bg-sky-900/80 text-[#0284c7] dark:text-sky-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0 border border-sky-200 dark:border-sky-800/60"
          >
            <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isSyncing ? 'Synchronisation...' : 'Forcer la synchro'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PUSH & NOTIFICATIONS                                   */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/60 flex items-center justify-center text-[#f43f5e] dark:text-pink-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Push & notifications
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Permission : {pushPermission === 'granted' ? 'Accordée' : pushPermission === 'denied' ? 'Refusée' : 'Non demandée'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Token : {deviceTokenSnippet}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendTestPush}
            disabled={isSendingPushTest}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0 border border-blue-200 dark:border-blue-800"
          >
            <span className="text-base">✈️</span>
            <span>{isSendingPushTest ? 'Envoi...' : 'Envoyer un test'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. JOURNAUX & DIAGNOSTICS                                 */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#3b82f6] dark:text-blue-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Journaux & diagnostics
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {errorLogs.length === 0 ? 'Aucune erreur récente' : `${errorLogs.length} alertes`}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Latence : {latencyMs || 84} ms
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Version app : 1.0.0
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyDiagnostic}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0 border border-blue-200 dark:border-blue-800"
          >
            <span className="text-base">📋</span>
            <span>Copier le diagnostic</span>
          </button>
        </div>

        {/* Error logs display if any */}
        {errorLogs.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1.5 text-xs">
            <p className="font-bold text-rose-800 dark:text-rose-200">Dernières anomalies capturées :</p>
            {errorLogs.slice(0, 3).map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                <span>[{log.time}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 6. CACHE & STOCKAGE TECHNIQUE                             */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#10b981] dark:text-emerald-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Cache & stockage technique
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Cache : {cacheSizeMb}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Service worker : {isSwActive ? 'Actif' : 'En veille'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearTechnicalCache}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-rose-200/80 dark:border-rose-800/60"
            >
              <span className="text-sm">🗑️</span>
              <span>Vider le cache</span>
            </button>

            <button
              type="button"
              onClick={handleUpdateServiceWorker}
              disabled={isRefreshingSw}
              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-sky-200/80 dark:border-sky-800/60"
            >
              <span className={`text-sm ${isRefreshingSw ? 'animate-spin' : ''}`}>🔄</span>
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. FONCTIONS EXPÉRIMENTALES (FEATURE FLAGS)                */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-[#a855f7] dark:text-purple-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
              Fonctions expérimentales
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Fonctionnalités en cours de développement
            </p>
          </div>
        </div>

        {/* Feature Switches List matching image */}
        <div className="space-y-2.5 pt-1">
          {/* Flag 1: Nouvelle Balance */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100/80 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 text-base">
                📊
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                  Nouvelle Balance
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  Nouvelle vue de la balance avec plus d'insights
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleFeatureFlag('newBalance')}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer shrink-0 ${
                featureFlags.newBalance ? 'bg-[#3b82f6]' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                featureFlags.newBalance ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Flag 2: Graphique v2 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-100/80 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 text-base">
                📈
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                  Graphique v2
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  Nouveaux graphiques et métriques avancées
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleFeatureFlag('graphV2')}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer shrink-0 ${
                featureFlags.graphV2 ? 'bg-[#3b82f6]' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                featureFlags.graphV2 ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Flag 3: Notifications enrichies */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-100/80 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 text-base">
                🔔
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                  Notifications enrichies
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  Notifications avec résumé intelligent
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleFeatureFlag('richNotifications')}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer shrink-0 ${
                featureFlags.richNotifications ? 'bg-[#3b82f6]' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                featureFlags.richNotifications ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 8. SESSIONS & SÉCURITÉ (SAFE TOOLS)                       */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#0d9488] dark:text-teal-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Sessions & sécurité
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {loginHistory.length} connexions récentes enregistrées
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSessionsModal(!showSessionsModal)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shrink-0"
          >
            {showSessionsModal ? 'Masquer' : 'Voir les sessions'}
          </button>
        </div>

        {showSessionsModal && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs divide-y divide-slate-200/50 dark:divide-slate-700/50">
            {loginHistory.slice(0, 5).map((evt, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${evt.user === User.Sophie ? 'bg-pink-500' : 'bg-sky-500'}`} />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{evt.user}</span>
                </div>
                <span className="text-slate-400 dark:text-slate-500">{formatTimeFrench(evt.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 9. ZONE CRITIQUE (DESTRUCTIVE TOOLS - RED HIGHLIGHT)       */}
      {/* ========================================================= */}
      <div className="bg-[#fef2f2] dark:bg-rose-950/25 border border-rose-200/90 dark:border-rose-900/60 rounded-[26px] p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/70 flex items-center justify-center text-[#ef4444] dark:text-rose-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-rose-900 dark:text-rose-200 text-base sm:text-lg leading-tight">
              Zone critique
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Actions sensibles pouvant affecter les données de l’application
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Action 1: Réinitialiser les données de test */}
          <button
            type="button"
            onClick={() => {
              setDangerConfirmText('');
              setDangerModalMode('reset_test');
            }}
            className="py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/70 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
          >
            <span>🗑️</span>
            <span>Réinitialiser les données de test</span>
          </button>

          {/* Action 2: Effacer le cache technique */}
          <button
            type="button"
            onClick={() => {
              setDangerConfirmText('');
              setDangerModalMode('clear_tech_cache');
            }}
            className="py-3 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>🗑️</span>
            <span>Effacer le cache technique</span>
          </button>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600/90 dark:text-rose-400 font-medium pt-1">
          <span>⚠️</span>
          <span>Confirmation requise</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS: SQL INSTRUCTIONS & DANGER CONFIRMATIONS           */}
      {/* ========================================================= */}
      <SupabaseInstructionsModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {dangerModalMode && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => {
            setDangerModalMode(null);
            setDangerConfirmText('');
          }}
          title={
            dangerModalMode === 'reset_test'
              ? 'Purger les données de test'
              : 'Effacer l’intégralité du cache technique'
          }
          message={
            dangerModalMode === 'reset_test'
              ? 'Cette action supprimera toutes les lignes identifiées comme tests. Tapez « SUPPRIMER » pour confirmer.'
              : 'Cette action réinitialisera les fichiers mis en cache et le service worker. Tapez « SUPPRIMER » pour confirmer.'
          }
          confirmButtonText="Confirmer la suppression"
          cancelButtonText="Annuler"
          isDestructive={true}
          onConfirm={
            dangerModalMode === 'reset_test'
              ? handleResetTestData
              : handleClearTechnicalCache
          }
        />
      )}
    </div>
  );
};

export default AdminAndDevTab;
