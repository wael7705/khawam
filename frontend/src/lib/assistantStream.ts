export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface StreamEvent {
  type?: string;
  delta?: string;
  errorText?: string;
}

function parseSseChunk(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = [];
  const parts = buffer.split('\n');
  const rest = parts.pop() ?? '';

  for (const line of parts) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      events.push(JSON.parse(payload) as StreamEvent);
    } catch {
      // تجاهل أسطر غير JSON
    }
  }

  return { events, rest };
}

export async function streamAssistantReply(
  messages: AssistantMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const uiMessages = messages
    .filter((m) => m.id !== 'welcome')
    .map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: 'text', text: m.text }],
    }));

  const response = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: uiMessages }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error('لا توجد استجابة من المساعد');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;

    for (const event of parsed.events) {
      if (event.type === 'error' && event.errorText) {
        throw new Error(event.errorText);
      }
      if (event.type === 'text-delta' && event.delta) {
        onDelta(event.delta);
      }
    }
  }
}
