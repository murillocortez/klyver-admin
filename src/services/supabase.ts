import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// TODO: Move these to environment variables (e.g. .env.local)
// Fallback to hardcoded values if env vars are missing (Critical for Vercel deployment stability)
// NOTE: Hardcoding key temporarily to bypass incorrect Vercel Env Var (Service Role Key detected)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nezmauiwtoersiwtpjmd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lem1hdWl3dG9lcnNpd3Rwam1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDkxNTUsImV4cCI6MjA3OTgyNTE1NX0.kDqyocisphkC-mEZOB694u5_0hyPFjPWopwrSKV2yfM';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
