// The number a person quotes for a PQRS: the first 8 characters of its id, in capitals (spec 020, D-117).
// Not consecutive and never a lookup key; the full id stays the key.
export const pqrsCode = (id: string): string => id.replace(/-/g, '').slice(0, 8).toUpperCase();
