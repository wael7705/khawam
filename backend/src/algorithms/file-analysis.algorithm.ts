import { readFile } from 'node:fs/promises';

/**
 * Analyzes uploaded files (PDF/Word) to extract page counts
 */

export async function countPdfPagesFromBuffer(buffer: Buffer): Promise<number> {
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.numpages;
}

export async function countPdfPages(filePath: string): Promise<number> {
  const buffer = await readFile(filePath);
  return countPdfPagesFromBuffer(buffer);
}

export async function estimateWordPages(filePath: string): Promise<number> {
  const mammoth = await import('mammoth');
  const buffer = await readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  const lines = text.split('\n').length;
  const LINES_PER_PAGE = 50;

  return Math.max(1, Math.ceil(lines / LINES_PER_PAGE));
}

export async function analyzeFile(filePath: string): Promise<{ pages: number; type: string }> {
  const ext = filePath.toLowerCase().split('.').pop();

  if (ext === 'pdf') {
    const pages = await countPdfPages(filePath);
    return { pages, type: 'pdf' };
  }

  if (ext === 'doc' || ext === 'docx') {
    const pages = await estimateWordPages(filePath);
    return { pages, type: 'word' };
  }

  return { pages: 1, type: 'image' };
}
