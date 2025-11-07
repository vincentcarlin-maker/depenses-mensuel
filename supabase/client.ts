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
      audit_log: {
        Row: {
          id: string;
          created_at: string;
          entity: string;
          action: string;
          user_name: string | null;
          description: string | null;
          amount: number | null;
          details: string | null;
          user_agent: string | null;
        };
        Insert: {
          entity: string;
          action: string;
          user_name?: string | null;
          description?: string | null;
          amount?: number | null;
          details?: string | null;
          user_agent?: string | null;
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

// -----------------------------------------------------------------------------
// ACTION REQUISE : Configuration de l'Historique des Dépenses (Audit Log)
// -----------------------------------------------------------------------------
// L'erreur "violates not-null constraint" que vous rencontrez se produit car
// la base de données ne parvient pas à enregistrer l'historique d'une action
// (suppression, modification) si une des informations de la dépense est vide.
//
// Pour corriger ce problème de manière DÉFINITIVE, vous devez exécuter le script
// SQL ci-dessous dans l'éditeur SQL de votre projet Supabase.
//
// Ce script va :
// 1. Supprimer l'ancienne table d'historique pour repartir sur une base saine.
// 2. Créer une nouvelle table `audit_log` avec la bonne structure.
// 3. Créer une fonction de base de données ROBUSTE qui gère les cas où
//    des informations sont manquantes, empêchant ainsi l'erreur de se reproduire.
//
// 1. Allez sur votre projet Supabase > SQL Editor.
// 2. Cliquez sur "+ New query".
// 3. Copiez-collez l'intégralité du script SQL ci-dessous et exécutez-le.
/*
-- **SCRIPT DE CORRECTION ET D'INSTALLATION DE L'AUDIT**
-- Ce script va nettoyer les anciennes tables/fonctions et installer la nouvelle version.

-- 0. Nettoyage des anciennes versions (si elles existent)
DROP TABLE IF EXISTS public.history_logs CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP FUNCTION IF EXISTS public.log_expense_change() CASCADE;

-- 1. Création de la table pour stocker l'historique
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  entity TEXT NOT NULL,
  action TEXT NOT NULL,
  user_name TEXT,
  description TEXT,
  amount NUMERIC,
  details TEXT, -- Résumé de l'action (rendu optionnel pour éviter les erreurs)
  user_agent TEXT
);

-- 2. Activation de la Row Level Security (RLS) pour la sécurité
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Création d'une politique pour autoriser la lecture des logs par l'application
DROP POLICY IF EXISTS "Allow anon read access on audit_log" ON public.audit_log;
CREATE POLICY "Allow anon read access on audit_log"
ON public.audit_log
FOR SELECT TO anon
USING (true);

-- 4. Création de la fonction qui sera appelée par les triggers (VERSION ROBUSTE)
CREATE OR REPLACE FUNCTION public.log_expense_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_agent TEXT;
BEGIN
  -- Tente de récupérer le user-agent depuis les en-têtes de la requête.
  BEGIN
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_user_agent := NULL;
  END;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (entity, action, user_name, description, amount, details, user_agent)
    VALUES (
      'expenses',
      'INSERT',
      NEW.user,
      NEW.description,
      NEW.amount,
      -- Utilise COALESCE pour fournir une valeur par défaut si le CONCAT est nul
      COALESCE(CONCAT(
        COALESCE(NEW.user::text, 'Un utilisateur'),
        ' a ajouté : ',
        COALESCE(NEW.description, 'une dépense'),
        ' (',
        to_char(COALESCE(NEW.amount, 0), 'FM999999990.00'),
        ' €)'
      ), 'Détail de l''ajout non disponible.'),
      v_user_agent
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (entity, action, user_name, description, amount, details, user_agent)
    VALUES (
      'expenses',
      'UPDATE',
      NEW.user,
      NEW.description,
      NEW.amount,
      -- Utilise COALESCE pour fournir une valeur par défaut si le CONCAT est nul
      COALESCE(CONCAT(
        COALESCE(NEW.user::text, 'Un utilisateur'),
        ' a modifié la dépense "',
        COALESCE(OLD.description, '(ancienne dépense)'),
        '"'
      ), 'Détail de la modification non disponible.'),
      v_user_agent
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (entity, action, user_name, description, amount, details, user_agent)
    VALUES (
      'expenses',
      'DELETE',
      OLD.user,
      OLD.description,
      OLD.amount,
      -- Utilise COALESCE pour fournir une valeur par défaut si le CONCAT est nul
      COALESCE(CONCAT(
        COALESCE(OLD.user::text, 'Un utilisateur'),
        ' a supprimé : ',
        COALESCE(OLD.description, 'une dépense'),
        ' (',
        to_char(COALESCE(OLD.amount, 0), 'FM999999990.00'),
        ' €)'
      ), 'Détail de la suppression non disponible.'),
      v_user_agent
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Création des triggers sur la table 'expenses'
DROP TRIGGER IF EXISTS on_expense_insert ON public.expenses;
CREATE TRIGGER on_expense_insert
AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();

DROP TRIGGER IF EXISTS on_expense_update ON public.expenses;
CREATE TRIGGER on_expense_update
AFTER UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();

DROP TRIGGER IF EXISTS on_expense_delete ON public.expenses;
CREATE TRIGGER on_expense_delete
AFTER DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();
*/