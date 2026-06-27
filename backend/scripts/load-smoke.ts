/**
 * فحص تحمّل سريع للـ API — يُشغَّل يدوياً قبل تطوير كبير.
 * Usage: LOAD_BASE_URL=https://... pnpm exec tsx scripts/load-smoke.ts
 */

const BASE_URL = (process.env.LOAD_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.LOAD_CONCURRENCY ?? 25);
const ROUNDS = Number(process.env.LOAD_ROUNDS ?? 4);

interface Sample {
  ok: boolean;
  ms: number;
  status: number;
}

async function hit(path: string): Promise<Sample> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: AbortSignal.timeout(15_000),
    });
    return { ok: res.ok, ms: performance.now() - start, status: res.status };
  } catch {
    return { ok: false, ms: performance.now() - start, status: 0 };
  }
}

async function burst(path: string, n: number): Promise<Sample[]> {
  return Promise.all(Array.from({ length: n }, () => hit(path)));
}

function summarize(label: string, samples: Sample[]): void {
  const ok = samples.filter((s) => s.ok).length;
  const ms = samples.map((s) => s.ms).sort((a, b) => a - b);
  const p50 = ms[Math.floor(ms.length * 0.5)] ?? 0;
  const p95 = ms[Math.floor(ms.length * 0.95)] ?? 0;
  const max = ms[ms.length - 1] ?? 0;
  console.log(
    `${label}: ${ok}/${samples.length} ok | p50=${p50.toFixed(0)}ms p95=${p95.toFixed(0)}ms max=${max.toFixed(0)}ms`,
  );
}

async function main(): Promise<void> {
  console.log(`Load smoke → ${BASE_URL} | concurrency=${CONCURRENCY} rounds=${ROUNDS}`);

  const healthSamples: Sample[] = [];
  const servicesSamples: Sample[] = [];

  for (let round = 1; round <= ROUNDS; round++) {
    const [health, services] = await Promise.all([
      burst('/api/health', CONCURRENCY),
      burst('/api/services', CONCURRENCY),
    ]);
    healthSamples.push(...health);
    servicesSamples.push(...services);
    console.log(`round ${round}/${ROUNDS} done`);
  }

  summarize('GET /api/health', healthSamples);
  summarize('GET /api/services', servicesSamples);

  const healthOk = healthSamples.every((s) => s.ok && s.status === 200);
  const servicesOk = servicesSamples.filter((s) => s.ok).length / servicesSamples.length >= 0.99;

  if (!healthOk || !servicesOk) {
    console.error('LOAD SMOKE FAILED');
    process.exit(1);
  }

  const final = await hit('/api/health');
  const body = await fetch(`${BASE_URL}/api/health`).then((r) => r.json() as Promise<Record<string, unknown>>);
  console.log('post-load health:', JSON.stringify(body));
  console.log(`LOAD SMOKE PASSED (last health ${final.ms.toFixed(0)}ms)`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
