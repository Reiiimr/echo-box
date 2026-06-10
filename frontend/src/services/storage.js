import { auth } from '../firebase';

// Supabase Storage — public bucket "uploads"
// Uses the anon key from your frontend env (safe for public buckets)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = 'uploads';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param {File|Blob} file  - The file to upload
 * @param {'images'|'audio'} type - Storage folder
 */
export async function uploadFile(file, type = 'images') {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const ext  = file.name
    ? file.name.split('.').pop()
    : type === 'audio' ? 'webm' : 'jpg';
  const path = `${type}/${uid}/${Date.now()}.${ext}`;

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Upload failed');
  }

  // Return the public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Uploads an image File → returns public download URL.
 */
export const uploadImage = (file) => uploadFile(file, 'images');

/**
 * Uploads an audio Blob (from MediaRecorder) → returns public download URL.
 */
export const uploadAudio = (blob) => {
  const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
  return uploadFile(file, 'audio');
};
