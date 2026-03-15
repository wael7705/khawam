/**
 * مساعدات لتحليل multipart/form-data من الجسم الخام (بدون الاعتماد على محلل Fastify).
 * يُستخدم عندما البروكسي يغيّر أو يحذف Content-Type فيؤدي إلى خطأ 415.
 */
import { PassThrough } from 'node:stream';
import Busboy from 'busboy';

const PEEK_SIZE = 512;
const PEEK_TIMEOUT_MS = 8000;

export function readFirstChunk(
  raw: NodeJS.ReadableStream,
): Promise<{ buffer: Buffer; rest: NodeJS.ReadableStream }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let len = 0;
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      raw.removeListener('data', onData);
      raw.removeListener('error', onError);
      raw.removeListener('end', onEnd);
      reject(new Error('PEEK_TIMEOUT'));
    }, PEEK_TIMEOUT_MS);
    const onData = (chunk: Buffer | string) => {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(b);
      len += b.length;
      if (len >= PEEK_SIZE) {
        done = true;
        clearTimeout(t);
        raw.removeListener('data', onData);
        raw.removeListener('error', onError);
        raw.removeListener('end', onEnd);
        const full = Buffer.concat(chunks);
        const buffer = full.subarray(0, PEEK_SIZE);
        const overflow = full.length > PEEK_SIZE ? full.subarray(PEEK_SIZE) : null;
        const rest = new PassThrough();
        rest.write(buffer);
        if (overflow && overflow.length > 0) rest.write(overflow);
        (raw as NodeJS.ReadableStream).pipe(rest);
        resolve({ buffer, rest });
      }
    };
    const onError = (e: Error) => {
      if (!done) {
        done = true;
        clearTimeout(t);
        reject(e);
      }
    };
    const onEnd = () => {
      if (!done) {
        done = true;
        clearTimeout(t);
        raw.removeListener('data', onData);
        raw.removeListener('error', onError);
        const buffer = Buffer.concat(chunks);
        const rest = new PassThrough();
        rest.write(buffer);
        rest.end();
        resolve({ buffer, rest });
      }
    };
    (raw as NodeJS.ReadableStream).resume?.();
    raw.on('data', onData);
    raw.on('error', onError);
    raw.on('end', onEnd);
  });
}

export function getBoundaryFromPeek(peek: Buffer): string | null {
  const i = peek.indexOf('\n');
  const line = (i >= 0 ? peek.subarray(0, i) : peek).toString('utf8').replace(/\r$/, '').trim();
  if (!line.startsWith('--')) return null;
  const b = line.slice(2).trim();
  return b.length ? b : null;
}

export interface MultipartStreamResult {
  stream: NodeJS.ReadableStream;
  contentType: string;
}

/**
 * يحصل على جسم الطلب كـ stream ويُصلح Content-Type من الـ body إن غاب من الهيدر.
 */
export async function getMultipartStream(
  request: { body: unknown; raw: { body?: NodeJS.ReadableStream } | unknown },
  headers: Record<string, string | string[] | undefined>,
): Promise<MultipartStreamResult> {
  const body = request.body;
  const stream: NodeJS.ReadableStream =
    body && typeof (body as NodeJS.ReadableStream & { pipe?: unknown }).pipe === 'function'
      ? (body as NodeJS.ReadableStream)
      : (request.raw as { body?: NodeJS.ReadableStream })?.body ?? (request.raw as NodeJS.ReadableStream);

  const ct = headers['content-type'];
  const ctStr = typeof ct === 'string' ? ct : Array.isArray(ct) ? ct[0] : '';
  const hasMultipart = !!ctStr && ctStr.toLowerCase().includes('multipart/form-data');

  if (hasMultipart) {
    return { stream, contentType: ctStr };
  }

  const { buffer, rest } = await readFirstChunk(stream);
  const boundary = getBoundaryFromPeek(buffer);
  if (!boundary) {
    throw new Error('MULTIPART_REQUIRED');
  }
  return {
    stream: rest,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

export interface ParsedFilePart {
  filename: string;
  file: NodeJS.ReadableStream;
  mimetype: string;
}

export function parseOneFile(
  stream: NodeJS.ReadableStream,
  contentType: string,
  headers: Record<string, string | string[] | undefined>,
  fieldName: string,
  maxFileSize: number,
): Promise<ParsedFilePart> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: { ...headers, 'content-type': contentType },
      limits: { fileSize: maxFileSize },
    });
    let resolved = false;
    bb.on('file', (name: string, s: NodeJS.ReadableStream, info: { filename?: string; mimeType?: string }) => {
      if (resolved || name !== fieldName) {
        s.resume();
        return;
      }
      resolved = true;
      resolve({
        filename: info.filename ?? 'upload',
        file: s,
        mimetype: info.mimeType ?? 'application/octet-stream',
      });
    });
    bb.on('error', (e: Error) => {
      if (!resolved) {
        resolved = true;
        reject(e);
      }
    });
    bb.on('finish', () => {
      if (!resolved) {
        resolved = true;
        reject(new Error('NO_FILE'));
      }
    });
    (stream as NodeJS.ReadableStream).pipe(bb);
  });
}

export function parseMultipleFiles(
  stream: NodeJS.ReadableStream,
  contentType: string,
  headers: Record<string, string | string[] | undefined>,
  fieldName: string,
  maxFileSize: number,
): Promise<ParsedFilePart[]> {
  return new Promise((resolve, reject) => {
    const files: ParsedFilePart[] = [];
    const bb = Busboy({
      headers: { ...headers, 'content-type': contentType },
      limits: { fileSize: maxFileSize },
    });
    bb.on('file', (name: string, s: NodeJS.ReadableStream, info: { filename?: string; mimeType?: string }) => {
      if (name !== fieldName) {
        s.resume();
        return;
      }
      files.push({
        filename: info.filename ?? 'upload',
        file: s,
        mimetype: info.mimeType ?? 'application/octet-stream',
      });
    });
    bb.on('error', reject);
    bb.on('finish', () => resolve(files));
    (stream as NodeJS.ReadableStream).pipe(bb);
  });
}
