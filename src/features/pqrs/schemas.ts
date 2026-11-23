import { z } from 'zod';
import type { PqrsLimits } from '@/api/types';

// The maximum lengths come from the API (settings); nothing is written here.
export const createPqrsSchema = ({ subjectMaxLength, descriptionMaxLength }: PqrsLimits) =>
  z.object({
    typeId: z.string().min(1, 'pqrs.new.chooseType'),
    subject: z.string().trim().min(1, 'validation.required').max(subjectMaxLength, 'validation.tooLong'),
    description: z.string().trim().min(1, 'validation.required').max(descriptionMaxLength, 'validation.tooLong'),
  });

export type CreatePqrsForm = z.infer<ReturnType<typeof createPqrsSchema>>;
