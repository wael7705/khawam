import { describe, expect, it } from 'vitest';
import {
  normalizeOllamaBaseUrl,
  resolveAssistantProvider,
  resolveAssistantProviderChain,
  type AssistantProviderConfig,
} from '../src/algorithms/assistant-provider.algorithm.js';

const baseConfig: AssistantProviderConfig = {
  assistantProvider: 'auto',
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'qwen2.5:7b',
  geminiApiKey: undefined,
  geminiModel: 'gemini-2.5-flash',
  nodeEnv: 'test',
};

describe('assistant-provider.algorithm', () => {
  it('auto prefers gemini then ollama fallback', () => {
    const chain = resolveAssistantProviderChain({
      ...baseConfig,
      geminiApiKey: 'test-key',
    });
    expect(chain.map((p) => p.kind)).toEqual(['gemini', 'ollama']);
    expect(chain[0]?.modelId).toBe('gemini-2.5-flash');
    expect(chain[1]?.modelId).toBe('qwen2.5:7b');
  });

  it('auto uses ollama only without gemini key', () => {
    const chain = resolveAssistantProviderChain(baseConfig);
    expect(chain).toHaveLength(1);
    expect(chain[0]?.kind).toBe('ollama');
  });

  it('resolveAssistantProvider returns primary only', () => {
    const resolved = resolveAssistantProvider({
      ...baseConfig,
      geminiApiKey: 'test-key',
    });
    expect(resolved?.kind).toBe('gemini');
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
