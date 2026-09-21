-- 0001_init.sql
-- Base schema for ALI Boxing Club member app.

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  email text,
  photo_url text,
  role text default 'player' check (role in ('player','coach','collaborator','admin')),
  status text default 'pending' check (status in ('pending','approved','rejected')),
  category text,
  weight_class text,
  weight_kg numeric,
  level text,
  membership_status text,
  date_of_birth date,
  place_of_birth text,
  is_minor boolean default false,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  parent_phone text,
  created_at timestamptz default now()
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text,
  notes text,
  starts_at timestamptz not null,
  created_by uuid references public.profiles(id),
  status text default 'scheduled' check (status in ('scheduled','started','completed')),
  created_at timestamptz default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending' check (status in ('present','absent','late','pending')),
  marked_at timestamptz,
  unique (session_id, player_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  caption text,
  created_at timestamptz default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  type text check (type in ('image','video')),
  file_url text not null,
  thumbnail_url text,
  created_at timestamptz default now()
);

create table public.likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  sent_by uuid references public.profiles(id),
  title text not null,
  body text not null,
  target text default 'everyone',
  sent_at timestamptz default now()
);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz default now(),
  unique (user_id, expo_push_token)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  name text,
  is_group boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table public.fighter_cards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) on delete cascade unique,
  display_name text,
  photo_url text,
  category text,
  weight_class text,
  level text,
  wins int default 0,
  losses int default 0,
  membership_status text,
  created_at timestamptz default now()
);

-- Performance indexes (feed + chat pagination).
create index if not exists idx_training_sessions_starts_at on public.training_sessions (starts_at desc);
create index if not exists idx_attendance_session on public.attendance (session_id);
create index if not exists idx_attendance_player on public.attendance (player_id);
create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_media_post on public.media (post_id);
create index if not exists idx_messages_conversation_created_at on public.messages (conversation_id, created_at);
create index if not exists idx_device_tokens_user on public.device_tokens (user_id);
create index if not exists idx_conversation_members_user on public.conversation_members (user_id);

-- Auto-create a profile row when a new auth user signs up.
-- Every new account gets status: 'pending' automatically (table default).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, phone, is_minor, guardian_name, guardian_phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce((new.raw_user_meta_data->>'is_minor')::boolean, false),
    new.raw_user_meta_data->>'guardian_name',
    new.raw_user_meta_data->>'guardian_phone'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();