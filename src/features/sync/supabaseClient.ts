import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase connection, configured by environment variables (see .env.example
 * and the Netlify site settings). The publishable key is designed to be public:
 * what each visitor may do is decided by row-level security on the server.
 *
 * Without configuration (tests, a fresh clone) the app runs fully offline and
 * the synchronisation section explains that it is not set up.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
