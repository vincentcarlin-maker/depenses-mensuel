import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { type User } from '../types';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import ChevronRightIcon from './icons/ChevronRightIcon';
import {
    FuelIcon,
    HeatingIcon,
    GroceriesIcon,
    RestaurantIcon,
    CarRepairsIcon,
    MiscIcon,
    GiftIcon,
    ClothingIcon,
    PalmTreeIcon,
    PillIcon,
    MandatoryIcon
} from './icons/CategoryIcons';

const VAPID_PUBLIC_KEY = 'BN0Z3nqz3OLK1q2RuvukfLMAffOncCrBsvMw7GncY_9EK8u6-W0OzfIsRElejTlC-TM2uNDXCZkicnJX47pNGdc';

const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

interface NotificationsTabProps {
    loggedInUser: User;
}

// Category visual mapping for the filter chips
const getCategoryIcon = (category: string) => {
    const normalized = category.toLowerCase().trim();

    // 1. Complément alimentaire / Santé / Pharmacie (check first to avoid matching "alimentaire" as groceries)
    if (normalized.includes('complément') || normalized.includes('complement') || normalized.includes('pill') || normalized.includes('santé') || normalized.includes('pharmacie')) {
        return <PillIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }

    // 2. Dépenses récurrentes / Dép. recurentes / Obligatoires / Loyer
    if (normalized.includes('recurent') || normalized.includes('récurrent') || normalized.includes('obligatoire') || normalized.includes('dép.') || normalized.includes('dep.') || normalized.includes('loyer')) {
        return (
            <svg className="w-4 h-4 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        );
    }

    // 3. Carburant / Essence / Diesel
    if (normalized.includes('carburant') || normalized.includes('essence') || normalized.includes('diesel') || normalized.includes('gasoil')) {
        return <FuelIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }

    // 4. Chauffage / Énergie / Gaz / Bois
    if (normalized.includes('chauffage') || normalized.includes('bois') || normalized.includes('gaz') || normalized.includes('pellet') || normalized.includes('fioul')) {
        return <HeatingIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    }

    // 5. Courses / Supermarché
    if (normalized.includes('course') || normalized.includes('supermarché') || normalized.includes('supermarche') || normalized.includes('hyper')) {
        return <GroceriesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }

    // 6. Restaurant / Resto / Bar
    if (normalized.includes('restaurant') || normalized.includes('resto') || normalized.includes('bar') || normalized.includes('brasserie')) {
        return <RestaurantIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }

    // 7. Vacances / Voyage
    if (normalized.includes('vacance') || normalized.includes('voyage') || normalized.includes('hotel') || normalized.includes('hôtel')) {
        return <PalmTreeIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    }

    // 8. Réparation voitures / Auto / Garage
    if (normalized.includes('voiture') || normalized.includes('auto') || normalized.includes('garage') || normalized.includes('réparation') || normalized.includes('reparation')) {
        return <CarRepairsIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }

    // 9. Vêtements / Habit / Shopping
    if (normalized.includes('vêtement') || normalized.includes('vetement') || normalized.includes('habit') || normalized.includes('mode') || normalized.includes('fringue')) {
        return <ClothingIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }

    // 10. Cadeau / Anniversaire / Fête
    if (normalized.includes('cadeau') || normalized.includes('anniversaire') || normalized.includes('fête') || normalized.includes('fete')) {
        return <GiftIcon className="w-4 h-4 text-pink-500 dark:text-pink-400" />;
    }

    // 11. Divers / Autre
    return <MiscIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
};

// Short label helper matching mockup (e.g. "Dépenses obligatoires" -> "Dép. récurrentes")
const formatCategoryLabel = (cat: string) => {
    if (cat === "Dépenses obligatoires") return "Dép. récurrentes";
    return cat;
};

const NotificationsTab: React.FC<NotificationsTabProps> = ({ loggedInUser }) => {
    const flags = useFeatureFlags();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    
    // Notification preferences states
    const [prefAuthors, setPrefAuthors] = useState<string[]>(['Sophie', 'Vincent', 'Commun']);
    const [prefMinAmount, setPrefMinAmount] = useState<number>(0);
    const [prefCategories, setPrefCategories] = useState<string[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [prefIncludeMoneyPot, setPrefIncludeMoneyPot] = useState<boolean>(true);
    const [prefIncludeDeletes, setPrefIncludeDeletes] = useState<boolean>(true);
    const [prefQuietHoursActive, setPrefQuietHoursActive] = useState<boolean>(false);
    const [prefQuietHoursStart, setPrefQuietHoursStart] = useState<string>('22:00');
    const [prefQuietHoursEnd, setPrefQuietHoursEnd] = useState<string>('08:00');
    const [prefPrivacyMode, setPrefPrivacyMode] = useState<boolean>(false);

    const [isSyncingPrefs, setIsSyncingPrefs] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [testAlertSent, setTestAlertSent] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }

        // Charger la liste actuelle des catégories de dépenses
        const savedCats = JSON.parse(localStorage.getItem('expenseCategories') || '[]');
        const cats = savedCats.length > 0 ? savedCats : [
            "Dépenses obligatoires",
            "Carburant",
            "Chauffage",
            "Courses",
            "Restaurant",
            "Divers",
            "Vacances",
            "Réparation voitures",
            "Vêtements",
            "Cadeau",
            "Complément alimentaire"
        ];
        setAvailableCategories(cats);

        // Charger les préférences de notifications locales
        const savedPrefs = localStorage.getItem('notificationPreferences');
        if (savedPrefs) {
            try {
                const parsed = JSON.parse(savedPrefs);
                if (parsed.authors) setPrefAuthors(parsed.authors);
                if (typeof parsed.minAmount === 'number') setPrefMinAmount(parsed.minAmount);
                if (typeof parsed.includeMoneyPot === 'boolean') setPrefIncludeMoneyPot(parsed.includeMoneyPot);
                if (typeof parsed.includeDeletes === 'boolean') setPrefIncludeDeletes(parsed.includeDeletes);
                if (typeof parsed.quietHoursActive === 'boolean') setPrefQuietHoursActive(parsed.quietHoursActive);
                if (parsed.quietHoursStart) setPrefQuietHoursStart(parsed.quietHoursStart);
                if (parsed.quietHoursEnd) setPrefQuietHoursEnd(parsed.quietHoursEnd);
                if (typeof parsed.privacyMode === 'boolean') setPrefPrivacyMode(parsed.privacyMode);
                
                if (parsed.categories) {
                    setPrefCategories(parsed.categories.filter((c: string) => cats.includes(c)));
                } else {
                    setPrefCategories(cats);
                }
            } catch (e) {
                setPrefCategories(cats);
            }
        } else {
            setPrefCategories(cats);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                const userId = (loggedInUser as string) === 'Duo' ? 'Commun' : loggedInUser;
                try {
                    const { data } = await (supabase.from('push_subscriptions') as any)
                        .select('subscription, id')
                        .eq('user_id', userId);
                        
                    if (!data || data.length === 0) {
                        const localPrefs = {
                            authors: prefAuthors,
                            minAmount: prefMinAmount,
                            categories: prefCategories.length > 0 ? prefCategories : availableCategories,
                            includeMoneyPot: prefIncludeMoneyPot,
                            includeDeletes: prefIncludeDeletes,
                            quietHoursActive: prefQuietHoursActive,
                            quietHoursStart: prefQuietHoursStart,
                            quietHoursEnd: prefQuietHoursEnd,
                            privacyMode: prefPrivacyMode
                        };
                        const subscriptionJSON = subscription.toJSON() as any;
                        subscriptionJSON.preferences = localPrefs;

                        await (supabase.from('push_subscriptions') as any).insert({
                            user_id: userId,
                            subscription: subscriptionJSON
                        });
                    } else {
                        const subObj = typeof data[0].subscription === 'string'
                            ? JSON.parse(data[0].subscription)
                            : data[0].subscription;
                        
                        if (subObj && subObj.preferences) {
                            const prefs = subObj.preferences;
                            if (prefs.authors) setPrefAuthors(prefs.authors);
                            if (typeof prefs.minAmount === 'number') setPrefMinAmount(prefs.minAmount);
                            if (prefs.categories) setPrefCategories(prefs.categories);
                            if (typeof prefs.includeMoneyPot === 'boolean') setPrefIncludeMoneyPot(prefs.includeMoneyPot);
                            if (typeof prefs.includeDeletes === 'boolean') setPrefIncludeDeletes(prefs.includeDeletes);
                            if (typeof prefs.quietHoursActive === 'boolean') setPrefQuietHoursActive(prefs.quietHoursActive);
                            if (prefs.quietHoursStart) setPrefQuietHoursStart(prefs.quietHoursStart);
                            if (prefs.quietHoursEnd) setPrefQuietHoursEnd(prefs.quietHoursEnd);
                            if (typeof prefs.privacyMode === 'boolean') setPrefPrivacyMode(prefs.privacyMode);
                            
                            localStorage.setItem('notificationPreferences', JSON.stringify(prefs));
                        }
                    }
                } catch (e) {
                    console.error("DB error syncing subscription", e);
                }
                
                setIsSubscribed(true);
            } else {
                setIsSubscribed(false);
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de l'abonnement :", error);
        }
    };

    const syncPrefsToSupabase = async (updatedPrefs: {
        authors: string[];
        minAmount: number;
        categories: string[];
        includeMoneyPot: boolean;
        includeDeletes: boolean;
        quietHoursActive: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
        privacyMode: boolean;
    }) => {
        setIsSyncingPrefs(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                const userId = (loggedInUser as string) === 'Duo' ? 'Commun' : loggedInUser;
                const subscriptionJSON = subscription.toJSON() as any;
                subscriptionJSON.preferences = updatedPrefs;
                
                await (supabase.from('push_subscriptions') as any).delete().eq('user_id', userId);
                await (supabase.from('push_subscriptions') as any).insert({
                    user_id: userId,
                    subscription: subscriptionJSON
                });
            }
        } catch (e) {
            console.error("Erreur de synchro préf:", e);
        } finally {
            setIsSyncingPrefs(false);
        }
    };

    const handleUpdatePreference = (newFields: Partial<{
        authors: string[];
        minAmount: number;
        categories: string[];
        includeMoneyPot: boolean;
        includeDeletes: boolean;
        quietHoursActive: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
        privacyMode: boolean;
    }>) => {
        const fullPrefs = {
            authors: newFields.authors !== undefined ? newFields.authors : prefAuthors,
            minAmount: newFields.minAmount !== undefined ? newFields.minAmount : prefMinAmount,
            categories: newFields.categories !== undefined ? newFields.categories : prefCategories,
            includeMoneyPot: newFields.includeMoneyPot !== undefined ? newFields.includeMoneyPot : prefIncludeMoneyPot,
            includeDeletes: newFields.includeDeletes !== undefined ? newFields.includeDeletes : prefIncludeDeletes,
            quietHoursActive: newFields.quietHoursActive !== undefined ? newFields.quietHoursActive : prefQuietHoursActive,
            quietHoursStart: newFields.quietHoursStart !== undefined ? newFields.quietHoursStart : prefQuietHoursStart,
            quietHoursEnd: newFields.quietHoursEnd !== undefined ? newFields.quietHoursEnd : prefQuietHoursEnd,
            privacyMode: newFields.privacyMode !== undefined ? newFields.privacyMode : prefPrivacyMode
        };

        if (newFields.authors !== undefined) setPrefAuthors(newFields.authors);
        if (newFields.minAmount !== undefined) setPrefMinAmount(newFields.minAmount);
        if (newFields.categories !== undefined) setPrefCategories(newFields.categories);
        if (newFields.includeMoneyPot !== undefined) setPrefIncludeMoneyPot(newFields.includeMoneyPot);
        if (newFields.includeDeletes !== undefined) setPrefIncludeDeletes(newFields.includeDeletes);
        if (newFields.quietHoursActive !== undefined) setPrefQuietHoursActive(newFields.quietHoursActive);
        if (newFields.quietHoursStart !== undefined) setPrefQuietHoursStart(newFields.quietHoursStart);
        if (newFields.quietHoursEnd !== undefined) setPrefQuietHoursEnd(newFields.quietHoursEnd);
        if (newFields.privacyMode !== undefined) setPrefPrivacyMode(newFields.privacyMode);

        localStorage.setItem('notificationPreferences', JSON.stringify(fullPrefs));
        syncPrefsToSupabase(fullPrefs);
    };

    const handleAuthorToggle = (author: string) => {
        const nextAuthors = prefAuthors.includes(author)
            ? prefAuthors.filter(a => a !== author)
            : [...prefAuthors, author];
        handleUpdatePreference({ authors: nextAuthors });
    };

    const handleMinAmountChange = (val: number) => {
        handleUpdatePreference({ minAmount: val });
    };

    const handleCategoryToggle = (cat: string) => {
        const nextCats = prefCategories.includes(cat)
            ? prefCategories.filter(c => c !== cat)
            : [...prefCategories, cat];
        handleUpdatePreference({ categories: nextCats });
    };

    const handleSelectAllCategories = () => {
        handleUpdatePreference({ categories: availableCategories });
    };

    const handleSelectNoneCategories = () => {
        handleUpdatePreference({ categories: [] });
    };

    const subscribeUser = async () => {
        setIsActionLoading(true);
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                alert("Les notifications Push ne sont pas supportées par ce navigateur.");
                return;
            }
            const registration = await navigator.serviceWorker.ready;
            const applicationServerKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            const userId = (loggedInUser as string) === 'Duo' ? 'Commun' : loggedInUser;
            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', userId);
            
            const subJSON = subscription.toJSON() as any;
            subJSON.preferences = {
                authors: prefAuthors,
                minAmount: prefMinAmount,
                categories: prefCategories.length > 0 ? prefCategories : availableCategories,
                includeMoneyPot: prefIncludeMoneyPot,
                includeDeletes: prefIncludeDeletes,
                quietHoursActive: prefQuietHoursActive,
                quietHoursStart: prefQuietHoursStart,
                quietHoursEnd: prefQuietHoursEnd,
                privacyMode: prefPrivacyMode
            };

            await (supabase.from('push_subscriptions') as any).insert({
                user_id: userId,
                subscription: subJSON
            });

            setIsSubscribed(true);
            localStorage.setItem('push_notifications_enabled', 'true');
            localStorage.removeItem('notif_reminder_snoozed_until');
        } catch (error: any) {
            console.error('Erreur lors de la souscription aux notifications push', error);
            alert("Erreur de souscription: " + (error.message || "Inconnue"));
        } finally {
            setIsActionLoading(false);
        }
    };

    const unsubscribeUser = async () => {
        setIsActionLoading(true);
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
            }
            const userId = (loggedInUser as string) === 'Duo' ? 'Commun' : loggedInUser;
            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', userId);
            setIsSubscribed(false);
            localStorage.setItem('push_notifications_enabled', 'false');
        } catch (error: any) {
            console.error('Erreur lors de la désactivation des notifications push', error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleToggleNotifications = async () => {
        if (isSubscribed && permission === 'granted') {
            await unsubscribeUser();
        } else {
            if (permission !== 'granted') {
                await requestPermission();
            } else {
                await subscribeUser();
            }
        }
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('Ce navigateur ne supporte pas les notifications.');
            return;
        }

        const perm = await Notification.requestPermission();
        setPermission(perm);
        
        if (perm === 'granted') {
            await subscribeUser();
        }
    };

    const sendTestNotification = async () => {
        setTestAlertSent(true);
        setTimeout(() => setTestAlertSent(false), 3000);

        if (permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification("Notification DuoBudget", {
                    body: "Les notifications push fonctionnent parfaitement !",
                    icon: "/logo.svg",
                    badge: "/logo.svg",
                    vibrate: [200, 100, 200]
                } as any);
            } catch {
                new Notification("Notification DuoBudget", {
                    body: "Les notifications push fonctionnent parfaitement !",
                    icon: "/logo.svg"
                });
            }
        } else {
            alert("Veuillez d'abord activer les notifications pour recevoir une alerte test.");
        }
    };

    const isPushActive = isSubscribed && permission === 'granted';

    return (
        <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
            {/* CARD 1: NOTIFICATIONS PUSH */}
            <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 shadow-xs border border-slate-100/90 dark:border-slate-700/60 space-y-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#dcfce7] dark:bg-emerald-950/60 text-[#16a34a] dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl leading-tight">
                            Notifications Push
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Recevez vos rappels et alertes en temps réel sur cet appareil. Sur mobile, vous devez d'abord installer l'application sur votre écran d'accueil.
                        </p>
                    </div>
                </div>

                {/* Sub-card: Statut des notifications */}
                <div className="p-4 sm:p-4.5 bg-[#f8fafc] dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#dcfce7] dark:bg-emerald-950/70 text-[#16a34a] dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                                    Statut des notifications
                                </span>
                                {permission === 'denied' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                        Bloquées
                                    </span>
                                ) : isPushActive ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                                        Activées
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                        Désactivées
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {isPushActive 
                                    ? "Vous recevez les alertes de dépenses et synchronisations sur cet appareil."
                                    : "Activez pour être alerté en direct des dépenses de votre duo."}
                            </p>
                        </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0">
                        {permission === 'denied' ? (
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                                Accès refusé
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleToggleNotifications}
                                disabled={isActionLoading}
                                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50 ${
                                    isPushActive
                                        ? 'bg-[#fff1f2] hover:bg-rose-100/80 text-[#e11d48] border border-rose-200/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 dark:border-rose-900/40'
                                        : 'bg-[#0284c7] hover:bg-sky-600 text-white'
                                }`}
                            >
                                {isActionLoading ? 'Chargement...' : isPushActive ? 'Désactiver' : 'Activer'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Row: Tester une alerte */}
                <button
                    type="button"
                    onClick={sendTestNotification}
                    className="w-full bg-[#f0f7ff] dark:bg-blue-950/30 border border-[#dbeafe] dark:border-blue-900/40 rounded-2xl p-3 sm:p-3.5 px-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                            <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm text-[#2563eb] dark:text-blue-400">
                            {testAlertSent ? "Alerte de test envoyée !" : "Tester une alerte"}
                        </span>
                    </div>
                    <div className="text-[#2563eb] dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                        <ChevronRightIcon className="w-4.5 h-4.5" />
                    </div>
                </button>

                {/* Exp V2: Notifications Enrichies Banner */}
                {flags.richNotifications && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
                                EXP V2
                            </span>
                            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                                Mode Notifications Enrichies Actif
                            </h4>
                        </div>
                        <p className="text-xs text-amber-900/80 dark:text-amber-300">
                            Les notifications incluent désormais la répartition automatique par catégorie, l'icône personnalisée du payeur et le résumé intelligent.
                        </p>
                    </div>
                )}
            </div>

            {/* CARD 2: FILTRES & MOTIFS DE NOTIFICATIONS */}
            <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 shadow-xs border border-slate-100/90 dark:border-slate-700/60 space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#e0f2fe] dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                            Filtres & motifs de notifications
                        </h3>
                    </div>

                    {/* Cloud status pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#059669] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#a7f3d0] dark:border-emerald-900/50">
                        {isSyncingPrefs ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Synchronisation...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                <span>Enregistré sur le cloud</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Subsection 1: Auteurs à suivre */}
                <div className="space-y-2.5">
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            Auteurs à suivre
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Choisissez qui peut déclencher des notifications.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                        {/* Sophie */}
                        {(() => {
                            const isChecked = prefAuthors.includes('Sophie');
                            return (
                                <button
                                    type="button"
                                    onClick={() => handleAuthorToggle('Sophie')}
                                    className={`py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition-all cursor-pointer font-bold text-xs sm:text-sm min-w-0 ${
                                        isChecked
                                            ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-[#bae6fd] dark:border-sky-800 text-slate-900 dark:text-white shadow-2xs'
                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    <div className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                                        isChecked
                                            ? 'bg-[#0284c7] text-white'
                                            : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                    }`}>
                                        {isChecked && (
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm sm:text-base shrink-0">👤</span>
                                    <span className="truncate">Sophie</span>
                                </button>
                            );
                        })()}

                        {/* Vincent */}
                        {(() => {
                            const isChecked = prefAuthors.includes('Vincent');
                            return (
                                <button
                                    type="button"
                                    onClick={() => handleAuthorToggle('Vincent')}
                                    className={`py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition-all cursor-pointer font-bold text-xs sm:text-sm min-w-0 ${
                                        isChecked
                                            ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-[#bae6fd] dark:border-sky-800 text-slate-900 dark:text-white shadow-2xs'
                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    <div className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                                        isChecked
                                            ? 'bg-[#0284c7] text-white'
                                            : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                    }`}>
                                        {isChecked && (
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm sm:text-base shrink-0">👤</span>
                                    <span className="truncate">Vincent</span>
                                </button>
                            );
                        })()}

                        {/* Dépenses communes */}
                        {(() => {
                            const isChecked = prefAuthors.includes('Commun');
                            return (
                                <button
                                    type="button"
                                    onClick={() => handleAuthorToggle('Commun')}
                                    className={`py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl border flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition-all cursor-pointer font-bold text-xs sm:text-sm min-w-0 ${
                                        isChecked
                                            ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-[#bae6fd] dark:border-sky-800 text-slate-900 dark:text-white shadow-2xs'
                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    <div className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                                        isChecked
                                            ? 'bg-[#0284c7] text-white'
                                            : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                    }`}>
                                        {isChecked && (
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm sm:text-base shrink-0">👥</span>
                                    <span className="truncate">Communes</span>
                                </button>
                            );
                        })()}
                    </div>
                </div>

                {/* Subsection 2: Montant minimum */}
                <div className="space-y-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Alerter uniquement si le montant est supérieur ou égal à :
                    </h4>
                    <div className="flex items-center gap-4 pt-1">
                        <div className="flex-1 relative flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="5"
                                value={prefMinAmount}
                                onChange={(e) => handleMinAmountChange(Number(e.target.value))}
                                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                            />
                        </div>
                        <div className="px-4 py-1.5 bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-xl font-extrabold text-sm text-slate-900 dark:text-white min-w-[70px] text-center shadow-2xs">
                            {prefMinAmount} €
                        </div>
                    </div>
                </div>

                {/* Subsection 3: Catégories surveillées */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            Catégories surveillées ({prefCategories.length}/{availableCategories.length})
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAllCategories}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#eff6ff] text-[#2563eb] hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition-colors cursor-pointer"
                            >
                                Tout cocher
                            </button>
                            <button
                                type="button"
                                onClick={handleSelectNoneCategories}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#eff6ff] text-[#2563eb] hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition-colors cursor-pointer"
                            >
                                Tout décocher
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                        {availableCategories.map((category) => {
                            const isChecked = prefCategories.includes(category);
                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => handleCategoryToggle(category)}
                                    className={`p-2.5 px-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left font-bold text-xs sm:text-sm min-w-0 ${
                                        isChecked
                                            ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-[#bae6fd] dark:border-sky-800 text-slate-900 dark:text-white shadow-2xs'
                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                                        isChecked
                                            ? 'bg-[#0284c7] text-white'
                                            : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                    }`}>
                                        {isChecked && (
                                            <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="shrink-0">
                                        {getCategoryIcon(category)}
                                    </span>
                                    <span className="truncate flex-1">
                                        {formatCategoryLabel(category)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Subsection 4: Types d'activités à suivre */}
                <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        Types d'activités à suivre
                    </h4>

                    <div className="space-y-3">
                        {/* 1. Cagnotte & Commun */}
                        <div 
                            onClick={() => handleUpdatePreference({ includeMoneyPot: !prefIncludeMoneyPot })}
                            className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100/90 dark:border-slate-700/60 flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800 transition-colors group shadow-2xs"
                        >
                            <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                                prefIncludeMoneyPot
                                    ? 'bg-[#0284c7] text-white'
                                    : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}>
                                {prefIncludeMoneyPot && (
                                    <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="w-11 h-11 rounded-full bg-[#dcfce7] dark:bg-emerald-950/60 text-[#10b981] dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-lg">
                                $
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">
                                    Cagnotte & Commun
                                </p>
                                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                    Recevoir les mouvements de fonds ou versements de la cagnotte
                                </p>
                            </div>
                        </div>

                        {/* 2. Suppressions de dépenses */}
                        <div 
                            onClick={() => handleUpdatePreference({ includeDeletes: !prefIncludeDeletes })}
                            className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100/90 dark:border-slate-700/60 flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800 transition-colors group shadow-2xs"
                        >
                            <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                                prefIncludeDeletes
                                    ? 'bg-[#0284c7] text-white'
                                    : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}>
                                {prefIncludeDeletes && (
                                    <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="w-11 h-11 rounded-full bg-[#ffe4e6] dark:bg-rose-950/60 text-[#e11d48] dark:text-rose-400 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">
                                    Suppressions de dépenses
                                </p>
                                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                    Recevoir une alerte quand une dépense est retirée ou annulée
                                </p>
                            </div>
                        </div>

                        {/* 3. Mode Ne Pas Déranger */}
                        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100/90 dark:border-slate-700/60 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between gap-3.5">
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className="w-11 h-11 rounded-full bg-[#f3e8ff] dark:bg-purple-950/60 text-[#9333ea] dark:text-purple-400 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">
                                            Mode Ne Pas Déranger
                                        </p>
                                        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                            Sommeil silencieux
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle switch */}
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={prefQuietHoursActive}
                                    onClick={() => handleUpdatePreference({ quietHoursActive: !prefQuietHoursActive })}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        prefQuietHoursActive ? 'bg-[#0284c7]' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            prefQuietHoursActive ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {prefQuietHoursActive && (
                                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                    <span>Silencieux de</span>
                                    <input
                                        type="time"
                                        value={prefQuietHoursStart}
                                        onChange={(e) => handleUpdatePreference({ quietHoursStart: e.target.value })}
                                        className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs"
                                    />
                                    <span>jusqu'à</span>
                                    <input
                                        type="time"
                                        value={prefQuietHoursEnd}
                                        onChange={(e) => handleUpdatePreference({ quietHoursEnd: e.target.value })}
                                        className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 4. Mode Confidentiel */}
                        <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100/90 dark:border-slate-700/60 flex items-center justify-between gap-3.5 shadow-2xs">
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <div className="w-11 h-11 rounded-full bg-[#e0f2fe] dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">
                                        Mode Confidentiel
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                        Masquer l'auteur et le montant sur l'écran verrouillé
                                    </p>
                                </div>
                            </div>

                            {/* Toggle switch */}
                            <button
                                type="button"
                                role="switch"
                                aria-checked={prefPrivacyMode}
                                onClick={() => handleUpdatePreference({ privacyMode: !prefPrivacyMode })}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    prefPrivacyMode ? 'bg-[#0284c7]' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        prefPrivacyMode ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 3: NOTE TECHNIQUE */}
            <div className="bg-[#f0f7ff] dark:bg-blue-950/30 border border-[#dbeafe] dark:border-blue-900/40 rounded-[22px] p-4 sm:p-5 flex gap-3.5 items-start">
                <div className="w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    i
                </div>
                <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#1e40af] dark:text-blue-300">
                        Note technique
                    </h4>
                    <p className="text-xs sm:text-sm text-[#2563eb]/90 dark:text-blue-300/80 leading-relaxed font-medium">
                        Les préférences de notifications push sont directement rattachées à votre appareil/navigateur. En filtrant les notifications avant leur dispatch, vous économisez de la batterie et de la bande passante tout en gardant une vie privée totalement sous contrôle.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationsTab;
