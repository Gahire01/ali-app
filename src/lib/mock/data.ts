import type {
  Attendance,
  Conversation,
  ConversationMember,
  FighterCard,
  Like,
  Media,
  Message,
  Post,
  Profile,
  TrainingSession,
} from '@/types/supabase';

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400_000).toISOString();

export const staffRoles: Profile['role'][] = ['admin', 'coach', 'collaborator'];

export function isStaff(role: Profile['role']): boolean {
  return staffRoles.includes(role);
}

const base = (
  id: string,
  full_name: string,
  email: string,
  role: Profile['role'],
  extra: Partial<Profile>
): Profile => ({
  id,
  full_name,
  phone: '+250 788 000 000',
  email,
  photo_url: '',
  role,
  status: 'approved',
  category: null,
  weight_class: null,
  weight_kg: null,
  level: null,
  membership_status: null,
  date_of_birth: null,
  place_of_birth: 'Kigali',
  is_minor: false,
  guardian_name: null,
  guardian_phone: null,
  parent_name: null,
  parent_phone: null,
  created_at: daysAgo(200),
  ...extra,
});

export const seedProfiles: Profile[] = [
  base('me-admin', 'Ali Semwaga', 'gahiredev01@gmail.com', 'admin', {
    phone: '+250 788 000 001',
    photo_url: 'avatars/me-admin.jpg',
    category: 'COACH',
    level: 'Head Coach',
    date_of_birth: '1985-02-14',
    created_at: daysAgo(400),
  }),
  base('coach-abdul', 'Havrimana Abdul', 'havrimana@aliboxing.rw', 'coach', {
    phone: '+250 788 000 002',
    photo_url: 'avatars/coach-abdul.jpg',
    category: 'COACH',
    level: 'Second Coach',
    created_at: daysAgo(380),
  }),
  base('coach-placid', 'Izabayo Placid', 'izabayo@aliboxing.rw', 'coach', {
    phone: '+250 788 000 003',
    photo_url: 'avatars/coach-placid.jpg',
    category: 'COACH',
    level: 'Third Coach',
    created_at: daysAgo(360),
  }),
  base('secretary', 'Abdillilah Gahire', 'gahire@aliboxing.rw', 'collaborator', {
    phone: '+250 788 000 004',
    photo_url: 'avatars/secretary.jpg',
    category: 'STAFF',
    level: 'Secretary',
    created_at: daysAgo(350),
  }),
  base('p-eric', 'Eric Mugisha', 'eric.mugisha@example.com', 'player', {
    phone: '+250 788 000 010',
    category: 'PRO',
    weight_class: 'Lightweight',
    weight_kg: 61,
    level: 'Advanced',
    membership_status: 'Active',
    date_of_birth: '2000-05-12',
    created_at: daysAgo(300),
  }),
  base('p-diane', 'Diane Uwase', 'diane.uwase@example.com', 'player', {
    phone: '+250 788 000 011',
    category: 'AMATEUR',
    weight_class: 'Featherweight',
    weight_kg: 54,
    level: 'Intermediate',
    membership_status: 'Active',
    date_of_birth: '2002-09-03',
    created_at: daysAgo(280),
  }),
  base('p-blaise', 'Blaise Hakizimana', 'blaise.h@example.com', 'player', {
    phone: '+250 788 000 012',
    category: 'AMATEUR',
    weight_class: 'Welterweight',
    weight_kg: 67,
    level: 'Beginner',
    membership_status: 'Active',
    date_of_birth: '2004-01-19',
    is_minor: true,
    guardian_name: 'Jean Hakizimana',
    guardian_phone: '+250 788 100 012',
    created_at: daysAgo(200),
  }),
  base('p-kevin', 'Kevin Ndungutse', 'kevin.n@example.com', 'player', {
    phone: '+250 788 000 013',
    category: 'YOUTH 13-17',
    weight_kg: 48,
    level: 'Beginner',
    membership_status: 'Active',
    date_of_birth: '2010-08-30',
    is_minor: true,
    guardian_name: 'Patrick Ndungutse',
    guardian_phone: '+250 788 100 013',
    created_at: daysAgo(150),
  }),
  base('p-aline', 'Aline Mukamana', 'aline.m@example.com', 'player', {
    phone: '+250 788 000 014',
    category: 'YOUTH 13-17',
    weight_kg: 52,
    level: 'Intermediate',
    membership_status: 'Active',
    date_of_birth: '2009-11-11',
    is_minor: true,
    guardian_name: 'Solange Mukamana',
    guardian_phone: '+250 788 100 014',
    created_at: daysAgo(120),
  }),
  base('p-samuel', 'Samuel Bizimana', 'samuel.b@example.com', 'player', {
    phone: '+250 788 000 015',
    category: 'KIDS 6-12',
    weight_kg: 28,
    level: 'Beginner',
    membership_status: 'Active',
    date_of_birth: '2014-04-25',
    is_minor: true,
    guardian_name: 'Claudine Bizimana',
    guardian_phone: '+250 788 100 015',
    created_at: daysAgo(90),
  }),
  base('p-grace', 'Grace Umuhoza', 'grace.u@example.com', 'player', {
    phone: '+250 788 000 016',
    category: 'AMATEUR',
    weight_class: 'Bantamweight',
    weight_kg: 56,
    level: 'Intermediate',
    membership_status: 'Active',
    date_of_birth: '2001-12-07',
    created_at: daysAgo(75),
  }),
  base('p-pending1', 'Christelle Ingabire', 'christelle.i@example.com', 'player', {
    phone: '+250 788 000 020',
    status: 'pending',
    is_minor: false,
    created_at: hoursFromNow(-9),
  }),
  base('p-pending2', 'Yves Nkundimana', 'yves.n@example.com', 'player', {
    phone: '+250 788 000 021',
    status: 'pending',
    is_minor: true,
    guardian_name: 'Aimable Nkundimana',
    guardian_phone: '+250 788 100 021',
    created_at: hoursFromNow(-3),
  }),
];

