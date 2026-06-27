import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { cache } from '../../shared/cache/memory-cache.js';
import { resolveServiceOrderSlug } from '../../algorithms/assistant-slug.algorithm.js';
import {
  ASSISTANT_KNOWLEDGE_CACHE_KEY,
  ASSISTANT_TRAINING_SCENARIOS,
  COMPANY_ADDRESS_AR,
  COMPANY_MAPS_URL,
  DEFAULT_ORDER_WORKFLOW,
  STATIC_FAQ,
} from './assistant.constants.js';
import type { AssistantKnowledge } from './assistant.types.js';

function siteUrl(path: string): string {
  const base = config.PUBLIC_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function formatUnitPrice(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  return num.toLocaleString('ar-SY', { maximumFractionDigits: 0 });
}

export async function loadAssistantKnowledge(): Promise<AssistantKnowledge> {
  const cached = cache.get<AssistantKnowledge>(ASSISTANT_KNOWLEDGE_CACHE_KEY);
  if (cached) return cached;

  const [services, portfolio, workflowSteps, pricingRules] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true, isVisible: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        descriptionAr: true,
        features: true,
      },
    }),
    prisma.portfolioWork.findMany({
      where: { isVisible: true },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 12,
      select: {
        id: true,
        title: true,
        titleAr: true,
        categoryAr: true,
        category: true,
      },
    }),
    prisma.serviceWorkflow.findMany({
      where: { isActive: true },
      orderBy: [{ stepNumber: 'asc' }, { displayOrder: 'asc' }],
      take: 8,
      select: { stepNameAr: true, stepDescriptionAr: true },
    }),
    prisma.pricingRule.findMany({
      where: {
        isActive: true,
        service: { isActive: true, isVisible: true },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      take: 20,
      select: {
        nameAr: true,
        service: { select: { nameAr: true } },
        ranges: {
          take: 2,
          orderBy: { displayOrder: 'asc' },
          select: {
            printMode: true,
            sizeCode: true,
            unitPrice: true,
          },
        },
      },
    }),
  ]);

  const orderWorkflow =
    workflowSteps.length > 0
      ? workflowSteps.map((step) =>
          step.stepDescriptionAr
            ? `${step.stepNameAr}: ${step.stepDescriptionAr}`
            : step.stepNameAr,
        )
      : DEFAULT_ORDER_WORKFLOW;

  const priceHints: string[] = [];
  for (const rule of pricingRules) {
    for (const range of rule.ranges) {
      const price = formatUnitPrice(range.unitPrice);
      if (!price) continue;
      priceHints.push(
        `${rule.service.nameAr} / ${rule.nameAr} (${range.sizeCode}, ${range.printMode}): من ${price} ل.س للوحدة`,
      );
      if (priceHints.length >= 25) break;
    }
    if (priceHints.length >= 25) break;
  }

  const knowledge: AssistantKnowledge = {
    company: {
      name: 'خوّام للدعاية والإعلان',
      website: siteUrl('/'),
      whatsapp: '+963112134640',
      whatsappDisplay: '+963 11 213 4640',
      whatsappUrl: 'https://wa.me/963112134640',
      email: 'info@khawam.net',
      facebook: 'https://www.facebook.com/khawam.net',
      instagram: 'https://www.instagram.com/khawam.net',
      address: COMPANY_ADDRESS_AR,
      mapsUrl: COMPANY_MAPS_URL,
      hours: 'السبت - الخميس: 9:00 صباحاً - 6:00 مساءً (الجمعة عطلة)',
      servicesPageUrl: siteUrl('/services'),
      portfolioPageUrl: siteUrl('/portfolio'),
      orderPageUrl: siteUrl('/services'),
      myOrdersPageUrl: siteUrl('/my-orders'),
    },
    services: services.map((service) => {
      const slug = resolveServiceOrderSlug(service);
      return {
        slug,
        nameAr: service.nameAr,
        nameEn: service.nameEn ?? service.nameAr,
        descriptionAr: service.descriptionAr ?? '',
        orderUrl: siteUrl(`/order/${slug}`),
      };
    }),
    portfolio: portfolio.map((work) => ({
      title: work.titleAr ?? work.title,
      category: work.categoryAr ?? work.category ?? '',
      url: siteUrl(`/portfolio/work/${work.id}`),
    })),
    orderWorkflow,
    faq: STATIC_FAQ,
    trainingScenarios: ASSISTANT_TRAINING_SCENARIOS,
    priceHints,
  };

  cache.set(ASSISTANT_KNOWLEDGE_CACHE_KEY, knowledge, 'services');
  return knowledge;
}

export async function getAssistantSystemPrompt(): Promise<string> {
  const { buildAssistantSystemPrompt } = await import(
    '../../algorithms/assistant-prompt.algorithm.js'
  );
  const knowledge = await loadAssistantKnowledge();
  return buildAssistantSystemPrompt(knowledge);
}
