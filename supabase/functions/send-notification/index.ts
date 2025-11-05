// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore
import webpush from 'https://deno.land/x/webpush/mod.ts';

// FIX: Declare the Deno global to resolve TypeScript errors about an undefined variable in a Deno environment.
declare const Deno: any;

// Récupère les secrets depuis les variables d'environnement du projet Supabase
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialise la librairie web-push avec les clés VAPID
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("Les clés VAPID ne sont pas configurées comme variables d'environnement.");
} else {
  webpush.setVapidDetails(
    'mailto:notifications@example.com', // Remplacez par votre email
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Crée un client Supabase avec les droits d'administrateur (service_role)
// pour pouvoir lire tous les abonnements.
const supabaseAdmin = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY ?? '');

serve(async (req: any) => {
  // 1. Vérifie le secret d'autorisation pour s'assurer que seuls les appels légitimes
  // (venant du déclencheur de la base de données) sont traités.
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${FUNCTION_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Extrait les données de la nouvelle dépense du corps de la requête
    const { record: newExpense } = await req.json();

    // 3. Récupère tous les abonnements aux notifications depuis la table 'subscriptions'
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('subscription_data');

    if (subsError) throw subsError;
    if (!subscriptions || subscriptions.length === 0) {
      console.log("Aucun abonnement à notifier.");
      return new Response(JSON.stringify({ message: "Aucun abonnement trouvé." }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Prépare le contenu de la notification
    const payload = JSON.stringify({
      title: 'Nouvelle dépense ajoutée !',
      body: `${newExpense.user} a ajouté : ${newExpense.description} (${newExpense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`,
    });

    // 5. Envoie une notification à chaque abonné
    const sendPromises = subscriptions.map(async (s: any) => {
      const subscription = s.subscription_data;
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error) {
        console.error('Échec de l\'envoi de la notification à :', subscription.endpoint, error);
        // Si l'abonnement est expiré ou invalide (ex: code 410 ou 404), on le supprime de la BDD
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('Suppression de l\'abonnement obsolète :', subscription.endpoint);
          await supabaseAdmin
            .from('subscriptions')
            .delete()
            .eq('subscription_data->>endpoint', subscription.endpoint);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ message: 'Notifications envoyées avec succès' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erreur dans la fonction send-notification :', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});