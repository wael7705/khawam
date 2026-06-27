import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { convertToModelMessages, generateText, streamText, type UIMessage } from 'ai';
import {
  getAssistantDisabledMessage,
  normalizeOllamaBaseUrl,
  resolveAssistantProvider,
  resolveAssistantProviderChain,
  type AssistantProviderConfig,
  type AssistantProviderKind,
  type ResolvedAssistantProvider,
} from '../../algorithms/assistant-provider.algorithm.js';
import { config } from '../../config/index.js';
import { getAssistantSystemPrompt } from './assistant.knowledge.service.js';

type StreamModel = Parameters<typeof streamText>[0]['model'];

function getProviderConfig(): AssistantProviderConfig {
  return {
    assistantProvider: config.ASSISTANT_PROVIDER,
    ollamaBaseUrl: config.OLLAMA_BASE_URL,
    ollamaModel: config.OLLAMA_MODEL,
    geminiApiKey: config.GEMINI_API_KEY,
    geminiModel: config.GEMINI_MODEL,
    nodeEnv: config.NODE_ENV,
  };
}

function createOllamaModel(baseUrl: string, modelId: string): StreamModel {
  const safeBase = normalizeOllamaBaseUrl(baseUrl);
  const provider = createOpenAICompatible({
    name: 'ollama',
    baseURL: `${safeBase}/v1`,
    apiKey: 'ollama',
  });
  return provider(modelId);
}

function createGeminiModel(modelId: string): StreamModel {
  const apiKey = config.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY مفقود');
  }
  const provider = createOpenAICompatible({
    name: 'google-gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey,
  });
  return provider(modelId);
}

function createModelForProvider(resolved: ResolvedAssistantProvider): StreamModel {
  if (resolved.kind === 'gemini') {
    return createGeminiModel(resolved.modelId);
  }
  return createOllamaModel(config.OLLAMA_BASE_URL, resolved.modelId);
}

async function probeProvider(
  resolved: ResolvedAssistantProvider,
  system: string,
): Promise<void> {
  const model = createModelForProvider(resolved);
  await generateText({
    model,
    system,
    prompt: 'ok',
    maxOutputTokens: 8,
  });
}

export function getResolvedAssistantProvider(): ResolvedAssistantProvider | null {
  return resolveAssistantProvider(getProviderConfig());
}

export function isAssistantConfigured(): boolean {
  return resolveAssistantProviderChain(getProviderConfig()).length > 0;
}

export function getAssistantStatus(): {
  enabled: boolean;
  provider: AssistantProviderKind | null;
  model: string | null;
  fallback: AssistantProviderKind | null;
  fallbackModel: string | null;
  endpoint: string;
} {
  const chain = resolveAssistantProviderChain(getProviderConfig());
  const primary = chain[0] ?? null;
  const backup = chain[1] ?? null;
  return {
    enabled: chain.length > 0,
    provider: primary?.kind ?? null,
    model: primary?.modelId ?? null,
    fallback: backup?.kind ?? null,
    fallbackModel: backup?.modelId ?? null,
    endpoint: '/api/assistant/chat',
  };
}

export async function streamAssistantChat(
  messages: UIMessage[],
): Promise<Response> {
  const chain = resolveAssistantProviderChain(getProviderConfig());
  if (chain.length === 0) {
    return new Response(
      JSON.stringify({ error: getAssistantDisabledMessage(config.ASSISTANT_PROVIDER) }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const system = await getAssistantSystemPrompt();
  const modelMessages = await convertToModelMessages(messages);
  const errors: string[] = [];

  for (const provider of chain) {
    try {
      if (chain.length > 1) {
        await probeProvider(provider, system);
      }

      const model = createModelForProvider(provider);
      const result = streamText({
        model,
        system,
        messages: modelMessages,
      });
      return result.toUIMessageStreamResponse({ originalMessages: messages });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `فشل مزود ${provider.label}`;
      errors.push(`${provider.label}: ${message}`);
      console.error(`[assistant] ${provider.label} failed:`, message);
    }
  }

  return new Response(
    JSON.stringify({
      error: 'تعذر الاتصال بجميع نماذج المساعد',
      details: errors,
    }),
    { status: 502, headers: { 'Content-Type': 'application/json' } },
  );
}
