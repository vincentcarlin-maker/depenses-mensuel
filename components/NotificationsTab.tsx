import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { type User } from '../types';
import { notifySubscriptionsDirectly } from '../webpush-client';

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

const NotificationsTab: React.FC<NotificationsTabProps> = ({ loggedInUser }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    
    // Notification preferences states
    const [prefAuthors, setPrefAuthors] = useState<string[]>(['Sophie', 'Vincent', 'Commun']);
    const [prefMinAmount, setPrefMinAmount] = useState<number>(0);
    const [prefCategories, setPrefCategories] = useState<string[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [isSyncingPrefs, setIsSyncingPrefs] = useState(false);

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
            "Vacances",
            "Réparation voitures",
            "Vêtements",
            "Cadeau",
            "Complément alimentaire",
            "Divers",
        ];
        setAvailableCategories(cats);

        // Charger les préférences de notifications locales
        const savedPrefs = localStorage.getItem('notificationPreferences');
        if (savedPrefs) {
            try {
                const parsed = JSON.parse(savedPrefs);
                if (parsed.authors) setPrefAuthors(parsed.authors);
                if (typeof parsed.minAmount === 'number') setPrefMinAmount(parsed.minAmount);
                if (parsed.categories) {
                    // Filtrer pour éliminer d'anciennes catégories si supprimées
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
                const userId = loggedInUser === 'Duo' ? 'Commun' : loggedInUser;
                try {
                    const { data } = await supabase.from('push_subscriptions')
                        .select('subscription, id')
                        .eq('user_id', userId);
                        
                    if (!data || data.length === 0) {
                        const localPrefs = {
                            authors: prefAuthors,
                            minAmount: prefMinAmount,
                            categories: prefCategories.length > 0 ? prefCategories : availableCategories
                        };
                        const subscriptionJSON = subscription.toJSON() as any;
                        subscriptionJSON.preferences = localPrefs;

                        await supabase.from('push_subscriptions').insert({
                            user_id: userId,
                            subscription: subscriptionJSON
                        });
                    } else {
                        // Si l'abonnement existe déjà sur Supabase, on lit ses préférences pour mettre le front à jour
                        const subObj = typeof data[0].subscription === 'string'
                            ? JSON.parse(data[0].subscription)
                            : data[0].subscription;
                        
                        if (subObj && subObj.preferences) {
                            const prefs = subObj.preferences;
                            if (prefs.authors) setPrefAuthors(prefs.authors);
                            if (typeof prefs.minAmount === 'number') setPrefMinAmount(prefs.minAmount);
                            if (prefs.categories) setPrefCategories(prefs.categories);
                            
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

    const syncPrefsToSupabase = async (authors: string[], minAmount: number, categories: string[]) => {
        setIsSyncingPrefs(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                const userId = loggedInUser === 'Duo' ? 'Commun' : loggedInUser;
                const subscriptionJSON = subscription.toJSON() as any;
                subscriptionJSON.preferences = {
                    authors,
                    minAmount,
                    categories
                };
                
                // Mettre à jour dans Supabase
                await supabase.from('push_subscriptions').delete().eq('user_id', userId);
                const { error } = await supabase.from('push_subscriptions').insert({
                    user_id: userId,
                    subscription: subscriptionJSON
                });
                
                if (error) {
                    console.error("Erreur de synchro des préférences DB:", error);
                }
            }
        } catch (e) {
            console.error("Erreur de synchro préf:", e);
        } finally {
            setIsSyncingPrefs(false);
        }
    };

    const handleAuthorToggle = (author: string) => {
        const nextAuthors = prefAuthors.includes(author)
            ? prefAuthors.filter(a => a !== author)
            : [...prefAuthors, author];
        setPrefAuthors(nextAuthors);
        const nextPrefs = { authors: nextAuthors, minAmount: prefMinAmount, categories: prefCategories };
        localStorage.setItem('notificationPreferences', JSON.stringify(nextPrefs));
        syncPrefsToSupabase(nextAuthors, prefMinAmount, prefCategories);
    };

    const handleMinAmountChange = (val: number) => {
        setPrefMinAmount(val);
        const nextPrefs = { authors: prefAuthors, minAmount: val, categories: prefCategories };
        localStorage.setItem('notificationPreferences', JSON.stringify(nextPrefs));
        syncPrefsToSupabase(prefAuthors, val, prefCategories);
    };

    const handleCategoryToggle = (cat: string) => {
        const nextCats = prefCategories.includes(cat)
            ? prefCategories.filter(c => c !== cat)
            : [...prefCategories, cat];
        setPrefCategories(nextCats);
        const nextPrefs = { authors: prefAuthors, minAmount: prefMinAmount, categories: nextCats };
        localStorage.setItem('notificationPreferences', JSON.stringify(nextPrefs));
        syncPrefsToSupabase(prefAuthors, prefMinAmount, nextCats);
    };

    const handleSelectAllCategories = () => {
        const catsToSet = availableCategories.length > 0 ? availableCategories : [
            "Dépenses obligatoires", "Carburant", "Chauffage", "Courses", "Restaurant",
            "Vacances", "Réparation voitures", "Vêtements", "Cadeau", "Complément alimentaire", "Divers"
        ];
        setPrefCategories(catsToSet);
        const nextPrefs = { authors: prefAuthors, minAmount: prefMinAmount, categories: catsToSet };
        localStorage.setItem('notificationPreferences', JSON.stringify(nextPrefs));
        syncPrefsToSupabase(prefAuthors, prefMinAmount, catsToSet);
    };

    const handleSelectNoneCategories = () => {
        setPrefCategories([]);
        const nextPrefs = { authors: prefAuthors, minAmount: prefMinAmount, categories: [] };
        localStorage.setItem('notificationPreferences', JSON.stringify(nextPrefs));
        syncPrefsToSupabase(prefAuthors, prefMinAmount, []);
    };

    const subscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const applicationServerKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // Sauvegarder dans Supabase (on efface l'ancien s'il existe pour éviter le doublon d'ID)
            const userId = loggedInUser === 'Duo' ? 'Commun' : loggedInUser;
            await supabase.from('push_subscriptions').delete().eq('user_id', userId);
            
            const subJSON = subscription.toJSON() as any;
            subJSON.preferences = {
                authors: prefAuthors,
                minAmount: prefMinAmount,
                categories: prefCategories.length > 0 ? prefCategories : availableCategories
            };

            const { error: insertError } = await supabase.from('push_subscriptions').insert({
                user_id: userId,
                subscription: subJSON
            });

            if (insertError) {
                console.error("Erreur lors de l'enregistrement de l'abonnement :", insertError);
                alert("Erreur DB (" + insertError.code + ") : " + insertError.message);
            } else {
                setIsSubscribed(true);
                alert("Synchronisation réussie ! Vos préférences ont été appliquées.");
            }
        } catch (error: any) {
            console.error('Erreur lors de la souscription aux notifications push', error);
            alert("Erreur de souscription: " + (error.message || "Inconnue"));
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
        if (permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification("DuoBudget", {
                    body: "Ceci est une notification de test de DuoBudget !",
                    icon: "/logo.svg",
                    badge: "/logo.svg",
                    vibrate: [200, 100, 200]
                });
            } catch (error) {
                // Fallback si le SW n'est pas prêt
                new Notification("DuoBudget", {
                    body: "Ceci est une notification de test !",
                    icon: "/logo.svg"
                });
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-700 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-4">Notifications Push</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Pour recevoir des rappels sur votre appareil en temps réel, vous devez autoriser les notifications. Sur mobile, vous devez d'abord installer l'application sur votre écran d'accueil.
                </p>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl gap-4">
                        <div>
                            <p className="font-semibold">Statut des notifications</p>
                            <p className="text-sm text-slate-500">
                                {permission === 'granted' ? 'Activées' : permission === 'denied' ? 'Refusées' : 'Non demandées'}
                            </p>
                        </div>
                        {permission !== 'granted' && permission !== 'denied' && (
                            <button
                                onClick={requestPermission}
                                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium shadow-sm hover:shadow self-start sm:self-auto"
                            >
                                Autoriser
                            </button>
                        )}
                        {permission === 'denied' && (
                            <div className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-medium self-start sm:self-auto">Bloquées</div>
                        )}
                        {permission === 'granted' && !isSubscribed && (
                            <button
                                onClick={subscribeUser}
                                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium shadow-sm hover:shadow self-start sm:self-auto"
                            >
                                S'abonner aux serveurs
                            </button>
                        )}
                        {permission === 'granted' && isSubscribed && (
                            <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                                <div className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm font-medium">Connectées</div>
                                <button
                                    onClick={subscribeUser}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                                >
                                    Forcer la synchronisation
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const payload = { 
                                                expense: { 
                                                    user: loggedInUser === 'Duo' ? 'Commun' : (loggedInUser === 'Vincent' ? 'Sophie' : 'Vincent'), 
                                                    amount: 99.99, 
                                                    description: 'Test depuis frontend', 
                                                    category: 'Restaurant' 
                                                } 
                                            };
                                            
                                            // Essayer d'abord d'appeler l'Edge Function Supabase (nécessaire sur GitHub Pages)
                                            const { data, error } = await supabase.functions.invoke('send-notification', {
                                                body: payload
                                            });

                                            if (error) {
                                                console.warn("L'Edge Function a retourné une erreur, tentative d'envoi Push direct client-side...", error);
                                                
                                                // Tentative d'envoi direct depuis le navigateur client
                                                const directRes = await notifySubscriptionsDirectly(loggedInUser === 'Duo' ? 'Commun' : loggedInUser, payload.expense);
                                                if (directRes.success) {
                                                    alert(`Succès ! Notification envoyée directement depuis votre navigateur à ${directRes.count} appareil(s).`);
                                                } else {
                                                    // Si l'envoi direct échoue aussi, on tente l'API locale en ultime secours
                                                    console.warn("L'envoi direct client-side a échoué, tentative via API locale...");
                                                    const r = await fetch(window.location.origin + '/api/send-notification', { 
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify(payload)
                                                    });
                                                    const localData = await r.json();
                                                    if (!r.ok || localData.error) {
                                                        throw new Error(localData.error || 'Erreur serveur local');
                                                    }
                                                    alert(localData.message || 'Succès (via serveur Express local)');
                                                }
                                            } else {
                                                alert(data.message || 'Succès ! Notification envoyée via Supabase Edge Function.');
                                            }
                                        } catch (e: any) {
                                            alert(
                                                "Erreur d'envoi. Veuillez réessayer ou vérifier vos réglages de filtres de notification.\n\nDétails : " + (e.message || e)
                                            );
                                        }
                                    }}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                >
                                    Simuler Dépense
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            // Appel de l'Edge Function Supabase en mode Test
                                            const { data, error } = await supabase.functions.invoke('send-notification', {
                                                body: { isTest: true }
                                            });

                                            if (error) {
                                                console.warn("L'Edge Function de test a échoué. Envoi direct d'un signal Push client-side...", error);
                                                
                                                const directRes = await notifySubscriptionsDirectly(loggedInUser === 'Duo' ? 'Commun' : loggedInUser, null);
                                                if (directRes.success) {
                                                    alert(`Succès ! Signal Push émis en direct depuis le navigateur à ${directRes.count} appareil(s).`);
                                                } else {
                                                    console.warn("Le push direct a échoué, tentative locale...");
                                                    const r = await fetch('/api/test-notification', { method: 'POST' });
                                                    const contentType = r.headers.get('content-type');
                                                    if (contentType && contentType.includes('application/json')) {
                                                        const localData = await r.json();
                                                        if (!r.ok) {
                                                            throw new Error(localData.message || localData.error || `Erreur serveur (${r.status})`);
                                                        }
                                                        alert(localData.message || 'Succès de test (Local)');
                                                    } else {
                                                        const text = await r.text();
                                                        throw new Error(text || `Erreur http ${r.status}`);
                                                    }
                                                }
                                            } else {
                                                alert(data.message || 'Succès ! Test de Push envoyé via Supabase Edge Function.');
                                            }
                                        } catch (e: any) {
                                            alert(
                                                "Erreur lors du test de Push.\n\nDétails : " + (e.message || e)
                                            );
                                        }
                                    }}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                                >
                                    Tester le Push Serveur
                                </button>
                            </div>
                        )}
                    </div>

                    {isSubscribed && permission === 'granted' && (
                        <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-6 animate-fade-in mt-4">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    Filtres & Motifs de notifications
                                </h4>
                                {isSyncingPrefs ? (
                                    <span className="text-xs text-brand-500 flex items-center gap-1">
                                        <svg className="animate-spin h-3.5 w-3.5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sauvegarde en cours...
                                    </span>
                                ) : (
                                    <span className="text-xs text-green-500 flex items-center gap-1 font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Enregistré sur le cloud
                                    </span>
                                )}
                            </div>

                            {/* Filtre par Auteur */}
                            <div className="space-y-2">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Auteurs des dépenses à suivre :</span>
                                <div className="flex flex-wrap gap-4 pt-1">
                                    {['Sophie', 'Vincent', 'Commun'].map(author => (
                                        <label key={author} className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input
                                                type="checkbox"
                                                checked={prefAuthors.includes(author)}
                                                onChange={() => handleAuthorToggle(author)}
                                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5"
                                            />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {author === 'Commun' ? 'Dépenses Communes (Duo)' : author}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filtre par Montant minimum */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        Alerter uniquement si le montant est supérieur ou égal :
                                    </span>
                                    <span className="text-sm px-2.5 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold rounded-full">
                                        {prefMinAmount} €
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="500"
                                        step="5"
                                        value={prefMinAmount}
                                        onChange={(e) => handleMinAmountChange(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        value={prefMinAmount}
                                        onChange={(e) => handleMinAmountChange(Number(e.target.value))}
                                        className="w-20 p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-center font-bold text-sm bg-white dark:bg-slate-750"
                                    />
                                </div>
                            </div>

                            {/* Filtre par Catégories/Motifs */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        Motifs / Catégories de dépenses sélectionnés ({prefCategories.length}/{availableCategories.length}) :
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllCategories}
                                            className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded font-medium text-slate-600 dark:text-slate-300 transition-colors"
                                        >
                                            Tout cocher
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSelectNoneCategories}
                                            className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded font-medium text-slate-600 dark:text-slate-300 transition-colors"
                                        >
                                            Tout décocher
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl scrollbar-thin">
                                    {availableCategories.map((category) => {
                                        const isChecked = prefCategories.includes(category);
                                        return (
                                            <label
                                                key={category}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors border ${
                                                    isChecked 
                                                    ? 'bg-brand-50/40 dark:bg-brand-900/10 border-brand-100 dark:border-brand-900/30' 
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleCategoryToggle(category)}
                                                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                                                />
                                                <span className={`truncate font-medium ${isChecked ? 'text-brand-800 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {category}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {permission === 'granted' && (
                        <button
                            onClick={sendTestNotification}
                            className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-brand-500 transition-colors font-medium flex justify-center items-center gap-2 mt-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                            Tester l'envoi direct d'une alerte sur mon écran
                        </button>
                    )}
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm">
                    <strong>Note technique :</strong> Les préférences de notifications push sont directement rattachées à votre appareil/navigateur. En filtrant les notifications avant leur dispatch, vous économisez de la batterie et de la bande passante tout en gardant une vie privée totalement sous contrôle.
                </div>
            </div>
        </div>
    );
};

export default NotificationsTab;
