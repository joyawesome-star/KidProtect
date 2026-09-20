create table if not exists public.parent_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  username text unique,
  password text,
  pin_hash text,
  phone text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists parent_accounts_username_key on public.parent_accounts (username) where username is not null;

create table if not exists public.parent_students (
  parent_id uuid not null references public.parent_accounts(id) on delete cascade,
  student_id bigint not null references public.students(id) on delete cascade,
  primary key (parent_id, student_id)
);

drop trigger if exists parent_accounts_set_updated_at on public.parent_accounts;
create trigger parent_accounts_set_updated_at before update on public.parent_accounts for each row execute function public.set_updated_at();
create index if not exists parent_students_student_idx on public.parent_students(student_id);

alter table public.parent_accounts alter column auth_user_id drop not null;

create or replace function public.is_hq_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.hq_admins where auth_user_id = auth.uid() and is_active);
$$;
create or replace function public.staff_school_id()
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from public.staff where auth_user_id = auth.uid() and is_active limit 1;
$$;
create or replace function public.is_parent_of(target_student_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.parent_accounts p join public.parent_students ps on ps.parent_id=p.id where p.auth_user_id=auth.uid() and p.is_active and ps.student_id=target_student_id);
$$;

alter table public.schools enable row level security;
alter table public.hq_admins enable row level security;
alter table public.staff enable row level security;
alter table public.students enable row level security;
alter table public.tags enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.notices enable row level security;
alter table public.meeting_requests enable row level security;
alter table public.lost_found_logs enable row level security;
alter table public.lost_items enable row level security;
alter table public.audit_logs enable row level security;
alter table public.parent_accounts enable row level security;
alter table public.parent_students enable row level security;

drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select to authenticated using (public.is_hq_admin() or id = public.staff_school_id());
drop policy if exists schools_manage on public.schools;
create policy schools_manage on public.schools for all to authenticated using (public.is_hq_admin()) with check (public.is_hq_admin());
create policy schools_hq_portal_anon on public.schools for select to anon using (true);
create policy schools_hq_portal_insert_anon on public.schools for insert to anon with check (true);
create policy schools_hq_portal_update_anon on public.schools for update to anon using (true) with check (true);
create policy schools_hq_portal_delete_anon on public.schools for delete to anon using (true);

drop policy if exists hq_self_read on public.hq_admins;
create policy hq_self_read on public.hq_admins for select to authenticated using (auth_user_id = auth.uid() or public.is_hq_admin());
create policy hq_login_read_anon on public.hq_admins for select to anon using (true);
create policy hq_forgot_pin_update_anon on public.hq_admins for update to anon using (is_active = true) with check (is_active = true);
drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated using (public.is_hq_admin() or auth_user_id=auth.uid() or school_id=public.staff_school_id());
create policy staff_login_read_anon on public.staff for select to anon using (true);
create policy staff_admin_insert_anon on public.staff for insert to anon with check (true);
create policy staff_admin_update_anon on public.staff for update to anon using (true) with check (true);

drop policy if exists students_read on public.students;
create policy students_read on public.students for select to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id() or public.is_parent_of(id));
drop policy if exists students_write on public.students;
create policy students_write on public.students for all to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id()) with check (public.is_hq_admin() or school_id=public.staff_school_id());
create policy students_portal_select_anon on public.students for select to anon using (true);
create policy students_portal_insert_anon on public.students for insert to anon with check (true);
create policy students_portal_update_anon on public.students for update to anon using (true) with check (true);

drop policy if exists tags_read on public.tags;
create policy tags_read on public.tags for select to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id());
drop policy if exists tags_write on public.tags;
create policy tags_write on public.tags for all to authenticated using (public.is_hq_admin()) with check (public.is_hq_admin());
create policy tags_portal_select_anon on public.tags for select to anon using (true);
create policy tags_hq_portal_insert_anon on public.tags for insert to anon with check (true);
create policy tags_portal_update_anon on public.tags for update to anon using (true) with check (true);
create policy tags_portal_delete_anon on public.tags for delete to anon using (true);

