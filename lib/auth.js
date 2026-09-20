import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';

export function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireUser() {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error('Unauthorized');
  return userId;
}

export async function requireHqAdmin() {
  const userId = await requireUser();
  const { rows } = await db.query(
    'select id from public.hq_admins where auth_user_id = $1 and is_active = true limit 1',
    [userId]
  );
  if (!rows.length) throw new Error('Forbidden');
  return userId;
}
