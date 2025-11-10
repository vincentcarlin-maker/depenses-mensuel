import { createClient } from '@supabase/supabase-js';
import { type Expense, type Reminder } from '../types';

// =============================================================================
// GUIDE DE DÉPANNAGE INFALLIBLE POUR LE TEMPS-RÉEL
// =============================================================================
//
// L'erreur "Real-time channel error" est quasi-certainement un problème de
// configuration dans votre tableau de bord Supabase.
//
// Suivez attentivement ces DEUX étapes et VÉRIFIEZ chaque point.
//
// -----------------------------------------------------------------------------
// ÉTAPE 1 : CONFIGURER LES "PUBLICATIONS" (ACTION REQUISE)
// -----------------------------------------------------------------------------
// C'est la cause la plus fréquente. Vous devez dire à Supabase de "diffuser"
// les changements de vos tables.
//
// 1. Allez sur votre projet Supabase.
// 2. Menu de gauche : allez dans `Database` > `Publications`.
// 3. Vous verrez une ligne `supabase_realtime`. CLIQUEZ DESSUS.
// 4. Une section apparaît. Cliquez sur le lien bleu (ex: `0 tables`).
// 5. Cochez les cases pour les tables `expenses` ET `reminders`.
// 6. Cliquez sur le bouton `SAVE`.
//
// --- VÉRIFICATION ---
// Après avoir sauvegardé, le lien doit maintenant indiquer `2 tables`. S'il
// indique toujours `0 tables`, l'étape a échoué. Répétez-la.
//
// -----------------------------------------------------------------------------
// ÉTAPE 2 : CONFIGURER LES POLITIQUES DE SÉCURITÉ (RLS)
// -----------------------------------------------------------------------------
// Cette étape autorise votre application à LIRE les données diffusées.
//
// 1. Allez sur votre projet Supabase > `SQL Editor`.
// 2. Cliquez sur `+ New query`.
// 3. Copiez-collez le script SQL ci-dessous et cliquez sur `RUN`.
/*
-- Activez RLS pour les tables si ce n'est pas déjà fait
alter table public.expenses enable row level security;
alter table public.reminders enable row level security;

-- Supprime les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Allow all access for anonymous users on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access for anonymous users on reminders" ON public.reminders;

-- Crée des politiques qui autorisent TOUT pour les utilisateurs anonymes (votre app)
CREATE POLICY "Allow all access for anonymous users on expenses"
ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access for anonymous users on reminders"
ON public.reminders FOR ALL TO anon USING (true) WITH CHECK (true);
*/
//
// --- VÉRIFICATION ---
// 1. Allez dans `Authentication` > `Policies`.
// 2. Sélectionnez la table `expenses` dans la liste déroulante.
// 3. Vous DEVEZ voir une politique nommée "Allow all access...".
//    Si la liste est vide, le script n'a pas été exécuté correctement.
//
// =============================================================================
// Une fois ces deux étapes VÉRIFIÉES, le temps-réel fonctionnera.
// Le reste des instructions concerne les notifications PUSH (app fermée).
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