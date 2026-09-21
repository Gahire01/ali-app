import { Resend } from 'npm:resend@4.7.0';

import {
  badRequest,
  corsHeaders,
  json,
  methodNotAllowed,
} from '../_shared/cors.ts';

const MAIL_TO_ADMIN =
  Deno.env.get('MAIL_TO_ADMIN') ?? 'gahiredev01@gmail.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'club@aliboxing.vercel.app';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');

type NewUserRecord = {
  id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
};

function allow(event: Request): boolean {
  if (!WEBHOOK_SECRET) return true;
  const auth = event.headers.get('Authorization') ?? '';
  return auth.replace(/^Bearer\s+/i, '') === WEBHOOK_SECRET;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return methodNotAllowed(req.method);

  if (!allow(req)) {
    return json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!RESEND_API_KEY) {
    return json(
      { error: 'RESEND_API_KEY is not configured on the edge function.' },
      { status: 500 }
    );
  }

  let body: {
    record?: NewUserRecord;
    type?: string;
  };
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const record = body.record ?? {};
  if (!record.email) return badRequest('Missing record.email.');

  const fullName = record.full_name || 'A new member';
  const email = record.email;
  const phone = record.phone || 'no phone given';

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `"ALI Boxing Club" <${FROM_EMAIL}>`,
      to: [MAIL_TO_ADMIN],
      subject: `New registration: ${fullName} (${email})`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0b0b;padding:24px;color:#f7f5f0">
          <h1 style="text-transform:uppercase;letter-spacing:2px;color:#b71c1c">ALI Boxing Club</h1>
          <h2>New registration pending review</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0">
            <tr><td style="padding:6px 0;color:#8f8d88">Name</td><td style="padding:6px 16px"><b>${fullName}</b></td></tr>
            <tr><td style="padding:6px 0;color:#8f8d88">Email</td><td style="padding:6px 16px"><b>${email}</b></td></tr>
            <tr><td style="padding:6px 0;color:#8f8d88">Phone</td><td style="padding:6px 16px"><b>${phone}</b></td></tr>
          </table>
          <p>Open the <b>Dashboard</b> in the ALI Boxing Club app to review and approve this member.</p>
          <p style="color:#5a5854;font-size:13px">Train Like a Champion.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend send error', JSON.stringify(error));
      return json({ ok: false, error: error.message }, { status: 502 });
    }

    return json({ ok: true });
  } catch (err) {
    console.error('on-new-user failure', err);
    return json(
      { ok: false, error: 'Failed to send notification email.' },
      { status: 502 }
    );
  }
});