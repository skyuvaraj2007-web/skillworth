import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jokcbrqfnbrqgocwboli.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'public_anon_placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
