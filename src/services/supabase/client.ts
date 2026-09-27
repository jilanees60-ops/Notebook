import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../types/notebook';

const STORAGE_KEY_URL = 'jnas_supabase_url';
const STORAGE_KEY_ANON = 'jnas_supabase_anon_key';
const STORAGE_KEY_LOCAL_MODE = 'jnas_local_mode_preferred';

let supabaseInstance: SupabaseClient | null = null;

export const isLocalOnlyPreferred = (): boolean => {
  return localStorage.getItem(STORAGE_KEY_LOCAL_MODE) === 'true';
};

export const setLocalOnlyPreferred = (preferred: boolean): void => {
  if (preferred) {
    localStorage.setItem(STORAGE_KEY_LOCAL_MODE, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEY_LOCAL_MODE);
  }
};

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
        storage: window.localStorage,
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

    const { error } = await testClient.auth.getSession();
    if (error && error.message.includes('Invalid API key')) {
      return { success: false, message: 'Invalid Anon Key or Project URL' };
    }

    return { success: true, message: 'Successfully connected to Supabase endpoint!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed' };
  }
};

/**
 * Real Supabase Session & User retrieval.
 * Returns null if not authenticated in Supabase (never returns a fake user ID).
 */
export const getSupabaseSession = async (): Promise<Session | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
      console.warn('Supabase getSession error:', error.message);
      return null;
    }
    return session;
  } catch (e) {
    console.warn('Failed to get Supabase session:', e);
    return null;
  }
};

/**
 * Returns authenticated Supabase user or null.
 * NEVER creates or returns a fake cloud identity.
 */
export const getCurrentUser = async (): Promise<{ id: string; email?: string } | null> => {
  const session = await getSupabaseSession();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email,
    };
  }
  return null;
};

/**
 * Send passwordless Magic Link (OTP) to user's email.
 */
export const sendMagicLink = async (
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; message?: string; error?: any }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase client is not configured. Please check your project URL and Anon key.',
    };
  }

  try {
    const targetRedirect = redirectTo || (typeof window !== 'undefined' ? window.location.origin : '');
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: targetRedirect,
      },
    });

    if (error) {
      return { success: false, message: error.message, error };
    }

    // Since they initiated cloud sign-in, clear local mode preference
    setLocalOnlyPreferred(false);

    return {
      success: true,
      message: `A secure sign-in link has been sent to ${email.trim()}. Check your inbox to connect your notebook.`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to send magic link', error: err };
  }
};

/**
 * Optional standard password sign-in for users with email/password enabled in Supabase.
 */
export const signInWithPassword = async (
  email: string,
  password: string
): Promise<{ success: boolean; message?: string; session?: Session | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured.' };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    setLocalOnlyPreferred(false);
    return { success: true, session: data.session };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Sign in failed' };
  }
};

/**
 * Sign out from Supabase and clear session.
 */
export const signOutSupabase = async (): Promise<void> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Error during sign out:', e);
    }
  }
  // Clear any cached credentials if needed
  setLocalOnlyPreferred(false);
};

/**
 * Subscribe to Supabase Auth state changes.
 * Handles SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
 * Returns unsubscribe cleanup function.
 */
export const subscribeToAuthChanges = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Upload an asset into the PRIVATE 'notebook_assets' storage bucket.
 * Uses strict path format: {user_id}/{folder}/{filename}
 * Generates a signed URL instead of public URL.
 * Falls back to offline Base64 data URL if unauthenticated or offline.
 */
export const uploadAsset = async (
  file: File,
  folder = 'uploads'
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string; storagePath?: string }> => {
  const client = getSupabaseClient();
  const fileExt = file.name.split('.').pop() || 'dat';
  const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${Date.now()}_${cleanBaseName}.${fileExt}`;

  if (client) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user?.id) {
        const userId = session.user.id;
        const storagePath = `${userId}/${folder}/${fileName}`;

        const { data, error } = await client.storage
          .from('notebook_assets')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          // Private bucket: create a signed URL (valid for 1 year)
          const { data: signedData, error: signError } = await client.storage
            .from('notebook_assets')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

          if (!signError && signedData?.signedUrl) {
            return {
              url: signedData.signedUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              storagePath,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Supabase storage upload failed, falling back to local data URL:', e);
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