drop policy if exists attendance_read on public.attendance_logs;
create policy attendance_read on public.attendance_logs for select to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id() or public.is_parent_of(student_id));
drop policy if exists attendance_write on public.attendance_logs;
create policy attendance_write on public.attendance_logs for insert to authenticated with check (school_id=public.staff_school_id() or public.is_hq_admin());
create policy attendance_portal_select_anon on public.attendance_logs for select to anon using (true);
create policy attendance_portal_insert_anon on public.attendance_logs for insert to anon with check (true);
create policy attendance_portal_update_anon on public.attendance_logs for update to anon using (true) with check (true);
drop policy if exists notices_read on public.notices;
create policy notices_read on public.notices for select to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id() or exists(select 1 from public.parent_students ps join public.students s on s.id=ps.student_id join public.parent_accounts p on p.id=ps.parent_id where p.auth_user_id=auth.uid() and s.school_id=notices.school_id));
drop policy if exists notices_write on public.notices;
create policy notices_write on public.notices for all to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id()) with check (public.is_hq_admin() or school_id=public.staff_school_id());
create policy notices_portal_select_anon on public.notices for select to anon using (true);
create policy notices_portal_insert_anon on public.notices for insert to anon with check (true);
create policy notices_portal_update_anon on public.notices for update to anon using (true) with check (true);

drop policy if exists parent_self_read on public.parent_accounts;
create policy parent_self_read on public.parent_accounts for select to authenticated using (auth_user_id=auth.uid());
create policy parent_login_read_anon on public.parent_accounts for select to anon using (true);
create policy parent_portal_insert_anon on public.parent_accounts for insert to anon with check (true);
create policy parent_forgot_pin_update_anon on public.parent_accounts for update to anon using (is_active = true) with check (is_active = true);
drop policy if exists parent_links_read on public.parent_students;
create policy parent_links_read on public.parent_students for select to authenticated using (exists(select 1 from public.parent_accounts p where p.id=parent_id and p.auth_user_id=auth.uid()));
create policy parent_links_portal_select_anon on public.parent_students for select to anon using (true);
create policy parent_links_portal_insert_anon on public.parent_students for insert to anon with check (true);

-- Remaining operational tables are available to HQ and staff in their own school.
create policy meeting_read on public.meeting_requests for select to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id());
create policy meeting_write on public.meeting_requests for all to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id()) with check (public.is_hq_admin() or school_id=public.staff_school_id());
create policy meeting_portal_select_anon on public.meeting_requests for select to anon using (true);
create policy meeting_portal_insert_anon on public.meeting_requests for insert to anon with check (true);
create policy meeting_portal_update_anon on public.meeting_requests for update to anon using (true) with check (true);
create policy lost_log_read on public.lost_found_logs for select to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id());
create policy lost_log_write on public.lost_found_logs for all to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id()) with check (public.is_hq_admin() or school_id=public.staff_school_id());
create policy lost_log_portal_insert_anon on public.lost_found_logs for insert to anon with check (true);
create policy lost_items_read on public.lost_items for select to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id());
create policy lost_items_write on public.lost_items for all to authenticated using (public.is_hq_admin() or school_id=public.staff_school_id()) with check (public.is_hq_admin() or school_id=public.staff_school_id());
create policy lost_items_portal_select_anon on public.lost_items for select to anon using (true);
create policy lost_items_portal_insert_anon on public.lost_items for insert to anon with check (true);
create policy lost_items_portal_update_anon on public.lost_items for update to anon using (true) with check (true);
create policy audit_hq_read on public.audit_logs for select to authenticated using (public.is_hq_admin());
create policy audit_hq_write on public.audit_logs for insert to authenticated with check (public.is_hq_admin());
create policy audit_hq_portal_insert_anon on public.audit_logs for insert to anon with check (true);
