export type AssistantProviderKind = 'ollama' | 'gemini' | 'lovable';

export interface AssistantProviderConfig {
  assistantProvider: AssistantProviderKind | 'auto';
  ollamaBaseUrl: string;
  ollamaModel: string;
  geminiApiKey?: string;
  geminiModel: string;
  lovableApiKey?: string;
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

function isLovableConfigured(config: AssistantProviderConfig): boolean {
  return Boolean(config.lovableApiKey?.trim());
}

function resolveAutoProvider(config: AssistantProviderConfig): ResolvedAssistantProvider | null {
  if (isGeminiConfigured(config)) {
    return {
      kind: 'gemini',
      modelId: config.geminiModel,
      label: `gemini:${config.geminiModel}`,
    };
  }
  if (isOllamaConfigured(config)) {
    return {
      kind: 'ollama',
      modelId: config.ollamaModel,
      label: `ollama:${config.ollamaModel}`,
    };
  }
  if (isLovableConfigured(config)) {
    return {
      kind: 'lovable',
      modelId: 'google/gemini-2.5-flash',
      label: 'lovable:google/gemini-2.5-flash',
    };
  }
  return null;
}

export function resolveAssistantProvider(
  config: AssistantProviderConfig,
): ResolvedAssistantProvider | null {
  const explicit = config.assistantProvider;

  if (explicit === 'auto') {
    return resolveAutoProvider(config);
  }

  if (explicit === 'gemini') {
    if (!isGeminiConfigured(config)) return null;
    return {
      kind: 'gemini',
      modelId: config.geminiModel,
      label: `gemini:${config.geminiModel}`,
    };
  }

  if (explicit === 'ollama') {
    if (!isOllamaConfigured(config)) return null;
    return {
      kind: 'ollama',
      modelId: config.ollamaModel,
      label: `ollama:${config.ollamaModel}`,
    };
  }

  if (explicit === 'lovable') {
    if (!isLovableConfigured(config)) return null;
    return {
      kind: 'lovable',
      modelId: 'google/gemini-2.5-flash',
      label: 'lovable:google/gemini-2.5-flash',
    };
  }

  return null;
}

export function getAssistantDisabledMessage(provider: AssistantProviderKind | 'auto'): string {
  if (provider === 'ollama') {
    return 'المساعد غير مفعّل: شغّل Ollama واضبط OLLAMA_BASE_URL و OLLAMA_MODEL';
  }
  if (provider === 'gemini') {
    return 'المساعد غير مفعّل: أضف GEMINI_API_KEY';
  }
  if (provider === 'lovable') {
    return 'المساعد غير مفعّل: أضف LOVABLE_API_KEY';
  }
  return 'المساعد غير مفعّل: أضف GEMINI_API_KEY أو شغّل Ollama أو LOVABLE_API_KEY';
}
