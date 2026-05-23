import express from "express";
import path from "path";
import cors from "cors";
import webpush from "web-push";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

// VAPID KEYS
const VAPID_PUBLIC_KEY = 'BN0Z3nqz3OLK1q2RuvukfLMAffOncCrBsvMw7GncY_9EK8u6-W0OzfIsRElejTlC-TM2uNDXCZkicnJX47pNGdc';
const VAPID_PRIVATE_KEY = 'g1sFLkHhpqVT5NOxZIIXMrUIBXHhOi90Rcd3VD9YZHo';
webpush.setVapidDetails(
    'mailto:vincent.carlin@sfr.fr',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// We define our own supabase client for the server using the anon key (which has access thanks to RLS)
const supabaseUrl = 'https://xcdyshzyxpngbpceilym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHlzaHp5eHBuZ2JwY2VpbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI4NDYsImV4cCI6MjA3NzMxODg0Nn0.woxCgIKTPvEy7s2ePIJIAIflwal8dG5ApTfpyWy9feQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

    // Notre endpoint de test
    app.post("/api/test-notification", async (req, res) => {
        try {
            const { data: subscriptions, error: subsError } = await supabase.from('push_subscriptions').select('subscription, user_id');
            if (subsError) {
                console.error("Erreur DB lors de la récupération des souscriptions:", subsError);
                return res.status(500).json({ message: "Erreur DB: " + subsError.message });
            }
            if (!subscriptions || subscriptions.length === 0) return res.status(200).json({ message: "Aucun abonné enregistré" });
            
            const payload = JSON.stringify({
                title: 'Test de Push backend',
                body: "Ceci est un test direct du serveur vers votre appareil.",
                icon: '/icon-192x192.png',
                data: { url: '/' }
            });

            const sendPromises = subscriptions.map(async (s: any) => {
                try {
                    const sub = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
                    if (sub) {
                        await webpush.sendNotification(sub, payload);
                    }
                } catch(e: any) {
                    console.error("Erreur d'envoi à une souscription:", e.message || e);
                }
            });
            await Promise.all(sendPromises);
            res.status(200).json({ message: "Test de notification push envoyé à tous les " + subscriptions.length + " abonné(s) !" });
        } catch (err: any) {
            console.error("Erreur d'exécution du test-notification:", err);
            res.status(500).json({ message: "Erreur serveur : " + (err.message || String(err)) });
        }
    });

    app.post("/api/send-notification", async (req, res) => {
        try {
            console.log("Requête de notification reçue:", req.body);
            
            // Normalize inputs
            let type: 'add' | 'delete' | 'update' | 'moneypot' = req.body?.type || 'add';
            const expense = req.body?.expense || req.body?.record;
            const moneyPotTransaction = req.body?.moneyPotTransaction;

            if (!expense && !moneyPotTransaction) {
                return res.status(200).json({ message: "Ignoré : Aucune donnée reçue" });
            }

            const { data: subscriptions, error: subsError } = await supabase
                .from('push_subscriptions')
                .select('subscription, user_id');

            if (subsError) {
                console.error("Erreur lecture Supabase:", subsError);
                return res.status(500).json({ error: subsError.message });
            }

            if (!subscriptions || subscriptions.length === 0) {
                return res.status(200).json({ message: "Aucun abonné enregistré." });
            }

            // Déduire l'auteur de l'événement
            const author = expense 
                ? (expense.user || "Quelqu'un") 
                : (moneyPotTransaction ? (moneyPotTransaction.user_name || "Quelqu'un") : "Quelqu'un");

            // Filtrer les abonnements pour ne pas envoyer à l'auteur lui-même
            const targetSubs = subscriptions.filter((sub) => sub.user_id !== author);

            if (targetSubs.length === 0) {
                return res.status(200).json({ message: "Aucun autre utilisateur à notifier." });
            }

            const sendPromises = targetSubs.map(async (s: any) => {
                const subscription = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
                
                if (!subscription) return;

                // 1. Appliquer les filtres par préférence de l'abonné
                if (subscription.preferences) {
                    const prefs = subscription.preferences;

                    // A. Plage horaire de silence (Ne pas déranger)
                    if (prefs.quietHoursActive && prefs.quietHoursStart && prefs.quietHoursEnd) {
                        const now = new Date();
                        const currentHours = now.getHours();
                        const currentMinutes = now.getMinutes();
                        const currentTotalMinutes = currentHours * 60 + currentMinutes;

                        const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
                        const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
                        const startTotalMinutes = startH * 60 + startM;
                        const endTotalMinutes = endH * 60 + endM;

                        let isInQuietHours = false;
                        if (startTotalMinutes <= endTotalMinutes) {
                            isInQuietHours = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
                        } else {
                            isInQuietHours = currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes;
                        }

                        if (isInQuietHours) {
                            console.log(`Notification ignorée pour ${s.user_id} : Plage horaire silencieuse active.`);
                            return;
                        }
                    }

                    // B. Filtre Suppressions
                    if (type === 'delete' && prefs.includeDeletes === false) {
                        console.log(`Notification ignorée pour ${s.user_id} : Alerte de suppression désactivée.`);
                        return;
                    }

                    // C. Filtre Cagnotte
                    const isCategoryCagnotte = expense && (expense.category === 'Cagnotte' || expense.category === 'Cagnotte commune');
                    if ((type === 'moneypot' || isCategoryCagnotte) && prefs.includeMoneyPot === false) {
                        console.log(`Notification ignorée pour ${s.user_id} : Alerte de cagnotte désactivée.`);
                        return;
                    }

                    // D. Filtrer les dépenses par auteur
                    if (expense && (type === 'add' || type === 'update' || type === 'delete')) {
                        if (prefs.authors && Array.isArray(prefs.authors)) {
                            if (!prefs.authors.includes(expense.user)) {
                                console.log(`Notification ignorée pour ${s.user_id} : auteur ${expense.user} filtré.`);
                                return;
                            }
                        }
                    }

                    // E. Filtrer par montant minimum
                    if (expense && (type === 'add' || type === 'update')) {
                        if (typeof prefs.minAmount === 'number') {
                            if (expense.amount < prefs.minAmount) {
                                console.log(`Notification ignorée pour ${s.user_id} : montant ${expense.amount}€ inférieur au min.`);
                                return;
                            }
                        }
                    }

                    // F. Filtrer par catégories
                    if (expense && (type === 'add' || type === 'update')) {
                        if (prefs.categories && Array.isArray(prefs.categories)) {
                            if (!prefs.categories.includes(expense.category)) {
                                console.log(`Notification ignorée pour ${s.user_id} : catégorie ${expense.category} filtrée.`);
                                return;
                            }
                        }
                    }
                }

                // 2. Conception personnalisée du payload de notification (Confidentialité)
                const isPrivacy = subscription.preferences?.privacyMode === true;
                
                let title = 'Mise à jour';
                let body = '';

                if (isPrivacy) {
                    title = 'Notification 🔒';
                    if (type === 'delete') {
                        body = 'Une dépense a été retirée par votre partenaire.';
                    } else if (type === 'moneypot') {
                        body = 'Une opération sur la cagnotte a été enregistrée.';
                    } else if (type === 'update') {
                        body = 'Une dépense a été mise à jour par votre partenaire.';
                    } else {
                        body = 'Votre partenaire a ajouté une nouvelle activité.';
                    }
                } else {
                    if (type === 'delete') {
                        title = 'Dépense supprimée';
                        body = `${author} a supprimé la dépense de ${expense.amount}€ (${expense.description || expense.category})`;
                    } else if (type === 'update') {
                        title = 'Dépense modifiée';
                        body = `${author} a modifié la dépense : ${expense.description || expense.category} (${expense.amount}€)`;
                    } else if (type === 'moneypot') {
                        title = 'Cagnotte commune';
                        const symbol = moneyPotTransaction.amount >= 0 ? '+' : '';
                        body = `${author} a enregistré une transaction de ${symbol}${moneyPotTransaction.amount}€ dans la cagnotte : ${moneyPotTransaction.description || ''}`;
                    } else {
                        title = 'Nouvelle dépense';
                        body = `${author} a ajouté une dépense de ${expense.amount}€ (${expense.description || expense.category})`;
                    }
                }

                const payload = JSON.stringify({
                    title,
                    body,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    data: { url: '/' }
                });

                try {
                    await webpush.sendNotification(subscription, payload);
                    console.log('Notification envoyée avec succès à', s.user_id);
                } catch (error: any) {
                    // Suppression si l'abonnement est expiré ou invalide
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log('Abonnement expiré, suppression pour', s.user_id);
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('user_id', s.user_id);
                    } else {
                        console.error('Erreur lors de l\'envoi de la notification:', error);
                    }
                }
            });

            await Promise.all(sendPromises);
            res.status(200).json({ success: true, message: "Processus de notification terminé" });

        } catch (err: any) {
            console.error("Erreur serveur lors de la notification:", err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    });

    // Vite middleware for development (pour servir le front)
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        // Important: Use * for Express v4, *all for Express v5
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
