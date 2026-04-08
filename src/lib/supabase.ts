import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://fnatdgkoldgksssuptqd.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYXRkZ2tvbGRna3Nzc3VwdHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MDM2OTEsImV4cCI6MjA5MTE3OTY5MX0.U7voGChRqfCxNWX7oStNxYgZf98lgOFnDatJicQ70ck';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
