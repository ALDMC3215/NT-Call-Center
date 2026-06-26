import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Environment variable validation
// Both variables MUST be present in .env.local (or the active .env file).
// Vite exposes only variables prefixed with VITE_ to client-side code.
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabasePublishableKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

  throw new Error(
    `[Supabase] Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'Add them to your .env.local file and restart the dev server.\n' +
      'Example:\n' +
      '  VITE_SUPABASE_URL=https://<project-ref>.supabase.co\n' +
      '  VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>',
  );
}

// ---------------------------------------------------------------------------
// Singleton Supabase client
// Import `supabase` from this file wherever you need to query the database.
// ---------------------------------------------------------------------------

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
