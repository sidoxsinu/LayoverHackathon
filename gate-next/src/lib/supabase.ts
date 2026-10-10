import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    return null;
  }

  return _createBrowserClient(url, key);
}
