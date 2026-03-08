import { z } from 'zod';

export const createHeroSlideSchema = z.object({
  imageUrl: z.string().min(1, 'رابط الصورة مطلوب'),
  isLogo: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial();

export const reorderSlidesSchema = z.object({
  slideIds: z.array(z.string().min(1)).min(1, 'يجب تحديد الشريحات'),
});
