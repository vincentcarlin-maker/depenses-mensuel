import { createClient } from '@supabase/supabase-js';
import { type Expense, type Reminder } from '../types';

// =============================================================================
// GUIDE DÉFINITIF ET VISUEL POUR ACTIVER LE TEMPS-RÉEL
// =============================================================================
//
// L'erreur "Real-time channel error" est frustrante mais 100% due à la
// configuration de votre projet Supabase. Suivez ce guide VISUELLEMENT.
// Chaque clic est important.
//
// -----------------------------------------------------------------------------
// ÉTAPE 1 : CONFIGURER LES "PUBLICATIONS" (ACTION REQUISE)
// -----------------------------------------------------------------------------
//
// 1. ➡️ Menu de gauche : Cliquez sur l'icône "Database" (un cylindre).
// 2. ➡️ Dans le panneau qui apparaît : Cliquez sur "Publications".
// 3. ➡️ La page montre une seule publication : "supabase_realtime".
//       Cliquez sur le texte "supabase_realtime".
// 4. ➡️ Une nouvelle section s'ouvre. Cliquez sur le lien bleu "0 tables" (ou "X tables").
// 5. ➡️ Cochez les cases pour "expenses" ET "reminders".
// 6. ➡️ Cliquez sur le gros bouton vert "Save".
//
// --- VÉRIFICATION VISUELLE ---
// Le lien bleu doit maintenant afficher `2 tables`. S'il indique toujours
// `0 tables` ou `1 tables`, vous avez manqué une étape.
//
// -----------------------------------------------------------------------------
// ÉTAPE 2 : CONFIGURER LES POLITIQUES DE SÉCURITÉ (RLS)
// -----------------------------------------------------------------------------
//
// 1. ➡️ Menu de gauche : Cliquez sur l'icône "Authentication" (une clé).
// 2. ➡️ Dans le panneau qui apparaît : Cliquez sur "Policies".
// 3. ➡️ Si vous voyez un grand bouton bleu "Enable RLS" pour les tables
//       "expenses" ou "reminders", CLIQUEZ DESSUS.
// 4. ➡️ Menu de gauche : Cliquez sur l'icône "SQL Editor" (un éclair >_).
// 5. ➡️ Cliquez sur "+ New query".
// 6. ➡️ Copiez-collez l'intégralité du script ci-dessous et cliquez "RUN".
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
// --- VÉRIFICATION VISUELLE ---
// 1. Retournez dans "Authentication" > "Policies".
// 2. Sélectionnez "expenses" dans la liste. Vous DEVEZ y voir une
//    politique verte nommée "Allow all access...".
// 3. Faites de même pour "reminders". Si la politique n'apparaît pas, le script a échoué.
//
// =============================================================================
// SOLUTION DE DERNIER RECOURS
// =============================================================================
//
// Si, après avoir VÉRIFIÉ VISUELLEMENT ces deux étapes, l'erreur persiste,
// cela signifie qu'une configuration ancienne ou cachée de votre projet est
// en conflit. La solution la plus sûre est de créer un NOUVEAU projet Supabase
// et de refaire ces deux étapes.
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