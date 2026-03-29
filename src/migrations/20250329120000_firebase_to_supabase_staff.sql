-- YMSDash: staff auth + profiles (replaces Firestore `admins` + `teachers` collections used for login)
-- Run in Supabase SQL Editor or: supabase db push (if using Supabase CLI)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  admin_uid text unique,
  staff_uid text unique,
  legacy_firebase_uid text,
  name text,
  email text,
  phone_number text,
  password_hash text,
  password text,
  picture text,
  profile_image_url text,
  created_at timestamptz default now()
);

create index if not exists idx_admins_admin_uid on public.admins (admin_uid);
create index if not exists idx_admins_staff_uid on public.admins (staff_uid);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  uid text unique not null,
  name text,
  role text default 'teacher',
  password_hash text,
  password text,
  avatar text,
  status text,
  assigned_class text,
  class_assigned text,
  created_at timestamptz default now()
);

create index if not exists idx_teachers_uid on public.teachers (uid);

-- ---------------------------------------------------------------------------
-- Sequences for admin registration UID (optional; app can also generate client-side)
-- ---------------------------------------------------------------------------

create sequence if not exists public.admin_display_seq start 1;

create or replace function public.next_admin_sequence()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.admin_display_seq');
$$;

grant execute on function public.next_admin_sequence() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Staff login (replaces client Firestore queries + bcrypt; keeps passwords off public SELECT)
-- ---------------------------------------------------------------------------

create or replace function public.staff_login(p_uid text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
  t record;
  uid_trim text := trim(coalesce(p_uid, ''));
begin
  if uid_trim = '' then
    return jsonb_build_object('ok', false, 'message', 'UID is required');
  end if;
  if p_password is null or p_password = '' then
    return jsonb_build_object('ok', false, 'message', 'Password is required');
  end if;

  select * into a
  from public.admins
  where admin_uid = uid_trim
     or staff_uid = uid_trim
     or legacy_firebase_uid = uid_trim
  limit 1;

  if found then
    if a.password_hash is not null and length(trim(a.password_hash)) > 0 then
      if crypt(p_password, a.password_hash) = a.password_hash then
        return jsonb_build_object(
          'ok', true,
          'role', 'admin',
          'id', a.id,
          'name', coalesce(a.name, ''),
          'uid', coalesce(a.admin_uid, a.staff_uid, uid_trim),
          'avatar', coalesce(a.picture, a.profile_image_url)
        );
      end if;
    end if;
    if a.password is not null and a.password = p_password then
      return jsonb_build_object(
        'ok', true,
        'role', 'admin',
        'id', a.id,
        'name', coalesce(a.name, ''),
        'uid', coalesce(a.admin_uid, a.staff_uid, uid_trim),
        'avatar', coalesce(a.picture, a.profile_image_url)
      );
    end if;
    return jsonb_build_object('ok', false, 'message', 'Incorrect password');
  end if;

  select * into t from public.teachers where uid = uid_trim limit 1;

  if found then
    if t.status is not null and lower(trim(t.status)) = 'inactive' then
      return jsonb_build_object('ok', false, 'message', 'Your account has been disabled. Contact the admin.');
    end if;
    if t.password_hash is not null and length(trim(t.password_hash)) > 0 then
      if crypt(p_password, t.password_hash) = t.password_hash then
        return jsonb_build_object(
          'ok', true,
          'role', coalesce(nullif(trim(t.role), ''), 'teacher'),
          'id', t.id,
          'name', coalesce(t.name, ''),
          'uid', t.uid,
          'avatar', t.avatar
        );
      end if;
    end if;
    if t.password is not null and t.password = p_password then
      return jsonb_build_object(
        'ok', true,
        'role', coalesce(nullif(trim(t.role), ''), 'teacher'),
        'id', t.id,
        'name', coalesce(t.name, ''),
        'uid', t.uid,
        'avatar', t.avatar
      );
    end if;
    return jsonb_build_object('ok', false, 'message', 'Incorrect password');
  end if;

  return jsonb_build_object('ok', false, 'message', 'UID not found');
end;
$$;

grant execute on function public.staff_login(text, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.teachers enable row level security;

-- No direct public reads on credential tables; use staff_login RPC.

drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own"
  on public.admins for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "admins_insert_own" on public.admins;
create policy "admins_insert_own"
  on public.admins for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "admins_update_own" on public.admins;
create policy "admins_update_own"
  on public.admins for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- teachers: RLS on with no policies = deny direct table access (staff_login RPC bypasses via SECURITY DEFINER)

-- Service role bypasses RLS for bulk imports / admin tools.

-- ---------------------------------------------------------------------------
-- Storage bucket (create in Dashboard: Storage → New bucket → admin-avatars, public read optional)
-- Policies (run after bucket exists):
--
-- insert: authenticated users can upload to folder matching their uid
-- create policy "admin_avatars_insert" on storage.objects for insert to authenticated
--   with check (bucket_id = 'admin-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- ---------------------------------------------------------------------------
