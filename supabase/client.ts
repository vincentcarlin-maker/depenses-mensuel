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
        Update: never; // Les logs sont immuables
      };
    };
  };
};

// -----------------------------------------------------------------------------
// ACTION REQUISE : Configuration de l'Historique des modifications
// -----------------------------------------------------------------------------
// Pour que la nouvelle fonctionnalité d'historique fonctionne, vous DEVEZ
// exécuter les commandes SQL ci-dessous dans l'éditeur SQL de Supabase.
// Cela va créer la table pour stocker les logs et mettre en place des
// déclencheurs (triggers) qui enregistreront automatiquement chaque
// ajout, modification et suppression de dépense.
//
// 1. Allez sur votre projet Supabase > SQL Editor > "+ New query".
// 2. Copiez-collez TOUT le bloc de code ci-dessous et exécutez-le.

/*
-- **SCRIPT DE CORRECTION ET D'INSTALLATION DE L'AUDIT**
-- Ce script va nettoyer les anciennes tables/fonctions et installer la nouvelle version.

-- 0. Nettoyage des anciennes versions (si elles existent)
DROP TABLE IF EXISTS public.history_logs CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- 1. Création de la table pour stocker l'historique (avec plus de structure)
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  entity TEXT NOT NULL,
  action TEXT NOT NULL,
  user_name TEXT, -- Utilisateur qui a effectué l'action
  description TEXT, -- Description de l'élément affecté
  amount NUMERIC, -- Montant de l'élément affecté
  details TEXT NOT NULL -- Résumé de l'action
);

-- 2. Activation de la Row Level Security (RLS) pour la sécurité
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Création d'une politique pour autoriser la lecture des logs par l'application
DROP POLICY IF EXISTS "Allow anon read access on audit_log" ON public.audit_log;
CREATE POLICY "Allow anon read access on audit_log"
ON public.audit_log
FOR SELECT TO anon
USING (true);

-- 4. Création de la fonction qui sera appelée par les triggers
CREATE OR REPLACE FUNCTION public.log_expense_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (entity, action, user_name, description, amount, details)
    VALUES (
      'expenses',
      'INSERT',
      NEW.user,
      NEW.description,
      NEW.amount,
      CONCAT(
        NEW.user,
        ' a ajouté : ',
        NEW.description,
        ' (',
        to_char(NEW.amount, 'FM999999990.00'),
        ' €)'
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (entity, action, user_name, description, amount, details)
    VALUES (
      'expenses',
      'UPDATE',
      NEW.user,
      NEW.description,
      NEW.amount,
      CONCAT(
        NEW.user,
        ' a modifié la dépense "',
        OLD.description,
        '"'
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (entity, action, user_name, description, amount, details)
    VALUES (
      'expenses',
      'DELETE',
      OLD.user,
      OLD.description,
      OLD.amount,
      CONCAT(
        OLD.user,
        ' a supprimé : ',
        OLD.description,
        ' (',
        to_char(OLD.amount, 'FM999999990.00'),
        ' €)'
      )
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

// -----------------------------------------------------------------------------
// ACTION REQUISE : Configuration des Politiques de Sécurité (RLS)
// -----------------------------------------------------------------------------
// ... (instructions existantes) ...

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);