import { describe, expect, it } from 'vitest';
import {
  normalizeOllamaBaseUrl,
  resolveAssistantProvider,
  type AssistantProviderConfig,
} from '../src/algorithms/assistant-provider.algorithm.js';

const baseConfig: AssistantProviderConfig = {
  assistantProvider: 'auto',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3.1:8b',
  geminiApiKey: undefined,
  geminiModel: 'gemini-2.0-flash',
  lovableApiKey: undefined,
  nodeEnv: 'test',
};

describe('assistant-provider.algorithm', () => {
  it('auto prefers gemini when GEMINI_API_KEY is set', () => {
    const resolved = resolveAssistantProvider({
      ...baseConfig,
      geminiApiKey: 'test-key',
    });
    expect(resolved?.kind).toBe('gemini');
    expect(resolved?.modelId).toBe('gemini-2.0-flash');
  });

  it('auto falls back to ollama without gemini key', () => {
    const resolved = resolveAssistantProvider(baseConfig);
    expect(resolved?.kind).toBe('ollama');
    expect(resolved?.modelId).toBe('llama3.1:8b');
  });

  it('explicit ollama requires base url', () => {
    const resolved = resolveAssistantProvider({
      ...baseConfig,
      assistantProvider: 'ollama',
      ollamaBaseUrl: '',
    });
    expect(resolved).toBeNull();
  });

  it('normalizeOllamaBaseUrl strips trailing slash', () => {
    expect(normalizeOllamaBaseUrl('http://127.0.0.1:11434/')).toBe('http://127.0.0.1:11434');
  });

  it('normalizeOllamaBaseUrl rejects credentials in url', () => {
    expect(() => normalizeOllamaBaseUrl('http://user:pass@127.0.0.1:11434')).toThrow();
  });
});
