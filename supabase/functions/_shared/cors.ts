export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function methodNotAllowed(method: string): Response {
  return json({ error: `Method ${method} not allowed.` }, { status: 405 });
}

export function unauthorized(): Response {
  return json({ error: 'Unauthorized.' }, { status: 401 });
}

export function forbidden(): Response {
  return json({ error: 'Forbidden.' }, { status: 403 });
}

export function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 });
}