/**
 * Wraps a promise with a hard timeout. If the promise doesn't resolve
 * within `ms` milliseconds, it rejects with a friendly error so the UI
 * can recover instead of hanging forever.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms = 8000,
  label = 'Request',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `${label} is taking too long. Check your connection and try again.`,
            ),
          ),
        ms,
      ),
    ),
  ]);
}
