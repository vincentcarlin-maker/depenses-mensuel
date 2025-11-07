import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// ACTION REQUIRED: Supabase Project Configuration
// =============================================================================
// To connect this application to your Supabase project, you need to provide
// your project's URL and its public anon key.
//
// 1. Go to your Supabase project dashboard.
// 2. Navigate to 'Project Settings' > 'API'.
// 3. Under 'Project API keys', find the 'Project URL' and the 'anon' 'public' key.
// 4. Replace the placeholder values below with your actual credentials.
// =============================================================================

const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key

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