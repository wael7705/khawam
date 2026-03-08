import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

type ServiceWorkflow = Awaited<ReturnType<typeof prisma.serviceWorkflow.findFirst>>;

export interface CreateWorkflowInput {
  serviceId: string;
  stepNumber: number;
  stepNameAr: string;
  stepNameEn?: string;
  stepDescriptionAr?: string;
  stepDescriptionEn?: string;
  stepType: string;
  stepConfig?: Record<string, unknown>;
  displayOrder?: number;
}

export interface UpdateWorkflowInput {
  stepNumber?: number;
  stepNameAr?: string;
  stepNameEn?: string;
  stepDescriptionAr?: string;
  stepDescriptionEn?: string;
  stepType?: string;
  stepConfig?: Record<string, unknown>;
  displayOrder?: number;
  isActive?: boolean;
}

function asInputJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

export async function getServiceWorkflow(serviceId: string): Promise<ServiceWorkflow[]> {
  return prisma.serviceWorkflow.findMany({
    where: { serviceId, isActive: true },
    orderBy: [{ stepNumber: 'asc' }, { displayOrder: 'asc' }],
  });
}

export async function getWorkflowById(workflowId: string): Promise<ServiceWorkflow | null> {
  return prisma.serviceWorkflow.findUnique({
    where: { id: workflowId },
  });
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<ServiceWorkflow> {
  return prisma.serviceWorkflow.create({
    data: {
      serviceId: input.serviceId,
      stepNumber: input.stepNumber,
      stepNameAr: input.stepNameAr,
      stepNameEn: input.stepNameEn,
      stepDescriptionAr: input.stepDescriptionAr,
      stepDescriptionEn: input.stepDescriptionEn,
      stepType: input.stepType,
      stepConfig: asInputJson(input.stepConfig),
      displayOrder: input.displayOrder ?? 0,
    },
  });
}

export async function updateWorkflow(
  workflowId: string,
  input: UpdateWorkflowInput,
): Promise<ServiceWorkflow> {
  return prisma.serviceWorkflow.update({
    where: { id: workflowId },
    data: {
      ...(input.stepNumber !== undefined && { stepNumber: input.stepNumber }),
      ...(input.stepNameAr !== undefined && { stepNameAr: input.stepNameAr }),
      ...(input.stepNameEn !== undefined && { stepNameEn: input.stepNameEn }),
      ...(input.stepDescriptionAr !== undefined && { stepDescriptionAr: input.stepDescriptionAr }),
      ...(input.stepDescriptionEn !== undefined && { stepDescriptionEn: input.stepDescriptionEn }),
      ...(input.stepType !== undefined && { stepType: input.stepType }),
      ...(input.stepConfig !== undefined && { stepConfig: asInputJson(input.stepConfig) }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteWorkflow(workflowId: string): Promise<ServiceWorkflow> {
  return prisma.serviceWorkflow.delete({
    where: { id: workflowId },
  });
}

const LECTURE_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'استلام الملفات',
    stepNameEn: 'Receive Files',
    stepDescriptionAr: 'استلام ملفات المحاضرات من العميل',
    stepType: 'upload',
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'مراجعة الجودة',
    stepNameEn: 'Quality Review',
    stepDescriptionAr: 'مراجعة جودة الملفات ووضوح الطباعة',
    stepType: 'review',
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'الطباعة',
    stepNameEn: 'Printing',
    stepDescriptionAr: 'طباعة المحاضرات',
    stepType: 'print',
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'التجليد والتجهيز',
    stepNameEn: 'Binding & Preparation',
    stepDescriptionAr: 'تجليد وتجهيز الطلبات',
    stepType: 'binding',
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'التسليم',
    stepNameEn: 'Delivery',
    stepDescriptionAr: 'تسليم الطلب للعميل',
    stepType: 'delivery',
    displayOrder: 4,
  },
];

const FLEX_PRINTING_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'استلام التصميم',
    stepNameEn: 'Receive Design',
    stepDescriptionAr: 'استلام ملف التصميم من العميل',
    stepType: 'upload',
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'معاينة التصميم',
    stepNameEn: 'Design Preview',
    stepDescriptionAr: 'معاينة التصميم والموافقة',
    stepType: 'preview',
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'الطباعة على الفليكس',
    stepNameEn: 'Flex Printing',
    stepDescriptionAr: 'طباعة التصميم على الفليكس',
    stepType: 'print',
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'التقطيع والتشطيب',
    stepNameEn: 'Cutting & Finishing',
    stepDescriptionAr: 'تقطيع وتشطيب المنتج',
    stepType: 'cutting',
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'التسليم',
    stepNameEn: 'Delivery',
    stepDescriptionAr: 'تسليم الطلب للعميل',
    stepType: 'delivery',
    displayOrder: 4,
  },
];

const BUSINESS_CARDS_STEPS: Omit<CreateWorkflowInput, 'serviceId'>[] = [
  {
    stepNumber: 1,
    stepNameAr: 'استلام التصميم',
    stepNameEn: 'Receive Design',
    stepDescriptionAr: 'استلام تصميم البطاقة',
    stepType: 'upload',
    displayOrder: 0,
  },
  {
    stepNumber: 2,
    stepNameAr: 'مراجعة التصميم',
    stepNameEn: 'Design Review',
    stepDescriptionAr: 'مراجعة التصميم والموافقة',
    stepType: 'review',
    displayOrder: 1,
  },
  {
    stepNumber: 3,
    stepNameAr: 'الطباعة',
    stepNameEn: 'Printing',
    stepDescriptionAr: 'طباعة البطاقات',
    stepType: 'print',
    displayOrder: 2,
  },
  {
    stepNumber: 4,
    stepNameAr: 'التقطيع والتشطيب',
    stepNameEn: 'Cutting & Finishing',
    stepDescriptionAr: 'تقطيع البطاقات إلى المقاس المطلوب',
    stepType: 'cutting',
    displayOrder: 3,
  },
  {
    stepNumber: 5,
    stepNameAr: 'التسليم',
    stepNameEn: 'Delivery',
    stepDescriptionAr: 'تسليم الطلب للعميل',
    stepType: 'delivery',
    displayOrder: 4,
  },
];

export async function setupLecturePrinting(serviceId: string): Promise<ServiceWorkflow[]> {
  const existing = await prisma.serviceWorkflow.findMany({ where: { serviceId } });
  if (existing.length > 0) {
    await prisma.serviceWorkflow.deleteMany({ where: { serviceId } });
  }

  const created: ServiceWorkflow[] = [];
  for (const step of LECTURE_PRINTING_STEPS) {
    const w = await createWorkflow({ ...step, serviceId });
    created.push(w);
  }
  return created;
}

export async function setupFlexPrinting(serviceId: string): Promise<ServiceWorkflow[]> {
  const existing = await prisma.serviceWorkflow.findMany({ where: { serviceId } });
  if (existing.length > 0) {
    await prisma.serviceWorkflow.deleteMany({ where: { serviceId } });
  }

  const created: ServiceWorkflow[] = [];
  for (const step of FLEX_PRINTING_STEPS) {
    const w = await createWorkflow({ ...step, serviceId });
    created.push(w);
  }
  return created;
}

export async function setupBusinessCards(serviceId: string): Promise<ServiceWorkflow[]> {
  const existing = await prisma.serviceWorkflow.findMany({ where: { serviceId } });
  if (existing.length > 0) {
    await prisma.serviceWorkflow.deleteMany({ where: { serviceId } });
  }

  const created: ServiceWorkflow[] = [];
  for (const step of BUSINESS_CARDS_STEPS) {
    const w = await createWorkflow({ ...step, serviceId });
    created.push(w);
  }
  return created;
}
