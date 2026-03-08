import argon2 from 'argon2';
import { createHash, timingSafeEqual } from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

function verifyBcryptLegacy(hash: string, password: string): Promise<boolean> {
  return import('bcryptjs').then((bcryptjs) => {
    const bcrypt = bcryptjs.default ?? bcryptjs;
    return bcrypt.compare(password, hash);
  });
}

function verifyBcryptSha256Legacy(hash: string, password: string): Promise<boolean> {
  const parts = hash.split('$');
  if (parts.length < 5) return Promise.resolve(false);
  const bcryptHash = '$2b$' + parts.slice(3).join('$');
  const sha256 = createHash('sha256').update(password, 'utf8').digest('base64');
  return import('bcryptjs').then((bcryptjs) => {
    const bcrypt = bcryptjs.default ?? bcryptjs;
    return bcrypt.compare(sha256, bcryptHash);
  });
}

function verifyPbkdf2Legacy(hash: string, password: string): Promise<boolean> {
  return new Promise((resolve) => {
    const { pbkdf2 } = require('node:crypto') as typeof import('node:crypto');
    const parts = hash.split('$');
    if (parts.length < 4) return resolve(false);

    const roundsStr = parts[2];
    const saltAndHash = parts[3];
    if (!roundsStr || !saltAndHash) return resolve(false);

    const rounds = parseInt(roundsStr, 10);
    const [salt, expected] = saltAndHash.split('/');
    if (!salt || !expected) return resolve(false);

    const expectedBuf = Buffer.from(expected, 'base64');
    pbkdf2(password, salt, rounds, expectedBuf.length, 'sha256', (err, derived) => {
      if (err) return resolve(false);
      try {
        resolve(timingSafeEqual(derived, expectedBuf));
      } catch {
        resolve(false);
      }
    });
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || !password) return false;

  const trimmed = password.trim();

  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return verifyBcryptLegacy(hash, trimmed);
  }

  if (hash.startsWith('$bcrypt-sha256$')) {
    return verifyBcryptSha256Legacy(hash, trimmed);
  }

  if (hash.startsWith('$pbkdf2')) {
    return verifyPbkdf2Legacy(hash, trimmed);
  }

  try {
    return await argon2.verify(hash, trimmed);
  } catch {
    return false;
  }
}

export function needsRehash(hash: string): boolean {
  return !hash.startsWith('$argon2');
}
