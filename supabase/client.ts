import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Configuration de Supabase
// =============================================================================
// L'application est maintenant connectée à votre projet Supabase.
// =============================================================================

const supabaseUrl: string = 'https://xcdyshzyxpngbpceilym.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHlzaHp5eHBuZ2JwY2VpbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI4NDYsImV4cCI6MjA3NzMxODg0Nn0.woxCgIKTPvEy7s2ePIJIAIflwal8dG5ApTfpyWy9feQ';

/**
 * A flag to check if the Supabase credentials have been configured.
 * The application will show a configuration screen if this is false.
 */
export const isSupabaseConfigured = 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

/**
 * The Supabase client instance.
 * It is exported as `null` if the configuration is missing, to prevent the
 * app from crashing. The main App component will handle this case.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;