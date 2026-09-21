-- 0002_rls.sql
-- Row Level Security for ALI Boxing Club. RLS is enabled on EVERY table.

-- ── Helpers ──────────────────────────────────────────────────────────────
-- Staff = approved coach, collaborator, or admin.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role in ('coach', 'collaborator', 'admin')
  );
$$;

-- Approved player (member).
create or replace function public.is_approved_player()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role = 'player'
  );
$$;

-- ── profiles ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_staff" on public.profiles
  for select using (public.is_staff());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_update_staff" on public.profiles
  for update using (public.is_staff()) with check (public.is_staff());

create policy "profiles_delete_staff" on public.profiles
  for delete using (public.is_staff());

-- Players may only edit their own contact/photo fields, never the
-- coach-assigned fields (role, status, category, weight, level, ...).
create or replace function public.restrict_player_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.is_minor is distinct from old.is_minor
    or new.email is distinct from old.email
    or new.category is distinct from old.category
    or new.weight_class is distinct from old.weight_class
    or new.weight_kg is distinct from old.weight_kg
    or new.level is distinct from old.level
    or new.membership_status is distinct from old.membership_status
    or new.date_of_birth is distinct from old.date_of_birth
    or new.place_of_birth is distinct from old.place_of_birth
    or new.guardian_name is distinct from old.guardian_name
    or new.guardian_phone is distinct from old.guardian_phone
    or new.parent_name is distinct from old.parent_name
    or new.parent_phone is distinct from old.parent_phone
  then
    raise exception 'You can only edit your name, phone, and photo. Contact a coach to change anything else.';
  end if;
  return new;
end;
$$;

create trigger restrict_player_profile_update
before update on public.profiles
for each row
when (auth.uid() = old.id)
execute function public.restrict_player_profile_update();

-- ── training_sessions ────────────────────────────────────────────────────
alter table public.training_sessions enable row level security;

create policy "training_sessions_select_approved" on public.training_sessions
  for select using (public.is_approved_player() or public.is_staff());

create policy "training_sessions_insert_staff" on public.training_sessions
  for insert with check (public.is_staff());

create policy "training_sessions_update_staff" on public.training_sessions
  for update using (public.is_staff()) with check (public.is_staff());

create policy "training_sessions_delete_staff" on public.training_sessions
  for delete using (public.is_staff());

-- ── attendance ────────────────────────────────────────────────────────────
alter table public.attendance enable row level security;

create policy "attendance_select_own" on public.attendance
  for select using (player_id = auth.uid() or public.is_staff());

create policy "attendance_insert_staff" on public.attendance
  for insert with check (public.is_staff());

create policy "attendance_update_staff" on public.attendance
  for update using (public.is_staff()) with check (public.is_staff());

create policy "attendance_delete_staff" on public.attendance
  for delete using (public.is_staff());

-- ── posts ────────────────────────────────────────────────────────────────
alter table public.posts enable row level security;

create policy "posts_select_approved" on public.posts
  for select using (public.is_approved_player() or public.is_staff());

create policy "posts_insert_staff" on public.posts
  for insert with check (public.is_staff());

create policy "posts_update_staff" on public.posts
  for update using (public.is_staff()) with check (public.is_staff());

create policy "posts_delete_staff" on public.posts
  for delete using (public.is_staff());

-- ── media ────────────────────────────────────────────────────────────────
alter table public.media enable row level security;

create policy "media_select_approved" on public.media
  for select using (public.is_approved_player() or public.is_staff());

create policy "media_insert_staff" on public.media
  for insert with check (public.is_staff());

create policy "media_update_staff" on public.media
  for update using (public.is_staff()) with check (public.is_staff());

create policy "media_delete_staff" on public.media
  for delete using (public.is_staff());

-- ── likes ────────────────────────────────────────────────────────────────
alter table public.likes enable row level security;

create policy "likes_select_approved" on public.likes
  for select using (public.is_approved_player() or public.is_staff());

