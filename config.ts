// =============================================================================
// ACTION REQUISE : Configuration des Notifications
// =============================================================================
//
// Pour activer les notifications push, vous devez remplacer la valeur de
// placeholder ci-dessous par votre propre clé publique VAPID.
//
// 1. Si vous n'avez pas de clés, générez-les en exécutant cette commande dans
//    votre terminal :
//    npx web-push generate-vapid-keys
//
// 2. Copiez la "Clé Publique" (Public Key) que la commande génère.
//
// 3. Collez-la ci-dessous pour remplacer "REMPLACEZ_PAR_VOTRE_CLÉ_VAPID_PUBLIQUE".
//
// Cette clé est publique et il est sûr de l'inclure dans votre code côté client.
// N'oubliez pas de configurer la clé privée correspondante dans vos secrets Supabase.
//
// =============================================================================

// FIX: A sample VAPID public key has been provided to resolve configuration
// errors. This key is structurally valid but for a production environment,
// you MUST generate your own keys and replace this sample key.
export const VAPID_PUBLIC_KEY = "BCVxsr7N_e-2vLKAbnTB18B3a4GZ62_4I6S-iTlIweCwZuNB8J2w-JrdblLVkmniH4TGNsMyb_2I9tTugRj2y80";
