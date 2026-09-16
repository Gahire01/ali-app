import type {
  Announcement,
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
import {
  seedAttendance,
  seedConversationMembers,
  seedConversations,
  seedFighterCards,
  seedLikes,
  seedMedia,
  seedMessages,
  seedPosts,
  seedProfiles,
  seedSessions,
  staffRoles,
} from '@/lib/mock/data';

const latency = () => new Promise((resolve) => setTimeout(resolve, 220));

const bus = new Map<string, ((payload: unknown) => void)[]>();

export function subscribeToBus(channel: string, kind: string, handler: (payload: never) => void): () => void {
  const key = `${channel}|${kind}`;
  const list = bus.get(key) ?? [];
  list.push(handler as (payload: unknown) => void);
  bus.set(key, list);
  return () => {
    const next = (bus.get(key) ?? []).filter((h) => h !== handler);
    if (next.length === 0) bus.delete(key);
    else bus.set(key, next);
  };
}

export function emitBus(channel: string, kind: string, payload: unknown): void {
  bus.get(`${channel}|${kind}`)?.forEach((h) => h(payload));
}

/* ------------------------------------------------------------------ */
/* Mutable in-memory store                                            */
/* ------------------------------------------------------------------ */

const profiles: Profile[] = [...seedProfiles];
const posts: Post[] = [...seedPosts];
const postMedia: Media[] = [...seedMedia];
const postLikes: Like[] = [...seedLikes];
const sessions: TrainingSession[] = [...seedSessions];
const attendance: Attendance[] = [...seedAttendance];
const conversationsList: Conversation[] = [...seedConversations];
const conversationMembers: ConversationMember[] = [...seedConversationMembers];
const messages: Message[] = [...seedMessages];
const fighterCards: FighterCard[] = [...seedFighterCards];
const announcements: Announcement[] = [];

export const mockState = {
  get profiles() { return profiles; },
  get posts() { return posts; },
  get postMedia() { return postMedia; },
  get postLikes() { return postLikes; },
  get sessions() { return sessions; },
  get attendance() { return attendance; },
  get conversations() { return conversationsList; },
  get conversationMembers() { return conversationMembers; },
  get messages() { return messages; },
  get fighterCards() { return fighterCards; },
  get announcements() { return announcements; },
  isStaff,
};

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

/** Preview avatars resolve to stable placeholder photos. */
export function previewUrl(path: string | null | undefined): string {
  const key = encodeURIComponent((path ?? 'member').replace(/[^\w]+/g, ''));
  const style = ['grayscale', 'blur'].includes(key) ? '' : 'grayscale';
  return `https://picsum.photos/seed/${key || 'member'}/400/400${style ? '?blur=0' : ''}`;
}

export function isStaff(role: Profile['role']): boolean {
  return staffRoles.includes(role);
}

export async function mockGetProfile(userId: string): Promise<Profile | null> {
  await latency();
  return profiles.find((p) => p.id === userId) ?? null;
}

export async function mockGetFighterCard(playerId: string): Promise<FighterCard | null> {
  await latency();
  return fighterCards.find((c) => c.player_id === playerId) ?? null;
}

/* ------------------------------ Feed ------------------------------ */

export function feedView(userId: string) {
  return {
    async list(offset: number, limit: number): Promise<(Post & { author: Profile | null; media: Media[]; likeCount: number; likedByMe: boolean })[]> {
      await latency();
      const sorted = [...posts].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(offset, offset + limit);
      const me = userId;
      return sorted.map((post) => ({
        ...post,
        author: profiles.find((p) => p.id === post.author_id) ?? null,
        media: postMedia.filter((m) => m.post_id === post.id),
        likeCount: postLikes.filter((l) => l.post_id === post.id).length,
        likedByMe: postLikes.some((l) => l.post_id === post.id && l.user_id === me),
      }));
    },
    async create(input: { authorId: string; caption: string; images: string[] }): Promise<void> {
      await latency();
      const post: Post = {
        id: uid('post'),
        author_id: input.authorId,
        caption: input.caption,
        created_at: new Date().toISOString(),
      };
      posts.unshift(post);
      input.images.forEach((img, i) => {
        postMedia.unshift({
          id: uid('media'),
          post_id: post.id,
          type: 'image',
          file_url: img,
          thumbnail_url: img,
          created_at: post.created_at,
        });
      });
      emitBus('feed', 'reload', {});
    },
    async toggleLike(postId: string, userId: string): Promise<boolean> {
      await latency();
      const existing = postLikes.find((l) => l.post_id === postId && l.user_id === userId);
      if (existing) {
        postLikes.splice(postLikes.indexOf(existing), 1);
        return false;
      }
      postLikes.push({ post_id: postId, user_id: userId, created_at: new Date().toISOString() });
      return true;
    },
  };
}

/* ---------------------------- Training ---------------------------- */

export function trainingView(userId: string) {
  return {
    async list(): Promise<TrainingSession[]> {
      await latency();
      return [...sessions].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    },
    async myAttendance(): Promise<Attendance[]> {
      await latency();
      return attendance.filter((a) => a.player_id === userId);
    },
    async sessionAttendance(sessionId: string): Promise<Attendance[]> {
      await latency();
      return attendance.filter((a) => a.session_id === sessionId);
    },
    async markAttendance(sessionId: string, playerId: string, status: Attendance['status']): Promise<void> {
      await latency();
      const existing = attendance.find((a) => a.session_id === sessionId && a.player_id === playerId);
      if (existing) {
        existing.status = status;
        existing.marked_at = new Date().toISOString();
      } else {
        attendance.push({ id: uid('att'), session_id: sessionId, player_id: playerId, status, marked_at: new Date().toISOString() });
      }
    },
    async closeSession(sessionId: string): Promise<void> {
      await latency();
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;
      session.status = 'completed';
      attendance
        .filter((a) => a.session_id === sessionId && a.status === 'pending')
        .forEach((a) => {
          a.status = 'absent';
          a.marked_at = new Date().toISOString();
        });
    },
    async startSession(sessionId: string): Promise<void> {
      await latency();
      const session = sessions.find((s) => s.id === sessionId);
      if (session && session.status === 'scheduled') session.status = 'started';
    },
    async create(input: { title: string; location: string; notes: string; startsAt: string; createdBy: string }): Promise<void> {
      await latency();
      sessions.push({ id: uid('s'), title: input.title, location: input.location, notes: input.notes, starts_at: input.startsAt, created_by: input.createdBy, status: 'scheduled', created_at: new Date().toISOString() });
    },
  };
}

/* ------------------------------ Chat ------------------------------ */

export function chatView(userId: string) {
  const titleFor = (conv: Conversation) => {
    if (conv.is_group) return conv.name ?? 'Group chat';
    const other = conversationMembers
      .filter((m) => m.conversation_id === conv.id && m.user_id !== userId)
      .map((m) => profiles.find((p) => p.id === m.user_id))
      .find((p): p is Profile => Boolean(p));
    return other?.full_name ?? 'Chat';
  };

  return {
    async list(): Promise<{ conversation: Conversation; title: string; lastMessage: Message | null; unreadCount: number }[]> {
      await latency();
      const mine = conversationMembers.filter((m) => m.user_id === userId).map((m) => m.conversation_id);
      return conversationsList
        .filter((c) => mine.includes(c.id))
        .map((conv) => {
          const convMessages = messages.filter((m) => m.conversation_id === conv.id);
          convMessages.sort((a, b) => a.created_at.localeCompare(b.created_at));
          const last = convMessages[convMessages.length - 1] ?? null;
          const unread = convMessages.filter((m) => m.sender_id !== userId && !m.read_at).length;
          return { conversation: conv, title: titleFor(conv), lastMessage: last, unreadCount: unread };
        })
        .sort((a, b) => (b.lastMessage?.created_at ?? b.conversation.created_at).localeCompare(a.lastMessage?.created_at ?? a.conversation.created_at));
    },
    async messages(conversationId: string, limit: number): Promise<Message[]> {
      await latency();
      const all = messages.filter((m) => m.conversation_id === conversationId).sort((a, b) => a.created_at.localeCompare(b.created_at));
      return all.slice(-limit);
    },
    async send(conversationId: string, senderId: string, body: string): Promise<Message> {
      const message: Message = { id: uid('m'), conversation_id: conversationId, sender_id: senderId, body, read_at: null, created_at: new Date().toISOString() };
      await latency();
      messages.push(message);
      emitBus(`chat:${conversationId}`, 'INSERT', message);
      return message;
    },
    async markRead(conversationId: string, readerId: string): Promise<void> {
      messages
        .filter((m) => m.conversation_id === conversationId && m.sender_id !== readerId && !m.read_at)
        .forEach((m) => {
          m.read_at = new Date().toISOString();
        });
    },
    async create(input: { createdBy: string; isGroup: boolean; title?: string; memberIds: string[] }): Promise<Conversation> {
      await latency();
      const conv: Conversation = { id: uid('c'), name: input.isGroup ? input.title ?? 'Group chat' : null, is_group: input.isGroup, created_by: input.createdBy, created_at: new Date().toISOString() };
      conversationsList.push(conv);
      [...new Set([input.createdBy, ...input.memberIds])].forEach((userId) => {
        conversationMembers.push({ conversation_id: conv.id, user_id: userId, joined_at: new Date().toISOString() });
      });
      return conv;
    },
    async members(conversationId: string): Promise<Profile[]> {
      const ids = conversationMembers.filter((m) => m.conversation_id === conversationId).map((m) => m.user_id);
      return profiles.filter((p) => ids.includes(p.id));
    },
    async addMember(conversationId: string, userId: string): Promise<void> {
      if (!conversationMembers.some((m) => m.conversation_id === conversationId && m.user_id === userId)) {
        conversationMembers.push({ conversation_id: conversationId, user_id: userId, joined_at: new Date().toISOString() });
      }
    },
    async removeMember(conversationId: string, userId: string): Promise<void> {
      const idx = conversationMembers.findIndex((m) => m.conversation_id === conversationId && m.user_id === userId);
      if (idx >= 0) conversationMembers.splice(idx, 1);
    },
  };
}

/* ----------------------------- Admin ------------------------------ */

export const adminView = {
  async pending(): Promise<Profile[]> {
    await latency();
    return profiles.filter((p) => p.status === 'pending');
  },
  async setApproval(playerId: string, approved: boolean, category?: string): Promise<void> {
    await latency();
    const profile = profiles.find((p) => p.id === playerId);
    if (!profile) return;
    profile.status = approved ? 'approved' : 'rejected';
    profile.category = approved ? category ?? null : profile.category;
  },
  async updateProfile(playerId: string, fields: Partial<Profile>): Promise<void> {
    await latency();
    const profile = profiles.find((p) => p.id === playerId);
    if (profile) Object.assign(profile, fields);
  },
  async players(): Promise<Profile[]> {
    await latency();
    return profiles
      .filter((p) => p.status === 'approved')
      .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
  },
  async stats() {
    const approved = profiles.filter((p) => p.status === 'approved').length;
    const pending = profiles.filter((p) => p.status === 'pending').length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 86400_000);
    const todaySessions = sessions.filter((s) => s.starts_at >= todayStart.toISOString() && s.starts_at < todayEnd.toISOString()).length;
    const openedId = sessions.find((s) => s.status === 'started')?.id;
    const marked = openedId ? attendance.filter((a) => a.session_id === openedId && a.status !== 'pending') : [];
    const totalPlayers = new Set(attendance.filter((a) => a.session_id === openedId).map((a) => a.player_id)).size;
    const attendancePct = totalPlayers > 0 ? Math.round((marked.length / totalPlayers) * 100) : null;
    return { totalMembers: approved, pending, todaySessions, attendancePct };
  },
  async fighterCard(playerId: string): Promise<FighterCard | null> {
    return fighterCards.find((c) => c.player_id === playerId) ?? null;
  },
  async saveFighterCard(card: Omit<FighterCard, 'id' | 'created_at'>): Promise<void> {
    await latency();
    const existing = fighterCards.find((c) => c.player_id === card.player_id);
    if (existing) {
      Object.assign(existing, card);
    } else {
      fighterCards.push({ ...card, id: uid('fc'), created_at: new Date().toISOString() });
    }
  },
  async announce(input: { sentBy: string; title: string; body: string; target: string }): Promise<void> {
    await latency();
    announcements.push({ id: uid('ann'), sent_by: input.sentBy, title: input.title, body: input.body, target: input.target, sent_at: new Date().toISOString() });
  },
  async allMembers(): Promise<Profile[]> {
    return profiles;
  },
};