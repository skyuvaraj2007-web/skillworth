require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

/**
 * Normalizes Supabase Project URL.
 * Handles both HTTPS format ('https://<ref>.supabase.co') and
 * direct PostgreSQL URI ('postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres').
 */
function getNormalizedSupabaseUrl() {
  const rawUrl = process.env.SUPABASE_URL || '';
  if (!rawUrl) return null;

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl.replace(/\/$/, '');
  }

  // Handle postgresql connection string
  const match = rawUrl.match(/db\.([a-z0-9]+)\.supabase\.co/i);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }

  return rawUrl;
}

const supabaseUrl = getNormalizedSupabaseUrl();
// Strictly require Service Role Key for server-side operations. NEVER fallback to Anon key in backend.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && serviceRoleKey) {
  try {
    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log(`[SkillWorth Supabase] Initialized server client with Service Role for: ${supabaseUrl}`);
  } catch (err) {
    console.error('[SkillWorth Supabase] Initialization error with Service Role key:', err.message);
  }
} else if (supabaseUrl && !serviceRoleKey) {
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const errMsg = '[SkillWorth Supabase Error] SUPABASE_URL is configured, but SUPABASE_SERVICE_ROLE_KEY is missing. Privileged server operations require the Service Role key.';
  if (isProduction) {
    console.error(errMsg);
  } else {
    console.warn(errMsg + ' Falling back to local database store in development.');
  }
} else {
  console.log('[SkillWorth Supabase] Running in local database mode.');
}

module.exports = {
  supabase,
  supabaseUrl,
  isSupabaseConfigured: Boolean(supabase)
};
