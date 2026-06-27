/**
 * بناء روابط PostgreSQL مع معاملات Prisma المناسبة لـ PgBouncer والتطبيق.
 */
export function appendQueryParams(
  url: string,
  params: Record<string, string>,
): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (!parsed.searchParams.has(key)) {
      parsed.searchParams.set(key, value);
    }
  }
  return parsed.toString();
}

export function buildAppDatabaseUrl(
  rawUrl: string,
  connectionLimit: number,
  pgbouncerEnabled: boolean,
): string {
  const params: Record<string, string> = {
    connection_limit: String(connectionLimit),
  };
  if (pgbouncerEnabled) {
    params.pgbouncer = 'true';
  }
  return appendQueryParams(rawUrl, params);
}
