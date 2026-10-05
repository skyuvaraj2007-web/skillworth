const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Supabase JavaScript Client initialized successfully');
} else {
  console.warn('⚠️ Database production variables are not configured; Supabase client is disabled until Vercel environment variables are set.');
}

/**
 * Upload a binary buffer or base64 file to a Supabase Storage bucket.
 * Automatically creates the bucket if it does not exist.
 */
async function uploadToStorage(bucketName, filePath, fileBuffer, contentType = 'application/octet-stream') {
  if (!supabase) throw new Error('Supabase client not initialized');

  // Check / ensure bucket exists
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets && buckets.some(b => b.name === bucketName);
    if (!exists) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }
  } catch (err) {
    console.warn(`[Supabase Storage] Notice checking bucket "${bucketName}":`, err.message);
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return {
    path: data.path,
    publicUrl: urlData.publicUrl
  };
}

module.exports = {
  supabase,
  SUPABASE_URL,
  uploadToStorage
};
