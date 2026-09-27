import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../types/notebook';

const STORAGE_KEY_URL = 'jnas_supabase_url';
const STORAGE_KEY_ANON = 'jnas_supabase_anon_key';
const STORAGE_KEY_LOCAL_USER_ID = 'jnas_local_user_id';

// Generate or retrieve persistent local user ID for offline-first usage
export const getLocalUserId = (): string => {
  let uid = localStorage.getItem(STORAGE_KEY_LOCAL_USER_ID);
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem(STORAGE_KEY_LOCAL_USER_ID, uid);
  }
  return uid;
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = (): SupabaseConfig => {
  const url =
    localStorage.getItem(STORAGE_KEY_URL) ||
    import.meta.env.VITE_SUPABASE_URL ||
    '';
  const anonKey =
    localStorage.getItem(STORAGE_KEY_ANON) ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

  return {
    url,
    anonKey,
    isConnected: isConfigured,
  };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (supabaseInstance) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  supabaseInstance = null; // Re-create on next getSupabaseClient()
};

export const clearSupabaseConfig = (): void => {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  supabaseInstance = null;
};

export const testConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    // Try pinging auth endpoint
    const { error } = await testClient.auth.getSession();
    if (error && error.message.includes('Invalid API key')) {
      return { success: false, message: 'Invalid Anon Key or Project URL' };
    }

    return { success: true, message: 'Successfully connected to Supabase endpoint!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed' };
  }
};

export const getCurrentUser = async (): Promise<{ id: string; email?: string } | null> => {
  const client = getSupabaseClient();
  if (!client) {
    return { id: getLocalUserId(), email: 'local-user@offline.jnas' };
  }

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
      };
    }
  } catch (e) {
    console.warn('Session retrieval error:', e);
  }

  return { id: getLocalUserId(), email: 'local-user@offline.jnas' };
};

export const uploadAsset = async (
  file: File,
  folder = 'uploads'
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> => {
  const client = getSupabaseClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  if (client) {
    try {
      const { data: { session } } = await client.auth.getSession();
      const userId = session?.user?.id || 'public';
      const storagePath = `${userId}/${fileName}`;

      const { data, error } = await client.storage
        .from('notebook_assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: urlData } = client.storage
          .from('notebook_assets')
          .getPublicUrl(storagePath);

        return {
          url: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };
      }
    } catch (e) {
      console.warn('Supabase storage upload failed, falling back to local storage URL:', e);
    }
  }

  // Local fallback: Convert to Data URL for instant offline capability
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
