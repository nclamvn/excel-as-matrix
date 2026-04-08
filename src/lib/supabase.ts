import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Browser-side Supabase client.
 * Used for SSO session detection and Realtime collaboration.
 * Returns null if credentials are not configured (graceful degradation).
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : null;

/**
 * Get Supabase client, returning null if not configured.
 * Useful for conditional logic without importing the raw export.
 */
export function getSupabase(): SupabaseClient | null {
  return supabase;
}

/**
 * Unique client ID for this browser session.
 * Used to filter own broadcasts in realtime channels.
 */
let _clientId: string | null = null;

export function getClientId(): string {
  if (!_clientId) {
    _clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return _clientId;
}
