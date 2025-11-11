import { createClient } from '@supabase/supabase-js';
import { type Expense, type Reminder } from '../types';

// NOTE: Real-time channel connection errors are logged to the console in App.tsx.

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