import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  badRequest,
  corsHeaders,
  json,
  methodNotAllowed,
  unauthorized,
} from '../_shared/cors.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const STAFF_ROLES = ['coach', 'collaborator', 'admin'];

type PushPayload = {
  user_ids?: string[];
  conversation_id?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

async function actorFromToken(authorization: string | null): Promise<{
  uid: string | null;
  isStaff: boolean;
} | null> {
  const token = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();
  if (!profile || profile.status !== 'approved') return null;
  return {
    uid: user.id,
    isStaff: STAFF_ROLES.includes(profile.role),
  };
}

async function isConversationMember(uid: string, conversationId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', uid)
    .maybeSingle();
  return !error && !!data;
}

async function recipientIds(payload: PushPayload, actor: { uid: string; isStaff: boolean }): Promise<{ ids: string[]; error?: string }> {
  if (payload.conversation_id) {
    if (!(await isConversationMember(actor.uid, payload.conversation_id))) {
      return { ids: [], error: 'You are not a member of this conversation.' };
    }
    const { data } = await admin
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', payload.conversation_id)
      .neq('user_id', actor.uid);
    return { ids: [...new Set((data ?? []).map((row) => row.user_id))] };
  }

  if (!actor.isStaff) return { ids: [], error: 'Only staff may push to arbitrary members.' };
  return { ids: [...new Set(payload.user_ids ?? [])] };
}

async function pushToExpo(messages: Array<Record<string, unknown>>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EXPO_ACCESS_TOKEN) headers['Authorization'] = `Bearer ${EXPO_ACCESS_TOKEN}`;

  const sent: string[] = [];
  const failed: Array<{ token: string; message: string }> = [];

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      failed.push(
        ...batch.map((message) => ({
          token: String(message.to),
          message: `Expo returned HTTP ${response.status}`,
        }))
      );
      continue;
    }

    const tickets = await response.json();
    batch.forEach((message, index) => {
      const ticket = tickets?.data?.[index];
      if (ticket?.status === 'ok') {
        sent.push(ticket.id as string);
      } else {
        failed.push({
          token: String(message.to),
          message: ticket?.message ?? 'Unknown push error',
        });
      }
    });
  }

  return { sent, failed };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return methodNotAllowed(req.method);

  const actor = await actorFromToken(req.headers.get('Authorization'));
  if (!actor) return unauthorized();

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return badRequest('Invalid JSON body.');
  }

  if (!payload.title || !payload.body) {
    return badRequest('Missing required fields: title, body.');
  }
  if (!payload.conversation_id && (!payload.user_ids || payload.user_ids.length === 0)) {
    return badRequest('Provide user_ids (staff) or conversation_id (members).');
  }

  const { ids, error } = await recipientIds(payload, actor);
  if (error) return json({ error }, { status: 403 });
  if (ids.length === 0) return json({ ok: true, sent: 0, failed: [], recipients: 0 });

  const { data: tokens } = await admin
    .from('device_tokens')
    .select('expo_push_token')
    .in('user_id', ids);

  const effective = tokens ?? [];

  const messages = effective.map((row) => ({
    to: row.expo_push_token,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default',
  }));

  const result = await pushToExpo(messages);

  return json({
    ok: true,
    recipients: effective.length,
    sent: result.sent.length,
    failed: result.failed,
  });
});