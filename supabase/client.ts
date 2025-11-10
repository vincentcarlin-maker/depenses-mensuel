import { createClient } from '@supabase/supabase-js';
import { type Expense, type Reminder } from '../types';

// =============================================================================
// GUIDE DE CONFIGURATION COMPLET POUR LES FONCTIONNALITÉS TEMPS-RÉEL
// =============================================================================
//
// Pour que la synchronisation en temps réel et les notifications push
// fonctionnent, TROIS étapes de configuration sont OBLIGATOIRES dans votre
// projet Supabase.
//
// -----------------------------------------------------------------------------
// ÉTAPE 1 : ACTIVER LA RÉPLICATION DE LA BASE DE DONNÉES (ACTION REQUISE)
// -----------------------------------------------------------------------------
// C'est l'étape la plus importante et la cause la plus probable de l'erreur
// "Real-time channel error". Vous devez dire à Supabase quelles tables
// doivent diffuser leurs changements.
//
// 1. Allez sur votre projet Supabase.
// 2. Dans le menu de gauche, allez dans `Database` > `Replication`.
// 3. Dans la section "Source", cliquez sur le lien qui indique `0 tables`.
// 4. Cochez les cases pour les tables `expenses` et `reminders`.
// 5. Cliquez sur `Save`.
//
// Votre application peut maintenant écouter les changements sur ces tables.
//
// -----------------------------------------------------------------------------
// ÉTAPE 2 : CONFIGURER LES POLITIQUES DE SÉCURITÉ (RLS)
// -----------------------------------------------------------------------------
// Cette étape autorise votre application à lire, ajouter, modifier et supprimer
// des données. Si elle n'est pas configurée, toutes les requêtes échoueront.
//
// 1. Allez sur votre projet Supabase > `SQL Editor`.
// 2. Cliquez sur `+ New query`.
// 3. Copiez-collez le script SQL ci-dessous et exécutez-le.
/*
-- POLITIQUE POUR LA TABLE "expenses" --
DROP POLICY IF EXISTS "Allow all access for anonymous users on expenses" ON public.expenses;
CREATE POLICY "Allow all access for anonymous users on expenses"
ON public.expenses
FOR ALL TO anon
USING (true)
WITH CHECK (true);

-- POLITIQUE POUR LA TABLE "reminders" --
DROP POLICY IF EXISTS "Allow all access for anonymous users on reminders" ON public.reminders;
CREATE POLICY "Allow all access for anonymous users on reminders"
ON public.reminders
FOR ALL TO anon
USING (true)
WITH CHECK (true);
*/
//
// -----------------------------------------------------------------------------
// ÉTAPE 3 : CONFIGURER LE WEBHOOK POUR LES NOTIFICATIONS PUSH
// -----------------------------------------------------------------------------
// Cette étape déclenche la fonction backend pour envoyer une notification
// push à chaque fois qu'une nouvelle dépense est ajoutée.
//
// 1. Allez sur votre projet Supabase > `Database` > `Webhooks`.
// 2. Cliquez sur `Create a new webhook`.
// 3. Remplissez le formulaire comme suit :
//    - **Name**: `Déclencheur de notification de dépense`
//    - **Table**: `expenses`
//    - **Events**: Cochez `INSERT`.
//    - **Webhook URL**: Choisissez `Supabase Edge Function` > `send-notification`.
//    - **HTTP Headers**:
//      - Créez un en-tête nommé `Authorization`.
//      - La valeur doit être `Bearer VOTRE_FUNCTION_SECRET`. Remplacez
//        `VOTRE_FUNCTION_SECRET` par le mot de passe que vous avez défini
//        dans les secrets de la Edge Function.
// 4. Cliquez sur `Create webhook`.
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
