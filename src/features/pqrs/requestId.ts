// One id per attempt to file a PQRS; a retry reuses it so the server answers with the same PQRS.
// It only has to be unique, so the Math.random fallback is enough where `crypto.randomUUID` is missing.
export function newRequestId(): string {
  const native = globalThis.crypto?.randomUUID?.();
  if (native) return native;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r % 4) + 8).toString(16);
  });
}
