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
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Expense>;
      };
      reminders: {
        Row: Reminder;
        Insert: Omit<Reminder, 'id' | 'created_at'>;
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

// REMARQUE : Pour que les abonnements aux notifications fonctionnent,
// assurez-vous que la table 'subscriptions' autorise les insertions pour les
// utilisateurs anonymes. Si vous utilisez la RLS (Row Level Security),
// vous devez créer une politique pour le rôle 'anon'.
//
// Exemple de politique SQL à exécuter dans l'éditeur SQL de Supabase :
// CREATE POLICY "Allow anon insert on subscriptions"
// ON public.subscriptions
// FOR INSERT TO anon
// WITH CHECK (true);
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
