type Bus = Map<string, Set<(payload: unknown) => void>>;

const bus: Bus = new Map();

export function emitToBus(channel: string, event: string, payload: unknown) {
  const key = `${channel}:${event}`;
  bus.get(key)?.forEach((fn) => fn(payload));
}

export function subscribeToBus(
  channel: string,
  event: string,
  listener: (payload: unknown) => void,
) {
  const key = `${channel}:${event}`;
  if (!bus.has(key)) bus.set(key, new Set());
  bus.get(key)!.add(listener);
  return () => {
    bus.get(key)?.delete(listener);
  };
}
