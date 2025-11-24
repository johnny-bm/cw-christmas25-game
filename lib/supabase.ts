import { createClient } from '@supabase/supabase-js';

// Supabase credentials - use environment variables, fallback to hardcoded for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xssagbzhftjgkrcutjtd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2FnYnpoZnRqZ2tyY3V0anRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDY3NTUsImV4cCI6MjA3ODEyMjc1NX0.-R0nFL7kqyLS5eJZkXq5yn_cV_F24CF-RsozQsuvJXc';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Create Supabase client (will be null if not configured)
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export type { Database } from './database.types';