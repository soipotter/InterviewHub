import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder =
  !supabaseUrl ||
  !supabaseKey ||
  supabaseUrl.includes('your-project-id') ||
  supabaseKey.includes('your-anon-public-key') ||
  supabaseKey.includes('your-publishable-key');

if (isPlaceholder && typeof window !== 'undefined') {
  console.warn(
    '[InterviewHub] Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY) are missing or using placeholder values. Phase 4 mock services remain active.'
  );
}

/**
 * Isolated Supabase Client instance for InterviewHub.
 * Decoupled boundary inside src/services/.
 * Uses ONLY public publishable/anonymous frontend credentials.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-anon-key'
);
