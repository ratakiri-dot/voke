
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Environment Variables. Please check your .env.local file.');
  // Returning a dummy client to prevent immediate crash, though calls will fail.
  // This allows the UI to render and potentially show an error message if we added an ErrorBoundary.
  // For now, it prevents the white screen of death on load.
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
