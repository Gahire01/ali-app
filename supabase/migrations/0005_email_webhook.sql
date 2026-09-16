-- 0005_email_webhook.sql
-- Notify gahiredev01@gmail.com whenever a new user registers.
--
-- This creates a database trigger on auth.users INSERT that fires the
-- `on-new-user` edge function via pg_net (effectively the same thing as a
-- Supabase "Database Webhook").
--
-- Before it can fire, set the edge function URL once per project:
--
--   alter role postgres set app.settings.edge_function_url =
--     'https://<your-project-ref>.supabase.co/functions/v1/on-new-user';
--
-- (Replace <your-project-ref> with your Supabase project ref. Alternatively,
-- create the same trigger + function from the Dashboard → Database →
-- Webhooks UI, which does this for you.)

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_on_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hook_url text := current_setting('app.settings.edge_function_url', true);
  payload jsonb;
begin
  if hook_url is null or hook_url = '' then
    raise warning 'app.settings.edge_function_url is not set; skipping new-user notification for %', new.email;
    return new;
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', jsonb_build_object(
      'id', new.id,
      'email', new.email,
      'full_name', new.raw_user_meta_data ->> 'full_name',
      'phone', new.raw_user_meta_data ->> 'phone',
      'created_at', new.created_at
    )
  );

  perform extensions.net.http_post(
    url := hook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload::text
  );

  return new;
end;
$$;

create trigger trg_notify_on_new_user
after insert on auth.users
for each row
execute function public.notify_on_new_user();

grant execute on function extensions.net.http_post to postgres;