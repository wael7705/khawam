import { z } from 'zod';

const uiMessagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

export const assistantChatBodySchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string(),
          role: z.enum(['user', 'assistant', 'system']),
          parts: z.array(uiMessagePartSchema),
        })
        .passthrough(),
    )
    .min(1)
    .max(40),
});

export type AssistantChatBody = z.infer<typeof assistantChatBodySchema>;
