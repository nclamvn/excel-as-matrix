import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Browser-side Supabase client for SSO session detection.
 * Used by AuthProvider to check if the user has an existing Supabase session
 * (e.g., set by the Prismy landing page or another Prismy app).
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
