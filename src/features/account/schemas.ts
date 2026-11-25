import { z } from 'zod';

const name = z.string().trim().min(1, 'validation.required').max(100, 'validation.tooLong');

export const ownNameSchema = z.object({ firstName: name, lastName: name });

export type OwnNameForm = z.infer<typeof ownNameSchema>;
