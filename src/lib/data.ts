import type {
  Attendance,
  Conversation,
  FighterCard,
  Media,
  Message,
  Post,
  Profile,
  TrainingSession,
} from '@/types/supabase';
import { isPreviewMock } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import {
  adminView as mockAdminView,
  chatView as mockChatView,
  feedView as mockFeedView,
  mockGetFighterCard,
  mockGetProfile,
  previewUrl as mockPreviewUrl,
  subscribeToBus,
  trainingView as mockTrainingView,
} from '@/lib/mock';
import { isStaff as _isStaff } from '@/lib/mock/data';

/** Coach/admin/collaborator roles have staff powers. */
export const isStaff = _isStaff;

export type FeedPost = Post & {
  author: Profile | null;
  media: Media[];
  likeCount: number;
  likedByMe: boolean;
};

export type ConversationSummary = {
  conversation: Conversation;
  title: string;
  lastMessage: Message | null;
  unreadCount: number;
};

export type AdminStats = {
  totalMembers: number;
  pending: number;
  todaySessions: number;
  attendancePct: number | null;
};

/** Resolve a media/storage path to a displayable URL (real vs preview). */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (isPreviewMock) return mockPreviewUrl(path);
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from('club-media').getPublicUrl(path).data?.publicUrl ?? path;
}

/* ----------------------------- Profile ---------------------------- */

export async function getProfile(userId: string): Promise<Profile | null> {
  if (isPreviewMock) return mockGetProfile(userId);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    console.error('getProfile', error);
    return null;
  }
  return data;
}

export async function getFighterCard(playerId: string): Promise<FighterCard | null> {
  if (isPreviewMock) return mockGetFighterCard(playerId);
  const { data, error } = await supabase.from('fighter_cards').select('*').eq('player_id', playerId).maybeSingle();
  if (error) {
    console.error('getFighterCard', error);
    return null;
  }
  return data;
}

/* ------------------------------- Feed ----------------------------- */

export const feed = {
  async list(userId: string, offset: number, limit: number): Promise<FeedPost[]> {
    if (isPreviewMock) return mockFeedView(userId).list(offset, limit);

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p.id);
    const authorIds = [...new Set(posts.map((p) => p.author_id).filter(Boolean))] as string[];

    const [media, likes, myLikes, authors] = await Promise.all([
      supabase.from('media').select('*').in('post_id', postIds),
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', userId),
      authorIds.length > 0
        ? supabase.from('profiles').select('*').in('id', authorIds)
        : Promise.resolve({ data: [] as Profile[], error: null }),
    ]);

    if (media.error) throw media.error;
    if (likes.error) throw likes.error;
    if (myLikes.error) throw myLikes.error;
    if (authors.error) throw authors.error;

    const mediaByPost = new Map<string, Media[]>();
    media.data.forEach((m) => {
      const list = mediaByPost.get(m.post_id) ?? [];
      list.push(m);
      mediaByPost.set(m.post_id, list);
    });
    const countByPost = new Map<string, number>();
    likes.data.forEach((l) => countByPost.set(l.post_id, (countByPost.get(l.post_id) ?? 0) + 1));
    const mine = new Set(myLikes.data.map((l) => l.post_id));
    const authorById = new Map(authors.data.map((a) => [a.id, a]));

    return posts.map((post) => ({
      ...post,
      author: post.author_id ? authorById.get(post.author_id) ?? null : null,
      media: mediaByPost.get(post.id) ?? [],
      likeCount: countByPost.get(post.id) ?? 0,
      likedByMe: mine.has(post.id),
    }));
  },

  async create(input: { authorId: string; caption: string; images: string[] }): Promise<void> {
    if (isPreviewMock) return mockFeedView(input.authorId).create(input);

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({ author_id: input.authorId, caption: input.caption })
      .select('id')
      .single();
    if (postError) throw postError;

    for (const [i, image] of input.images.entries()) {
      const path = `posts/${post.id}/${i}`;
      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('club-media')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { error: mediaError } = await supabase
        .from('media')
        .insert({ post_id: post.id, type: 'image', file_url: path, thumbnail_url: path });
      if (mediaError) throw mediaError;
    }
  },

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    if (isPreviewMock) return mockFeedView(userId).toggleLike(postId, userId);

    const { data: existing } = await supabase.from('likes').select().eq('post_id', postId).eq('user_id', userId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      if (error) throw error;
      return false;
    }
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
    return true;
  },
};

/* ----------------------------- Training --------------------------- */

