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
            
            // Supporte à la fois le format direct (frontend) et le format Webhook (Supabase)
            const newExpense = req.body?.expense || req.body?.record;
            if (!newExpense) {
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

            // Préparation de la notification
            const author = newExpense.user || "Quelqu'un";
            const payload = JSON.stringify({
                title: 'DuoBudget - Nouvelle dépense',
                body: `${author} a ajouté une dépense de ${newExpense.amount}€ (${newExpense.description || newExpense.category})`,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                data: { url: '/' }
            });

            // Envoi aux abonnés (on n'envoie pas à l'auteur de la dépense)
            const sendPromises = subscriptions
                .filter((sub) => sub.user_id !== author)
                .map(async (s: any) => {
                const subscription = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
                
                // Vérifier les préférences de l'abonné
                if (subscription && subscription.preferences) {
                    const prefs = subscription.preferences;
                    // 1. Filtrer par auteur
                    if (prefs.authors && Array.isArray(prefs.authors)) {
                        if (!prefs.authors.includes(newExpense.user)) {
                            console.log(`Notification ignorée pour ${s.user_id} : auteur ${newExpense.user} filtré.`);
                            return;
                        }
                    }
                    // 2. Filtrer par montant minimum
                    if (typeof prefs.minAmount === 'number') {
                        if (newExpense.amount < prefs.minAmount) {
                            console.log(`Notification ignorée pour ${s.user_id} : montant ${newExpense.amount}€ inférieur au min.`);
                            return;
                        }
                    }
                    // 3. Filtrer par catégories
                    if (prefs.categories && Array.isArray(prefs.categories)) {
                        if (!prefs.categories.includes(newExpense.category)) {
                            console.log(`Notification ignorée pour ${s.user_id} : catégorie ${newExpense.category} filtrée.`);
                            return;
                        }
                    }
                }

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
