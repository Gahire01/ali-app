/**
 * Maps any error (Supabase, network, RLS, native) to user-friendly copy.
 * Order matters — the most specific patterns must come first.
 */
export function describeError(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';

  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : (error as { message?: string })?.message ?? '';

  const code =
    (error as { code?: string })?.code ??
    (error as { status?: number })?.status ??
    '';

  const msg = raw.toLowerCase();
  const codeStr = String(code).toLowerCase();

  // ── Supabase Auth: credential problems ──
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid email or password') ||
    msg.includes('wrong password')
  ) {
    return 'Wrong email or password. Check both and try again.';
  }

  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Please confirm your email address first. Check your inbox for the link.';
  }

  if (
    msg.includes('user not found') ||
    msg.includes('no user found') ||
    msg.includes('user does not exist')
  ) {
    return 'No account found for that email. Try signing up instead.';
  }

  // ── Rate limiting ──
  if (
    msg.includes('too many requests') ||
    msg.includes('rate limit') ||
    codeStr === 'over_email_send_rate_limit' ||
    codeStr === 'over_request_rate_limit'
  ) {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  // ── Session expired ──
  if (
    msg.includes('jwt expired') ||
    msg.includes('token has expired') ||
    msg.includes('session expired') ||
    codeStr === 'session_expired' ||
    codeStr === 'refresh_token_not_found'
  ) {
    return 'Your session expired. Please sign in again.';
  }

  if (msg.includes('invalid token') || msg.includes('token is invalid')) {
    return 'This link is invalid or has already been used. Try signing in again.';
  }

  if (msg.includes('password should be at least')) {
    return 'Your password needs to be at least 8 characters long.';
  }

  // ── Sign-up: duplicate email ──
  if (
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('email already exists') ||
    codeStr === 'email_exists'
  ) {
    return 'That email is already registered. Try signing in instead.';
  }

  // ── RLS / permissions ──
  if (
    codeStr === '42501' ||
    msg.includes('permission denied') ||
    msg.includes('row-level security') ||
    msg.includes('not authorized')
  ) {
    return "You don't have access to that yet. Contact your coach if you think this is wrong.";
  }

  // ── Network / offline ──
  if (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('is taking too long') ||
    msg.includes('connection') ||
    codeStr === 'enetunreach' ||
    codeStr === 'econnaborted'
  ) {
    return 'You appear to be offline. Check your connection and try again.';
  }

  // ── Backend / server ──
  if (
    msg.includes('something went wrong') ||
    msg.includes('internal server error') ||
    msg.includes('500')
  ) {
    return 'The server is having trouble right now. Please try again in a moment.';
  }

  if (raw && raw.length < 140 && !raw.toLowerCase().includes('error:')) {
    return raw;
  }

  return 'Something went wrong. Please try again.';
}
