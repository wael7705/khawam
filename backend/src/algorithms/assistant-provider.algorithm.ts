export type AssistantProviderKind = 'ollama' | 'gemini';

export interface AssistantProviderConfig {
  assistantProvider: AssistantProviderKind | 'auto';
  ollamaBaseUrl: string;
  ollamaModel: string;
  geminiApiKey?: string;
  geminiModel: string;
  nodeEnv: string;
}

export interface ResolvedAssistantProvider {
  kind: AssistantProviderKind;
  modelId: string;
  label: string;
}

const BLOCKED_OLLAMA_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.goog',
]);

export function normalizeOllamaBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('OLLAMA_BASE_URL فارغ');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('OLLAMA_BASE_URL غير صالح');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('OLLAMA_BASE_URL يجب أن يكون http أو https');
  }
  if (parsed.username || parsed.password) {
    throw new Error('OLLAMA_BASE_URL لا يجب أن يحتوي بيانات اعتماد');
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_OLLAMA_HOSTS.has(host)) {
    throw new Error('OLLAMA_BASE_URL غير مسموح');
  }
  return trimmed;
}

function isOllamaConfigured(config: AssistantProviderConfig): boolean {
  return Boolean(config.ollamaBaseUrl.trim());
}

function isGeminiConfigured(config: AssistantProviderConfig): boolean {
  return Boolean(config.geminiApiKey?.trim());
}

function buildGeminiProvider(config: AssistantProviderConfig): ResolvedAssistantProvider {
  return {
    kind: 'gemini',
    modelId: config.geminiModel,
    label: `gemini:${config.geminiModel}`,
  };
}

function buildOllamaProvider(config: AssistantProviderConfig): ResolvedAssistantProvider {
  return {
    kind: 'ollama',
    modelId: config.ollamaModel,
    label: `ollama:${config.ollamaModel}`,
  };
}

/** ترتيب المحاولة: Gemini أولاً ثم Ollama كبديل */
export function resolveAssistantProviderChain(
  config: AssistantProviderConfig,
): ResolvedAssistantProvider[] {
  const chain: ResolvedAssistantProvider[] = [];

  if (config.assistantProvider === 'gemini') {
    if (isGeminiConfigured(config)) chain.push(buildGeminiProvider(config));
    return chain;
  }

  if (config.assistantProvider === 'ollama') {
    if (isOllamaConfigured(config)) chain.push(buildOllamaProvider(config));
    return chain;
  }

  // auto: gemini ثم ollama
  if (isGeminiConfigured(config)) chain.push(buildGeminiProvider(config));
  if (isOllamaConfigured(config)) chain.push(buildOllamaProvider(config));
  return chain;
}

export function resolveAssistantProvider(
  config: AssistantProviderConfig,
): ResolvedAssistantProvider | null {
  return resolveAssistantProviderChain(config)[0] ?? null;
}

export function getAssistantDisabledMessage(provider: AssistantProviderKind | 'auto'): string {
  if (provider === 'ollama') {
    return 'المساعد غير مفعّل: شغّل Ollama واضبط OLLAMA_BASE_URL و OLLAMA_MODEL';
  }
  if (provider === 'gemini') {
    return 'المساعد غير مفعّل: أضف GEMINI_API_KEY';
  }
  return 'المساعد غير مفعّل: أضف GEMINI_API_KEY أو شغّل Ollama (qwen2.5:7b)';
}
