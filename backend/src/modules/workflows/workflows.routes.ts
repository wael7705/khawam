import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import * as workflowsService from './workflows.service.js';

const adminPreHandler = [authenticate, requireRole('مدير')];

const createWorkflowSchema = z.object({
  serviceId: z.string().min(1),
  stepNumber: z.number().int().min(1),
  stepNameAr: z.string().min(1),
  stepNameEn: z.string().optional(),
  stepDescriptionAr: z.string().optional(),
  stepDescriptionEn: z.string().optional(),
  stepType: z.string().min(1),
  stepConfig: z.record(z.unknown()).optional(),
  displayOrder: z.number().int().optional(),
});

const updateWorkflowSchema = z.object({
  stepNumber: z.number().int().min(1).optional(),
  stepNameAr: z.string().min(1).optional(),
  stepNameEn: z.string().optional(),
  stepDescriptionAr: z.string().optional(),
  stepDescriptionEn: z.string().optional(),
  stepType: z.string().min(1).optional(),
  stepConfig: z.record(z.unknown()).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const setupSchema = z.object({
  serviceId: z.string().min(1),
});

export async function workflowsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { serviceId: string } }>(
    '/service/:serviceId/workflow',
    async (request, reply) => {
      const { serviceId } = request.params;
      try {
        const workflow = await workflowsService.getServiceWorkflow(serviceId);
        return reply.send(workflow);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.get<{ Params: { workflowId: string } }>(
    '/workflow/:workflowId',
    async (request, reply) => {
      const { workflowId } = request.params;
      try {
        const workflow = await workflowsService.getWorkflowById(workflowId);
        if (!workflow) {
          return reply.code(404).send({ detail: 'سير العمل غير موجود' });
        }
        return reply.send(workflow);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.post('/workflow', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = createWorkflowSchema.parse(request.body);
      const workflow = await workflowsService.createWorkflow(body);
      return reply.send(workflow);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ detail: err.errors });
      }
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put<{ Params: { workflowId: string } }>(
    '/workflow/:workflowId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { workflowId } = request.params;
      try {
        const body = updateWorkflowSchema.parse(request.body);
        const workflow = await workflowsService.updateWorkflow(workflowId, body);
        return reply.send(workflow);
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ detail: err.errors });
        }
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.delete<{ Params: { workflowId: string } }>(
    '/workflow/:workflowId',
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const { workflowId } = request.params;
      try {
        const workflow = await workflowsService.deleteWorkflow(workflowId);
        return reply.send(workflow);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ detail: error.message });
      }
    },
  );

  app.post('/setup-lecture-printing', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = setupSchema.parse(request.body);
      const workflow = await workflowsService.setupLecturePrinting(body.serviceId);
      return reply.send(workflow);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ detail: err.errors });
      }
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/setup-flex-printing', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = setupSchema.parse(request.body);
      const workflow = await workflowsService.setupFlexPrinting(body.serviceId);
      return reply.send(workflow);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ detail: err.errors });
      }
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/setup-business-cards', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = setupSchema.parse(request.body);
      const workflow = await workflowsService.setupBusinessCards(body.serviceId);
      return reply.send(workflow);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ detail: err.errors });
      }
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
