import { z } from 'zod';
import type { DropdownItem } from '@/api/types';

export const itemSchema = z.object({
  labelEs: z.string().trim().min(1, 'validation.required').max(80),
  labelEn: z.string().trim().min(1, 'validation.required').max(80),
});

export type ItemForm = z.infer<typeof itemSchema>;

// Selectors follow the device language; anything that is not English falls back to Spanish.
export function labelFor(
  item: Pick<DropdownItem, 'labelEs' | 'labelEn'>,
  language: string,
) {
  return language.startsWith('en') ? item.labelEn : item.labelEs;
}
