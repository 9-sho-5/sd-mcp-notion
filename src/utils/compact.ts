export function compact<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const k in obj) {
    const v = obj[k];
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}
