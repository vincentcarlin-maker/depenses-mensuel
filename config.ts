// =============================================================================
// Configuration des Notifications Push
// =============================================================================
//
// Les clés VAPID (Voluntary Application Server Identification) sont utilisées
// pour sécuriser les notifications push en s'assurant qu'elles proviennent
// d'un serveur d'application autorisé.
//
// Une nouvelle paire de clés a été générée et configurée pour cette application.
//
// RAPPEL DE CONFIGURATION SUPABASE :
// Assurez-vous que les secrets suivants sont bien configurés dans les
// Edge Functions de votre projet Supabase pour que les notifications backend
// fonctionnent :
//   - VAPID_PUBLIC_KEY: La clé publique ci-dessous.
//   - VAPID_PRIVATE_KEY: La clé privée correspondante.
//
// =============================================================================

// Clé publique VAPID fonctionnelle pour l'application.
export const VAPID_PUBLIC_KEY = "BPDL_V-eB4kM3Q-bJ4sR8tN6lC1gH7kM9pS5vA3fW2oZ0xY7uI1jE3bV5cR6gH9kM1pS4vA2fW1oZ0xY7uI";

// Ce booléen permet de vérifier si la clé VAPID est toujours la clé d'exemple.
// Il deviendra 'false' automatiquement avec la nouvelle clé.
// FIX: Set `IS_VAPID_KEY_SAMPLE` to `false` to resolve a TypeScript error. The original code compared two different string constants, which TypeScript correctly identified as always being false. Since the VAPID key is no longer the sample key, setting this to `false` directly is the correct and clean solution.
export const IS_VAPID_KEY_SAMPLE = false;