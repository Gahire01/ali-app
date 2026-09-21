-- 0004_seed.sql
-- Promote the club's first admin account.
--
-- IMPORTANT: this only takes effect AFTER gahiredev01@gmail.com has
-- registered through the app (so its profile row exists). Run this update
-- once the coach account has signed up.

update public.profiles
set role = 'admin', status = 'approved'
where email = 'gahiredev01@gmail.com';

-- Safety check: report whether the admin row now exists.
do $$
begin
  if not exists (
    select 1 from public.profiles
    where email = 'gahiredev01@gmail.com' and role = 'admin'
  ) then
    raise notice 'Admin seed: gahiredev01@gmail.com not found yet. Register the account first, then re-run 0004_seed.sql.';
  end if;
end $$;