create policy "likes_insert_own" on public.likes
  for insert with check (
    auth.uid() = user_id
    and (public.is_approved_player() or public.is_staff())
  );

create policy "likes_delete_own" on public.likes
  for delete using (
    auth.uid() = user_id
    and (public.is_approved_player() or public.is_staff())
  );

-- ── announcements ────────────────────────────────────────────────────────
alter table public.announcements enable row level security;

create policy "announcements_select_approved" on public.announcements
  for select using (public.is_approved_player() or public.is_staff());

create policy "announcements_insert_staff" on public.announcements
  for insert with check (public.is_staff());

create policy "announcements_update_staff" on public.announcements
  for update using (public.is_staff()) with check (public.is_staff());

create policy "announcements_delete_staff" on public.announcements
  for delete using (public.is_staff());

-- ── device_tokens ────────────────────────────────────────────────────────
alter table public.device_tokens enable row level security;

create policy "device_tokens_select_own" on public.device_tokens
  for select using (auth.uid() = user_id);

create policy "device_tokens_insert_own" on public.device_tokens
  for insert with check (auth.uid() = user_id);

create policy "device_tokens_update_own" on public.device_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "device_tokens_delete_own" on public.device_tokens
  for delete using (auth.uid() = user_id);

-- ── conversations ────────────────────────────────────────────────────────
alter table public.conversations enable row level security;

create policy "conversations_select_member" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = id and cm.user_id = auth.uid()
    )
  );

create policy "conversations_insert_approved" on public.conversations
  for insert with check (public.is_approved_player() or public.is_staff());

create policy "conversations_update_staff" on public.conversations
  for update using (public.is_staff()) with check (public.is_staff());

create policy "conversations_delete_staff" on public.conversations
  for delete using (public.is_staff());

-- ── conversation_members ─────────────────────────────────────────────────
alter table public.conversation_members enable row level security;

create policy "conversation_members_select_member" on public.conversation_members
  for select using (
    exists (
      select 1 from public.conversation_members me
      where me.conversation_id = conversation_id and me.user_id = auth.uid()
    )
  );

-- Staff may manage members. A conversation's creator may add members too
-- (used when a player starts a 1:1 chat with a coach or teammate).
create policy "conversation_members_insert_staff_or_creator" on public.conversation_members
  for insert with check (
    public.is_staff()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

create policy "conversation_members_delete_staff_or_self" on public.conversation_members
  for delete using (
    public.is_staff()
    or auth.uid() = user_id
  );

-- ── messages ─────────────────────────────────────────────────────────────
alter table public.messages enable row level security;

create policy "messages_select_member" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
    )
  );

create policy "messages_insert_member" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
    )
  );

-- ── fighter_cards ────────────────────────────────────────────────────────
alter table public.fighter_cards enable row level security;

create policy "fighter_cards_select_approved" on public.fighter_cards
  for select using (public.is_approved_player() or public.is_staff());

create policy "fighter_cards_insert_staff" on public.fighter_cards
  for insert with check (public.is_staff());

create policy "fighter_cards_update_staff" on public.fighter_cards
  for update using (public.is_staff()) with check (public.is_staff());

create policy "fighter_cards_delete_staff" on public.fighter_cards
  for delete using (public.is_staff());

-- ── public_profiles view ─────────────────────────────────────────────────
-- Sanitized player-facing read model (no DOB, place of birth, or family
-- contact details). Definer-owned so it can serve a player the safe details
-- of OTHER approved players, while row logic keeps visibility tight:
--   • everyone sees their own row
--   • approved members see other approved members' rows
--   • pending/rejected/unknown sees nobody else
create or replace view public.public_profiles
as
select
  id,
  full_name,
  phone,
  email,
  photo_url,
  role,
  status,
  category,
  weight_class,
  weight_kg,
  level,
  membership_status,
  is_minor,
  created_at
from public.profiles p
where
  auth.uid() = p.id
  or (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.status = 'approved'
    )
    and p.status = 'approved'
  );

grant select on public.public_profiles to authenticated;
grant select on public.public_profiles to service_role;