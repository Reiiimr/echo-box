import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../firebase';

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * @param {File|Blob} file - The file to upload
 * @param {'images'|'audio'} type - Storage folder
 */
export async function uploadFile(file, type = 'images') {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const ext  = file.name ? file.name.split('.').pop() : (type === 'audio' ? 'webm' : 'jpg');
  const path = `${type}/${uid}/${Date.now()}.${ext}`;
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

/**
 * Uploads an image File → returns download URL.
 */
export const uploadImage = (file) => uploadFile(file, 'images');

/**
 * Uploads an audio Blob (from MediaRecorder) → returns download URL.
 */
export const uploadAudio = (blob) => {
  const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
  return uploadFile(file, 'audio');
};