export const seedPosts: Post[] = [
  {
    id: 'post-1',
    author_id: 'me-admin',
    caption:
      'Sparring night was electric. 14 rounds, zero doubt. The Kigali fight team is built different. Session recap on the board tomorrow at 06:30.',
    created_at: hoursFromNow(-20),
  },
  {
    id: 'post-2',
    author_id: 'coach-abdul',
    caption:
      'Skipping rope before every session, non-negotiable. Champions are made in the boring hours.',
    created_at: hoursFromNow(-44),
  },
  {
    id: 'post-3',
    author_id: 'me-admin',
    caption:
      'New applications are open for review. Coaches check the dashboard — approvals are cleared daily.',
    created_at: daysAgo(2),
  },
  {
    id: 'post-4',
    author_id: 'coach-placid',
    caption:
      'Footwork drill of the week: pivot out, reset, cut the ring. See you all at the usual time.',
    created_at: daysAgo(3),
  },
];

export const seedMedia: Media[] = [
  {
    id: 'media-1',
    post_id: 'post-1',
    type: 'image',
    file_url: 'posts/post-1/ring.jpg',
    thumbnail_url: 'posts/post-1/ring_thumb.jpg',
    created_at: hoursFromNow(-20),
  },
  {
    id: 'media-2',
    post_id: 'post-4',
    type: 'image',
    file_url: 'posts/post-4/footwork.jpg',
    thumbnail_url: 'posts/post-4/footwork_thumb.jpg',
    created_at: daysAgo(3),
  },
];

export const seedLikes: Like[] = [
  { post_id: 'post-1', user_id: 'p-eric', created_at: hoursFromNow(-19) },
  { post_id: 'post-1', user_id: 'p-diane', created_at: hoursFromNow(-19) },
  { post_id: 'post-2', user_id: 'p-blaise', created_at: hoursFromNow(-10) },
  { post_id: 'post-3', user_id: 'p-kevin', created_at: daysAgo(1) },
  { post_id: 'post-3', user_id: 'p-aline', created_at: daysAgo(1) },
];

export const seedSessions: TrainingSession[] = [
  { id: 's1', title: 'Morning Condition', location: 'Gym floor', notes: 'Skip rope, shadow boxing, core circuit.', starts_at: daysAgo(28), created_by: 'me-admin', status: 'completed', created_at: daysAgo(29) },
  { id: 's2', title: 'Technique: Guard and Defense', location: 'Rings A and B', notes: 'Shell drills, stay tall, counters.', starts_at: daysAgo(21), created_by: 'coach-abdul', status: 'completed', created_at: daysAgo(22) },
  { id: 's3', title: 'Bag Work', location: 'Heavy bag room', notes: 'Six 3-minute rounds, hands up.', starts_at: daysAgo(14), created_by: 'me-admin', status: 'completed', created_at: daysAgo(15) },
  { id: 's4', title: 'Sparring Night', location: 'Main ring', notes: 'Approved pairs only. Gear checked at the door.', starts_at: daysAgo(7), created_by: 'me-admin', status: 'completed', created_at: daysAgo(8) },
  { id: 's5', title: 'Morning Condition', location: 'Gym floor', notes: '', starts_at: hoursFromNow(14), created_by: 'coach-placid', status: 'scheduled', created_at: daysAgo(1) },
  { id: 's6', title: 'Technique: Footwork', location: 'Rings A and B', notes: 'Pivots, angles, ring control.', starts_at: hoursFromNow(62), created_by: 'me-admin', status: 'scheduled', created_at: daysAgo(2) },
];

