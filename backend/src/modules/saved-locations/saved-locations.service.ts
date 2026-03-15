import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database.js';

const LABELS = ['home', 'work', 'other'] as const;
export type SavedLocationLabel = (typeof LABELS)[number];

const MAX_SAVED_LOCATIONS = 3;

export interface CreateSavedLocationInput {
  userId: string;
  label: SavedLocationLabel;
  street?: string | null;
  neighborhood?: string | null;
  buildingFloor?: string | null;
  extra?: string | null;
  latitude: number;
  longitude: number;
}

export interface UpdateSavedLocationInput {
  street?: string | null;
  neighborhood?: string | null;
  buildingFloor?: string | null;
  extra?: string | null;
  latitude?: number;
  longitude?: number;
}

function toNumber(d: Decimal | null | undefined): number | null {
  if (d == null) return null;
  return Number(d);
}

export async function listByUserId(userId: string) {
  const list = await prisma.savedLocation.findMany({
    where: { userId },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return list.map((row) => ({
    id: row.id,
    user_id: row.userId,
    label: row.label,
    street: row.street ?? undefined,
    neighborhood: row.neighborhood ?? undefined,
    building_floor: row.buildingFloor ?? undefined,
    extra: row.extra ?? undefined,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    display_order: row.displayOrder,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt?.toISOString(),
  }));
}

export async function create(input: CreateSavedLocationInput) {
  if (!LABELS.includes(input.label as SavedLocationLabel)) {
    throw Object.assign(new Error('التسمية يجب أن تكون: home أو work أو other'), { statusCode: 400 });
  }

  const count = await prisma.savedLocation.count({ where: { userId: input.userId } });
  if (count >= MAX_SAVED_LOCATIONS) {
    throw Object.assign(
      new Error(`الحد الأقصى ${MAX_SAVED_LOCATIONS} مواقع محفوظة. يمكنك تعديل أو حذف موقع موجود.`),
      { statusCode: 400 }
    );
  }

  const existing = await prisma.savedLocation.findUnique({
    where: { userId_label: { userId: input.userId, label: input.label } },
  });
  if (existing) {
    const updated = await prisma.savedLocation.update({
      where: { id: existing.id },
      data: {
        street: input.street ?? null,
        neighborhood: input.neighborhood ?? null,
        buildingFloor: input.buildingFloor ?? null,
        extra: input.extra ?? null,
        latitude: new Decimal(input.latitude),
        longitude: new Decimal(input.longitude),
        updatedAt: new Date(),
      },
    });
    return {
      id: updated.id,
      user_id: updated.userId,
      label: updated.label,
      street: updated.street ?? undefined,
      neighborhood: updated.neighborhood ?? undefined,
      building_floor: updated.buildingFloor ?? undefined,
      extra: updated.extra ?? undefined,
      latitude: toNumber(updated.latitude),
      longitude: toNumber(updated.longitude),
      display_order: updated.displayOrder,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt?.toISOString(),
    };
  }

  const created = await prisma.savedLocation.create({
    data: {
      userId: input.userId,
      label: input.label,
      street: input.street ?? null,
      neighborhood: input.neighborhood ?? null,
      buildingFloor: input.buildingFloor ?? null,
      extra: input.extra ?? null,
      latitude: new Decimal(input.latitude),
      longitude: new Decimal(input.longitude),
    },
  });
  return {
    id: created.id,
    user_id: created.userId,
    label: created.label,
    street: created.street ?? undefined,
    neighborhood: created.neighborhood ?? undefined,
    building_floor: created.buildingFloor ?? undefined,
    extra: created.extra ?? undefined,
    latitude: toNumber(created.latitude),
    longitude: toNumber(created.longitude),
    display_order: created.displayOrder,
    created_at: created.createdAt.toISOString(),
    updated_at: created.updatedAt?.toISOString(),
  };
}

export async function update(id: string, userId: string, input: UpdateSavedLocationInput) {
  const existing = await prisma.savedLocation.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw Object.assign(new Error('الموقع غير موجود أو لا يخصك'), { statusCode: 404 });
  }

  const updated = await prisma.savedLocation.update({
    where: { id },
    data: {
      ...(input.street !== undefined && { street: input.street }),
      ...(input.neighborhood !== undefined && { neighborhood: input.neighborhood }),
      ...(input.buildingFloor !== undefined && { buildingFloor: input.buildingFloor }),
      ...(input.extra !== undefined && { extra: input.extra }),
      ...(input.latitude !== undefined && { latitude: new Decimal(input.latitude) }),
      ...(input.longitude !== undefined && { longitude: new Decimal(input.longitude) }),
      updatedAt: new Date(),
    },
  });
  return {
    id: updated.id,
    user_id: updated.userId,
    label: updated.label,
    street: updated.street ?? undefined,
    neighborhood: updated.neighborhood ?? undefined,
    building_floor: updated.buildingFloor ?? undefined,
    extra: updated.extra ?? undefined,
    latitude: toNumber(updated.latitude),
    longitude: toNumber(updated.longitude),
    display_order: updated.displayOrder,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt?.toISOString(),
  };
}

export async function remove(id: string, userId: string) {
  const existing = await prisma.savedLocation.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw Object.assign(new Error('الموقع غير موجود أو لا يخصك'), { statusCode: 404 });
  }
  await prisma.savedLocation.delete({ where: { id } });
  return { success: true };
}
