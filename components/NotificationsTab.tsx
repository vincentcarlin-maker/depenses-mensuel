import React, { useState, useEffect } from 'react';

const NotificationsTab: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('Ce navigateur ne supporte pas les notifications.');
            return;
        }

        const perm = await Notification.requestPermission();
        setPermission(perm);
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
                        {permission === 'granted' && (
                            <div className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm font-medium">Autorisées</div>
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
