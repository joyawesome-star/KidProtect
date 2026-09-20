import { NextResponse } from 'next/server';
import { adminSupabase, requireHqAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    await requireHqAdmin();
    const { kind, email, password, name, phone, schoolId, assignedGrade, assignedSection, studentIds = [], username } = await request.json();
    if (!['staff', 'parent'].includes(kind) || !email || !password || !name) return NextResponse.json({ error: 'Invalid provisioning request' }, { status: 400 });

    const { data, error } = await adminSupabase().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;

    const client = await db.connect();
    try {
      await client.query('begin');
      if (kind === 'staff') {
        if (!phone || !schoolId || !username) throw new Error('username, phone and schoolId are required for staff');
        await client.query(
          'insert into public.staff (auth_user_id, school_id, name, username, password, phone, role, assigned_grade, assigned_section, pin_changed_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,timezone(\'utc\', now()))',
          [data.user.id, schoolId, name, username.trim(), password, phone, 'teacher', assignedGrade || null, assignedSection || null]
        );
      } else {
        if (!username) throw new Error('username is required for parent');
        const parent = await client.query(
          'insert into public.parent_accounts (auth_user_id, name, username, password, phone) values ($1,$2,$3,$4,$5) returning id',
          [data.user.id, name, username.trim(), password, phone || null]
        );
        for (const studentId of studentIds) await client.query('insert into public.parent_students (parent_id, student_id) values ($1,$2)', [parent.rows[0].id, studentId]);
      }
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      await adminSupabase().auth.admin.deleteUser(data.user.id);
      throw error;
    } finally { client.release(); }
    return NextResponse.json({ userId: data.user.id }, { status: 201 });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Unable to provision user' }, { status });
  }
}
