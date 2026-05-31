import { z } from 'zod';

const orderStatusValues = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'] as const;

export const updateOrderStatusBodySchema = z
  .object({
    status: z.enum(orderStatusValues),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== 'cancelled') return;
    const notes = data.notes?.trim() ?? '';
    if (notes.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'يجب ذكر سبب الإلغاء (3 أحرف على الأقل)',
        path: ['notes'],
      });
    }
  });
