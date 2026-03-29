-- Run this in Supabase → SQL Editor if you see:
--   Could not find the function public.staff_login(p_password, p_uid) in the schema cache
-- That message lists RPC arguments alphabetically; the real issue is usually: the function
-- was never created, or PostgREST has not reloaded its schema cache after CREATE FUNCTION.

create extension if not exists pgcrypto;

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