export const training = {
  async list(): Promise<TrainingSession[]> {
    if (isPreviewMock) return mockTrainingView('').list();
    const { data, error } = await supabase.from('training_sessions').select('*').order('starts_at');
    if (error) throw error;
    return data;
  },
  async myAttendance(userId: string): Promise<Attendance[]> {
    if (isPreviewMock) return mockTrainingView(userId).myAttendance();
    const { data, error } = await supabase.from('attendance').select('*').eq('player_id', userId);
    if (error) throw error;
    return data;
  },
  async sessionAttendance(sessionId: string): Promise<Attendance[]> {
    if (isPreviewMock) return mockTrainingView('').sessionAttendance(sessionId);
    const { data, error } = await supabase.from('attendance').select('*').eq('session_id', sessionId);
    if (error) throw error;
    return data;
  },
  async markAttendance(sessionId: string, playerId: string, status: Attendance['status']): Promise<void> {
    if (isPreviewMock) return mockTrainingView('').markAttendance(sessionId, playerId, status);
    const { error } = await supabase
      .from('attendance')
      .upsert(
        { session_id: sessionId, player_id: playerId, status, marked_at: new Date().toISOString() },
        { onConflict: 'session_id,player_id' }
      );
    if (error) throw error;
  },
  async closeSession(sessionId: string): Promise<void> {
    if (isPreviewMock) return mockTrainingView('').closeSession(sessionId);
    const { error } = await supabase.from('training_sessions').update({ status: 'completed' }).eq('id', sessionId);
    if (error) throw error;
    const { error: flagError } = await supabase
      .from('attendance')
      .update({ status: 'absent', marked_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('status', 'pending');
    if (flagError) throw flagError;
  },
  async startSession(sessionId: string): Promise<void> {
    if (isPreviewMock) return mockTrainingView('').startSession(sessionId);
    const { error } = await supabase.from('training_sessions').update({ status: 'started' }).eq('id', sessionId);
    if (error) throw error;
  },
  async create(input: { title: string; location: string; notes: string; startsAt: string; createdBy: string }): Promise<void> {
    if (isPreviewMock) return mockTrainingView('').create(input);
    const { error } = await supabase.from('training_sessions').insert({
      title: input.title,
      location: input.location,
      notes: input.notes,
      starts_at: input.startsAt,
      created_by: input.createdBy,
    });
    if (error) throw error;
  },
};

/* ------------------------------- Chat ------------------------------ */

export const chat = {
  async list(userId: string): Promise<ConversationSummary[]> {
    if (isPreviewMock) return mockChatView(userId).list();

    const { data: memberships, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);
    if (memberError) throw memberError;

    const convIds = memberships.map((m) => m.conversation_id);
    if (convIds.length === 0) return [];

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds);
    if (convError) throw convError;

    const summary = await Promise.all(
      conversations.map(async (conversation) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const { data: unread } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversation.id)
          .neq('sender_id', userId)
          .is('read_at', null);

        let title = conversation.name ?? 'Group chat';
        if (!conversation.is_group) {
          const { data: otherMembers } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conversation.id)
            .neq('user_id', userId);
          const otherId = otherMembers?.[0]?.user_id;
          if (otherId) {
            const { data: otherProfile } = await supabase.from('public_profiles').select('full_name').eq('id', otherId).maybeSingle();
            title = otherProfile?.full_name ?? 'Chat';
          }
        }

        return {
          conversation,
          title,
          lastMessage: lastMessage ?? null,
          unreadCount: unread?.length ?? 0,
        };
      })
    );

    return summary.sort((a, b) =>
      (b.lastMessage?.created_at ?? b.conversation.created_at).localeCompare(
        a.lastMessage?.created_at ?? a.conversation.created_at
      )
    );
  },

  async messages(conversationId: string, limit: number): Promise<Message[]> {
    if (isPreviewMock) return mockChatView('').messages(conversationId, limit);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async send(conversationId: string, senderId: string, body: string): Promise<Message> {
    if (isPreviewMock) return mockChatView(senderId).send(conversationId, senderId, body);

    const { data: message, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select('*')
      .single();
    if (error) throw error;

    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId);
    const memberIds = members?.map((m) => m.user_id) ?? [];
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    let pushTitle = conversation?.name ?? 'Chat';
    if (conversation && !conversation.is_group) {
      const otherId = memberIds.find((id) => id !== senderId);
      if (otherId) {
        const { data: other } = await supabase.from('public_profiles').select('full_name').eq('id', otherId).maybeSingle();
        pushTitle = other?.full_name ?? 'Chat';
      }
    }

    void supabase.functions.invoke('send-push', {
      body: { conversation_id: conversationId, ex_sender_id: senderId, title: pushTitle, body },
    });

    return message;
  },

  async markRead(conversationId: string, readerId: string): Promise<void> {
    if (isPreviewMock) return mockChatView(readerId).markRead(conversationId, readerId);
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', readerId)
      .is('read_at', null);
  },

  async create(input: { createdBy: string; isGroup: boolean; title?: string; memberIds: string[] }): Promise<Conversation> {
    if (isPreviewMock) return mockChatView(input.createdBy).create(input);

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({ name: input.isGroup ? input.title ?? 'Group chat' : null, is_group: input.isGroup, created_by: input.createdBy })
      .select('*')
      .single();
    if (error) throw error;

    const rows = [...new Set([input.createdBy, ...input.memberIds])].map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
    }));
    const { error: memberError } = await supabase.from('conversation_members').insert(rows);
    if (memberError) throw memberError;
    return conversation;
  },

  async members(conversationId: string): Promise<Profile[]> {
    if (isPreviewMock) return mockChatView('').members(conversationId);
    const { data: rows, error } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId);
    if (error) throw error;
    const ids = rows.map((r) => r.user_id);
    if (ids.length === 0) return [];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
    return profiles ?? [];
  },

  async addMember(conversationId: string, userId: string): Promise<void> {
    if (isPreviewMock) return mockChatView('').addMember(conversationId, userId);
    await supabase.from('conversation_members').insert({ conversation_id: conversationId, user_id: userId });
  },

  async removeMember(conversationId: string, userId: string): Promise<void> {
    if (isPreviewMock) return mockChatView('').removeMember(conversationId, userId);
    await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  },

  subscribe(conversationId: string, handler: (message: Message) => void): () => void {
    if (isPreviewMock) {
      return subscribeToBus(`chat:${conversationId}`, 'INSERT', handler as (payload: never) => void);
    }
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => handler(payload.new as Message)
      )
      .subscribe();
    return () => {
      void channel.unsubscribe();
    };
  },
};

