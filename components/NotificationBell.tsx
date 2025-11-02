import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

const VAPID_PUBLIC_KEY = 'BPD-n-y_kP-8dC-2y5-uUPlwR2yHAnJ-2-6G-gqfbXcT1a-Zp4Jz1-k8k_y3Y6X5z6n8w7X9y8j7e6r5t4o3Z2k';

// Helper pour convertir la clé VAPID pour l'API Push
const urlBase64ToUint8Array = (base64String: string) => {
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

const NotificationBell: React.FC = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(true);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setIsSubscribed(true);
                    }
                    setIsLoading(false);
                });
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const subscribeUser = async () => {
        setIsLoading(true);
        if (permission === 'denied') {
            alert("Vous avez bloqué les notifications. Veuillez les autoriser dans les paramètres de votre navigateur.");
            setIsLoading(false);
            return;
        }

        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            
            const { error } = await supabase.from('subscriptions').insert({
                subscription_data: sub.toJSON(),
            });

            if (error) {
                console.error('Erreur lors de la sauvegarde de l\'abonnement:', error);
                alert("Une erreur est survenue lors de l'enregistrement de votre abonnement aux notifications. La cause la plus fréquente est une règle de sécurité manquante sur la base de données (RLS).");
                await sub.unsubscribe();
                setIsSubscribed(false);
            } else {
                console.log('Utilisateur abonné.');
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Échec de l\'abonnement de l\'utilisateur: ', error);
        }
        setIsLoading(false);
    };
    
    const unsubscribeUser = async () => {
        setIsLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                const subJSON = sub.toJSON();
                const { error } = await supabase
                    .from('subscriptions')
                    .delete()
                    .eq('subscription_data->>endpoint', subJSON.endpoint);

                if (error) {
                    console.error('Erreur lors de la suppression de l\'abonnement:', error);
                    alert("Une erreur est survenue lors de la désactivation des notifications. Veuillez réessayer.");
                } else {
                    await sub.unsubscribe();
                    console.log('Utilisateur désabonné.');
                    setIsSubscribed(false);
                }
            }
        } catch (error) {
            console.error('Erreur lors du désabonnement', error);
        }
        setIsLoading(false);
    };

    const handleToggleSubscription = async () => {
        if (isSubscribed) {
            await unsubscribeUser();
        } else {
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm === 'granted') {
                await subscribeUser();
            }
        }
    };

    if (!isSupported) {
        return null;
    }

    const getButtonState = () => {
        if (isLoading) return { label: "Chargement...", disabled: true, icon: <BellIcon /> };
        if (permission === 'denied') return { label: "Notifications bloquées", disabled: true, icon: <BellSlashIcon /> };
        if (isSubscribed) return { label: "Désactiver les notifications", disabled: false, icon: <BellIcon /> };
        return { label: "Activer les notifications", disabled: false, icon: <BellSlashIcon /> };
    }

    const { label, disabled, icon } = getButtonState();

    return (
        <button
            onClick={handleToggleSubscription}
            disabled={disabled}
            className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={label}
            title={label}
        >
            {icon}
        </button>
    );
};

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const BellSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341" />
  </svg>
);

export default NotificationBell;