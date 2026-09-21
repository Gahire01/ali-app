export type ErrorClass = 'network' | 'auth' | 'rls' | 'unknown';

const NETWORK_PATTERNS = [
  /network request failed/i,
  /fetch failed/i,
  /timeout/i,
  /timed out/i,
  /socket/i,
  /ec['"]?onnrefused/i,
  /unable to connect/i,
  /network error/i,
];

const RLS_PATTERNS = [
  /new row violates row.?level security policy/i,
  /violates row.?level security policy/i,
  /permission denied for table/i,
  /permission denied for schema/i,
  /rls/i,
];

const AUTH_PATTERNS = [
  /invalid login credentials/i,
  /user already registered/i,
  /password should be at least/i,
  /invalid api key/i,
  /email not confirmed/i,
  /email.*already/i,
  /token has expired/i,
  /refresh token not found/i,
  /invalid refresh token/i,
  /auth/i,
];

export function classifyError(error: unknown): ErrorClass {
  if (!error) return 'unknown';

  if (error instanceof TypeError) {
    return /fetch|network|load|sock|connect/i.test(error.message) ? 'network' : 'unknown';
  }

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : '';

  if (!message) return 'unknown';

  if (NETWORK_PATTERNS.some((pattern) => pattern.test(message))) return 'network';
  if (RLS_PATTERNS.some((pattern) => pattern.test(message))) return 'rls';
  if (AUTH_PATTERNS.some((pattern) => pattern.test(message))) return 'auth';

  return 'unknown';
}

const COPY: Record<ErrorClass, string> = {
  network:
    'You seem to be offline. Check your connection and try again.',
  auth: 'You need to sign in again. Your session has expired or your details were not recognized.',
  rls: 'You do not have permission to do that. If this looks wrong, contact your coach.',
  unknown: 'Something went wrong on our end. Please try again in a moment.',
};

export function describeError(error: unknown): string {
  return COPY[classifyError(error)];
}