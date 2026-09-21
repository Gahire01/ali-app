import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@4.7.0';

import {
  badRequest,
  corsHeaders,
  forbidden,
  json,
  methodNotAllowed,
  unauthorized,
} from '../_shared/cors.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'club@aliboxing.vercel.app';

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const STAFF_ROLES = ['coach', 'collaborator', 'admin'];

async function requireStaff(authorization: string | null): Promise<boolean> {
  const token = (authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return false;
  const { data: profile } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();
  if (!profile) return false;
  return profile.status === 'approved' && STAFF_ROLES.includes(profile.role);
}

type ApprovalPayload = {
  user_id: string;
  status: 'approved' | 'rejected';
  email: string;
  full_name: string;
  rejection_reason?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return methodNotAllowed(req.method);

  if (!(await requireStaff(req.headers.get('Authorization')))) {
    return unauthorized();
  }

  let body: ApprovalPayload;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const { user_id, status, email, full_name, rejection_reason } = body;
  if (!user_id || !status || !email || !full_name) {
    return badRequest('Missing required fields: user_id, status, email, full_name.');
  }
  if (status !== 'approved' && status !== 'rejected') {
    return badRequest('status must be approved or rejected.');
  }

  const approved = status === 'approved';
  const reason = rejection_reason?.trim();

  const subject = approved
    ? "You're in — welcome to ALI Boxing Club"
    : 'Update on your ALI Boxing Club registration';

  const html = approved
    ? `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0b0b;padding:24px;color:#f7f5f0">
          <h1 style="text-transform:uppercase;letter-spacing:2px;color:#b71c1c">ALI Boxing Club</h1>
          <h2>You're in, ${full_name}.</h2>
          <p>Welcome to ALI Boxing Club. Your training space is ready — open the app to see your schedule, training sessions, and club chat.</p>
          <p style="color:#5a5854;font-size:13px">Train Like a Champion.</p>
        </div>
      `
    : `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0b0b;padding:24px;color:#f7f5f0">
          <h1 style="text-transform:uppercase;letter-spacing:2px;color:#b71c1c">ALI Boxing Club</h1>
          <h2>Update on your registration</h2>
          <p>Hi ${full_name}, we were not able to approve your ALI Boxing Club membership at this time.</p>
          ${reason ? `<p>${reason}</p>` : ''}
          <p>If you think this is a mistake, reply to this email or contact ${'gahiredev01@gmail.com'}.</p>
          <p style="color:#5a5854;font-size:13px">Train Like a Champion.</p>
        </div>
      `;

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');
    if (!Deno.env.get('RESEND_API_KEY')) {
      return json({ error: 'RESEND_API_KEY is not configured.' }, { status: 500 });
    }
    const { error } = await resend.emails.send({
      from: `"ALI Boxing Club" <${FROM_EMAIL}>`,
      to: [email],
      subject,
      html,
    });
    if (error) {
      console.error('on-approval send error', JSON.stringify(error));
      return json({ ok: false, error: error.message }, { status: 502 });
    }
    return json({ ok: true, status, user_id });
  } catch (err) {
    console.error('on-approval failure', err);
    return json({ ok: false, error: 'Failed to send email.' }, { status: 502 });
  }
});