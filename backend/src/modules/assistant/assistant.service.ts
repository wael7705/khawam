import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { config } from '../../config/index.js';
import { getAssistantSystemPrompt } from './assistant.knowledge.service.js';

const LOVABLE_MODEL = 'google/gemini-2.5-flash';

function createLovableProvider(apiKey: string) {
  return createOpenAICompatible({
    name: 'lovable-ai',
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    headers: {
      'Lovable-API-Key': apiKey,
      'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
    },
  });
}

export function isAssistantConfigured(): boolean {
  return Boolean(config.LOVABLE_API_KEY?.trim());
}

export async function streamAssistantChat(
  messages: UIMessage[],
): Promise<Response> {
  const apiKey = config.LOVABLE_API_KEY?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'المساعد غير مفعّل: أضف LOVABLE_API_KEY' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const provider = createLovableProvider(apiKey);
  const model = provider(LOVABLE_MODEL);
  const system = await getAssistantSystemPrompt();

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({ originalMessages: messages });
}
