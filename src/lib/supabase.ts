import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'ssemj_supabase_url';
const STORAGE_KEY_KEY = 'ssemj_supabase_anon_key';

// Konfigurasi Tetap / Default Supabase SSeMJ supaya semua peranti terus bersambung tanpa konfigurasi manual
export const DEFAULT_SUPABASE_URL = 'https://kjrbfgdkdfsrcaayqpps.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcmJmZ2RrZGZzcmNhYXlxcHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjMyMzQsImV4cCI6MjEwNDA5OTIzNH0.wUIVUkhODv1_fFxVjavbidl7iSrxRCq4JzY20bVSdVY';

// Auto-detect and save configuration from URL search params (e.g. ?supabase_url=...&supabase_key=...)
export function initConfigFromUrlParams(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const qUrl = params.get('supabase_url');
    const qKey = params.get('supabase_key');
    if (qUrl && qKey) {
      const cleanUrl = qUrl.trim();
      const cleanKey = qKey.trim();
      if (cleanUrl.startsWith('http') && cleanKey.length > 20) {
        localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
        localStorage.setItem(STORAGE_KEY_KEY, cleanKey);

        // Remove parameters from URL cleanly without reloading page
        const urlObj = new URL(window.location.href);
        urlObj.searchParams.delete('supabase_url');
        urlObj.searchParams.delete('supabase_key');
        window.history.replaceState({}, '', urlObj.toString());
        return true;
      }
    }
  } catch (err) {
    console.warn('Error reading supabase config from URL params:', err);
  }
  return false;
}

// Run initial check
initConfigFromUrlParams();

export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  let storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  let storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  // Padamkan sebarang nilai placeholder lama jika wujud dalam localStorage
  if (storedUrl && (storedUrl.includes('placeholder.supabase.co') || storedUrl.trim() === '')) {
    storedUrl = null;
    try { localStorage.removeItem(STORAGE_KEY_URL); } catch {}
  }
  if (storedKey && (storedKey === 'placeholder' || storedKey.trim() === '')) {
    storedKey = null;
    try { localStorage.removeItem(STORAGE_KEY_KEY); } catch {}
  }

  const validStoredUrl = storedUrl && !storedUrl.includes('placeholder.supabase.co') && storedUrl.trim() !== '' ? storedUrl.trim() : null;
  const validStoredKey = storedKey && storedKey !== 'placeholder' && storedKey.trim() !== '' ? storedKey.trim() : null;

  const url = (validStoredUrl || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const anonKey = (validStoredKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

  return { url, anonKey };
}

function createClientInstance(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

const initialConfig = getSavedSupabaseConfig();
let currentClient: SupabaseClient = createClientInstance(initialConfig.url, initialConfig.anonKey);
const clientListeners = new Set<(client: SupabaseClient) => void>();

export function onSupabaseClientChange(listener: (client: SupabaseClient) => void) {
  clientListeners.add(listener);
  return () => {
    clientListeners.delete(listener);
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): SupabaseClient {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  localStorage.setItem(STORAGE_KEY_KEY, cleanKey);

  currentClient = createClientInstance(cleanUrl, cleanKey);

  clientListeners.forEach((listener) => {
    try {
      listener(currentClient);
    } catch (e) {
      console.error('Error in Supabase client change listener:', e);
    }
  });

  return currentClient;
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  currentClient = createClientInstance(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);

  clientListeners.forEach((listener) => {
    try {
      listener(currentClient);
    } catch (e) {
      console.error('Error in Supabase client clear listener:', e);
    }
  });
}

export function getSupabaseShareUrl(): string {
  if (typeof window === 'undefined') return '';
  const { url, anonKey } = getSavedSupabaseConfig();
  if (!url || !anonKey || url.includes('placeholder.supabase.co') || anonKey === 'placeholder') {
    return '';
  }
  const shareObj = new URL(window.location.origin + window.location.pathname);
  shareObj.searchParams.set('supabase_url', url);
  shareObj.searchParams.set('supabase_key', anonKey);
  return shareObj.toString();
}

// Proxy wrapper so any direct usage of `supabase.from`, `supabase.channel` dynamically calls the current client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(currentClient, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(currentClient);
    }
    return value;
  },
});
