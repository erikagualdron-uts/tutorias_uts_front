import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(80),
});

// Capacity is typed as text and converted on submit; the server enforces the same rule.
export const roomSchema = z.object({
  locationId: z.string().min(1, 'validation.required'),
  name: z.string().trim().min(1, 'validation.required').max(40),
  capacity: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'rooms.form.capacityInvalid'),
});

export type LocationForm = z.infer<typeof locationSchema>;
export type RoomForm = z.infer<typeof roomSchema>;
