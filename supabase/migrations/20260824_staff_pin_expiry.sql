-- Track staff PIN rotation for the 30-day login expiry rule.
alter table public.staff add column if not exists pin_changed_at timestamptz not null default timezone('utc', now());
update public.staff
set pin_changed_at = coalesce(pin_changed_at, created_at, timezone('utc', now()))
where pin_changed_at is null;