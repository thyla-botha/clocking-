import { createBrowserClient } from '@supabase/ssr';

// NOTE: To enable typed queries, upgrade @supabase/ssr to >=0.6 and
// @supabase/supabase-js to >=2.46, then add the generic:
//   import type { Database } from '@/lib/database.types';
//   createBrowserClient<Database>(...)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
