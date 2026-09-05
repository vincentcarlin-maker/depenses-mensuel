import React, { useState, useEffect } from 'react';
import BellIcon from './icons/BellIcon';
import CloseIcon from './icons/CloseIcon';
import { supabase } from '../supabase/client';
import { type User } from '../types';

const VAPID_PUBLIC_KEY = 'BN0Z3nqz3OLK1q2RuvukfLMAffOncCrBsvMw7GncY_9EK8u6-W0OzfIsRElejTlC-TM2uNDXCZkicnJX47pNGdc';

const urlB64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

interface NotificationReminderAlertProps {
  loggedInUser?: User;
  onNotificationEnabled?: () => void;
  onOpenSettings?: () => void;
}

const NotificationReminderAlert: React.FC<NotificationReminderAlertProps> = ({
  loggedInUser = 'Commun',
  onNotificationEnabled,
  onOpenSettings,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    const currentPerm = Notification.permission;

    // Vérifier si l'utilisateur a reporté le rappel
    const snoozedUntil = localStorage.getItem('notif_reminder_snoozed_until');
    if (snoozedUntil && Number(snoozedUntil) > Date.now()) {
      return;
    }

    if (currentPerm === 'default') {
      setIsVisible(true);
    } else if (currentPerm === 'granted') {
      const manuallyDisabled = localStorage.getItem('push_notifications_enabled') === 'false';
      if (manuallyDisabled) {
        setIsVisible(true);
      } else {
        navigator.serviceWorker.ready.then(async (reg) => {
          try {
            const sub = await reg.pushManager.getSubscription();
            if (!sub) {
              setIsVisible(true);
            }
          } catch {
            setIsVisible(true);
          }
        });
      }
    }
  }, []);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      if (!('Notification' in window)) {
        alert('Ce navigateur ne supporte pas les notifications.');
        return;
      }

      const perm = await Notification.requestPermission();

      if (perm === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const applicationServerKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        const userId = (loggedInUser as string) === 'Duo' ? 'Commun' : (loggedInUser || 'Commun');
        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', userId);

        const subJSON = subscription.toJSON() as any;
        const savedPrefs = localStorage.getItem('notificationPreferences');
        let parsedPrefs = null;
        if (savedPrefs) {
          try {
            parsedPrefs = JSON.parse(savedPrefs);
          } catch {
            parsedPrefs = null;
          }
        }

        subJSON.preferences = parsedPrefs || {
          authors: ['Sophie', 'Vincent', 'Commun'],
          minAmount: 0,
          includeMoneyPot: true,
          includeDeletes: true,
          quietHoursActive: false,
          privacyMode: false,
        };

        await (supabase.from('push_subscriptions') as any).insert({
          user_id: userId,
          subscription: subJSON,
        });

        localStorage.setItem('push_notifications_enabled', 'true');
        localStorage.removeItem('notif_reminder_snoozed_until');
        setIsVisible(false);
        onNotificationEnabled?.();
      } else if (perm === 'denied') {
        alert("Les notifications ont été refusées. Pour les activer, veuillez modifier l'autorisation dans les paramètres de votre navigateur.");
      }
    } catch (err: any) {
      console.error('Erreur activation notification reminder:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleSnooze = () => {
    // Répéter le rappel dans 3 jours
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('notif_reminder_snoozed_until', String(Date.now() + threeDaysMs));
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-sky-50 dark:from-slate-800 dark:via-indigo-950/20 dark:to-slate-800 p-4 sm:p-5 border border-blue-200/80 dark:border-blue-900/40 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 mt-0.5">
            <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Rappel : Activez vos notifications
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Important
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Pour ne manquer aucune dépense ajoutée ou mise à jour par votre duo en temps réel, autorisez les notifications sur cet appareil.
            </p>
            <div className="pt-2 flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleActivate}
                disabled={isActivating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isActivating ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Activation...</span>
                  </>
                ) : (
                  <span>Activer les notifications</span>
                )}
              </button>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                >
                  Configurer
                </button>
              )}

              <button
                type="button"
                onClick={handleSnooze}
                className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSnooze}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
          title="Fermer le rappel"
          aria-label="Fermer le rappel"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default NotificationReminderAlert;
