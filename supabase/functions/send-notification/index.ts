import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Gérer le pré-vol CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("Requête de notification reçue par l'Edge Function Supabase:", body);

    const isTest = body.isTest === true;
    let type: 'add' | 'delete' | 'update' | 'moneypot' = body.type || 'add';
    const expense = body.expense || body.record;
    const moneyPotTransaction = body.moneyPotTransaction;

    // Récupérer l'URL et la clé d'API Supabase de l'environnement de l'Edge Function
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || "https://xcdyshzyxpngbpceilym.supabase.co"
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer les abonnés
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('subscription, user_id')

    if (subsError) {
      console.error("Erreur lecture Supabase:", subsError);
      return new Response(JSON.stringify({ error: subsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "Aucun abonné enregistré" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Configurer VAPID
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BN0Z3nqz3OLK1q2RuvukfLMAffOncCrBsvMw7GncY_9EK8u6-W0OzfIsRElejTlC-TM2uNDXCZkicnJX47pNGdc';
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'g1sFLkHhpqVT5NOxZIIXMrUIBXHhOi90Rcd3VD9YZHo';
    
    webpush.setVapidDetails(
      'mailto:vincent.carlin@sfr.fr',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    let targetSubscriptions = subscriptions;

    // Déduire l'auteur de l'événement
    const author = expense 
      ? (expense.user || "Quelqu'un") 
      : (moneyPotTransaction ? (moneyPotTransaction.user_name || "Quelqu'un") : "Quelqu'un");

    if (isTest) {
      // Pour les tests, on envoie à tout le monde
      targetSubscriptions = subscriptions;
    } else if (expense || moneyPotTransaction) {
      // On n'envoie pas à l'auteur de l'activité
      targetSubscriptions = subscriptions.filter((sub) => sub.user_id !== author);
    } else {
      return new Response(JSON.stringify({ error: "Aucune donnée de test, dépense ou transaction fournie." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (targetSubscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "Notification ignorée ou pas d'autre abonné à notifier." }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Envoi aux abonnés concernés
    const sendPromises = targetSubscriptions.map(async (s: any) => {
      try {
        const sub = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
        
        if (!sub) return;

        // A. Vérifier les préférences de l'abonné si non test
        if (!isTest && sub.preferences) {
          const prefs = sub.preferences;

          // 1. Heures de silence silencieuses (Ne Pas Déranger)
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
              console.log(`Notification ignorée pour ${s.user_id} : Mode Ne Pas Déranger actif.`);
              return;
            }
          }

          // 2. Filtre Suppressions
          if (type === 'delete' && prefs.includeDeletes === false) {
            console.log(`Notification ignorée pour ${s.user_id} : Suppression désactivée.`);
            return;
          }

          // 3. Filtre Cagnotte
          const isCategoryCagnotte = expense && (expense.category === 'Cagnotte' || expense.category === 'Cagnotte commune');
          if ((type === 'moneypot' || isCategoryCagnotte) && prefs.includeMoneyPot === false) {
            console.log(`Notification ignorée pour ${s.user_id} : Cagnotte désactivée.`);
            return;
          }

          // 4. Auteur
          if (expense && (type === 'add' || type === 'update' || type === 'delete')) {
            if (prefs.authors && Array.isArray(prefs.authors)) {
              if (!prefs.authors.includes(expense.user)) {
                console.log(`Notification ignorée pour ${s.user_id} : auteur ${expense.user} filtré.`);
                return;
              }
            }
          }

          // 5. Montant minimum
          if (expense && (type === 'add' || type === 'update')) {
            if (typeof prefs.minAmount === 'number') {
              if (expense.amount < prefs.minAmount) {
                console.log(`Notification ignorée pour ${s.user_id} : montant ${expense.amount}€ inférieur au minimum.`);
                return;
              }
            }
          }

          // 6. Catégorie
          if (expense && (type === 'add' || type === 'update')) {
            if (prefs.categories && Array.isArray(prefs.categories)) {
              if (!prefs.categories.includes(expense.category)) {
                console.log(`Notification ignorée pour ${s.user_id} : catégorie ${expense.category} filtrée.`);
                return;
              }
            }
          }
        }

        // B. Composer le message selon le mode Confidentiel (Privacy Mode)
        const isPrivacy = sub.preferences?.privacyMode === true;
        let title = isPrivacy ? 'DuoBudget 🔒' : 'DuoBudget';
        let bodyPayload = '';

        if (isPrivacy) {
          if (isTest) {
            bodyPayload = 'Ceci est une alerte de test confidentielle.';
          } else if (type === 'delete') {
            bodyPayload = 'Une dépense a été retirée par votre partenaire.';
          } else if (type === 'moneypot') {
            bodyPayload = 'Une opération sur la cagnotte a été enregistrée.';
          } else if (type === 'update') {
            bodyPayload = 'Une dépense a été mise à jour par votre partenaire.';
          } else {
            bodyPayload = 'Votre partenaire a ajouté une nouvelle activité.';
          }
        } else {
          if (isTest) {
            bodyPayload = "Test de push\nCeci est un test direct de l'Edge Function Supabase vers votre appareil.";
          } else if (type === 'delete') {
            bodyPayload = `Dépense supprimée\n${author} a supprimé la dépense de ${expense.amount}€ (${expense.description || expense.category})`;
          } else if (type === 'update') {
            bodyPayload = `Dépense modifiée\n${author} a modifié la dépense : ${expense.description || expense.category} (${expense.amount}€)`;
          } else if (type === 'moneypot') {
            const symbol = moneyPotTransaction.amount >= 0 ? '+' : '';
            bodyPayload = `Cagnotte commune\n${author} a enregistré une transaction de ${symbol}${moneyPotTransaction.amount}€ dans la cagnotte : ${moneyPotTransaction.description || ''}`;
          } else {
            bodyPayload = `Nouvelle dépense\n${author} a ajouté une dépense de ${expense.amount}€ (${expense.description || expense.category})`;
          }
        }

        const payload = JSON.stringify({
          title,
          body: bodyPayload,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: { url: '/' }
        });

        await webpush.sendNotification(sub, payload);
        console.log(`Notification envoyée avec succès à ${s.user_id}`);
      } catch (error: any) {
        // Supprimer l'abonnement s'il est expiré (410) ou introuvable (404)
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Abonnement expiré pour ${s.user_id}, suppression de la base...`);
          await supabase.from('push_subscriptions').delete().eq('user_id', s.user_id);
        } else {
          console.error(`Erreur d'envoi à ${s.user_id}:`, error.message || error);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({
      success: true,
      message: isTest 
        ? `Test de push envoyé à tous les ${targetSubscriptions.length} abonné(s) !`
        : `Notification de dépense envoyée à ${targetSubscriptions.length} abonné(s).`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erreur globale dans l'Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
