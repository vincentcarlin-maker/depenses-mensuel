import { createClient } from '@supabase/supabase-js';
import { type Expense, type Reminder } from '../types';

// =============================================================================
// =============================================================================
// ==   STOP: GUIDE DE DÉPANNAGE POUR L'ERREUR "Real-time channel error"   ==
// =============================================================================
// =============================================================================
//
// PROBLÈME : L'application affiche "Real-time channel error".
//
// SOLUTION : Ceci est 100% un problème de configuration dans votre projet Supabase.
//            Suivez PRÉCISÉMENT les 2 étapes ci-dessous. Le moindre oubli
//            empêchera la connexion de fonctionner.
//
// -----------------------------------------------------------------------------
// ÉTAPE 1 : AUTORISER LA DIFFUSION DES DONNÉES (PUBLICATIONS)
// -----------------------------------------------------------------------------
//
// But : Dire à Supabase "diffuse les changements des tables expenses et reminders".
//
// 1. ➡️ Dans Supabase, menu de gauche : Icône Base de données (cylindre) -> "Publications".
// 2. ➡️ Cliquez sur la seule ligne disponible : "supabase_realtime".
// 3. ➡️ Cliquez sur le lien bleu (ex: "0 tables").
// 4. ➡️ Une fenêtre s'ouvre. Cochez les cases pour "expenses" ET "reminders".
// 5. ➡️ Cliquez sur le bouton vert "Save".
//
// --- VÉRIFICATION VISUELLE OBLIGATOIRE ---
// Le lien doit maintenant afficher `2 tables`. Si ce n'est pas le cas,
// l'étape a échoué. Recommencez-la.
//
// -----------------------------------------------------------------------------
// ÉTAPE 2 : AUTORISER L'APPLICATION À LIRE LES DONNÉES (POLITIQUES RLS)
// -----------------------------------------------------------------------------
//
// But : Dire à Supabase "l'application a le droit de voir ces changements".
//
// 1. ➡️ Menu de gauche : Icône SQL Editor (>_).
// 2. ➡️ Cliquez sur "+ New query".
// 3. ➡️ Copiez-collez TOUT le script ci-dessous, puis cliquez sur "RUN".
/*
-- Étape A : S'assurer que Row Level Security (RLS) est bien activé.
-- Si RLS est désactivé, personne ne peut lire les données en temps réel.
alter table public.expenses enable row level security;
alter table public.reminders enable row level security;

-- Étape B : Supprimer les anciennes règles pour éviter les conflits.
DROP POLICY IF EXISTS "Allow anonymous read access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow anonymous read access to reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access for anonymous users on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access for anonymous users on reminders" ON public.reminders;

-- Étape C : Créer la nouvelle règle qui autorise TOUT.
-- C'est la règle la plus simple pour que l'application fonctionne.
CREATE POLICY "Allow all access for anonymous users on expenses"
ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access for anonymous users on reminders"
ON public.reminders FOR ALL TO anon USING (true) WITH CHECK (true);
*/
//
// --- VÉRIFICATION VISUELLE OBLIGATOIRE ---
// 1. ➡️ Menu de gauche : Icône Authentification (clé) -> "Policies".
// 2. ➡️ Sélectionnez la table "expenses". Vous DEVEZ y voir une politique
//       verte nommée "Allow all access for anonymous users on expenses".
// 3. ➡️ Faites de même pour "reminders".
//
// Si vous ne voyez pas les politiques, le script a échoué. Exécutez-le à nouveau.
//
// =============================================================================
//
// Si après avoir VÉRIFIÉ VISUELLEMENT ces deux étapes, l'erreur persiste,
// la seule explication est une configuration corrompue de votre projet.
// La solution est de créer un NOUVEAU projet Supabase et de refaire ces 2 étapes.
//
// =============================================================================

const supabaseUrl = 'https://xcdyshzyxpngbpceilym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHlzaHp5eHBuZ2JwY2VpbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI4NDYsImV4cCI6MjA3NzMxODg0Nn0.woxCgIKTPvEy7s2ePIJIAIflwal8dG5ApTfpyWy9feQ';

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'created_at'>;
        Update: Partial<Expense>;
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, 'created_at'>;
        Update: Partial<Reminder>;
      };
      // ... (autres tables)
    };
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);