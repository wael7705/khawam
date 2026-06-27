import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import {
  getAssistantDisabledMessage,
  normalizeOllamaBaseUrl,
  resolveAssistantProvider,
  type AssistantProviderConfig,
  type AssistantProviderKind,
  type ResolvedAssistantProvider,
} from '../../algorithms/assistant-provider.algorithm.js';
import { config } from '../../config/index.js';
import { getAssistantSystemPrompt } from './assistant.knowledge.service.js';

const LOVABLE_MODEL = 'google/gemini-2.5-flash';

function getProviderConfig(): AssistantProviderConfig {
  return {
    assistantProvider: config.ASSISTANT_PROVIDER,
    ollamaBaseUrl: config.OLLAMA_BASE_URL,
    ollamaModel: config.OLLAMA_MODEL,
    geminiApiKey: config.GEMINI_API_KEY,
    geminiModel: config.GEMINI_MODEL,
    lovableApiKey: config.LOVABLE_API_KEY,
    nodeEnv: config.NODE_ENV,
  };
}

function createLovableModel(apiKey: string): Parameters<typeof streamText>[0]['model'] {
  const provider = createOpenAICompatible({
    name: 'lovable-ai',
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    headers: {
      'Lovable-API-Key': apiKey,
      'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
    },
  });
  return provider(LOVABLE_MODEL);
}

function createOllamaModel(baseUrl: string, modelId: string): Parameters<typeof streamText>[0]['model'] {
  const safeBase = normalizeOllamaBaseUrl(baseUrl);
  const provider = createOpenAICompatible({
    name: 'ollama',
    baseURL: `${safeBase}/v1`,
    apiKey: 'ollama',
  });
  return provider(modelId);
}

function createGeminiModel(modelId: string): Parameters<typeof streamText>[0]['model'] {
  const apiKey = config.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY مفقود');
  }
  const provider = createGoogleGenerativeAI({ apiKey });
  return provider(modelId) as unknown as Parameters<typeof streamText>[0]['model'];
}

function createModelForProvider(resolved: ResolvedAssistantProvider): Parameters<typeof streamText>[0]['model'] {
  if (resolved.kind === 'gemini') {
    return createGeminiModel(resolved.modelId);
  }
  if (resolved.kind === 'ollama') {
    return createOllamaModel(config.OLLAMA_BASE_URL, resolved.modelId);
  }
  const apiKey = config.LOVABLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY مفقود');
  }
  return createLovableModel(apiKey);
}

export function getResolvedAssistantProvider(): ResolvedAssistantProvider | null {
  return resolveAssistantProvider(getProviderConfig());
}

export function isAssistantConfigured(): boolean {
  return getResolvedAssistantProvider() !== null;
}

export function getAssistantStatus(): {
  enabled: boolean;
  provider: AssistantProviderKind | null;
  model: string | null;
  endpoint: string;
} {
  const resolved = getResolvedAssistantProvider();
  return {
    enabled: resolved !== null,
    provider: resolved?.kind ?? null,
    model: resolved?.modelId ?? null,
    endpoint: '/api/assistant/chat',
  };
}

export async function streamAssistantChat(
  messages: UIMessage[],
): Promise<Response> {
  const resolved = getResolvedAssistantProvider();
  if (!resolved) {
    return new Response(
      JSON.stringify({ error: getAssistantDisabledMessage(config.ASSISTANT_PROVIDER) }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let model: Parameters<typeof streamText>[0]['model'];
  try {
    model = createModelForProvider(resolved);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'فشل تهيئة مزود المساعد';
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const system = await getAssistantSystemPrompt();

  try {
    const result = streamText({
      model,
      system,
      messages: await convertToModelMessages(messages),
    });
    return result.toUIMessageStreamResponse({ originalMessages: messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'فشل الاتصال بنموذج المساعد';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
