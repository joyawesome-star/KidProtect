-- KidShield production domain schema.
-- Extends the existing legacy public.students table (bigint primary key)
-- without deleting or rewriting existing data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  status text not null default 'lead' check (status in ('lead', 'active', 'suspended', 'archived')),
  address text,
  contact_phone text,
  subscription_start timestamptz,
  subscription_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Legacy students already exists in this project. Add the KidShield fields in place.
alter table public.students add column if not exists school_id uuid;
alter table public.students add column if not exists child_name text;
alter table public.students add column if not exists grade text;
alter table public.students add column if not exists section text;
alter table public.students add column if not exists contact_phone text;
alter table public.students add column if not exists parent_whatsapp text;
alter table public.students add column if not exists has_parent_app boolean not null default false;
alter table public.students add column if not exists app_device_token text;
alter table public.students add column if not exists tag_uuid uuid;
alter table public.students add column if not exists serial_number text;
alter table public.students add column if not exists status text not null default 'active';
alter table public.students add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.students
set updated_at = timezone('utc', now())
where child_name is null or contact_phone is null;

create table if not exists public.hq_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  username text unique,
  password text,
  phone text not null unique,
  pin_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  username text unique,
  password text,
  phone text not null unique,
  role text not null default 'teacher' check (role in ('admin', 'principal', 'teacher', 'security', 'staff')),
  assigned_grade text,
  assigned_section text,
  pin_hash text,
  pin_changed_at timestamptz not null default timezone('utc', now()),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.hq_admins add column if not exists username text;
alter table public.hq_admins add column if not exists password text;
alter table public.staff add column if not exists username text;
alter table public.staff add column if not exists password text;
alter table public.staff add column if not exists pin_changed_at timestamptz not null default timezone('utc', now());

update public.staff
set pin_changed_at = coalesce(pin_changed_at, created_at, timezone('utc', now()))
where pin_changed_at is null;

create unique index if not exists hq_admins_username_key on public.hq_admins (username) where username is not null;
create unique index if not exists staff_username_key on public.staff (username) where username is not null;

create table if not exists public.tags (
  uuid uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id bigint unique references public.students(id) on delete set null,
  serial_number text not null unique,
  batch_id text,
  status text not null default 'minted' check (status in ('minted', 'active', 'lost', 'disabled', 'retired')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'students_school_id_fkey') then
    alter table public.students add constraint students_school_id_fkey
      foreign key (school_id) references public.schools(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'students_tag_uuid_fkey') then
    alter table public.students add constraint students_tag_uuid_fkey
      foreign key (tag_uuid) references public.tags(uuid) on delete set null;
  end if;
end;
$$;

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  student_id bigint not null references public.students(id) on delete cascade,
  tag_uuid uuid references public.tags(uuid) on delete set null,
  attendance_date date not null default current_date,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'excused')),
  recorded_by_staff_id uuid references public.staff(id) on delete set null,
  recorded_by text,
  whatsapp_status text not null default 'pending' check (whatsapp_status in ('pending', 'sent', 'delivered', 'read', 'failed', 'success')),
  whatsapp_message_id text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (student_id, attendance_date)
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  target_grade text not null default 'GLOBAL',
  title text not null,
  message text not null,
  published_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  student_id bigint references public.students(id) on delete set null,
  tag_uuid uuid references public.tags(uuid) on delete set null,
  requested_by_staff_id uuid references public.staff(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'sent_to_app', 'sent_to_whatsapp', 'acknowledged', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lost_found_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  student_id bigint references public.students(id) on delete set null,
  tag_uuid uuid references public.tags(uuid) on delete set null,
  reported_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lost_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  student_id bigint references public.students(id) on delete set null,
  tag_uuid uuid references public.tags(uuid) on delete set null,
  item_description text not null,
  found_location text,
  found_by text,
  status text not null default 'open' check (status in ('open', 'resolved', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  target_school_id uuid references public.schools(id) on delete set null,
  action_performed text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists students_school_id_idx on public.students(school_id);
create unique index if not exists students_tag_uuid_key on public.students(tag_uuid) where tag_uuid is not null;
create unique index if not exists students_serial_number_key on public.students(serial_number) where serial_number is not null;
create index if not exists staff_school_id_idx on public.staff(school_id);
create index if not exists tags_school_status_idx on public.tags(school_id, status);
create index if not exists attendance_logs_school_date_idx on public.attendance_logs(school_id, attendance_date desc);
create index if not exists attendance_logs_student_created_idx on public.attendance_logs(student_id, created_at desc);
create index if not exists attendance_logs_whatsapp_status_idx on public.attendance_logs(whatsapp_status) where whatsapp_status in ('pending', 'failed');
create index if not exists notices_school_created_idx on public.notices(school_id, created_at desc);
create index if not exists meeting_requests_tag_created_idx on public.meeting_requests(tag_uuid, created_at desc);
create index if not exists lost_items_school_status_idx on public.lost_items(school_id, status, created_at desc);
create index if not exists audit_logs_school_created_idx on public.audit_logs(target_school_id, created_at desc);

drop trigger if exists schools_set_updated_at on public.schools;
create trigger schools_set_updated_at before update on public.schools for each row execute function public.set_updated_at();
drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();
drop trigger if exists hq_admins_set_updated_at on public.hq_admins;
create trigger hq_admins_set_updated_at before update on public.hq_admins for each row execute function public.set_updated_at();
drop trigger if exists staff_set_updated_at on public.staff;
create trigger staff_set_updated_at before update on public.staff for each row execute function public.set_updated_at();
drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at before update on public.tags for each row execute function public.set_updated_at();
drop trigger if exists attendance_logs_set_updated_at on public.attendance_logs;
create trigger attendance_logs_set_updated_at before update on public.attendance_logs for each row execute function public.set_updated_at();
drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at before update on public.notices for each row execute function public.set_updated_at();
drop trigger if exists meeting_requests_set_updated_at on public.meeting_requests;
create trigger meeting_requests_set_updated_at before update on public.meeting_requests for each row execute function public.set_updated_at();
drop trigger if exists lost_items_set_updated_at on public.lost_items;
create trigger lost_items_set_updated_at before update on public.lost_items for each row execute function public.set_updated_at();

-- Security is intentionally not enabled here. The current client code performs
-- direct anonymous reads and writes and has no Supabase Auth identities yet.
-- Enable RLS only after those workflows are moved behind authenticated server APIs.