export const seedAttendance: Attendance[] = [
  { id: 'a1', session_id: 's1', player_id: 'p-eric', status: 'present', marked_at: daysAgo(28) },
  { id: 'a2', session_id: 's1', player_id: 'p-diane', status: 'present', marked_at: daysAgo(28) },
  { id: 'a3', session_id: 's1', player_id: 'p-blaise', status: 'late', marked_at: daysAgo(28) },
  { id: 'a4', session_id: 's2', player_id: 'p-eric', status: 'present', marked_at: daysAgo(21) },
  { id: 'a5', session_id: 's2', player_id: 'p-diane', status: 'absent', marked_at: daysAgo(21) },
  { id: 'a6', session_id: 's3', player_id: 'p-eric', status: 'present', marked_at: daysAgo(14) },
  { id: 'a7', session_id: 's3', player_id: 'p-blaise', status: 'present', marked_at: daysAgo(14) },
  { id: 'a8', session_id: 's4', player_id: 'p-eric', status: 'present', marked_at: daysAgo(7) },
  { id: 'a9', session_id: 's4', player_id: 'p-diane', status: 'present', marked_at: daysAgo(7) },
  { id: 'a10', session_id: 's1', player_id: 'p-kevin', status: 'present', marked_at: daysAgo(28) },
  { id: 'a11', session_id: 's2', player_id: 'p-kevin', status: 'absent', marked_at: daysAgo(21) },
  { id: 'a12', session_id: 's3', player_id: 'p-kevin', status: 'present', marked_at: daysAgo(14) },
];

export const seedConversations: Conversation[] = [
  { id: 'c1', name: null, is_group: false, created_by: 'me-admin', created_at: daysAgo(120) },
  { id: 'c2', name: 'Kigali Fight Team', is_group: true, created_by: 'me-admin', created_at: daysAgo(100) },
  { id: 'c3', name: null, is_group: false, created_by: 'p-eric', created_at: daysAgo(60) },
];

export const seedConversationMembers: ConversationMember[] = [
  { conversation_id: 'c1', user_id: 'me-admin', joined_at: daysAgo(120) },
  { conversation_id: 'c1', user_id: 'coach-abdul', joined_at: daysAgo(120) },
  { conversation_id: 'c2', user_id: 'me-admin', joined_at: daysAgo(100) },
  { conversation_id: 'c2', user_id: 'coach-abdul', joined_at: daysAgo(100) },
  { conversation_id: 'c2', user_id: 'coach-placid', joined_at: daysAgo(100) },
  { conversation_id: 'c2', user_id: 'secretary', joined_at: daysAgo(100) },
  { conversation_id: 'c2', user_id: 'p-eric', joined_at: daysAgo(90) },
  { conversation_id: 'c2', user_id: 'p-diane', joined_at: daysAgo(90) },
  { conversation_id: 'c2', user_id: 'p-blaise', joined_at: daysAgo(80) },
  { conversation_id: 'c2', user_id: 'p-grace', joined_at: daysAgo(60) },
  { conversation_id: 'c3', user_id: 'me-admin', joined_at: daysAgo(60) },
  { conversation_id: 'c3', user_id: 'p-eric', joined_at: daysAgo(60) },
];

export const seedMessages: Message[] = [
  { id: 'm1', conversation_id: 'c2', sender_id: 'me-admin', body: 'Week schedule is live. Morning Condition tomorrow 06:30 sharp.', read_at: daysAgo(1), created_at: hoursFromNow(-50) },
  { id: 'm2', conversation_id: 'c2', sender_id: 'p-eric', body: 'On it. See you all at the gym.', read_at: hoursFromNow(-49), created_at: hoursFromNow(-48) },
  { id: 'm3', conversation_id: 'c2', sender_id: 'coach-abdul', body: 'Bring wraps, we drill guard in round two.', read_at: hoursFromNow(-10), created_at: hoursFromNow(-22) },
  { id: 'm4', conversation_id: 'c1', sender_id: 'coach-abdul', body: 'Coach, the ring mats arrived. Where do you want them stacked?', read_at: hoursFromNow(-30), created_at: hoursFromNow(-30) },
  { id: 'm5', conversation_id: 'c1', sender_id: 'me-admin', body: 'Good. By the heavy bags, left corner.', read_at: null, created_at: hoursFromNow(-29) },
  { id: 'm6', conversation_id: 'c3', sender_id: 'p-eric', body: 'Boss, match day nutrition plan?', read_at: hoursFromNow(-26), created_at: hoursFromNow(-26) },
  { id: 'm7', conversation_id: 'c3', sender_id: 'me-admin', body: 'Weights stay, carbs up Friday. Scale at 07:00.', read_at: null, created_at: hoursFromNow(-25) },
];

export const seedFighterCards: FighterCard[] = [
  { id: 'fc1', player_id: 'p-eric', display_name: 'The Surgeon', photo_url: 'avatars/p-eric.jpg', category: 'PRO', weight_class: 'Lightweight', level: 'Advanced', wins: 8, losses: 1, membership_status: 'Active', created_at: daysAgo(90) },
  { id: 'fc2', player_id: 'p-diane', display_name: 'Uwase', photo_url: 'avatars/p-diane.jpg', category: 'AMATEUR', weight_class: 'Featherweight', level: 'Intermediate', wins: 5, losses: 2, membership_status: 'Active', created_at: daysAgo(60) },
  { id: 'fc3', player_id: 'p-blaise', display_name: 'Blaze', photo_url: 'avatars/p-blaise.jpg', category: 'AMATEUR', weight_class: 'Welterweight', level: 'Beginner', wins: 2, losses: 3, membership_status: 'Active', created_at: daysAgo(30) },
];