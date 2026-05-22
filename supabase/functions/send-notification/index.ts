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
    const expense = body.expense || body.record;

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

    let payload: string;
    let targetSubscriptions = subscriptions;

    if (isTest) {
      payload = JSON.stringify({
        title: 'Test de Push backend (Supabase Edge Function)',
        body: "Ceci est un test direct de l'Edge Function Supabase vers votre appareil.",
        icon: '/icon-192x192.png',
        data: { url: '/' }
      });
    } else if (expense) {
      const author = expense.user || "Quelqu'un";
      payload = JSON.stringify({
        title: 'DuoBudget - Nouvelle dépense',
        body: `${author} a ajouté une dépense de ${expense.amount}€ (${expense.description || expense.category})`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: { url: '/' }
      });

      // On n'envoie pas à l'auteur de la dépense
      targetSubscriptions = subscriptions.filter((sub) => sub.user_id !== author);
    } else {
      return new Response(JSON.stringify({ error: "Aucune donnée de test ou dépense fournie." }), {
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
        if (sub) {
          await webpush.sendNotification(sub, payload);
          console.log(`Notification envoyée avec succès à ${s.user_id}`);
        }
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
    })

  } catch (error: any) {
    console.error("Erreur globale dans l'Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
