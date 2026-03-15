import { z } from 'zod';

export const createSavedLocationSchema = z.object({
  label: z.enum(['home', 'work', 'other'], {
    errorMap: () => ({ message: 'التسمية يجب أن تكون: home أو work أو other' }),
  }),
  street: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  building_floor: z.string().optional().nullable(),
  extra: z.string().optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

export const updateSavedLocationSchema = z.object({
  street: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  building_floor: z.string().optional().nullable(),
  extra: z.string().optional().nullable(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type CreateSavedLocationBody = z.infer<typeof createSavedLocationSchema>;
export type UpdateSavedLocationBody = z.infer<typeof updateSavedLocationSchema>;
