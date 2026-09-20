import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { token, email, password, name, phone, username } = await request.json();
    if (token !== process.env.INITIAL_HQ_SETUP_TOKEN) return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 });
    if (!email || !password || !name || !phone || !username) return NextResponse.json({ error: 'email, password, name, phone, and username are required' }, { status: 400 });

    const existing = await db.query('select 1 from public.hq_admins where auth_user_id is not null limit 1');
    if (existing.rows.length) return NextResponse.json({ error: 'HQ bootstrap has already been completed' }, { status: 409 });

    const { data, error } = await adminSupabase().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    await db.query('insert into public.hq_admins (auth_user_id, name, username, password, phone) values ($1, $2, $3, $4, $5)', [data.user.id, name, username.trim(), password, phone]);
    return NextResponse.json({ userId: data.user.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to bootstrap HQ admin' }, { status: 500 });
  }
}
