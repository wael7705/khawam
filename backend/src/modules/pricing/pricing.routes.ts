import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../shared/middleware/auth.middleware.js';
import * as pricingService from './pricing.service.js';
import {
  bulkUpdatePricesSchema,
  calculateAdvancedPriceSchema,
  calculateFinancialPriceSchema,
  calculatePriceSchema,
  createFinancialRuleSchema,
  createAdvancedPricingRuleSchema,
  getAdvancedPricingRulesQuerySchema,
  updateFinancialRuleSchema,
} from './pricing.schema.js';

const adminPreHandler = [authenticate, requireRole('مدير', 'موظف')];

function parseBool(input: unknown): boolean | undefined {
  if (typeof input === 'boolean') return input;
  if (typeof input !== 'string') return undefined;
  if (input === 'true') return true;
  if (input === 'false') return false;
  return undefined;
}

export async function pricingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/pricing-rules', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { is_active?: string; calculation_type?: 'piece' | 'area' | 'page' };
      const rules = await pricingService.getPricingRules({
        is_active: parseBool(query.is_active),
        calculation_type: query.calculation_type,
      });
      return { success: true, rules, count: rules.length };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message ?? 'تعذر جلب قواعد التسعير' });
    }
  });

  app.get('/pricing-rules/:ruleId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const params = request.params as { ruleId: string };
      const rule = await pricingService.getPricingRuleById(params.ruleId);
      return { success: true, rule };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message ?? 'تعذر جلب قاعدة التسعير' });
    }
  });

  app.post('/pricing-rules', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = createFinancialRuleSchema.parse(request.body);
      const rule = await pricingService.createPricingRule(body);
      return reply.code(201).send({ success: true, rule });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر إنشاء قاعدة التسعير' });
    }
  });

  app.put('/pricing-rules/:ruleId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const params = request.params as { ruleId: string };
      const body = updateFinancialRuleSchema.parse(request.body);
      const rule = await pricingService.updatePricingRule(params.ruleId, body);
      return { success: true, rule };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر تحديث قاعدة التسعير' });
    }
  });

  app.delete('/pricing-rules/:ruleId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const params = request.params as { ruleId: string };
      const result = await pricingService.deletePricingRule(params.ruleId);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر حذف قاعدة التسعير' });
    }
  });

  app.post('/calculate-price', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = calculatePriceSchema.parse(request.body);
      const result = await pricingService.calculatePriceFromRules(body);
      return {
        success: true,
        total_price: result.totalPrice,
        unit_price: result.unitPrice,
        rule_id: result.ruleId,
        rule_name_ar: result.ruleNameAr,
      };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر حساب السعر' });
    }
  });

  app.post('/calculate-price-by-rule/:ruleId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const params = request.params as { ruleId: string };
      const body = calculatePriceSchema.parse(request.body);
      const result = await pricingService.calculatePriceByRule(params.ruleId, body);
      return {
        success: true,
        total_price: result.totalPrice,
        unit_price: result.unitPrice,
        rule_id: result.ruleId,
        rule_name_ar: result.ruleNameAr,
      };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر حساب السعر للقاعدة المحددة' });
    }
  });

  app.get('/advanced-pricing-rules', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = getAdvancedPricingRulesQuerySchema.parse(request.query);
      const rules = await pricingService.getAdvancedPricingRules(query);
      return { success: true, rules, count: rules.length };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر جلب قواعد التسعير المتقدمة' });
    }
  });

  app.post('/advanced-pricing-rules', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = createAdvancedPricingRuleSchema.parse(request.body);
      const rule = await pricingService.createAdvancedPricingRule(body);
      return reply.code(201).send({ success: true, rule });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر إنشاء قاعدة متقدمة' });
    }
  });

  app.get('/calculate-price-advanced', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = calculateAdvancedPriceSchema.parse(request.query);
      const result = await pricingService.calculateAdvancedPriceFromRules(query);
      return {
        success: true,
        total_price: result.totalPrice,
        unit_price: result.unitPrice,
        config_id: result.configId,
        category_name_ar: result.categoryNameAr,
        paper_size: result.paperSize,
      };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر حساب السعر المتقدم' });
    }
  });

  app.post('/bulk-update-prices', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = bulkUpdatePricesSchema.parse(request.body);
      const result = await pricingService.bulkUpdatePrices(body);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر تنفيذ التحديث الجماعي' });
    }
  });

  app.get('/pricing/services-coverage', { preHandler: adminPreHandler }, async (_request, reply) => {
    try {
      const data = await pricingService.getServicePricingCoverage();
      return {
        success: true,
        services: data,
        missing_count: data.filter((item) => !item.has_pricing).length,
      };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message ?? 'تعذر جلب تغطية التسعير للخدمات' });
    }
  });

  app.get('/pricing/financial-rules', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const query = request.query as { service_id?: string };
      const rules = await pricingService.getFinancialRules(query.service_id);
      return { success: true, rules, count: rules.length };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message ?? 'تعذر جلب القواعد المالية' });
    }
  });

  app.post('/pricing/financial-rules', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = createFinancialRuleSchema.parse(request.body);
      const rule = await pricingService.createFinancialRule(body);
      return reply.code(201).send({ success: true, rule });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر إنشاء القاعدة المالية' });
    }
  });

  app.put('/pricing/financial-rules/:ruleId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const params = request.params as { ruleId: string };
      const body = updateFinancialRuleSchema.parse(request.body);
      const rule = await pricingService.updateFinancialRule(params.ruleId, body);
      return { success: true, rule };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر تحديث القاعدة المالية' });
    }
  });

  app.delete('/pricing/financial-rules/:ruleId', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const params = request.params as { ruleId: string };
      const result = await pricingService.deleteFinancialRule(params.ruleId);
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر حذف القاعدة المالية' });
    }
  });

  app.post('/pricing/financial-rules/import-legacy-template', { preHandler: adminPreHandler }, async (_request, reply) => {
    try {
      const result = await pricingService.importLegacyFinancialTemplates();
      return result;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر استيراد القالب القديم' });
    }
  });

  app.post('/pricing/calculate-financial-price', { preHandler: adminPreHandler }, async (request, reply) => {
    try {
      const body = calculateFinancialPriceSchema.parse(request.body);
      const result = await pricingService.calculateFinancialPrice(body);
      return {
        success: true,
        rule_id: result.ruleId,
        dimension_id: result.dimensionId,
        range_id: result.rangeId,
        unit_type: result.unitType,
        unit_price: result.unitPrice,
        total_price: result.totalPrice,
      };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 400).send({ detail: error.message ?? 'تعذر حساب السعر المالي' });
    }
  });
}
