import { createClient } from '@supabase/supabase-js';
import { type Expense, type Reminder } from '../types';

// -----------------------------------------------------------------------------
// La configuration de votre projet Supabase est maintenant terminée !
// -----------------------------------------------------------------------------

const supabaseUrl = 'https://xcdyshzyxpngbpceilym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHlzaHp5eHBuZ2JwY2VpbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI4NDYsImV4cCI6MjA3NzMxODg0Nn0.woxCgIKTPvEy7s2ePIJIAIflwal8dG5ApTfpyWy9feQ';

// Définition du type pour la base de données (optionnel mais recommandé)
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
      subscriptions: {
        Row: {
          id: string;
          created_at: string;
          subscription_data: any; // Champ pour stocker l'objet d'abonnement
        };
        Insert: {
          subscription_data: any;
        };
        Update: {};
      };
    };
  };
};

// -----------------------------------------------------------------------------
// ACTION REQUISE : Configuration des Politiques de Sécurité (RLS)
// -----------------------------------------------------------------------------
// Le problème que vous rencontrez (impossible d'ajouter/modifier/supprimer)
// est très probablement dû à l'activation de la "Row Level Security" (RLS)
// sur vos tables `expenses` et `reminders` sans politiques correspondantes.
//
// Quand la RLS est activée, Supabase bloque par défaut TOUTES les modifications.
// Vous devez explicitement autoriser chaque action (INSERT, UPDATE, DELETE).
//
// 1. Allez sur votre projet Supabase > Authentication > Policies.
// 2. Assurez-vous que la RLS est activée pour les tables `expenses` et `reminders`.
// 3. Allez dans l'Éditeur SQL (SQL Editor).
// 4. Copiez-collez et exécutez les commandes SQL ci-dessous pour créer les
//    politiques qui autorisent votre application à gérer les données.

/*
-- POLITIQUE POUR LA TABLE "expenses" --
-- Supprime l'ancienne politique si elle existe pour éviter les conflits.
DROP POLICY IF EXISTS "Allow all access for anonymous users on expenses" ON public.expenses;
-- Crée une politique qui autorise les utilisateurs anonymes (tous les utilisateurs de l'app)
-- à lire, ajouter, modifier et supprimer des dépenses.
CREATE POLICY "Allow all access for anonymous users on expenses"
ON public.expenses
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- POLITIQUE POUR LA TABLE "reminders" --
-- Supprime l'ancienne politique si elle existe pour éviter les conflits.
DROP POLICY IF EXISTS "Allow all access for anonymous users on reminders" ON public.reminders;
-- Crée une politique qui autorise les utilisateurs anonymes (tous les utilisateurs de l'app)
-- à lire, ajouter, modifier et supprimer des rappels.
CREATE POLICY "Allow all access for anonymous users on reminders"
ON public.reminders
FOR ALL TO anon
USING (true)
WITH CHECK (true);
*/

// -----------------------------------------------------------------------------
// ACTION REQUISE : Configuration des Notifications Push
// -----------------------------------------------------------------------------
// Pour que les notifications push fonctionnent, vous DEVEZ exécuter la commande
// SQL suivante dans l'éditeur SQL de votre projet Supabase.
// CELA EST OBLIGATOIRE. Sans cette politique, personne ne peut s'abonner
// aux notifications et la fonctionnalité sera rompue.
//
// 1. Allez sur votre projet Supabase > SQL Editor.
// 2. Cliquez sur "+ New query".
// 3. Copiez-collez et exécutez ceci :
/*
  -- Supprime l'ancienne politique si elle existe pour éviter les conflits
  DROP POLICY IF EXISTS "Allow anon insert on subscriptions" ON public.subscriptions;

  -- Crée la nouvelle politique qui autorise les utilisateurs anonymes (tous les utilisateurs de l'app)
  -- à insérer leur abonnement de notification dans la table.
  CREATE POLICY "Allow anon insert on subscriptions"
  ON public.subscriptions
  FOR INSERT TO anon
  WITH CHECK (true);
*/
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);