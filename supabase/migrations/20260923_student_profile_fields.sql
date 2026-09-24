-- Add fields used by the public QR registration and profile edit form.
-- IF NOT EXISTS keeps this safe for databases that already contain some fields.
alter table public.students add column if not exists dob date;
alter table public.students add column if not exists parent_name text;
alter table public.students add column if not exists emergency_phone text;
alter table public.students add column if not exists address text;
alter table public.students add column if not exists blood_group text;
alter table public.students add column if not exists allergies text;
alter table public.students add column if not exists medical_notes text;
alter table public.students add column if not exists pickup_persons text;
alter table public.students add column if not exists security_pin text;
