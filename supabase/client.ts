import { createClient } from '@supabase/supabase-js';
import { type Expense, type Reminder, type AuditLog } from '../types';

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
      audit_log: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};

// =============================================================================
// ACTION REQUISE : MISE EN PLACE DE L'HISTORIQUE DES MODIFICATIONS
// =============================================================================
// Pour activer la nouvelle fonctionnalité d'historique, vous devez exécuter
// le bloc de code SQL ci-dessous UNE SEULE FOIS dans l'éditeur SQL de votre
// projet Supabase.
//
// 1. Allez sur votre projet Supabase > SQL Editor.
// 2. Cliquez sur "+ New query".
// 3. Copiez-collez l'intégralité du bloc ci-dessous et cliquez sur "RUN".
//
// Ce script va :
//   1. Ajouter une colonne `user_agent` aux tables `expenses` et `reminders`
//      pour stocker l'information sur l'appareil.
//   2. Créer une nouvelle table `audit_log` pour stocker l'historique.
//   3. Créer une fonction `log_changes()` qui sera déclenchée à chaque modification.
//   4. Attacher cette fonction comme "trigger" aux tables `expenses` et `reminders`.
//
/*
-- 1. Ajouter la colonne user_agent aux tables existantes
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Créer la table pour l'historique
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    description TEXT,
    user_agent TEXT
);

-- Active la RLS sur la nouvelle table et autorise la lecture par tous
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read access on audit_log" ON public.audit_log;
CREATE POLICY "Allow anon read access on audit_log"
ON public.audit_log
FOR SELECT TO anon
USING (true);


-- 3. Créer la fonction qui sera appelée par les triggers
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
DECLARE
    log_action TEXT;
    log_entity TEXT;
    log_description TEXT;
    log_user_agent TEXT;
BEGIN
    log_entity := TG_TABLE_NAME;

    IF (TG_OP = 'INSERT') THEN
        log_action := 'CREATE';
        log_description := format('%s a ajouté ''%s'' (%s)', NEW.user, NEW.description, to_char(NEW.amount, 'FM999999990.00L'));
        log_user_agent := NEW.user_agent;
    ELSIF (TG_OP = 'UPDATE') THEN
        log_action := 'UPDATE';
        log_description := format('La dépense ''%s'' a été modifiée', OLD.description);
        log_user_agent := NEW.user_agent;
    ELSIF (TG_OP = 'DELETE') THEN
        log_action := 'DELETE';
        log_description := format('La dépense ''%s'' (%s) a été supprimée', OLD.description, to_char(OLD.amount, 'FM999999990.00L'));
        log_user_agent := OLD.user_agent; -- user_agent of the creator
    END IF;

    -- Pour la table reminders, on adapte la description
    IF (log_entity = 'reminders') THEN
      IF (TG_OP = 'INSERT') THEN
          log_description := format('Rappel ''%s'' ajouté', NEW.description);
      ELSIF (TG_OP = 'UPDATE') THEN
          log_description := format('Rappel ''%s'' modifié', OLD.description);
      ELSIF (TG_OP = 'DELETE') THEN
          log_description := format('Rappel ''%s'' supprimé', OLD.description);
      END IF;
    END IF;

    INSERT INTO public.audit_log (action, entity, description, user_agent)
    VALUES (log_action, log_entity, log_description, log_user_agent);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Créer les triggers pour les tables expenses et reminders
DROP TRIGGER IF EXISTS expenses_audit_trigger ON public.expenses;
CREATE TRIGGER expenses_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION log_changes();

DROP TRIGGER IF EXISTS reminders_audit_trigger ON public.reminders;
CREATE TRIGGER reminders_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION log_changes();

*/
// -----------------------------------------------------------------------------


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