/* ------------------------------- Admin ----------------------------- */

export const admin = {
  async pending(): Promise<Profile[]> {
    if (isPreviewMock) return mockAdminView.pending();
    const { data, error } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at');
    if (error) throw error;
    return data;
  },

  async setApproval(playerId: string, approved: boolean, category?: string): Promise<void> {
    if (isPreviewMock) return mockAdminView.setApproval(playerId, approved, category);

    const { error } = await supabase
      .from('profiles')
      .update({ status: approved ? 'approved' : 'rejected', category: approved ? category ?? null : null })
      .eq('id', playerId);
    if (error) throw error;

    void supabase.functions.invoke('on-approval', { body: { userId: playerId, approved } });
    if (approved) {
      void supabase.functions.invoke('send-push', {
        body: {
          user_ids: [playerId],
          title: "You're in.",
          body: 'Welcome to ALI Boxing Club. Your training space is ready.',
        },
      });
    }
  },

  async updateProfile(playerId: string, fields: Partial<Profile>): Promise<void> {
    if (isPreviewMock) return mockAdminView.updateProfile(playerId, fields);
    const { error } = await supabase.from('profiles').update(fields).eq('id', playerId);
    if (error) throw error;
  },

  async players(): Promise<Profile[]> {
    if (isPreviewMock) return mockAdminView.players();
    const { data, error } = await supabase.from('profiles').select('*').eq('status', 'approved');
    if (error) throw error;
    return [...data].sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
  },

  async stats(): Promise<AdminStats> {
    if (isPreviewMock) return mockAdminView.stats();
    const [{ count: totalMembers }, { count: pending }, { data: sessions }, { data: openedId }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('training_sessions')
        .select('id')
        .gte('starts_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .lt('starts_at', new Date(new Date().setHours(0, 0, 0, 0) + 86400_000).toISOString()),
      supabase.from('training_sessions').select('id').eq('status', 'started').limit(1).maybeSingle(),
    ]);

    let attendancePct: number | null = null;
    if (openedId?.id) {
      const { count: marked } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', openedId.id)
        .neq('status', 'pending');
      const { count: all } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', openedId.id);
      if (all && all > 0) attendancePct = Math.round(((marked ?? 0) / all) * 100);
    }

    return { totalMembers: totalMembers ?? 0, pending: pending ?? 0, todaySessions: sessions?.length ?? 0, attendancePct };
  },

  async fighterCard(playerId: string): Promise<FighterCard | null> {
    if (isPreviewMock) return mockAdminView.fighterCard(playerId);
    const { data, error } = await supabase.from('fighter_cards').select('*').eq('player_id', playerId).maybeSingle();
    if (error) console.error('fighterCard', error);
    return data;
  },

  async saveFighterCard(card: Omit<FighterCard, 'id' | 'created_at'>): Promise<void> {
    if (isPreviewMock) return mockAdminView.saveFighterCard(card);
    const { error } = await supabase.from('fighter_cards').upsert(card, { onConflict: 'player_id' });
    if (error) throw error;
  },

  async announce(input: { sentBy: string; title: string; body: string; target: string }): Promise<void> {
    if (isPreviewMock) return mockAdminView.announce(input);

    const { error } = await supabase
      .from('announcements')
      .insert({ sent_by: input.sentBy, title: input.title, body: input.body, target: input.target });
    if (error) throw error;

    const { data: members } = await supabase.from('profiles').select('id').eq('status', 'approved');
    void supabase.functions.invoke('send-push', {
      body: { user_ids: members?.map((m) => m.id) ?? [], title: input.title, body: input.body },
    });
  },

  async allMembers(): Promise<Profile[]> {
    if (isPreviewMock) return mockAdminView.allMembers();
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (error) throw error;
    return data;
  },
};