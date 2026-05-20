import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { type User } from '../types';

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

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                // Ensure it's in Supabase by inserting if needed
                // Using a try-catch for the insert just in case
                try {
                    const { data } = await supabase.from('push_subscriptions')
                        .select('id')
                        .eq('user_id', loggedInUser === 'Duo' ? 'Commun' : loggedInUser);
                        
                    if (!data || data.length === 0) {
                        const { error } = await supabase.from('push_subscriptions').insert({
                            user_id: loggedInUser === 'Duo' ? 'Commun' : loggedInUser,
                            subscription: subscription.toJSON()
                        });
                        if (error) {
                            console.error("Supabase insert error", error);
                            alert("Erreur de synchronisation DB : " + error.message);
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
            
            const { error: insertError } = await supabase.from('push_subscriptions').insert({
                user_id: userId,
                subscription: subscription.toJSON()
            });

            if (insertError) {
                console.error("Erreur lors de l'enregistrement de l'abonnement :", insertError);
                alert("Erreur DB (" + insertError.code + ") : " + insertError.message);
            } else {
                setIsSubscribed(true);
                alert("Synchronisation réussie !");
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
                    Pour recevoir des rappels sur votre appareil, vous devez autoriser les notifications. Sur mobile, vous devez d'abord installer l'application sur votre écran d'accueil.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div>
                            <p className="font-semibold">Statut des notifications</p>
                            <p className="text-sm text-slate-500">
                                {permission === 'granted' ? 'Activées' : permission === 'denied' ? 'Refusées' : 'Non demandées'}
                            </p>
                        </div>
                        {permission !== 'granted' && permission !== 'denied' && (
                            <button
                                onClick={requestPermission}
                                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium shadow-sm hover:shadow"
                            >
                                Autoriser
                            </button>
                        )}
                        {permission === 'denied' && (
                            <div className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-medium">Bloquées</div>
                        )}
                        {permission === 'granted' && !isSubscribed && (
                            <button
                                onClick={subscribeUser}
                                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium shadow-sm hover:shadow"
                            >
                                S'abonner aux serveurs
                            </button>
                        )}
                        {permission === 'granted' && isSubscribed && (
                            <div className="flex gap-2 items-center">
                                <div className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm font-medium">Connectées</div>
                                <button
                                    onClick={subscribeUser}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                                >
                                    Forcer la synchronisation
                                </button>
                                <button
                                    onClick={() => {
                                        fetch('/api/test-notification', { method: 'POST' }).then(r => r.json()).then(d => alert(d.message || 'Succès')).catch(() => alert('Erreur'));
                                    }}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                                >
                                    Tester le Push Serveur
                                </button>
                            </div>
                        )}
                    </div>

                    {permission === 'granted' && (
                        <button
                            onClick={sendTestNotification}
                            className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-brand-500 transition-colors font-medium flex justify-center items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                            Envoyer une notification de test
                        </button>
                    )}
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm">
                    <strong>Note technique :</strong> Les vraies notifications système (quand l'application est fermée) nécessitent un serveur de notification complet, mais vous verrez quand même les alertes ici quand l'app est ouverte au moment du signalement !
                </div>
            </div>
        </div>
    );
};

export default NotificationsTab;
