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

    // Notre endpoint utilisé comme Webhook par Supabase
    app.post("/api/send-notification", async (req, res) => {
        try {
            console.log("Webhook reçu de Supabase:", req.body);
            
            // Le webhook Supabase (Database Trigger) envoie les données dans req.body.record
            const newExpense = req.body?.record;
            if (!newExpense || req.body?.type !== 'INSERT') {
                return res.status(200).json({ message: "Ignoré : Pas un INSERT ou aucune donnée reçue" });
            }

            const { data: subscriptions, error: subsError } = await supabase
                .from('push_subscriptions')
                .select('subscription, user_id');

            if (subsError) {
                console.error("Erreur lecture Supabase:", subsError);
                return res.status(500).json({ error: subsError.message });
            }

            if (!subscriptions || subscriptions.length === 0) {
                return res.status(200).json({ message: "Aucun abonné." });
            }

            // Préparation de la notification
            const author = newExpense.user || "Quelqu'un";
            const payload = JSON.stringify({
                title: 'DuoBudget - Nouvelle dépense',
                body: `${author} a ajouté une dépense de ${newExpense.amount}€ (${newExpense.description || newExpense.category})`,
                icon: '/logo.svg',
                badge: '/logo.svg'
            });

            // Envoi aux abonnés (on évite d'envoyer à l'auteur si possible, mais comme Supabase ne stocke que user_name = user_id dans notre app, on filtre)
            const sendPromises = subscriptions
                .filter((sub) => sub.user_id !== author) // Ne pas envoyer la notif à celui qui crée la dépense !
                .map(async (s: any) => {
                const subscription = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
                try {
                    await webpush.sendNotification(subscription, payload);
                    console.log('Notification envoyée à', s.user_id);
                } catch (error: any) {
                    // Suppression si l'abonnement est expiré
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log('Abonnement invalide, suppression pour', s.user_id);
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('user_id', s.user_id);
                    } else {
                        console.error('Erreur envoi notification:', error);
                    }
                }
            });

            await Promise.all(sendPromises);

            res.status(200).json({ success: true, message: "Notifications envoyées" });

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
