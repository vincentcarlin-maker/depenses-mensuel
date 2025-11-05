// =============================================================================
// ACTION REQUISE : Configuration des Notifications
// =============================================================================
//
// L'APPLICATION NE FONCTIONNERA PAS CORRECTEMENT SANS CES ÉTAPES.
// Pour activer les notifications push, vous devez générer et configurer VOS
// propres clés VAPID. La clé ci-dessous est un EXEMPLE et ne fonctionnera pas
// de manière fiable sans la configuration complète.
//
// --- ÉTAPE 1 : Générer les clés ---
//   Ouvrez votre terminal et exécutez la commande suivante :
//   npx web-push generate-vapid-keys
//
// --- ÉTAPE 2 : Configurer la clé publique (ici) ---
//   Copiez la "Clé Publique" générée et collez-la ci-dessous pour
//   remplacer la clé d'exemple.
//
// --- ÉTAPE 3 : Configurer les clés dans Supabase ---
//   Allez sur votre projet Supabase > Settings > Edge Functions.
//   Ajoutez les "secrets" (variables d'environnement) suivants :
//   - VAPID_PUBLIC_KEY: Votre clé publique (la même que ci-dessous).
//   - VAPID_PRIVATE_KEY: Votre clé privée générée à l'étape 1.
//
//   (Assurez-vous que les autres secrets comme FUNCTION_SECRET sont aussi configurés)
//
// =============================================================================

// 
// Fichier : config.ts

// ... (commentaires)

// REMPLACEZ la clé ci-dessous par votre nouvelle clé publique
export const VAPID_PUBLIC_KEY = "BHez2J6rA8s8-i6q-xK8-a5bC_rF9dD9yUvP3gO6eJzW_rQ1fI_sT7kH2m_xY5lZ-nJ8vG9bC4aD3e";

// Ne modifiez pas cette ligne
export const IS_VAPID_KEY_SAMPLE = VAPID_PUBLIC_KEY === "BCVxsr7N_e-2vLKAbnTB18B3a4GZ62_4I6S-iTlIweCwZuNB8J2w-JrdblLVkmniH4TGNsMyb_2I9tTugRj2y80";
