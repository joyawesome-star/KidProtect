-- Phone-and-PIN parent accounts do not require a Supabase Auth identity.
alter table public.parent_accounts alter column auth_user_id drop not null;