import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { UIMessage } from 'ai';
import { assistantChatBodySchema } from './assistant.schema.js';
import { isAssistantConfigured, streamAssistantChat } from './assistant.service.js';

async function pumpStream(response: Response, reply: FastifyReply): Promise<void> {
  reply.hijack();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  reply.raw.writeHead(response.status, headers);

  if (!response.body) {
    reply.raw.end();
    return;
  }

  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      reply.raw.write(value);
    }
  } catch {
    // انقطاع الاتصال من العميل
  } finally {
    reply.raw.end();
  }
}

export async function assistantRoutes(app: FastifyInstance): Promise<void> {
  app.get('/status', async () => ({
    enabled: isAssistantConfigured(),
    endpoint: '/api/assistant/chat',
  }));

  app.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = assistantChatBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'بيانات المحادثة غير صالحة',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const response = await streamAssistantChat(parsed.data.messages as UIMessage[]);
    if (response.status >= 400) {
      const text = await response.text();
      return reply.code(response.status).type('application/json').send(text);
    }

    await pumpStream(response, reply);
  });
}
