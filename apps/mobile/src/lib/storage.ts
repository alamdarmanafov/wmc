import { supabase } from './supabase';

export type StorageBucket = 'avatars' | 'community' | 'events';

/**
 * Uploads a local image (file:// or content:// uri) to a public bucket and returns its public URL.
 * Path convention enforced by RLS: `<userId>/<filename>`.
 */
export async function uploadImage(bucket: StorageBucket, path: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  // Cache-bust so a replaced avatar shows immediately.
  return `${data.publicUrl}?v=${Date.now()}`;
}
