import { createClient } from '@supabase/supabase-js';

/** Verify Supabase JWT and return user id (never trust client-only auth). */
export async function getUserIdFromAuthHeader(
  authHeader: string | undefined,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const base = supabaseUrl?.trim();
  const key = serviceRoleKey?.trim();
  // createClient('', ...) throws — avoid crashing the request handler
  if (!base || !key) return null;
  const token = authHeader.slice(7);
  const supabase = createClient(base, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function verifySocketToken(
  token: string | undefined,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<{ id: string; email?: string } | null> {
  if (!token) return null;
  const base = supabaseUrl?.trim();
  const key = serviceRoleKey?.trim();
  if (!base || !key) return null;
  const supabase = createClient(base, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}
